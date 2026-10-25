-- Generated demo data for Bank9 Tech.
-- All timestamps are epoch milliseconds relative to seed time.
-- Bank details are placeholders for manual testing only.

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

INSERT INTO settings (key, value, updated_at) VALUES
  ('shop_name', 'Bank9 Tech', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('shop_hotline', '1900 0009', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('shop_email', 'cskh@bank9.local', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('shop_address', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('bank_name', 'Vietcombank', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('bank_bin', '970436', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('bank_account', '0123456789', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('bank_account_name', 'NGUYEN VAN A', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('shipping_fee', '30000', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('free_shipping_threshold', '5000000', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('order_hold_minutes', '30', CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at) VALUES
  (1, 'Điện thoại', 'dien-thoai', 'Điện thoại thông minh chính hãng', 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (2, 'Laptop', 'laptop', 'Laptop văn phòng, gaming, đồ họa', 2, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (3, 'Máy tính', 'may-tinh', 'PC, máy tính để bàn, mini PC', 3, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO brands (id, name, slug, created_at) VALUES
  (1, 'Apple', 'apple', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (2, 'Samsung', 'samsung', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (3, 'Xiaomi', 'xiaomi', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (4, 'OPPO', 'oppo', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (5, 'Google', 'google', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (6, 'Dell', 'dell', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (7, 'ASUS', 'asus', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (8, 'Lenovo', 'lenovo', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (9, 'HP', 'hp', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (10, 'Acer', 'acer', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (11, 'MSI', 'msi', CAST(strftime('%s','now') AS INTEGER) * 1000),
  (12, 'Bank9 PC', 'bank9-pc', CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO products (id, name, slug, description, category_id, brand_id, specs_json, search_text, is_featured, is_active, created_at, updated_at) VALUES
  (1, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'iPhone 15 Pro Max với khung titan, chip A17 Pro và camera zoom quang 5x. Sản phẩm chính hãng, bảo hành 12 tháng.', 1, 1, '{"screen":"6.7 inch Super Retina XDR","cpu":"Apple A17 Pro","ram":"8GB","storage":"256GB","camera":"48MP + 12MP + 12MP","battery":"4441 mAh","os":"iOS 17","weight":"221g","warranty":"12 tháng"}', 'iphone 15 pro max 256gb apple dien thoai', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (2, 'iPhone 15 128GB', 'iphone-15-128gb', 'iPhone 15 với Dynamic Island, camera 48MP và cổng USB-C. Máy chính hãng nguyên seal.', 1, 1, '{"screen":"6.1 inch Super Retina XDR","cpu":"Apple A16 Bionic","ram":"6GB","storage":"128GB","camera":"48MP + 12MP","battery":"3349 mAh","os":"iOS 17","weight":"171g","warranty":"12 tháng"}', 'iphone 15 128gb apple dien thoai', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (3, 'Samsung Galaxy S24 Ultra 256GB', 'samsung-galaxy-s24-ultra-256gb', 'Galaxy S24 Ultra với bút S Pen, màn hình phẳng 6.8 inch và camera 200MP. Chip Snapdragon 8 Gen 3 mạnh mẽ.', 1, 2, '{"screen":"6.8 inch Dynamic AMOLED 2X","cpu":"Snapdragon 8 Gen 3","ram":"12GB","storage":"256GB","camera":"200MP + 50MP + 12MP + 10MP","battery":"5000 mAh","os":"Android 14","weight":"232g","warranty":"12 tháng"}', 'samsung galaxy s24 ultra 256gb dien thoai', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (4, 'Samsung Galaxy A55 5G 128GB', 'samsung-galaxy-a55-5g-128gb', 'Galaxy A55 5G tầm trung với màn hình 120Hz, camera 50MP chống rung quang học và khung kim loại.', 1, 2, '{"screen":"6.6 inch Super AMOLED","cpu":"Exynos 1480","ram":"8GB","storage":"128GB","camera":"50MP + 12MP + 5MP","battery":"5000 mAh","os":"Android 14","weight":"213g","warranty":"12 tháng"}', 'samsung galaxy a55 5g 128gb dien thoai', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (5, 'Xiaomi 14 256GB', 'xiaomi-14-256gb', 'Xiaomi 14 với ống kính Leica, chip Snapdragon 8 Gen 3 và sạc nhanh 90W.', 1, 3, '{"screen":"6.36 inch AMOLED","cpu":"Snapdragon 8 Gen 3","ram":"12GB","storage":"256GB","camera":"50MP + 50MP + 50MP","battery":"4610 mAh","os":"HyperOS","weight":"193g","warranty":"12 tháng"}', 'xiaomi 14 256gb dien thoai', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (6, 'Xiaomi Redmi Note 13 Pro 128GB', 'xiaomi-redmi-note-13-pro-128gb', 'Redmi Note 13 Pro với camera 200MP, màn hình AMOLED 120Hz và sạc nhanh 67W.', 1, 3, '{"screen":"6.67 inch AMOLED","cpu":"Snapdragon 7s Gen 2","ram":"8GB","storage":"128GB","camera":"200MP + 8MP + 2MP","battery":"5100 mAh","os":"HyperOS","weight":"187g","warranty":"12 tháng"}', 'xiaomi redmi note 13 pro 128gb dien thoai', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (7, 'OPPO Reno11 5G 256GB', 'oppo-reno11-5g-256gb', 'OPPO Reno11 5G với camera chân dung 32MP, thiết kế mỏng nhẹ và sạc SuperVOOC 67W.', 1, 4, '{"screen":"6.7 inch AMOLED","cpu":"Dimensity 7050","ram":"8GB","storage":"256GB","camera":"50MP + 8MP + 32MP","battery":"5000 mAh","os":"ColorOS 14","weight":"182g","warranty":"12 tháng"}', 'oppo reno11 5g 256gb dien thoai', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (8, 'Google Pixel 8 128GB', 'google-pixel-8-128gb', 'Google Pixel 8 với chip Tensor G3, camera AI và 7 năm cập nhật hệ điều hành.', 1, 5, '{"screen":"6.2 inch OLED","cpu":"Google Tensor G3","ram":"8GB","storage":"128GB","camera":"50MP + 12MP","battery":"4575 mAh","os":"Android 14","weight":"187g","warranty":"12 tháng"}', 'google pixel 8 128gb dien thoai', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (9, 'MacBook Air M3 13 inch 256GB', 'macbook-air-m3-13-256gb', 'MacBook Air M3 13 inch mỏng nhẹ, chip Apple M3, pin 18 giờ và màn hình Liquid Retina.', 2, 1, '{"screen":"13.6 inch Liquid Retina","cpu":"Apple M3 8-core","ram":"8GB","storage":"256GB SSD","gpu":"10-core GPU","battery":"18 giờ","os":"macOS Sonoma","weight":"1.24kg","warranty":"12 tháng"}', 'macbook air m3 13 inch 256gb apple laptop', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (10, 'MacBook Pro 14 inch M3 Pro 512GB', 'macbook-pro-14-m3-pro-512gb', 'MacBook Pro 14 inch với chip M3 Pro, màn hình Liquid Retina XDR và loa 6 driver.', 2, 1, '{"screen":"14.2 inch Liquid Retina XDR","cpu":"Apple M3 Pro 11-core","ram":"18GB","storage":"512GB SSD","gpu":"14-core GPU","battery":"18 giờ","os":"macOS Sonoma","weight":"1.61kg","warranty":"12 tháng"}', 'macbook pro 14 inch m3 pro 512gb apple laptop', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (11, 'Dell XPS 13 Plus', 'dell-xps-13-plus', 'Dell XPS 13 Plus với màn hình 13.4 inch 3.5K, bàn phím không viền và cảm biến vân tay.', 2, 6, '{"screen":"13.4 inch 3.5K OLED","cpu":"Intel Core i7-1360P","ram":"16GB","storage":"512GB SSD","gpu":"Intel Iris Xe","battery":"13 giờ","os":"Windows 11","weight":"1.26kg","warranty":"12 tháng"}', 'dell xps 13 plus laptop', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (12, 'ASUS ROG Zephyrus G14', 'asus-rog-zephyrus-g14', 'Laptop gaming ASUS ROG Zephyrus G14 với màn hình 165Hz, RTX 4060 và tản nhiệt buồng hơi.', 2, 7, '{"screen":"14 inch 2.5K 165Hz","cpu":"AMD Ryzen 9 7940HS","ram":"16GB","storage":"512GB SSD","gpu":"RTX 4060 8GB","battery":"10 giờ","os":"Windows 11","weight":"1.65kg","warranty":"24 tháng"}', 'asus rog zephyrus g14 laptop gaming', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (13, 'Lenovo ThinkPad X1 Carbon Gen 11', 'lenovo-thinkpad-x1-carbon-gen-11', 'ThinkPad X1 Carbon Gen 11 bền bỉ chuẩn quân đội, bàn phím tốt nhất phân khúc doanh nhân.', 2, 8, '{"screen":"14 inch WUXGA","cpu":"Intel Core i7-1355U","ram":"16GB","storage":"512GB SSD","gpu":"Intel Iris Xe","battery":"15 giờ","os":"Windows 11 Pro","weight":"1.12kg","warranty":"12 tháng"}', 'lenovo thinkpad x1 carbon gen 11 laptop', 0, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (14, 'HP Spectre x360 14', 'hp-spectre-x360-14', 'HP Spectre x360 14 màn hình cảm ứng 2.8K, xoay gập 360 độ, kèm bút cảm ứng.', 2, 9, '{"screen":"13.5 inch 2.8K OLED cảm ứng","cpu":"Intel Core i7-1355U","ram":"16GB","storage":"1TB SSD","gpu":"Intel Iris Xe","battery":"13 giờ","os":"Windows 11","weight":"1.36kg","warranty":"12 tháng"}', 'hp spectre x360 14 laptop', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (15, 'Acer Aspire 5', 'acer-aspire-5', 'Acer Aspire 5 laptop văn phòng giá tốt, màn hình 15.6 inch Full HD và bàn phím số.', 2, 10, '{"screen":"15.6 inch Full HD","cpu":"Intel Core i5-1235U","ram":"8GB","storage":"512GB SSD","gpu":"Intel Iris Xe","battery":"9 giờ","os":"Windows 11","weight":"1.76kg","warranty":"12 tháng"}', 'acer aspire 5 laptop', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (16, 'MSI Katana 15', 'msi-katana-15', 'MSI Katana 15 laptop gaming với RTX 4050, màn hình 144Hz và tản nhiệt Cooler Boost 5.', 2, 11, '{"screen":"15.6 inch Full HD 144Hz","cpu":"Intel Core i7-13620H","ram":"16GB","storage":"512GB SSD","gpu":"RTX 4050 6GB","battery":"6 giờ","os":"Windows 11","weight":"2.25kg","warranty":"24 tháng"}', 'msi katana 15 laptop gaming', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (17, 'PC Gaming RTX 4060', 'pc-gaming-rtx-4060', 'PC gaming lắp ráp sẵn với RTX 4060, Ryzen 5 7600 và 16GB DDR5. Bảo hành 24 tháng.', 3, 12, '{"cpu":"AMD Ryzen 5 7600","ram":"16GB DDR5","storage":"1TB NVMe","gpu":"RTX 4060 8GB","os":"Windows 11","warranty":"24 tháng"}', 'pc gaming rtx 4060 may tinh', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (18, 'PC Gaming RTX 4070 Super', 'pc-gaming-rtx-4070-super', 'PC gaming cao cấp với RTX 4070 Super, Ryzen 7 7800X3D và tản nhiệt nước AIO.', 3, 12, '{"cpu":"AMD Ryzen 7 7800X3D","ram":"32GB DDR5","storage":"1TB NVMe","gpu":"RTX 4070 Super 12GB","os":"Windows 11","warranty":"24 tháng"}', 'pc gaming rtx 4070 super may tinh', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (19, 'PC Văn phòng i5', 'pc-van-phong-i5', 'PC văn phòng ổn định cho làm việc, học online và kế toán. Cấu hình cân bằng, tiết kiệm điện.', 3, 12, '{"cpu":"Intel Core i5-12400","ram":"16GB DDR4","storage":"512GB NVMe","gpu":"Intel UHD 730","os":"Windows 11","warranty":"24 tháng"}', 'pc van phong i5 may tinh', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (20, 'PC Đồ họa Ryzen 7', 'pc-do-hoa-ryzen-7', 'PC đồ họa chuyên nghiệp với Ryzen 7, RTX 4060 Ti và 32GB RAM cho dựng phim, thiết kế 3D.', 3, 12, '{"cpu":"AMD Ryzen 7 7700","ram":"32GB DDR5","storage":"1TB NVMe","gpu":"RTX 4060 Ti 16GB","os":"Windows 11 Pro","warranty":"24 tháng"}', 'pc do hoa ryzen 7 may tinh', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (21, 'iMac 24 inch M3', 'imac-24-inch-m3', 'iMac 24 inch với chip M3, màn hình 4.5K Retina và thiết kế siêu mỏng nhiều màu sắc.', 3, 1, '{"screen":"24 inch 4.5K Retina","cpu":"Apple M3 8-core","ram":"8GB","storage":"256GB SSD","gpu":"10-core GPU","os":"macOS Sonoma","weight":"4.48kg","warranty":"12 tháng"}', 'imac 24 inch m3 apple may tinh', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (22, 'Mac mini M2', 'mac-mini-m2', 'Mac mini M2 nhỏ gọn, hiệu năng mạnh mẽ cho công việc văn phòng và sáng tạo nội dung.', 3, 1, '{"cpu":"Apple M2 8-core","ram":"8GB","storage":"256GB SSD","gpu":"10-core GPU","os":"macOS Sonoma","weight":"1.18kg","warranty":"12 tháng"}', 'mac mini m2 apple may tinh', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (23, 'PC Workstation RTX 4090', 'pc-workstation-rtx-4090', 'Workstation cao cấp với RTX 4090, phục vụ render 3D, AI và dựng phim 8K.', 3, 12, '{"cpu":"Intel Core i9-14900K","ram":"64GB DDR5","storage":"2TB NVMe","gpu":"RTX 4090 24GB","os":"Windows 11 Pro","warranty":"36 tháng"}', 'pc workstation rtx 4090 may tinh', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (24, 'Mini PC NUC', 'mini-pc-nuc', 'Mini PC NUC tiết kiệm diện tích, phù hợp làm máy văn phòng, giải trí và digital signage.', 3, 12, '{"cpu":"Intel Core i5-1240P","ram":"16GB","storage":"512GB NVMe","gpu":"Intel Iris Xe","os":"Windows 11","weight":"0.54kg","warranty":"12 tháng"}', 'mini pc nuc may tinh', 0, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO product_images (product_id, url, alt, sort_order) VALUES
  (1, '/seed/iphone-15-pro-max.svg', 'iPhone 15 Pro Max', 0),
  (2, '/seed/iphone-15.svg', 'iPhone 15', 0),
  (3, '/seed/galaxy-s24-ultra.svg', 'Samsung Galaxy S24 Ultra', 0),
  (4, '/seed/galaxy-a55.svg', 'Samsung Galaxy A55', 0),
  (5, '/seed/xiaomi-14.svg', 'Xiaomi 14', 0),
  (6, '/seed/redmi-note-13-pro.svg', 'Xiaomi Redmi Note 13 Pro', 0),
  (7, '/seed/oppo-reno11.svg', 'OPPO Reno11', 0),
  (8, '/seed/pixel-8.svg', 'Google Pixel 8', 0),
  (9, '/seed/macbook-air-m3.svg', 'MacBook Air M3', 0),
  (10, '/seed/macbook-pro-14.svg', 'MacBook Pro 14', 0),
  (11, '/seed/dell-xps-13.svg', 'Dell XPS 13 Plus', 0),
  (12, '/seed/asus-rog-g14.svg', 'ASUS ROG Zephyrus G14', 0),
  (13, '/seed/thinkpad-x1.svg', 'Lenovo ThinkPad X1 Carbon', 0),
  (14, '/seed/hp-spectre.svg', 'HP Spectre x360', 0),
  (15, '/seed/acer-aspire.svg', 'Acer Aspire 5', 0),
  (16, '/seed/msi-katana.svg', 'MSI Katana 15', 0),
  (17, '/seed/pc-rtx-4060.svg', 'PC Gaming RTX 4060', 0),
  (18, '/seed/pc-rtx-4070.svg', 'PC Gaming RTX 4070 Super', 0),
  (19, '/seed/pc-office.svg', 'PC Văn phòng i5', 0),
  (20, '/seed/pc-graphics.svg', 'PC Đồ họa Ryzen 7', 0),
  (21, '/seed/imac-24.svg', 'iMac 24 inch', 0),
  (22, '/seed/mac-mini.svg', 'Mac mini M2', 0),
  (23, '/seed/pc-workstation.svg', 'PC Workstation RTX 4090', 0),
  (24, '/seed/mini-pc.svg', 'Mini PC NUC', 0);

INSERT INTO product_variants (id, product_id, sku, name, price, compare_at_price, attributes_json, image_url, is_active, sort_order, created_at, updated_at) VALUES
  (1, 1, 'IP15PM-256-TITAN', '256GB - Titan tự nhiên', 29990000, 34990000, '{"storage":"256GB","color":"Titan tự nhiên"}', '/seed/iphone-15-pro-max.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (2, 1, 'IP15PM-512-TITAN', '512GB - Titan xanh', 34990000, 39990000, '{"storage":"512GB","color":"Titan xanh"}', '/seed/iphone-15-pro-max.svg', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (3, 2, 'IP15-128-BLACK', '128GB - Đen', 19990000, 22990000, '{"storage":"128GB","color":"Đen"}', '/seed/iphone-15.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (4, 2, 'IP15-256-BLUE', '256GB - Xanh dương', 22990000, 25990000, '{"storage":"256GB","color":"Xanh dương"}', '/seed/iphone-15.svg', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (5, 3, 'S24U-256-TITAN', '256GB - Titan xám', 26990000, 30990000, '{"storage":"256GB","color":"Titan xám"}', '/seed/galaxy-s24-ultra.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (6, 3, 'S24U-512-TITAN', '512GB - Titan đen', 31990000, 35990000, '{"storage":"512GB","color":"Titan đen"}', '/seed/galaxy-s24-ultra.svg', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (7, 4, 'A55-128-BLUE', '128GB - Xanh', 9490000, 10990000, '{"storage":"128GB","color":"Xanh"}', '/seed/galaxy-a55.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (8, 5, 'MI14-256-BLACK', '256GB - Đen', 18990000, 21990000, '{"storage":"256GB","color":"Đen"}', '/seed/xiaomi-14.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (9, 6, 'RN13P-128-BLUE', '128GB - Xanh', 6490000, 7490000, '{"storage":"128GB","color":"Xanh"}', '/seed/redmi-note-13-pro.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (10, 6, 'RN13P-256-PURPLE', '256GB - Tím', 7490000, 8490000, '{"storage":"256GB","color":"Tím"}', '/seed/redmi-note-13-pro.svg', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (11, 7, 'RENO11-256-GREEN', '256GB - Xanh lá', 10990000, 12990000, '{"storage":"256GB","color":"Xanh lá"}', '/seed/oppo-reno11.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (12, 8, 'PIXEL8-128-OBSIDIAN', '128GB - Đen', 15990000, 18990000, '{"storage":"128GB","color":"Đen"}', '/seed/pixel-8.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (13, 9, 'MBA-M3-256-MIDNIGHT', 'M3 8GB/256GB - Midnight', 27990000, 31990000, '{"ram":"8GB","storage":"256GB","color":"Midnight"}', '/seed/macbook-air-m3.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (14, 9, 'MBA-M3-512-STARLIGHT', 'M3 16GB/512GB - Starlight', 32990000, 36990000, '{"ram":"16GB","storage":"512GB","color":"Starlight"}', '/seed/macbook-air-m3.svg', 1, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (15, 10, 'MBP14-M3P-512-SPACE', 'M3 Pro 18GB/512GB - Space Black', 49990000, 54990000, '{"ram":"18GB","storage":"512GB","color":"Space Black"}', '/seed/macbook-pro-14.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (16, 11, 'XPS13-I7-512', 'i7/16GB/512GB - Bạc', 32990000, 36990000, '{"ram":"16GB","storage":"512GB","color":"Bạc"}', '/seed/dell-xps-13.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (17, 12, 'ROG-G14-R9-4060', 'Ryzen 9/16GB/512GB/RTX 4060', 39990000, 44990000, '{"ram":"16GB","storage":"512GB","gpu":"RTX 4060"}', '/seed/asus-rog-g14.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (18, 13, 'TP-X1-I7-512', 'i7/16GB/512GB - Đen', 34990000, 39990000, '{"ram":"16GB","storage":"512GB","color":"Đen"}', '/seed/thinkpad-x1.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (19, 14, 'SPECTRE-I7-1TB', 'i7/16GB/1TB - Xanh đêm', 31990000, 35990000, '{"ram":"16GB","storage":"1TB","color":"Xanh đêm"}', '/seed/hp-spectre.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (20, 15, 'ASP5-I5-512', 'i5/8GB/512GB - Xám', 15990000, 17990000, '{"ram":"8GB","storage":"512GB","color":"Xám"}', '/seed/acer-aspire.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (21, 16, 'KATANA-I7-4050', 'i7/16GB/512GB/RTX 4050', 24990000, 27990000, '{"ram":"16GB","storage":"512GB","gpu":"RTX 4050"}', '/seed/msi-katana.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (22, 17, 'PC-RTX4060-R5', 'Ryzen 5 7600/16GB/RTX 4060', 22990000, 25990000, '{"ram":"16GB","gpu":"RTX 4060"}', '/seed/pc-rtx-4060.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (23, 18, 'PC-RTX4070S-R7', 'Ryzen 7 7800X3D/32GB/RTX 4070 Super', 32990000, 36990000, '{"ram":"32GB","gpu":"RTX 4070 Super"}', '/seed/pc-rtx-4070.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (24, 19, 'PC-OFFICE-I5', 'i5-12400/16GB/512GB', 8990000, 9990000, '{"ram":"16GB","storage":"512GB"}', '/seed/pc-office.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (25, 20, 'PC-GRAPH-R7', 'Ryzen 7 7700/32GB/RTX 4060 Ti', 18990000, 21990000, '{"ram":"32GB","gpu":"RTX 4060 Ti"}', '/seed/pc-graphics.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (26, 21, 'IMAC24-M3-256', 'M3 8GB/256GB - Xanh', 34990000, 37990000, '{"ram":"8GB","storage":"256GB","color":"Xanh"}', '/seed/imac-24.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (27, 22, 'MACMINI-M2-256', 'M2 8GB/256GB', 14990000, 16990000, '{"ram":"8GB","storage":"256GB"}', '/seed/mac-mini.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (28, 23, 'PC-WS-4090', 'i9-14900K/64GB/RTX 4090', 69990000, 79990000, '{"ram":"64GB","gpu":"RTX 4090"}', '/seed/pc-workstation.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (29, 24, 'NUC-I5-512', 'i5/16GB/512GB', 9990000, 11990000, '{"ram":"16GB","storage":"512GB"}', '/seed/mini-pc.svg', 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (30, 2, 'IP15-128-PINK', '128GB - Hồng', 19990000, 22990000, '{"storage":"128GB","color":"Hồng"}', '/seed/iphone-15.svg', 0, 2, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO inventory (variant_id, on_hand, reserved, updated_at) VALUES
  (1, 12, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (2, 5, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (3, 15, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (4, 8, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (5, 8, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (6, 4, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (7, 20, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (8, 10, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (9, 3, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (10, 6, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (11, 7, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (12, 5, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (13, 6, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (14, 4, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (15, 4, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (16, 5, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (17, 1, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (18, 6, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (19, 4, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (20, 12, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (21, 5, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (22, 8, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (23, 4, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (24, 20, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (25, 6, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (26, 3, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (27, 5, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (28, 0, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (29, 9, 0, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (30, 0, 0, CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, expires_at, is_active, created_at) VALUES
  (1, 'WELCOME10', 'Giảm 10% tối đa 500.000đ cho đơn từ 5 triệu', 'percent', 10, 5000000, 500000, 100, 0, NULL, 1, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (2, 'FREESHIP', 'Miễn phí vận chuyển cho đơn từ 3 triệu', 'fixed', 30000, 3000000, NULL, 200, 0, NULL, 1, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (3, 'LAPTOP500', 'Giảm 500.000đ cho đơn từ 15 triệu', 'fixed', 500000, 15000000, NULL, 50, 0, NULL, 1, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (4, 'EXPIRED2024', 'Mã đã hết hạn dùng để test', 'percent', 10, 0, 300000, 100, 0, CAST(strftime('%s','now') AS INTEGER) * 1000 - 86400000, 1, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (5, 'USEDUP', 'Mã đã hết lượt dùng để test', 'fixed', 100000, 0, NULL, 1, 1, NULL, 1, CAST(strftime('%s','now') AS INTEGER) * 1000);

-- Demo orders. Times are computed relative to seed time.
INSERT INTO orders (id, code, customer_name, phone, phone_normalized, email, address, note, subtotal, shipping_fee, discount, total, coupon_code, payment_method, status, payment_status, tracking_code, created_at, updated_at, expires_at, paid_at) VALUES
  (1, 'B9-DEMO-0001', 'Nguyễn Văn An', '0901234567', '0901234567', 'an@example.com', '45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM', 'Giao giờ hành chính', 29990000, 0, 0, 29990000, NULL, 'qr', 'pending_payment', 'unpaid', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 300000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 300000, CAST(strftime('%s','now') AS INTEGER) * 1000 + 1500000, NULL),
  (2, 'B9-DEMO-0002', 'Trần Thị Bích', '0912345678', '0912345678', 'bich@example.com', '12 Nguyễn Huệ, Phường Sài Gòn, Quận 1, TP.HCM', NULL, 19990000, 0, 0, 19990000, NULL, 'qr', 'paid', 'paid', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 7200000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 6600000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 5400000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 6600000),
  (3, 'B9-DEMO-0003', 'Lê Hoàng Cường', '0987654321', '0987654321', NULL, '88 Võ Văn Tần, Phường 6, Quận 3, TP.HCM', 'Gọi trước khi giao', 27990000, 0, 0, 27990000, NULL, 'qr', 'shipping', 'paid', 'GHN123456789', CAST(strftime('%s','now') AS INTEGER) * 1000 - 172800000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 86400000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 171000000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 172000000),
  (4, 'B9-DEMO-0004', 'Phạm Minh Dung', '0933334444', '0933334444', 'dung@example.com', '231 Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM', NULL, 8990000, 30000, 0, 9020000, NULL, 'cod', 'completed', 'paid', 'GHN987654321', CAST(strftime('%s','now') AS INTEGER) * 1000 - 604800000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 518400000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 603000000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 518400000),
  (5, 'B9-DEMO-0005', 'Vũ Quốc Hùng', '0944445555', '0944445555', NULL, '56 Cách Mạng Tháng 8, Quận 10, TP.HCM', 'Khách đổi ý', 6490000, 30000, 0, 6520000, NULL, 'qr', 'cancelled', 'unpaid', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 259200000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 259000000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 257400000, NULL),
  (6, 'B9-DEMO-0006', 'Đỗ Thị Lan', '0955556666', '0955556666', 'lan@example.com', '9 Phan Xích Long, Phú Nhuận, TP.HCM', NULL, 15990000, 0, 0, 15990000, NULL, 'qr', 'expired', 'unpaid', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 3600000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 3600000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 1800000, NULL),
  (7, 'B9-DEMO-0007', 'Hoàng Gia Bảo', '0966667777', '0966667777', NULL, '72 Trần Hưng Đạo, Quận 5, TP.HCM', NULL, 22990000, 0, 500000, 22490000, 'LAPTOP500', 'qr', 'pending_payment', 'unpaid', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 600000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 600000, CAST(strftime('%s','now') AS INTEGER) * 1000 + 1200000, NULL);

INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku, image_url, unit_price, qty, line_total) VALUES
  (1, 1, 'iPhone 15 Pro Max 256GB', '256GB - Titan tự nhiên', 'IP15PM-256-TITAN', '/seed/iphone-15-pro-max.svg', 29990000, 1, 29990000),
  (2, 3, 'iPhone 15 128GB', '128GB - Đen', 'IP15-128-BLACK', '/seed/iphone-15.svg', 19990000, 1, 19990000),
  (3, 13, 'MacBook Air M3 13 inch 256GB', 'M3 8GB/256GB - Midnight', 'MBA-M3-256-MIDNIGHT', '/seed/macbook-air-m3.svg', 27990000, 1, 27990000),
  (4, 24, 'PC Văn phòng i5', 'i5-12400/16GB/512GB', 'PC-OFFICE-I5', '/seed/pc-office.svg', 8990000, 1, 8990000),
  (5, 9, 'Xiaomi Redmi Note 13 Pro 128GB', '128GB - Xanh', 'RN13P-128-BLUE', '/seed/redmi-note-13-pro.svg', 6490000, 1, 6490000),
  (6, 12, 'Google Pixel 8 128GB', '128GB - Đen', 'PIXEL8-128-OBSIDIAN', '/seed/pixel-8.svg', 15990000, 1, 15990000),
  (7, 22, 'PC Gaming RTX 4060', 'Ryzen 5 7600/16GB/RTX 4060', 'PC-RTX4060-R5', '/seed/pc-rtx-4060.svg', 22990000, 1, 22990000);

INSERT INTO payments (order_id, method, status, amount, provider, qr_url, paid_at, created_at) VALUES
  (1, 'qr', 'unpaid', 29990000, 'vietqr-manual', 'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=29990000&addInfo=B9-DEMO-0001&accountName=NGUYEN%20VAN%20A', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 300000),
  (2, 'qr', 'paid', 19990000, 'vietqr-manual', 'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=19990000&addInfo=B9-DEMO-0002&accountName=NGUYEN%20VAN%20A', CAST(strftime('%s','now') AS INTEGER) * 1000 - 6600000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 7200000),
  (3, 'qr', 'paid', 27990000, 'vietqr-manual', 'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=27990000&addInfo=B9-DEMO-0003&accountName=NGUYEN%20VAN%20A', CAST(strftime('%s','now') AS INTEGER) * 1000 - 172000000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 172800000),
  (4, 'cod', 'paid', 9020000, 'manual', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 518400000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 604800000),
  (5, 'qr', 'unpaid', 6520000, 'vietqr-manual', 'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=6520000&addInfo=B9-DEMO-0005&accountName=NGUYEN%20VAN%20A', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 259200000),
  (6, 'qr', 'unpaid', 15990000, 'vietqr-manual', 'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=15990000&addInfo=B9-DEMO-0006&accountName=NGUYEN%20VAN%20A', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 3600000),
  (7, 'qr', 'unpaid', 22490000, 'vietqr-manual', 'https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=22490000&addInfo=B9-DEMO-0007&accountName=NGUYEN%20VAN%20A', NULL, CAST(strftime('%s','now') AS INTEGER) * 1000 - 600000);

INSERT INTO order_status_history (order_id, from_status, to_status, note, created_by, created_at) VALUES
  (1, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 300000),
  (2, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 7200000),
  (2, 'pending_payment', 'paid', 'Admin xác nhận đã nhận chuyển khoản', 'admin', CAST(strftime('%s','now') AS INTEGER) * 1000 - 6600000),
  (3, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 172800000),
  (3, 'pending_payment', 'paid', 'Admin xác nhận đã nhận chuyển khoản', 'admin', CAST(strftime('%s','now') AS INTEGER) * 1000 - 172000000),
  (3, 'paid', 'shipping', 'Đã bàn giao cho GHN', 'admin', CAST(strftime('%s','now') AS INTEGER) * 1000 - 86400000),
  (4, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 604800000),
  (4, 'pending_payment', 'paid', 'Thanh toán COD khi giao hàng', 'admin', CAST(strftime('%s','now') AS INTEGER) * 1000 - 518400000),
  (4, 'paid', 'completed', 'Giao hàng thành công', 'admin', CAST(strftime('%s','now') AS INTEGER) * 1000 - 518000000),
  (5, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 259200000),
  (5, 'pending_payment', 'cancelled', 'Khách yêu cầu hủy', 'admin', CAST(strftime('%s','now') AS INTEGER) * 1000 - 259000000),
  (6, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 3600000),
  (6, 'pending_payment', 'expired', 'Hết thời gian giữ hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 1800000),
  (7, NULL, 'pending_payment', 'Khởi tạo đơn hàng', 'system', CAST(strftime('%s','now') AS INTEGER) * 1000 - 600000);

INSERT INTO inventory_reservations (order_id, variant_id, qty, status, created_at, expires_at) VALUES
  (1, 1, 1, 'active', CAST(strftime('%s','now') AS INTEGER) * 1000 - 300000, CAST(strftime('%s','now') AS INTEGER) * 1000 + 1500000),
  (2, 3, 1, 'confirmed', CAST(strftime('%s','now') AS INTEGER) * 1000 - 7200000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 5400000),
  (3, 13, 1, 'confirmed', CAST(strftime('%s','now') AS INTEGER) * 1000 - 172800000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 171000000),
  (4, 24, 1, 'confirmed', CAST(strftime('%s','now') AS INTEGER) * 1000 - 604800000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 603000000),
  (5, 9, 1, 'released', CAST(strftime('%s','now') AS INTEGER) * 1000 - 259200000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 257400000),
  (6, 12, 1, 'released', CAST(strftime('%s','now') AS INTEGER) * 1000 - 3600000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 1800000),
  (7, 22, 1, 'active', CAST(strftime('%s','now') AS INTEGER) * 1000 - 600000, CAST(strftime('%s','now') AS INTEGER) * 1000 + 1200000);

-- Keep inventory consistent with confirmed demo orders and active reservations.
UPDATE inventory SET on_hand = on_hand - 1 WHERE variant_id = 3;
UPDATE inventory SET on_hand = on_hand - 1 WHERE variant_id = 13;
UPDATE inventory SET on_hand = on_hand - 1 WHERE variant_id = 24;
UPDATE inventory SET reserved = 1 WHERE variant_id = 1;
UPDATE inventory SET reserved = 1 WHERE variant_id = 22;

INSERT INTO coupon_redemptions (coupon_id, order_id, amount, created_at) VALUES
  (3, 7, 500000, CAST(strftime('%s','now') AS INTEGER) * 1000 - 600000);

INSERT INTO audit_logs (actor, action, entity, entity_id, meta_json, created_at) VALUES
  ('system', 'seed', 'database', NULL, '{"note":"demo data"}', CAST(strftime('%s','now') AS INTEGER) * 1000);

INSERT INTO products_fts(products_fts) VALUES('rebuild');
