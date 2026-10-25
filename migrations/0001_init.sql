PRAGMA foreign_keys = ON;

CREATE TABLE `categories` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text,
  `image_url` text,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_categories_slug` ON `categories` (`slug`);

CREATE TABLE `brands` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `logo_url` text,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_brands_slug` ON `brands` (`slug`);

CREATE TABLE `products` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `slug` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `category_id` integer NOT NULL,
  `brand_id` integer NOT NULL,
  `specs_json` text DEFAULT '{}' NOT NULL,
  `search_text` text DEFAULT '' NOT NULL,
  `is_featured` integer DEFAULT false NOT NULL,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`);
CREATE INDEX `idx_products_category` ON `products` (`category_id`);
CREATE INDEX `idx_products_brand` ON `products` (`brand_id`);
CREATE INDEX `idx_products_active_featured` ON `products` (`is_active`,`is_featured`);

CREATE TABLE `product_images` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `product_id` integer NOT NULL,
  `url` text NOT NULL,
  `alt` text DEFAULT '' NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `idx_product_images_product` ON `product_images` (`product_id`);

CREATE TABLE `product_variants` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `product_id` integer NOT NULL,
  `sku` text NOT NULL,
  `name` text NOT NULL,
  `price` integer NOT NULL,
  `compare_at_price` integer,
  `attributes_json` text DEFAULT '{}' NOT NULL,
  `image_url` text,
  `is_active` integer DEFAULT true NOT NULL,
  `sort_order` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `chk_variant_price` CHECK(`price` >= 0)
);
CREATE UNIQUE INDEX `idx_product_variants_sku` ON `product_variants` (`sku`);
CREATE INDEX `idx_product_variants_product` ON `product_variants` (`product_id`);

CREATE TABLE `inventory` (
  `variant_id` integer PRIMARY KEY NOT NULL,
  `on_hand` integer DEFAULT 0 NOT NULL,
  `reserved` integer DEFAULT 0 NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `chk_inventory_on_hand` CHECK(`on_hand` >= 0),
  CONSTRAINT `chk_inventory_reserved` CHECK(`reserved` >= 0),
  CONSTRAINT `chk_inventory_reserved_lte_on_hand` CHECK(`reserved` <= `on_hand`)
);

CREATE TABLE `orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `code` text NOT NULL,
  `customer_name` text NOT NULL,
  `phone` text NOT NULL,
  `phone_normalized` text NOT NULL,
  `email` text,
  `address` text NOT NULL,
  `note` text,
  `subtotal` integer NOT NULL,
  `shipping_fee` integer DEFAULT 0 NOT NULL,
  `discount` integer DEFAULT 0 NOT NULL,
  `total` integer NOT NULL,
  `coupon_code` text,
  `payment_method` text NOT NULL,
  `status` text DEFAULT 'pending_payment' NOT NULL,
  `payment_status` text DEFAULT 'unpaid' NOT NULL,
  `tracking_code` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `expires_at` integer NOT NULL,
  `paid_at` integer,
  CONSTRAINT `chk_orders_total` CHECK(`total` >= 0)
);
CREATE UNIQUE INDEX `idx_orders_code` ON `orders` (`code`);
CREATE INDEX `idx_orders_phone` ON `orders` (`phone_normalized`);
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`,`created_at`);
CREATE INDEX `idx_orders_pending_expiry` ON `orders` (`status`,`expires_at`);

CREATE TABLE `order_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `variant_id` integer,
  `product_name` text NOT NULL,
  `variant_name` text NOT NULL,
  `sku` text NOT NULL,
  `image_url` text,
  `unit_price` integer NOT NULL,
  `qty` integer NOT NULL,
  `line_total` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `chk_order_item_qty` CHECK(`qty` > 0)
);
CREATE INDEX `idx_order_items_order` ON `order_items` (`order_id`);

CREATE TABLE `payments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `method` text NOT NULL,
  `status` text DEFAULT 'unpaid' NOT NULL,
  `amount` integer NOT NULL,
  `provider` text DEFAULT 'manual' NOT NULL,
  `provider_ref` text,
  `qr_url` text,
  `paid_at` integer,
  `raw_json` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `idx_payments_order` ON `payments` (`order_id`);

CREATE TABLE `order_status_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `from_status` text,
  `to_status` text NOT NULL,
  `note` text,
  `created_by` text DEFAULT 'system' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `idx_order_history_order` ON `order_status_history` (`order_id`);

CREATE TABLE `inventory_reservations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_id` integer NOT NULL,
  `variant_id` integer NOT NULL,
  `qty` integer NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` integer NOT NULL,
  `expires_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action,
  CONSTRAINT `chk_reservation_qty` CHECK(`qty` > 0)
);
CREATE INDEX `idx_reservations_order` ON `inventory_reservations` (`order_id`);
CREATE INDEX `idx_reservations_active_expiry` ON `inventory_reservations` (`status`,`expires_at`);

CREATE TABLE `coupons` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `code` text NOT NULL,
  `description` text,
  `discount_type` text NOT NULL,
  `discount_value` integer NOT NULL,
  `min_order` integer DEFAULT 0 NOT NULL,
  `max_discount` integer,
  `usage_limit` integer,
  `used_count` integer DEFAULT 0 NOT NULL,
  `expires_at` integer,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_coupons_code` ON `coupons` (`code`);

CREATE TABLE `coupon_redemptions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `coupon_id` integer NOT NULL,
  `order_id` integer NOT NULL,
  `amount` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `idx_coupon_redemption_order` ON `coupon_redemptions` (`coupon_id`,`order_id`);

CREATE TABLE `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `admin_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  `user_agent` text,
  `ip` text
);
CREATE INDEX `idx_admin_sessions_expiry` ON `admin_sessions` (`expires_at`);

CREATE TABLE `login_attempts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `ip` text NOT NULL,
  `email` text NOT NULL,
  `success` integer NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `idx_login_attempts_ip` ON `login_attempts` (`ip`,`created_at`);

CREATE TABLE `rate_limits` (
  `key` text PRIMARY KEY NOT NULL,
  `count` integer NOT NULL,
  `window_start` integer NOT NULL
);

CREATE TABLE `idempotency_keys` (
  `key` text PRIMARY KEY NOT NULL,
  `order_id` integer NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `idx_idempotency_order` ON `idempotency_keys` (`order_id`);

CREATE TABLE `payment_claims` (
  `order_id` integer PRIMARY KEY NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `release_claims` (
  `order_id` integer PRIMARY KEY NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `audit_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `actor` text NOT NULL,
  `action` text NOT NULL,
  `entity` text NOT NULL,
  `entity_id` text,
  `meta_json` text,
  `created_at` integer NOT NULL
);
CREATE INDEX `idx_audit_created` ON `audit_logs` (`created_at`);
