import type { OrderStatus, PaymentMethod, PaymentStatus } from "../../shared/constants";
import { normalizePhone } from "../../shared/constants";
import type {
  AdminOrderRow,
  OrderDetail,
  OrderHistoryEntry,
  OrderItem,
  OrderSummary,
} from "../../shared/types";
import { AppError, conflict, notFound } from "../lib/errors";
import { getActiveReservations, confirmStatements, releaseStatements } from "./inventory";
import type { Settings } from "./settings";

interface OrderRow {
  id: number;
  code: string;
  customer_name: string;
  phone: string;
  phone_normalized: string;
  email: string | null;
  address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  payment_status: PaymentStatus;
  tracking_code: string | null;
  created_at: number;
  updated_at: number;
  expires_at: number;
  paid_at: number | null;
}

interface PaymentRow {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  qr_url: string | null;
  paid_at: number | null;
}

const TERMINAL: OrderStatus[] = ["cancelled", "expired", "completed"];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled", "expired"],
  pending_confirmation: ["paid", "cancelled", "expired"],
  paid: ["processing", "shipping", "cancelled"],
  processing: ["shipping", "cancelled"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
  expired: [],
};

export function mapOrderSummary(row: OrderRow, itemCount: number): OrderSummary {
  return {
    id: row.id,
    code: row.code,
    customerName: row.customer_name,
    phone: row.phone,
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    itemCount,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

async function loadOrderRow(db: D1Database, code: string): Promise<OrderRow> {
  const row = await db
    .prepare("SELECT * FROM orders WHERE code = ?")
    .bind(code)
    .first<OrderRow>();
  if (!row) throw notFound("Không tìm thấy đơn hàng");
  return row;
}

export async function getOrderDetail(
  db: D1Database,
  code: string,
  phone: string | undefined,
  settings: Settings,
): Promise<OrderDetail> {
  const row = await loadOrderRow(db, code);

  if (phone !== undefined) {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized !== row.phone_normalized) {
      throw notFound("Không tìm thấy đơn hàng với số điện thoại này");
    }
  }

  const [itemsResult, paymentResult, historyResult] = await db.batch([
    db
      .prepare(
        `SELECT id, product_name, variant_name, sku, image_url, unit_price, qty, line_total
         FROM order_items WHERE order_id = ? ORDER BY id`,
      )
      .bind(row.id),
    db
      .prepare("SELECT method, status, amount, qr_url, paid_at FROM payments WHERE order_id = ?")
      .bind(row.id),
    db
      .prepare(
        `SELECT from_status, to_status, note, created_by, created_at
         FROM order_status_history WHERE order_id = ? ORDER BY id`,
      )
      .bind(row.id),
  ]);

  const items: OrderItem[] = (
    (itemsResult.results ?? []) as {
      id: number;
      product_name: string;
      variant_name: string;
      sku: string;
      image_url: string | null;
      unit_price: number;
      qty: number;
      line_total: number;
    }[]
  ).map((item) => ({
    id: item.id,
    productName: item.product_name,
    variantName: item.variant_name,
    sku: item.sku,
    imageUrl: item.image_url,
    unitPrice: item.unit_price,
    qty: item.qty,
    lineTotal: item.line_total,
  }));

  const payment = (paymentResult.results?.[0] ?? null) as PaymentRow | null;
  const history: OrderHistoryEntry[] = (
    (historyResult.results ?? []) as {
      from_status: OrderStatus | null;
      to_status: OrderStatus;
      note: string | null;
      created_by: string;
      created_at: number;
    }[]
  ).map((entry) => ({
    fromStatus: entry.from_status,
    toStatus: entry.to_status,
    note: entry.note,
    createdBy: entry.created_by,
    createdAt: entry.created_at,
  }));

  return {
    code: row.code,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    note: row.note,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    discount: row.discount,
    total: row.total,
    couponCode: row.coupon_code,
    paymentMethod: row.payment_method,
    status: row.status,
    paymentStatus: row.payment_status,
    trackingCode: row.tracking_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    items,
    payment: {
      method: payment?.method ?? row.payment_method,
      status: payment?.status ?? row.payment_status,
      amount: payment?.amount ?? row.total,
      qrUrl: payment?.qr_url ?? null,
      bankName: settings.bankName,
      bankAccount: settings.bankAccount,
      bankAccountName: settings.bankAccountName,
      paidAt: payment?.paid_at ?? null,
    },
    history,
  };
}

export async function getOrderStatus(
  db: D1Database,
  code: string,
  phone: string,
): Promise<{
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingCode: string | null;
  total: number;
  expiresAt: number;
  updatedAt: number;
}> {
  const normalized = normalizePhone(phone);
  const row = await db
    .prepare(
      `SELECT code, status, payment_status, tracking_code, total, expires_at, updated_at
       FROM orders WHERE code = ? AND phone_normalized = ?`,
    )
    .bind(code, normalized)
    .first<{
      code: string;
      status: OrderStatus;
      payment_status: PaymentStatus;
      tracking_code: string | null;
      total: number;
      expires_at: number;
      updated_at: number;
    }>();
  if (!row) throw notFound("Không tìm thấy đơn hàng");
  return {
    code: row.code,
    status: row.status,
    paymentStatus: row.payment_status,
    trackingCode: row.tracking_code,
    total: row.total,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  };
}

export async function cancelOrder(
  db: D1Database,
  code: string,
  phone: string | undefined,
  actor: string,
): Promise<void> {
  const row = await loadOrderRow(db, code);
  if (phone !== undefined) {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized !== row.phone_normalized) {
      throw notFound("Không tìm thấy đơn hàng");
    }
  }

  if (row.status !== "pending_payment" && row.status !== "pending_confirmation") {
    throw conflict("ORDER_NOT_CANCELLABLE", "Đơn hàng đã được xử lý, không thể hủy");
  }

  const now = Date.now();
  const claim = await db
    .prepare("INSERT OR IGNORE INTO release_claims (order_id, created_at) VALUES (?, ?)")
    .bind(row.id, now)
    .run();

  if ((claim.meta.changes ?? 0) === 0) {
    throw conflict("ORDER_NOT_CANCELLABLE", "Đơn hàng đã được xử lý, không thể hủy");
  }

  const reservations = await getActiveReservations(db, row.id);
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE orders SET status = 'cancelled', updated_at = ?
         WHERE id = ? AND status IN ('pending_payment','pending_confirmation')`,
      )
      .bind(now, row.id),
    db
      .prepare(
        `INSERT INTO order_status_history (order_id, from_status, to_status, note, created_by, created_at)
         VALUES (?, ?, 'cancelled', 'Hủy đơn hàng', ?, ?)`,
      )
      .bind(row.id, row.status, actor, now),
    ...releaseStatements(db, row.id, reservations, now),
  ];

  const results = await db.batch(statements);
  if ((results[0]?.meta.changes ?? 0) === 0) {
    throw conflict("ORDER_NOT_CANCELLABLE", "Đơn hàng đã được xử lý, không thể hủy");
  }
}

export async function confirmPayment(
  db: D1Database,
  code: string,
  actor: string,
): Promise<{ alreadyConfirmed: boolean }> {
  const row = await loadOrderRow(db, code);

  if (row.payment_status === "paid") {
    return { alreadyConfirmed: true };
  }

  if (row.status !== "pending_payment" && row.status !== "pending_confirmation") {
    throw conflict("ORDER_NOT_PENDING", "Đơn hàng không ở trạng thái chờ thanh toán");
  }

  const now = Date.now();
  const claim = await db
    .prepare("INSERT OR IGNORE INTO payment_claims (order_id, created_at) VALUES (?, ?)")
    .bind(row.id, now)
    .run();

  if ((claim.meta.changes ?? 0) === 0) {
    return { alreadyConfirmed: true };
  }

  const reservations = await getActiveReservations(db, row.id);
  const nextStatus: OrderStatus = "paid";

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE payments SET status = 'paid', paid_at = ?
         WHERE order_id = ? AND status <> 'paid'`,
      )
      .bind(now, row.id),
    ...confirmStatements(db, row.id, reservations, now),
    db
      .prepare(
        `UPDATE orders SET status = ?, payment_status = 'paid', paid_at = ?, updated_at = ?
         WHERE id = ? AND status IN ('pending_payment','pending_confirmation') AND payment_status = 'unpaid'`,
      )
      .bind(nextStatus, now, now, row.id),
    db
      .prepare(
        `INSERT INTO order_status_history (order_id, from_status, to_status, note, created_by, created_at)
         VALUES (?, ?, ?, 'Admin xác nhận thanh toán', ?, ?)`,
      )
      .bind(row.id, row.status, nextStatus, actor, now),
    db
      .prepare(
        `INSERT INTO audit_logs (actor, action, entity, entity_id, created_at)
         VALUES (?, 'confirm_payment', 'order', ?, ?)`,
      )
      .bind(actor, String(row.id), now),
  ];

  const results = await db.batch(statements);
  if ((results[0]?.meta.changes ?? 0) === 0) {
    throw conflict("PAYMENT_NOT_UPDATED", "Không thể xác nhận thanh toán cho đơn hàng này");
  }

  const orderUpdateIndex = 1 + reservations.length * 2;
  if ((results[orderUpdateIndex]?.meta.changes ?? 0) === 0) {
    throw conflict("ORDER_NOT_UPDATED", "Không thể cập nhật đơn hàng");
  }

  return { alreadyConfirmed: false };
}

export async function updateOrderStatus(
  db: D1Database,
  code: string,
  nextStatus: OrderStatus,
  note: string | undefined,
  actor: string,
): Promise<void> {
  const row = await loadOrderRow(db, code);

  if (row.status === nextStatus) {
    throw conflict("ORDER_STATUS_UNCHANGED", "Đơn hàng đã ở trạng thái này");
  }

  if (!ALLOWED_TRANSITIONS[row.status].includes(nextStatus)) {
    throw conflict(
      "INVALID_STATUS_TRANSITION",
      `Không thể chuyển đơn hàng từ trạng thái hiện tại sang trạng thái mới`,
    );
  }

  if (
    row.payment_method === "qr" &&
    ["paid", "processing", "shipping", "completed"].includes(nextStatus) &&
    row.payment_status !== "paid"
  ) {
    throw conflict("PAYMENT_NOT_CONFIRMED", "Vui lòng xác nhận thanh toán trước");
  }

  if (TERMINAL.includes(nextStatus)) {
    const terminalClaim = await db
      .prepare("INSERT OR IGNORE INTO release_claims (order_id, created_at) VALUES (?, ?)")
      .bind(row.id, Date.now())
      .run();
    if ((terminalClaim.meta.changes ?? 0) === 0) {
      throw conflict("ORDER_NOT_UPDATABLE", "Đơn hàng đã được xử lý");
    }
  }

  const now = Date.now();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE orders SET status = ?, updated_at = ?, tracking_code = COALESCE(?, tracking_code)
         WHERE id = ? AND status = ?`,
      )
      .bind(nextStatus, now, note && nextStatus === "shipping" ? note : null, row.id, row.status),
    db
      .prepare(
        `INSERT INTO order_status_history (order_id, from_status, to_status, note, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(row.id, row.status, nextStatus, note ?? null, actor, now),
    db
      .prepare(
        `INSERT INTO audit_logs (actor, action, entity, entity_id, meta_json, created_at)
         VALUES (?, 'update_status', 'order', ?, ?, ?)`,
      )
      .bind(actor, String(row.id), JSON.stringify({ from: row.status, to: nextStatus }), now),
  ];

  const results = await db.batch(statements);
  if ((results[0]?.meta.changes ?? 0) === 0) {
    throw conflict("ORDER_NOT_UPDATED", "Đơn hàng vừa được cập nhật bởi người khác");
  }
}

export async function expireOrders(
  db: D1Database,
  now = Date.now(),
): Promise<{ expired: number }> {
  const candidates = await db
    .prepare(
      `SELECT id, code, status FROM orders
       WHERE status IN ('pending_payment','pending_confirmation')
         AND expires_at <= ?
         AND payment_status = 'unpaid'
       ORDER BY expires_at LIMIT 50`,
    )
    .bind(now)
    .all<{ id: number; code: string; status: OrderStatus }>();

  let expired = 0;
  for (const candidate of candidates.results ?? []) {
    const claim = await db
      .prepare("INSERT OR IGNORE INTO release_claims (order_id, created_at) VALUES (?, ?)")
      .bind(candidate.id, now)
      .run();
    if ((claim.meta.changes ?? 0) === 0) continue;

    const reservations = await getActiveReservations(db, candidate.id);
    const statements: D1PreparedStatement[] = [
      db
        .prepare(
          `UPDATE orders SET status = 'expired', updated_at = ?
           WHERE id = ? AND status IN ('pending_payment','pending_confirmation') AND payment_status = 'unpaid'`,
        )
        .bind(now, candidate.id),
      db
        .prepare(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, created_by, created_at)
           VALUES (?, ?, 'expired', 'Hết thời gian giữ hàng', 'system', ?)`,
        )
        .bind(candidate.id, candidate.status, now),
      ...releaseStatements(db, candidate.id, reservations, now),
    ];
    const results = await db.batch(statements);
    if ((results[0]?.meta.changes ?? 0) > 0) expired += 1;
  }

  await db.prepare("DELETE FROM release_claims WHERE created_at < ?").bind(now - 7 * 86400000).run();
  await db.prepare("DELETE FROM payment_claims WHERE created_at < ?").bind(now - 7 * 86400000).run();
  await db
    .prepare("DELETE FROM idempotency_keys WHERE created_at < ?")
    .bind(now - 3 * 86400000)
    .run();
  await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 86400000).run();
  await db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").bind(now).run();
  await db.prepare("DELETE FROM login_attempts WHERE created_at < ?").bind(now - 7 * 86400000).run();

  return { expired };
}

export async function listOrders(
  db: D1Database,
  filters: { status?: string; search?: string; page: number; pageSize: number },
): Promise<{ items: AdminOrderRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const where: string[] = ["1 = 1"];
  const params: unknown[] = [];

  if (filters.status) {
    where.push("o.status = ?");
    params.push(filters.status);
  }
  if (filters.search) {
    where.push("(o.code LIKE ? OR o.phone LIKE ? OR o.customer_name LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const countStatement = db
    .prepare(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`)
    .bind(...params);
  const itemsStatement = db
    .prepare(
      `SELECT o.*, (SELECT COALESCE(SUM(oi.qty), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o ${whereSql}
       ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...params, filters.pageSize, (filters.page - 1) * filters.pageSize);

  const [countResult, itemsResult] = await db.batch([countStatement, itemsStatement]);
  const total = Number((countResult.results?.[0] as { total?: number } | undefined)?.total ?? 0);
  const items = ((itemsResult.results ?? []) as (OrderRow & { item_count: number })[]).map(
    (row) => ({
      ...mapOrderSummary(row, row.item_count),
      itemCount: row.item_count,
    }),
  );

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export function assertAdminTransitionAllowed(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

export function invalidTransition(): AppError {
  return conflict("INVALID_STATUS_TRANSITION", "Trạng thái đơn hàng không hợp lệ");
}
