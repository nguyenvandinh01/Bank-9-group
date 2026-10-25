PRAGMA foreign_keys = OFF;

DELETE FROM audit_logs;
DELETE FROM release_claims;
DELETE FROM payment_claims;
DELETE FROM idempotency_keys;
DELETE FROM rate_limits;
DELETE FROM login_attempts;
DELETE FROM admin_sessions;
DELETE FROM coupon_redemptions;
DELETE FROM coupons;
DELETE FROM inventory_reservations;
DELETE FROM order_status_history;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM inventory;
DELETE FROM product_variants;
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM brands;
DELETE FROM categories;
DELETE FROM settings;

PRAGMA foreign_keys = ON;
