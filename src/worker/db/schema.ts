import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("idx_categories_slug").on(t.slug)],
);

export const brands = sqliteTable(
  "brands",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("idx_brands_slug").on(t.slug)],
);

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    specsJson: text("specs_json").notNull().default("{}"),
    searchText: text("search_text").notNull().default(""),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("idx_products_slug").on(t.slug),
    index("idx_products_category").on(t.categoryId),
    index("idx_products_brand").on(t.brandId),
    index("idx_products_active_featured").on(t.isActive, t.isFeatured),
  ],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("idx_product_images_product").on(t.productId)],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    attributesJson: text("attributes_json").notNull().default("{}"),
    imageUrl: text("image_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("idx_product_variants_sku").on(t.sku),
    index("idx_product_variants_product").on(t.productId),
    check("chk_variant_price", sql`${t.price} >= 0`),
  ],
);

export const inventory = sqliteTable(
  "inventory",
  {
    variantId: integer("variant_id")
      .primaryKey()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    check("chk_inventory_on_hand", sql`${t.onHand} >= 0`),
    check("chk_inventory_reserved", sql`${t.reserved} >= 0`),
    check("chk_inventory_reserved_lte_on_hand", sql`${t.reserved} <= ${t.onHand}`),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    phoneNormalized: text("phone_normalized").notNull(),
    email: text("email"),
    address: text("address").notNull(),
    note: text("note"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    paymentMethod: text("payment_method").notNull(),
    status: text("status").notNull().default("pending_payment"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    trackingCode: text("tracking_code"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    paidAt: integer("paid_at"),
  },
  (t) => [
    uniqueIndex("idx_orders_code").on(t.code),
    index("idx_orders_phone").on(t.phoneNormalized),
    index("idx_orders_status_created").on(t.status, t.createdAt),
    index("idx_orders_pending_expiry").on(t.status, t.expiresAt),
    check("chk_orders_total", sql`${t.total} >= 0`),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: integer("variant_id"),
    productName: text("product_name").notNull(),
    variantName: text("variant_name").notNull(),
    sku: text("sku").notNull(),
    imageUrl: text("image_url"),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [
    index("idx_order_items_order").on(t.orderId),
    check("chk_order_item_qty", sql`${t.qty} > 0`),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: text("method").notNull(),
    status: text("status").notNull().default("unpaid"),
    amount: integer("amount").notNull(),
    provider: text("provider").notNull().default("manual"),
    providerRef: text("provider_ref"),
    qrUrl: text("qr_url"),
    paidAt: integer("paid_at"),
    rawJson: text("raw_json"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("idx_payments_order").on(t.orderId)],
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    note: text("note"),
    createdBy: text("created_by").notNull().default("system"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_order_history_order").on(t.orderId)],
);

export const inventoryReservations = sqliteTable(
  "inventory_reservations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => productVariants.id),
    qty: integer("qty").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [
    index("idx_reservations_order").on(t.orderId),
    index("idx_reservations_active_expiry").on(t.status, t.expiresAt),
    check("chk_reservation_qty", sql`${t.qty} > 0`),
  ],
);

export const coupons = sqliteTable(
  "coupons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    description: text("description"),
    discountType: text("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    minOrder: integer("min_order").notNull().default(0),
    maxDiscount: integer("max_discount"),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    expiresAt: integer("expires_at"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("idx_coupons_code").on(t.code)],
);

export const couponRedemptions = sqliteTable(
  "coupon_redemptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    couponId: integer("coupon_id")
      .notNull()
      .references(() => coupons.id),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("idx_coupon_redemption_order").on(t.couponId, t.orderId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const adminSessions = sqliteTable(
  "admin_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    email: text("email").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (t) => [index("idx_admin_sessions_expiry").on(t.expiresAt)],
);

export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ip: text("ip").notNull(),
    email: text("email").notNull(),
    success: integer("success", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_login_attempts_ip").on(t.ip, t.createdAt)],
);

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});

export const idempotencyKeys = sqliteTable(
  "idempotency_keys",
  {
    key: text("key").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_idempotency_order").on(t.orderId)],
);

export const paymentClaims = sqliteTable("payment_claims", {
  orderId: integer("order_id")
    .primaryKey()
    .references(() => orders.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
});

export const releaseClaims = sqliteTable("release_claims", {
  orderId: integer("order_id")
    .primaryKey()
    .references(() => orders.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metaJson: text("meta_json"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_audit_created").on(t.createdAt)],
);
