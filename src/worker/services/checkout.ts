import {
  buildVietQrUrl,
  normalizePhone,
} from "../../shared/constants";
import type { CheckoutInput } from "../../shared/schemas";
import { AppError, badRequest, conflict, notFound } from "../lib/errors";
import { orderCode } from "../lib/crypto";
import { getSettings } from "./settings";

interface VariantRow {
  id: number;
  sku: string;
  variant_name: string;
  price: number;
  image_url: string | null;
  variant_active: number;
  product_id: number;
  product_name: string;
  product_active: number;
  on_hand: number;
  reserved: number;
}

interface CouponRow {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: number | null;
  is_active: number;
}

export interface CheckoutResult {
  code: string;
  reused: boolean;
}

interface PricedItem {
  variantId: number;
  sku: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

function aggregateItems(items: CheckoutInput["items"]): Map<number, number> {
  const map = new Map<number, number>();
  for (const item of items) {
    map.set(item.variantId, (map.get(item.variantId) ?? 0) + item.qty);
  }
  return map;
}

function couponError(message: string): AppError {
  return new AppError(400, "COUPON_INVALID", message);
}

async function findExistingOrder(
  db: D1Database,
  idempotencyKey: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT o.code FROM idempotency_keys k JOIN orders o ON o.id = k.order_id WHERE k.key = ?`,
    )
    .bind(idempotencyKey)
    .first<{ code: string }>();
  return row?.code ?? null;
}

export async function createOrder(
  db: D1Database,
  input: CheckoutInput,
  idempotencyKey: string,
): Promise<CheckoutResult> {
  const existing = await findExistingOrder(db, idempotencyKey);
  if (existing) return { code: existing, reused: true };

  const settings = await getSettings(db);
  const now = Date.now();
  const quantities = aggregateItems(input.items);
  const variantIds = [...quantities.keys()];

  const placeholders = variantIds.map(() => "?").join(",");
  const variantResult = await db
    .prepare(
      `SELECT v.id, v.sku, v.name AS variant_name, v.price, v.image_url,
         v.is_active AS variant_active,
         p.id AS product_id, p.name AS product_name, p.is_active AS product_active,
         COALESCE(i.on_hand, 0) AS on_hand, COALESCE(i.reserved, 0) AS reserved
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       LEFT JOIN inventory i ON i.variant_id = v.id
       WHERE v.id IN (${placeholders})`,
    )
    .bind(...variantIds)
    .all<VariantRow>();

  const rows = variantResult.results ?? [];
  if (rows.length !== variantIds.length) {
    throw notFound("Một số sản phẩm không còn tồn tại");
  }

  const items: PricedItem[] = [];
  for (const row of rows) {
    const qty = quantities.get(row.id) ?? 0;
    if (row.variant_active !== 1 || row.product_active !== 1) {
      throw conflict("PRODUCT_UNAVAILABLE", `Sản phẩm "${row.product_name}" đã ngừng bán`);
    }
    if (qty < 1 || qty > 10) {
      throw badRequest("Số lượng sản phẩm không hợp lệ");
    }
    if (row.on_hand - row.reserved < qty) {
      throw conflict(
        "OUT_OF_STOCK",
        `Sản phẩm "${row.product_name} - ${row.variant_name}" không đủ hàng`,
      );
    }
    items.push({
      variantId: row.id,
      sku: row.sku,
      productName: row.product_name,
      variantName: row.variant_name,
      imageUrl: row.image_url,
      unitPrice: row.price,
      qty,
      lineTotal: row.price * qty,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee =
    subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;

  let coupon: CouponRow | null = null;
  let discount = 0;
  const couponCode = input.couponCode?.trim().toUpperCase() ?? "";

  if (couponCode) {
    const couponRow = await db
      .prepare("SELECT * FROM coupons WHERE code = ?")
      .bind(couponCode)
      .first<CouponRow>();

    if (!couponRow || couponRow.is_active !== 1) {
      throw couponError("Mã giảm giá không tồn tại hoặc đã bị khóa");
    }
    if (couponRow.expires_at !== null && couponRow.expires_at <= now) {
      throw couponError("Mã giảm giá đã hết hạn");
    }
    if (couponRow.usage_limit !== null && couponRow.used_count >= couponRow.usage_limit) {
      throw couponError("Mã giảm giá đã hết lượt sử dụng");
    }
    if (subtotal < couponRow.min_order) {
      throw couponError(
        `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN").format(couponRow.min_order)} ₫ để dùng mã này`,
      );
    }

    discount =
      couponRow.discount_type === "percent"
        ? Math.floor((subtotal * couponRow.discount_value) / 100)
        : couponRow.discount_value;
    if (couponRow.max_discount !== null) {
      discount = Math.min(discount, couponRow.max_discount);
    }
    discount = Math.min(discount, subtotal);
    coupon = couponRow;
  }

  const total = Math.max(0, subtotal + shippingFee - discount);
  const phoneNormalized = normalizePhone(input.phone);
  const isQr = input.paymentMethod === "qr";
  const expiresAt = isQr
    ? now + settings.orderHoldMinutes * 60 * 1000
    : now + 7 * 24 * 60 * 60 * 1000;
  const status = isQr ? "pending_payment" : "pending_confirmation";

  let code = orderCode(now);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await db
      .prepare("SELECT 1 AS found FROM orders WHERE code = ?")
      .bind(code)
      .first<{ found: number }>();
    if (!taken) break;
    code = orderCode(now + attempt + 1);
  }

  const qrUrl = isQr
    ? buildVietQrUrl({
        bin: settings.bankBin,
        account: settings.bankAccount,
        amount: total,
        addInfo: code,
        accountName: settings.bankAccountName,
      })
    : null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const statements: D1PreparedStatement[] = [];
    const orderInsertIndex = statements.length;
    statements.push(
      db
        .prepare(
          `INSERT INTO orders (code, customer_name, phone, phone_normalized, email, address, note,
             subtotal, shipping_fee, discount, total, coupon_code, payment_method, status,
             payment_status, created_at, updated_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?)`,
        )
        .bind(
          code,
          input.customerName,
          input.phone,
          phoneNormalized,
          input.email?.trim() ? input.email.trim() : null,
          input.address,
          input.note?.trim() ? input.note.trim() : null,
          subtotal,
          shippingFee,
          discount,
          total,
          coupon?.code ?? null,
          input.paymentMethod,
          status,
          now,
          now,
          expiresAt,
        ),
    );

    for (const item of items) {
      statements.push(
        db
          .prepare(
            `INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku,
               image_url, unit_price, qty, line_total)
             VALUES ((SELECT id FROM orders WHERE code = ?), ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            code,
            item.variantId,
            item.productName,
            item.variantName,
            item.sku,
            item.imageUrl,
            item.unitPrice,
            item.qty,
            item.lineTotal,
          ),
      );
    }

    statements.push(
      db
        .prepare(
          `INSERT INTO payments (order_id, method, status, amount, provider, qr_url, created_at)
           VALUES ((SELECT id FROM orders WHERE code = ?), ?, 'unpaid', ?, ?, ?, ?)`,
        )
        .bind(
          code,
          input.paymentMethod,
          total,
          isQr ? "vietqr-manual" : "manual",
          qrUrl,
          now,
        ),
    );

    statements.push(
      db
        .prepare(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, created_by, created_at)
           VALUES ((SELECT id FROM orders WHERE code = ?), NULL, ?, 'Khởi tạo đơn hàng', 'system', ?)`,
        )
        .bind(code, status, now),
    );

    for (const item of items) {
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_reservations (order_id, variant_id, qty, status, created_at, expires_at)
             VALUES ((SELECT id FROM orders WHERE code = ?), ?, ?, 'active', ?, ?)`,
          )
          .bind(code, item.variantId, item.qty, now, expiresAt),
      );
    }

    const inventoryStart = statements.length;
    for (const item of items) {
      statements.push(
        db
          .prepare(
            `UPDATE inventory SET reserved = reserved + ?, updated_at = ?
             WHERE variant_id = ? AND on_hand - reserved >= ?`,
          )
          .bind(item.qty, now, item.variantId, item.qty),
      );
    }

    const couponIndex = statements.length;
    if (coupon) {
      statements.push(
        db
          .prepare(
            `UPDATE coupons SET used_count = used_count + 1
             WHERE id = ? AND is_active = 1
               AND (expires_at IS NULL OR expires_at > ?)
               AND (usage_limit IS NULL OR used_count < usage_limit)`,
          )
          .bind(coupon.id, now),
      );
      statements.push(
        db
          .prepare(
            `INSERT INTO coupon_redemptions (coupon_id, order_id, amount, created_at)
             VALUES (?, (SELECT id FROM orders WHERE code = ?), ?, ?)`,
          )
          .bind(coupon.id, code, discount, now),
      );
    }

    statements.push(
      db
        .prepare(
          `INSERT INTO idempotency_keys (key, order_id, created_at)
           VALUES (?, (SELECT id FROM orders WHERE code = ?), ?)`,
        )
        .bind(idempotencyKey, code, now),
    );

    let results: D1Result<unknown>[];
    try {
      results = await db.batch(statements);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("UNIQUE constraint failed: idempotency_keys.key")) {
        const concurrent = await findExistingOrder(db, idempotencyKey);
        if (concurrent) return { code: concurrent, reused: true };
      }
      if (message.includes("UNIQUE constraint failed: orders.code")) {
        code = orderCode(now + attempt + 1);
        continue;
      }
      throw error;
    }

    const failedInventory = items.filter((_item, index) => {
      const result = results[inventoryStart + index];
      return (result?.meta.changes ?? 0) === 0;
    });

    const couponFailed =
      coupon !== null && (results[couponIndex]?.meta?.changes ?? 0) === 0;

    if (failedInventory.length > 0 || couponFailed) {
      const compensation: D1PreparedStatement[] = [];
      items.forEach((item, index) => {
        if ((results[inventoryStart + index]?.meta.changes ?? 0) > 0) {
          compensation.push(
            db
              .prepare(
                `UPDATE inventory SET reserved = reserved - ?, updated_at = ?
                 WHERE variant_id = ? AND reserved >= ?`,
              )
              .bind(item.qty, Date.now(), item.variantId, item.qty),
          );
        }
      });
      if (coupon && (results[couponIndex]?.meta.changes ?? 0) > 0) {
        compensation.push(
          db
            .prepare("UPDATE coupons SET used_count = MAX(0, used_count - 1) WHERE id = ?")
            .bind(coupon.id),
        );
      }
      compensation.push(
        db.prepare("DELETE FROM orders WHERE id = (SELECT id FROM orders WHERE code = ?)").bind(code),
      );
      await db.batch(compensation);

      if (couponFailed) {
        throw couponError("Mã giảm giá vừa hết lượt sử dụng, vui lòng thử mã khác");
      }
      throw conflict("OUT_OF_STOCK", "Một số sản phẩm vừa hết hàng, vui lòng kiểm tra lại giỏ hàng");
    }

    const orderResult = results[orderInsertIndex];
    if (!orderResult || (orderResult.meta.changes ?? 0) === 0) {
      throw new AppError(500, "ORDER_CREATE_FAILED", "Không thể tạo đơn hàng");
    }

    return { code, reused: false };
  }

  throw new AppError(500, "ORDER_CODE_FAILED", "Không thể tạo mã đơn hàng, vui lòng thử lại");
}
