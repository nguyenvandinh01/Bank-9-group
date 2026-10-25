import type { ProductInput } from "../../shared/schemas";
import { slugify } from "../../shared/constants";
import type {
  AdminProductDetail,
  AdminProductSummary,
  AdminStats,
  Category,
  Brand,
} from "../../shared/types";
import type { OrderStatus as OrderStatusValue } from "../../shared/constants";
import { conflict, notFound } from "../lib/errors";

interface AdminProductRow {
  id: number;
  name: string;
  slug: string;
  is_featured: number;
  is_active: number;
  updated_at: number;
  brand_name: string;
  brand_slug: string;
  category_name: string;
  category_slug: string;
  image_url: string | null;
  min_price: number;
  compare_at_price: number | null;
  available: number;
  sku_count: number;
}

const ADMIN_CARD_SELECT = `
  SELECT p.id, p.name, p.slug, p.is_featured, p.is_active, p.updated_at,
    b.name AS brand_name, b.slug AS brand_slug,
    c.name AS category_name, c.slug AS category_slug,
    (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url,
    COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1), 0) AS min_price,
    (SELECT v.compare_at_price FROM product_variants v WHERE v.product_id = p.id AND v.is_active = 1 ORDER BY v.price LIMIT 1) AS compare_at_price,
    COALESCE((
      SELECT SUM(i.on_hand - i.reserved)
      FROM product_variants v JOIN inventory i ON i.variant_id = v.id
      WHERE v.product_id = p.id AND v.is_active = 1
    ), 0) AS available,
    (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS sku_count
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  JOIN categories c ON c.id = p.category_id
`;

function mapAdminProduct(row: AdminProductRow): AdminProductSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    brandName: row.brand_name,
    brandSlug: row.brand_slug,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    minPrice: row.min_price,
    compareAtPrice: row.compare_at_price,
    available: Number(row.available ?? 0),
    isFeatured: row.is_featured === 1,
    isActive: row.is_active === 1,
    skuCount: row.sku_count,
    updatedAt: row.updated_at,
  };
}

export async function listAdminProducts(
  db: D1Database,
  filters: { search?: string; page: number; pageSize: number },
): Promise<{
  items: AdminProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where: string[] = ["1 = 1"];
  const params: unknown[] = [];
  if (filters.search) {
    where.push("(p.name LIKE ? OR p.slug LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const [countResult, itemsResult] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS total FROM products p ${whereSql}`).bind(...params),
    db
      .prepare(
        `${ADMIN_CARD_SELECT} ${whereSql} ORDER BY p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, filters.pageSize, (filters.page - 1) * filters.pageSize),
  ]);

  const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  return {
    items: ((itemsResult.results ?? []) as unknown as AdminProductRow[]).map(mapAdminProduct),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getAdminProduct(
  db: D1Database,
  id: number,
): Promise<AdminProductDetail> {
  const row = await db
    .prepare(
      `SELECT p.id, p.name, p.slug, p.description, p.category_id, p.brand_id, p.specs_json,
         p.is_featured, p.is_active
       FROM products p WHERE p.id = ?`,
    )
    .bind(id)
    .first<{
      id: number;
      name: string;
      slug: string;
      description: string;
      category_id: number;
      brand_id: number;
      specs_json: string;
      is_featured: number;
      is_active: number;
    }>();
  if (!row) throw notFound("Không tìm thấy sản phẩm");

  const [imagesResult, variantsResult] = await db.batch([
    db
      .prepare("SELECT id, url, alt FROM product_images WHERE product_id = ? ORDER BY sort_order, id")
      .bind(id),
    db
      .prepare(
        `SELECT v.id, v.sku, v.name, v.price, v.compare_at_price, v.attributes_json, v.is_active,
           COALESCE(i.on_hand, 0) AS on_hand, COALESCE(i.reserved, 0) AS reserved
         FROM product_variants v LEFT JOIN inventory i ON i.variant_id = v.id
         WHERE v.product_id = ? ORDER BY v.sort_order, v.id`,
      )
      .bind(id),
  ]);

  const specs = safeJson<Record<string, string>>(row.specs_json, {});
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryId: row.category_id,
    brandId: row.brand_id,
    specs,
    isFeatured: row.is_featured === 1,
    isActive: row.is_active === 1,
    images: (imagesResult.results ?? []) as { id: number; url: string; alt: string }[],
    variants: (
      (variantsResult.results ?? []) as {
        id: number;
        sku: string;
        name: string;
        price: number;
        compare_at_price: number | null;
        attributes_json: string;
        is_active: number;
        on_hand: number;
        reserved: number;
      }[]
    ).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      attributes: safeJson<Record<string, string>>(variant.attributes_json, {}),
      stock: variant.on_hand,
      reserved: variant.reserved,
      isActive: variant.is_active === 1,
    })),
  };
}

async function buildSearchText(
  db: D1Database,
  input: ProductInput,
  categoryId: number,
  brandId: number,
): Promise<string> {
  const [category, brand] = await db.batch([
    db.prepare("SELECT name FROM categories WHERE id = ?").bind(categoryId),
    db.prepare("SELECT name FROM brands WHERE id = ?").bind(brandId),
  ]);
  const categoryName =
    (category.results?.[0] as { name?: string } | undefined)?.name ?? "";
  const brandName = (brand.results?.[0] as { name?: string } | undefined)?.name ?? "";
  const specs = Object.values(input.specs ?? {}).join(" ");
  const attributes = input.variants
    .flatMap((variant) => [variant.name, ...Object.values(variant.attributes ?? {})])
    .join(" ");
  return normalizeText([input.name, categoryName, brandName, specs, attributes].join(" "));
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function uniqueSlug(
  db: D1Database,
  table: "products" | "categories" | "brands",
  base: string,
  excludeId?: number,
): Promise<string> {
  const root = slugify(base) || "san-pham";
  let candidate = root;
  for (let index = 2; index < 50; index += 1) {
    const row = await db
      .prepare(`SELECT id FROM ${table} WHERE slug = ?`)
      .bind(candidate)
      .first<{ id: number }>();
    if (!row || row.id === excludeId) return candidate;
    candidate = `${root}-${index}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function createProduct(
  db: D1Database,
  input: ProductInput,
  now: number,
): Promise<number> {
  const slug = await uniqueSlug(db, "products", input.slug || input.name);
  const searchText = await buildSearchText(db, input, input.categoryId, input.brandId);
  const specsJson = JSON.stringify(input.specs ?? {});

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO products (name, slug, description, category_id, brand_id, specs_json,
           search_text, is_featured, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.name,
        slug,
        input.description ?? "",
        input.categoryId,
        input.brandId,
        specsJson,
        searchText,
        input.isFeatured ? 1 : 0,
        input.isActive === false ? 0 : 1,
        now,
        now,
      ),
  ];

  for (const [index, variant] of input.variants.entries()) {
    statements.push(
      db
        .prepare(
          `INSERT INTO product_variants (product_id, sku, name, price, compare_at_price,
             attributes_json, image_url, is_active, sort_order, created_at, updated_at)
           VALUES ((SELECT id FROM products WHERE slug = ?), ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        )
        .bind(
          slug,
          variant.sku,
          variant.name,
          variant.price,
          variant.compareAtPrice ?? null,
          JSON.stringify(variant.attributes ?? {}),
          input.images?.[0] ?? null,
          index,
          now,
          now,
        ),
    );
    statements.push(
      db
        .prepare(
          `INSERT INTO inventory (variant_id, on_hand, reserved, updated_at)
           VALUES ((SELECT id FROM product_variants WHERE sku = ?), ?, 0, ?)`,
        )
        .bind(variant.sku, variant.stock, now),
    );
  }

  for (const [index, url] of (input.images ?? []).entries()) {
    statements.push(
      db
        .prepare(
          `INSERT INTO product_images (product_id, url, alt, sort_order)
           VALUES ((SELECT id FROM products WHERE slug = ?), ?, ?, ?)`,
        )
        .bind(slug, url, input.name, index),
    );
  }

  await db.batch(statements);
  const row = await db
    .prepare("SELECT id FROM products WHERE slug = ?")
    .bind(slug)
    .first<{ id: number }>();
  if (!row) throw conflict("PRODUCT_CREATE_FAILED", "Không thể tạo sản phẩm");
  return row.id;
}

export async function updateProduct(
  db: D1Database,
  id: number,
  input: ProductInput,
  now: number,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id, slug FROM products WHERE id = ?")
    .bind(id)
    .first<{ id: number; slug: string }>();
  if (!existing) throw notFound("Không tìm thấy sản phẩm");

  const slug = await uniqueSlug(db, "products", input.slug || existing.slug, id);
  const searchText = await buildSearchText(db, input, input.categoryId, input.brandId);

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE products SET name = ?, slug = ?, description = ?, category_id = ?, brand_id = ?,
           specs_json = ?, search_text = ?, is_featured = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.name,
        slug,
        input.description ?? "",
        input.categoryId,
        input.brandId,
        JSON.stringify(input.specs ?? {}),
        searchText,
        input.isFeatured ? 1 : 0,
        input.isActive === false ? 0 : 1,
        now,
        id,
      ),
  ];

  const existingVariants = await db
    .prepare("SELECT id, sku FROM product_variants WHERE product_id = ?")
    .bind(id)
    .all<{ id: number; sku: string }>();
  const existingBySku = new Map((existingVariants.results ?? []).map((row) => [row.sku, row.id]));
  const keepIds = new Set<number>();

  for (const [index, variant] of input.variants.entries()) {
    const variantId = existingBySku.get(variant.sku);
    if (variantId) {
      keepIds.add(variantId);
      statements.push(
        db
          .prepare(
            `UPDATE product_variants SET name = ?, price = ?, compare_at_price = ?,
               attributes_json = ?, sort_order = ?, updated_at = ?
             WHERE id = ?`,
          )
          .bind(
            variant.name,
            variant.price,
            variant.compareAtPrice ?? null,
            JSON.stringify(variant.attributes ?? {}),
            index,
            now,
            variantId,
          ),
      );
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory (variant_id, on_hand, reserved, updated_at)
             VALUES (?, ?, 0, ?)
             ON CONFLICT(variant_id) DO UPDATE SET on_hand = excluded.on_hand, updated_at = excluded.updated_at
             WHERE excluded.on_hand >= inventory.reserved`,
          )
          .bind(variantId, variant.stock, now),
      );
    } else {
      statements.push(
        db
          .prepare(
            `INSERT INTO product_variants (product_id, sku, name, price, compare_at_price,
               attributes_json, image_url, is_active, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          )
          .bind(
            id,
            variant.sku,
            variant.name,
            variant.price,
            variant.compareAtPrice ?? null,
            JSON.stringify(variant.attributes ?? {}),
            input.images?.[0] ?? null,
            index,
            now,
            now,
          ),
      );
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory (variant_id, on_hand, reserved, updated_at)
             VALUES ((SELECT id FROM product_variants WHERE sku = ?), ?, 0, ?)`,
          )
          .bind(variant.sku, variant.stock, now),
      );
    }
  }

  for (const [sku, variantId] of existingBySku) {
    if (!keepIds.has(variantId)) {
      statements.push(
        db
          .prepare(
            `UPDATE product_variants SET is_active = 0, updated_at = ? WHERE id = ? AND sku = ?`,
          )
          .bind(now, variantId, sku),
      );
    }
  }

  statements.push(db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id));
  for (const [index, url] of (input.images ?? []).entries()) {
    statements.push(
      db
        .prepare(
          `INSERT INTO product_images (product_id, url, alt, sort_order) VALUES (?, ?, ?, ?)`,
        )
        .bind(id, url, input.name, index),
    );
  }

  await db.batch(statements);
}

export async function deleteProduct(db: D1Database, id: number): Promise<void> {
  const row = await db
    .prepare("SELECT id, is_active FROM products WHERE id = ?")
    .bind(id)
    .first<{ id: number; is_active: number }>();
  if (!row) throw notFound("Không tìm thấy sản phẩm");

  await db
    .prepare("UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?")
    .bind(Date.now(), id)
    .run();
}

export async function getStats(db: D1Database, now = Date.now()): Promise<AdminStats> {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [totalsResult, statusResult, todayResult, lowStockResult, recentResult] =
    await db.batch([
      db.prepare(
        `SELECT COUNT(*) AS total_orders,
           COALESCE(SUM(CASE WHEN status IN ('pending_payment','pending_confirmation') THEN 1 ELSE 0 END), 0) AS pending_orders,
           COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
           COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) AS revenue
         FROM orders`,
      ),
      db.prepare("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
      db.prepare(
        `SELECT COALESCE(SUM(total), 0) AS today_revenue FROM orders
         WHERE payment_status = 'paid' AND paid_at >= ?`,
      ).bind(startOfDay.getTime()),
      db.prepare(
        `SELECT v.id AS variant_id, v.sku, p.name AS product_name, v.name AS variant_name,
           COALESCE(i.on_hand - i.reserved, 0) AS available
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         LEFT JOIN inventory i ON i.variant_id = v.id
         WHERE v.is_active = 1 AND p.is_active = 1 AND COALESCE(i.on_hand - i.reserved, 0) <= 3
         ORDER BY available ASC, v.id ASC LIMIT 10`,
      ),
      db.prepare(
        `SELECT o.*, (SELECT COALESCE(SUM(oi.qty),0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o ORDER BY o.created_at DESC, o.id DESC LIMIT 8`,
      ),
    ]);

  const totals = (totalsResult.results?.[0] ?? {}) as {
    total_orders?: number;
    pending_orders?: number;
    paid_orders?: number;
    revenue?: number;
  };
  const statusCounts = (
    (statusResult.results ?? []) as { status: OrderStatusValue; count: number }[]
  ).map((row) => ({ status: row.status as OrderStatusValue, count: row.count }));

  return {
    totalOrders: Number(totals.total_orders ?? 0),
    pendingOrders: Number(totals.pending_orders ?? 0),
    paidOrders: Number(totals.paid_orders ?? 0),
    revenue: Number(totals.revenue ?? 0),
    todayRevenue: Number(
      (todayResult.results?.[0] as { today_revenue?: number } | undefined)?.today_revenue ?? 0,
    ),
    lowStock: (
      (lowStockResult.results ?? []) as {
        variant_id: number;
        sku: string;
        product_name: string;
        variant_name: string;
        available: number;
      }[]
    ).map((row) => ({
      variantId: row.variant_id,
      sku: row.sku,
      productName: row.product_name,
      variantName: row.variant_name,
      available: row.available,
    })),
    recentOrders: (
      (recentResult.results ?? []) as {
        id: number;
        code: string;
        customer_name: string;
        phone: string;
        total: number;
        status: OrderStatusValue;
        payment_status: AdminStats["recentOrders"][number]["paymentStatus"];
        payment_method: AdminStats["recentOrders"][number]["paymentMethod"];
        created_at: number;
        expires_at: number;
        item_count: number;
      }[]
    ).map((row) => ({
      id: row.id,
      code: row.code,
      customerName: row.customer_name,
      phone: row.phone,
      total: row.total,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      itemCount: row.item_count,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    })),
    statusCounts,
  };
}

export async function listAdminCategories(db: D1Database): Promise<Category[]> {
  const result = await db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.sort_order,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.sort_order, c.id`,
    )
    .all<{
      id: number;
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
      sort_order: number;
      product_count: number;
    }>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    productCount: row.product_count,
  }));
}

export async function saveCategory(
  db: D1Database,
  input: { id?: number; name: string; slug?: string; description?: string },
  now: number,
): Promise<number> {
  if (input.id) {
    const existing = await db
      .prepare("SELECT id FROM categories WHERE id = ?")
      .bind(input.id)
      .first<{ id: number }>();
    if (!existing) throw notFound("Không tìm thấy danh mục");
    const slug = await uniqueSlug(db, "categories", input.slug || input.name, input.id);
    await db
      .prepare("UPDATE categories SET name = ?, slug = ?, description = ?, updated_at = ? WHERE id = ?")
      .bind(input.name, slug, input.description ?? null, now, input.id)
      .run();
    return input.id;
  }
  const slug = await uniqueSlug(db, "categories", input.slug || input.name);
  const result = await db
    .prepare(
      "INSERT INTO categories (name, slug, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
    )
    .bind(input.name, slug, input.description ?? null, now, now)
    .run();
  return Number(result.meta.last_row_id ?? 0);
}

export async function deleteCategory(db: D1Database, id: number): Promise<void> {
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM products WHERE category_id = ?")
    .bind(id)
    .first<{ total: number }>();
  if ((count?.total ?? 0) > 0) {
    throw conflict("CATEGORY_IN_USE", "Danh mục còn sản phẩm, không thể xóa");
  }
  await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
}

export async function listAdminBrands(db: D1Database): Promise<Brand[]> {
  const result = await db
    .prepare(
      `SELECT b.id, b.name, b.slug, b.logo_url,
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS product_count
       FROM brands b ORDER BY b.name COLLATE NOCASE`,
    )
    .all<{
      id: number;
      name: string;
      slug: string;
      logo_url: string | null;
      product_count: number;
    }>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    productCount: row.product_count,
  }));
}

export async function saveBrand(
  db: D1Database,
  input: { id?: number; name: string; slug?: string },
  now: number,
): Promise<number> {
  if (input.id) {
    const existing = await db
      .prepare("SELECT id FROM brands WHERE id = ?")
      .bind(input.id)
      .first<{ id: number }>();
    if (!existing) throw notFound("Không tìm thấy thương hiệu");
    const slug = await uniqueSlug(db, "brands", input.slug || input.name, input.id);
    await db.prepare("UPDATE brands SET name = ?, slug = ? WHERE id = ?").bind(input.name, slug, input.id).run();
    return input.id;
  }
  const slug = await uniqueSlug(db, "brands", input.slug || input.name);
  const result = await db
    .prepare("INSERT INTO brands (name, slug, created_at) VALUES (?, ?, ?)")
    .bind(input.name, slug, now)
    .run();
  return Number(result.meta.last_row_id ?? 0);
}

export async function deleteBrand(db: D1Database, id: number): Promise<void> {
  const count = await db
    .prepare("SELECT COUNT(*) AS total FROM products WHERE brand_id = ?")
    .bind(id)
    .first<{ total: number }>();
  if ((count?.total ?? 0) > 0) {
    throw conflict("BRAND_IN_USE", "Thương hiệu còn sản phẩm, không thể xóa");
  }
  await db.prepare("DELETE FROM brands WHERE id = ?").bind(id).run();
}

function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
