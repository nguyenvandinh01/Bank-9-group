PRAGMA foreign_keys = ON;

CREATE TABLE `refund_claims` (
  `order_id` integer PRIMARY KEY NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);

-- QR orders must have a confirmed payment before moving forward.
CREATE TRIGGER `trg_order_paid_requires_payment`
BEFORE UPDATE OF `status` ON `orders`
WHEN NEW.`payment_method` = 'qr'
  AND NEW.`status` IN ('paid','processing','shipping','completed')
  AND OLD.`status` IN ('pending_payment','pending_confirmation')
  AND NOT EXISTS (SELECT 1 FROM `payments` WHERE `order_id` = OLD.`id` AND `status` = 'paid')
BEGIN
  SELECT RAISE(ABORT, 'PAYMENT_NOT_CONFIRMED');
END;

CREATE TRIGGER `trg_order_terminal_immutable`
BEFORE UPDATE OF `status` ON `orders`
WHEN OLD.`status` IN ('cancelled','expired','completed')
  AND NEW.`status` <> OLD.`status`
BEGIN
  SELECT RAISE(ABORT, 'ORDER_TERMINAL');
END;

CREATE TRIGGER `trg_order_release_guard`
BEFORE UPDATE OF `status` ON `orders`
WHEN OLD.`status` IN ('pending_payment','pending_confirmation')
  AND NEW.`status` IN ('cancelled','expired')
  AND EXISTS (SELECT 1 FROM `payments` WHERE `order_id` = OLD.`id` AND `status` = 'paid')
BEGIN
  SELECT RAISE(ABORT, 'ORDER_ALREADY_PAID');
END;

-- QR payments may only be confirmed while the order is still waiting.
CREATE TRIGGER `trg_payment_paid_requires_pending_order`
BEFORE UPDATE OF `status` ON `payments`
WHEN NEW.`status` = 'paid' AND OLD.`status` <> 'paid'
  AND NEW.`method` = 'qr'
  AND (SELECT `status` FROM `orders` WHERE `id` = NEW.`order_id`) NOT IN ('pending_payment','pending_confirmation')
BEGIN
  SELECT RAISE(ABORT, 'ORDER_NOT_PENDING');
END;

CREATE TRIGGER `trg_payment_refund_requires_paid_order`
BEFORE UPDATE OF `status` ON `payments`
WHEN NEW.`status` = 'refunded' AND OLD.`status` = 'paid'
  AND (SELECT `status` FROM `orders` WHERE `id` = NEW.`order_id`) IN ('cancelled','expired','completed')
BEGIN
  SELECT RAISE(ABORT, 'ORDER_TERMINAL');
END;
