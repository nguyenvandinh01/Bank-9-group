import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import { adminLoginSchema, brandInputSchema, categoryInputSchema, checkoutSchema, productInputSchema, settingsInputSchema } from "../shared/schemas";
import type { AppContext } from "./env";
import { AppError, badRequest, forbidden, notFound } from "./lib/errors";
import { parseJson, intParam } from "./lib/validate";
import { randomHex } from "./lib/crypto";
import { assertSameOrigin, isRateLimited, login, logout, requireAdmin } from "./services/auth";
import {
  getFeatured,
  getNewest,
  getProductBySlug,
  listBrands,
  listCategories,
  listProducts,
} from "./services/catalog";
import { createOrder } from "./services/checkout";
import {
  cancelOrder,
  confirmPayment,
  expireOrders,
  getOrderDetail,
  getOrderStatus,
  listOrders,
  updateOrderStatus,
} from "./services/orders";
import {
  createProduct,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  getAdminProduct,
  getStats,
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
  saveBrand,
  saveCategory,
  updateProduct,
} from "./services/admin";
import { getSettings, publicSettings, readEnvSettings, saveSettings } from "./services/settings";
import type { OrderStatus } from "../shared/constants";
import { ORDER_STATUSES } from "../shared/constants";

type App = Hono<AppContext>;

function ok<T>(c: Context<AppContext>, data: T, status = 200) {
  return c.json({ data }, status as 200);
}

function clientIp(c: Context<AppContext>): string {
  return (
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "local"
  );
}

async function limit(
  c: Context<AppContext>,
  scope: string,
  max: number,
  windowMs = 10 * 60 * 1000,
): Promise<void> {
  const limited = await isRateLimited(c, `${scope}:${clientIp(c)}`, max, windowMs);
  if (limited) {
    throw new AppError(429, "RATE_LIMITED", "Bạn thao tác quá nhanh, vui lòng thử lại sau");
  }
}

const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
  trackingCode: z.string().trim().max(60).optional(),
});

const cancelSchema = z.object({
  phone: z.string().trim().min(8).max(20),
});

function parseOrderStatus(value: string | undefined): OrderStatus | undefined {
  if (!value) return undefined;
  return (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : undefined;
}

export function createApp() {
  const app: App = new Hono<AppContext>();

  app.use("*", async (c, next) => {
    const requestId = c.req.header("CF-Ray") ?? randomHex(8);
    c.set("requestId", requestId);
    await next();
    c.header("X-Request-Id", requestId);
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("X-Frame-Options", "DENY");
  });

  app.use("/api/*", async (c, next) => {
    if (c.req.method !== "GET" && c.req.method !== "HEAD" && c.req.method !== "OPTIONS") {
      assertSameOrigin(c);
    }
    await next();
  });

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        error.status as 400,
      );
    }
    console.error("Unhandled error", c.get("requestId"), error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Đã có lỗi xảy ra, vui lòng thử lại" } },
      500,
    );
  });

  app.notFound((c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy API" } },
        404,
      );
    }
    return c.env.ASSETS.fetch(c.req.raw);
  });

  app.get("/api/health", (c) => ok(c, { status: "ok", time: Date.now() }));

  app.get("/api/home", async (c) => {
    const db = c.env.DB;
    const [categories, brands, featured, newest, settings] = await Promise.all([
      listCategories(db),
      listBrands(db),
      getFeatured(db, 8),
      getNewest(db, 8),
      readEnvSettings(c.env),
    ]);
    return ok(c, { categories, brands, featured, newest, settings: publicSettings(settings) });
  });

  app.get("/api/products", async (c) => {
    const sortValue = c.req.query("sort");
    const sort =
      sortValue === "price_asc" ||
      sortValue === "price_desc" ||
      sortValue === "name" ||
      sortValue === "newest"
        ? sortValue
        : undefined;

    const result = await listProducts(c.env.DB, {
      search: c.req.query("search") ?? undefined,
      category: c.req.query("category") ?? undefined,
      brand: c.req.query("brand") ?? undefined,
      minPrice: intParam(c.req.query("minPrice"), 0) || undefined,
      maxPrice: intParam(c.req.query("maxPrice"), 0) || undefined,
      sort,
      page: intParam(c.req.query("page"), 1),
      pageSize: intParam(c.req.query("pageSize"), 12),
      featured: c.req.query("featured") === "1",
    });
    return ok(c, result);
  });

  app.get("/api/products/:slug", async (c) => {
    const product = await getProductBySlug(c.env.DB, c.req.param("slug"));
    return ok(c, product);
  });

  app.get("/api/categories", async (c) => ok(c, await listCategories(c.env.DB)));
  app.get("/api/brands", async (c) => ok(c, await listBrands(c.env.DB)));
  app.get("/api/settings/public", async (c) =>
    ok(c, publicSettings(await readEnvSettings(c.env))),
  );

  app.post("/api/checkout", async (c) => {
    await limit(c, "checkout", 10);
    const idempotencyKey = c.req.header("Idempotency-Key")?.trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) {
      throw badRequest("Thiếu Idempotency-Key hợp lệ");
    }
    const input = await parseJson(c, checkoutSchema);
    const result = await createOrder(c.env.DB, input, idempotencyKey);
    return ok(c, result, result.reused ? 200 : 201);
  });

  app.get("/api/orders/:code", async (c) => {
    await limit(c, "lookup", 40);
    const phone = c.req.query("phone");
    if (!phone) throw badRequest("Vui lòng nhập số điện thoại để tra cứu đơn hàng");
    const settings = await readEnvSettings(c.env);
    const order = await getOrderDetail(c.env.DB, c.req.param("code"), phone, settings);
    return ok(c, order);
  });

  app.get("/api/orders/:code/status", async (c) => {
    await limit(c, "lookup", 60);
    const phone = c.req.query("phone");
    if (!phone) throw badRequest("Vui lòng nhập số điện thoại để tra cứu đơn hàng");
    const status = await getOrderStatus(c.env.DB, c.req.param("code"), phone);
    return ok(c, status);
  });

  app.post("/api/orders/:code/cancel", async (c) => {
    await limit(c, "cancel", 10);
    const body = await parseJson(c, cancelSchema);
    await cancelOrder(c.env.DB, c.req.param("code"), body.phone, "customer");
    return ok(c, { cancelled: true });
  });

  app.get("/api/images/:key", async (c) => {
    const key = c.req.param("key");
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) throw badRequest("Tên tệp không hợp lệ");
    const object = await c.env.IMAGES.get(`uploads/${key}`);
    if (!object) throw notFound("Không tìm thấy hình ảnh");
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  });

  app.post("/api/admin/login", async (c) => {
    const input = await parseJson(c, adminLoginSchema);
    const session = await login(c, input.email, input.password, c.req.header("User-Agent") ?? null);
    return ok(c, session);
  });

  app.post("/api/admin/logout", async (c) => {
    await logout(c);
    return ok(c, { loggedOut: true });
  });

  app.get("/api/admin/me", async (c) => {
    const email = await requireAdmin(c);
    return ok(c, { email });
  });

  app.use("/api/admin/*", async (c, next) => {
    if (c.req.path === "/api/admin/login" || c.req.path === "/api/admin/logout") {
      return next();
    }
    const email = await requireAdmin(c);
    c.set("adminEmail", email);
    await next();
  });

  app.get("/api/admin/stats", async (c) => ok(c, await getStats(c.env.DB)));

  app.get("/api/admin/products", async (c) => {
    const result = await listAdminProducts(c.env.DB, {
      search: c.req.query("search") ?? undefined,
      page: intParam(c.req.query("page"), 1),
      pageSize: Math.min(50, intParam(c.req.query("pageSize"), 20)),
    });
    return ok(c, result);
  });

  app.get("/api/admin/products/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã sản phẩm không hợp lệ");
    return ok(c, await getAdminProduct(c.env.DB, id));
  });

  app.post("/api/admin/products", async (c) => {
    const input = await parseJson(c, productInputSchema);
    const id = await createProduct(c.env.DB, input, Date.now());
    return ok(c, { id }, 201);
  });

  app.put("/api/admin/products/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã sản phẩm không hợp lệ");
    const input = await parseJson(c, productInputSchema);
    await updateProduct(c.env.DB, id, input, Date.now());
    return ok(c, { id });
  });

  app.delete("/api/admin/products/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã sản phẩm không hợp lệ");
    await deleteProduct(c.env.DB, id);
    return ok(c, { deleted: true });
  });

  app.get("/api/admin/categories", async (c) => ok(c, await listAdminCategories(c.env.DB)));

  app.post("/api/admin/categories", async (c) => {
    const input = await parseJson(c, categoryInputSchema);
    const id = await saveCategory(c.env.DB, input, Date.now());
    return ok(c, { id }, 201);
  });

  app.put("/api/admin/categories/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã danh mục không hợp lệ");
    const input = await parseJson(c, categoryInputSchema);
    await saveCategory(c.env.DB, { ...input, id }, Date.now());
    return ok(c, { id });
  });

  app.delete("/api/admin/categories/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã danh mục không hợp lệ");
    await deleteCategory(c.env.DB, id);
    return ok(c, { deleted: true });
  });

  app.get("/api/admin/brands", async (c) => ok(c, await listAdminBrands(c.env.DB)));

  app.post("/api/admin/brands", async (c) => {
    const input = await parseJson(c, brandInputSchema);
    const id = await saveBrand(c.env.DB, input, Date.now());
    return ok(c, { id }, 201);
  });

  app.put("/api/admin/brands/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã thương hiệu không hợp lệ");
    const input = await parseJson(c, brandInputSchema);
    await saveBrand(c.env.DB, { ...input, id }, Date.now());
    return ok(c, { id });
  });

  app.delete("/api/admin/brands/:id", async (c) => {
    const id = intParam(c.req.param("id"), 0);
    if (!id) throw badRequest("Mã thương hiệu không hợp lệ");
    await deleteBrand(c.env.DB, id);
    return ok(c, { deleted: true });
  });

  app.get("/api/admin/orders", async (c) => {
    const result = await listOrders(c.env.DB, {
      status: parseOrderStatus(c.req.query("status")),
      search: c.req.query("search") ?? undefined,
      page: intParam(c.req.query("page"), 1),
      pageSize: Math.min(50, intParam(c.req.query("pageSize"), 20)),
    });
    return ok(c, result);
  });

  app.get("/api/admin/orders/:code", async (c) => {
    const settings = await readEnvSettings(c.env);
    return ok(c, await getOrderDetail(c.env.DB, c.req.param("code"), undefined, settings));
  });

  app.post("/api/admin/orders/:code/confirm-payment", async (c) => {
    const result = await confirmPayment(c.env.DB, c.req.param("code"), c.get("adminEmail"));
    return ok(c, result);
  });

  app.post("/api/admin/orders/:code/status", async (c) => {
    const input = await parseJson(c, orderStatusSchema);
    const code = c.req.param("code");
    const note =
      input.status === "shipping" && input.trackingCode
        ? `Mã vận đơn: ${input.trackingCode}`
        : input.note;
    await updateOrderStatus(c.env.DB, code, input.status, note, c.get("adminEmail"));
    return ok(c, { updated: true });
  });

  app.get("/api/admin/settings", async (c) => {
    const settings = await getSettings(c.env.DB);
    return ok(c, {
      shop_name: settings.shopName,
      shop_hotline: settings.shopHotline,
      shop_email: settings.shopEmail,
      shop_address: settings.shopAddress,
      bank_name: settings.bankName,
      bank_bin: settings.bankBin,
      bank_account: settings.bankAccount,
      bank_account_name: settings.bankAccountName,
      shipping_fee: String(settings.shippingFee),
      free_shipping_threshold: String(settings.freeShippingThreshold),
      order_hold_minutes: String(settings.orderHoldMinutes),
    });
  });

  app.put("/api/admin/settings", async (c) => {
    const input = await parseJson(c, settingsInputSchema);
    await saveSettings(c.env.DB, input, Date.now());
    return ok(c, { saved: true });
  });

  app.post("/api/admin/uploads", async (c) => {
    const form = await c.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw badRequest("Vui lòng chọn tệp hình ảnh");

    const maxBytes = Number.parseInt(c.env.MAX_UPLOAD_BYTES ?? "3145728", 10);
    if (file.size > (Number.isFinite(maxBytes) ? maxBytes : 3145728)) {
      throw badRequest("Hình ảnh vượt quá dung lượng cho phép");
    }

    const allowed: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    const extension = allowed[file.type];
    if (!extension) throw badRequest("Chỉ hỗ trợ ảnh PNG, JPG hoặc WebP");

    const key = `${Date.now().toString(36)}-${randomHex(8)}.${extension}`;
    await c.env.IMAGES.put(`uploads/${key}`, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return ok(c, { url: `/api/images/${key}` }, 201);
  });

  app.post("/api/dev/run-expiry", async (c) => {
    if (c.env.ENVIRONMENT !== "development") throw notFound("Không tìm thấy API");
    const result = await expireOrders(c.env.DB);
    return ok(c, result);
  });

  app.all("/api/*", () => {
    throw forbidden("Phương thức không được hỗ trợ");
  });

  return app;
}
