# BÁO CÁO TÓM TẮT DỰ ÁN BANK9 TECH

**Ngày báo cáo:** 26/10/2026
**Phiên bản:** 1.0.0
**Môi trường:** Cloudflare Workers (production) + local development
**Kho mã nguồn:** `Bank-9-group`

---

## 1. Mục tiêu và phạm vi

Bank9 Tech là ứng dụng thương mại điện tử demo bán điện thoại, laptop và máy tính, được xây dựng nhằm trình diễn một quy trình bán hàng hoàn chỉnh trên nền tảng Cloudflare. Dự án tập trung vào hai mục tiêu:

- **Nghiệp vụ:** mô phỏng luồng mua hàng từ duyệt sản phẩm, tìm kiếm, giỏ hàng, đặt hàng, thanh toán COD/VietQR đến xử lý đơn và quản trị tồn kho.
- **Kỹ thuật:** chứng minh khả năng xây dựng ứng dụng full-stack (React SPA + API Worker + D1 + KV) trên hạ tầng serverless của Cloudflare, không cần máy chủ riêng.

Phạm vi là bản demo nội bộ: không tích hợp cổng thanh toán, đơn vị vận chuyển, email giao dịch hay tài khoản khách hàng.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React 19, React Router, TanStack Query, Zustand, Tailwind CSS v4 |
| API | Hono, Zod |
| Cơ sở dữ liệu | Cloudflare D1 (SQLite), Drizzle schema + SQL migrations |
| Lưu trữ ảnh | Cloudflare KV |
| Build & chạy | Vite 8, `@cloudflare/vite-plugin`, Wrangler |
| Kiểm thử | Vitest (unit), script kiểm thử oversell qua HTTP |

Ứng dụng chạy trên Workers free plan, dùng cron mỗi 5 phút để dọn đơn hết hạn.

## 3. Chức năng chính

**Storefront**
- Trang chủ, danh mục, thương hiệu, sản phẩm nổi bật/mới.
- Tìm kiếm tiếng Việt không dấu bằng SQLite FTS5; lọc theo danh mục, thương hiệu, khoảng giá; sắp xếp và phân trang.
- Chi tiết sản phẩm với nhiều phiên bản (variant), giá, tồn kho khả dụng và thông số kỹ thuật.
- Giỏ hàng lưu trong `localStorage` (zustand persist).
- Thanh toán COD hoặc QR VietQR, áp mã giảm giá, chống gửi trùng bằng `Idempotency-Key`.
- Tra cứu đơn bằng mã đơn + số điện thoại, theo dõi trạng thái, tự động làm mới khi chờ thanh toán và tự hủy đơn khi còn chờ xử lý.

**Quản trị**
- Đăng nhập bằng session cookie ký HMAC-SHA256, có rate limit và ghi nhận lịch sử đăng nhập.
- Dashboard doanh thu, đơn chờ xử lý, tồn kho thấp và đơn gần đây.
- CRUD sản phẩm (soft delete), biến thể, tồn kho, ảnh upload qua KV.
- CRUD danh mục/thương hiệu, chặn xóa khi còn sản phẩm.
- Xử lý đơn: xác nhận thanh toán QR, chuyển trạng thái hợp lệ, nhập mã vận đơn.
- Cấu hình cửa hàng, phí ship, thời gian giữ hàng và tài khoản ngân hàng cho VietQR.

## 4. Kiến trúc và dữ liệu

Hệ thống gồm ba khối chính:

1. **React SPA** phục vụ giao diện storefront và trang quản trị, build vào `dist/client` và được Worker trả về qua binding `ASSETS`.
2. **Hono Worker** xử lý toàn bộ `/api/*`, xác thực, phân quyền, nghiệp vụ đơn hàng và cron.
3. **D1 + KV**: D1 lưu dữ liệu nghiệp vụ; KV lưu ảnh upload và phục vụ qua `/api/images/:key` với cache immutable.

Cơ sở dữ liệu gồm **21 bảng**, chia thành các nhóm: danh mục/sản phẩm (categories, brands, products, product_images, product_variants, inventory), đơn hàng (orders, order_items, payments, order_status_history), giữ chỗ tồn kho (inventory_reservations), khuyến mãi (coupons, coupon_redemptions), cấu hình (settings) và vận hành/bảo mật (admin_sessions, login_attempts, rate_limits, idempotency_keys, payment_claims, release_claims, audit_logs).

Ba migration SQL đảm nhiệm: tạo schema, chỉ mục FTS5 cho tìm kiếm và trigger bảo vệ các chuyển trạng thái/thanh toán không hợp lệ.

**Cơ chế chống oversell:** tồn kho lưu `on_hand` và `reserved`; mỗi lần đặt hàng thực hiện cập nhật có điều kiện `on_hand - reserved >= qty` trong transaction. Đơn quá hạn được cron `*/5 * * * *` chuyển sang `expired`, hoàn tồn kho và lượt dùng mã giảm giá.

## 5. Bảo mật

- Session admin ký HMAC-SHA256, lưu token hash trong D1, có thời hạn và thu hồi khi đăng xuất.
- Rate limit theo IP cho đăng nhập, checkout, tra cứu và hủy đơn.
- Kiểm tra same-origin cho mọi request ghi; chặn request khác origin.
- Zod validate toàn bộ input; response lỗi thống nhất, không lộ chi tiết hệ thống.
- Upload ảnh giới hạn PNG/JPEG/WebP và dung lượng tối đa 3 MB.
- Header bảo mật: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
- Trigger D1 và bảng claim (`payment_claims`, `release_claims`) ngăn xác nhận thanh toán/hoàn kho trùng lặp.

## 6. Kiểm thử và kết quả

| Hạng mục | Kết quả |
| --- | --- |
| Unit test Vitest | **23/23 test đạt**, 2 file test, thời gian ~0,36 giây (26/10/2026) |
| Kiểm thử thủ công | Checklist 18 bước tại `docs/manual-test.md` |
| Kiểm thử oversell | Script bắn 5 checkout đồng thời cho variant còn 1 hàng, kỳ vọng đúng 1 đơn thành công |
| Typecheck/build | **Đạt** — `tsc -b` + `vite build` (26/10/2026) |

Các kịch bản đã bao phủ: tìm kiếm không dấu, lọc/sắp xếp/phân trang, giỏ hàng, COD, QR, idempotency, tra cứu, hủy đơn, chống oversell, đăng nhập admin, CRUD, xử lý đơn, cài đặt và hết hạn giữ hàng.

## 7. Triển khai và vận hành

- Ứng dụng được triển khai dưới dạng **Cloudflare Worker** (không phải Pages), tên `bank-9-group`, dùng D1 `bank9-db`, KV `bank9-images` và cron 5 phút.
- URL hiện tại theo cấu hình chuyển hướng: `https://bank-9-group.zoro9x9x9x.workers.dev/`.
- Quy trình deploy: `npm run deploy:check` → `npm run deploy` (kiểm tra cấu hình, typecheck, build, `wrangler deploy`).
- Hỗ trợ deploy tự động từ GitHub qua Workers Builds khi push lên nhánh `main`.
- Dữ liệu demo: 3 danh mục, 12 thương hiệu, 24 sản phẩm, 30 biến thể, 7 đơn hàng và 5 mã giảm giá.

## 8. Hạn chế

- Chưa có tài khoản khách, wishlist, đánh giá sản phẩm, email giao dịch, webhook thanh toán, tích hợp vận chuyển hay hóa đơn điện tử.
- QR là chuyển khoản thật nếu cấu hình tài khoản thật; admin phải đối soát và xác nhận thủ công.
- Chưa có SSR/SEO, đa ngôn ngữ và tối ưu cho traffic lớn.
- Bundle client khoảng 586 kB, Vite cảnh báo chunk > 500 kB; chưa tách nhỏ theo route.
- Mật khẩu admin mặc định chỉ phù hợp cho demo; bắt buộc đổi secret khi dùng thật.

## 9. Kết luận và hướng phát triển

Bank9 Tech đã hoàn thành mục tiêu xây dựng một ứng dụng thương mại điện tử full-stack chạy hoàn toàn trên Cloudflare, với luồng mua hàng và quản trị đầy đủ, các cơ chế bảo vệ tồn kho – thanh toán – bảo mật cơ bản và bộ kiểm thử đạt yêu cầu. Dự án phù hợp làm nền tảng demo, học tập và thử nghiệm hạ tầng serverless.

Hướng phát triển tiếp theo: bổ sung tài khoản khách và đánh giá sản phẩm, tích hợp cổng thanh toán/webhook, email giao dịch, đối soát tự động, SSR/SEO, đa ngôn ngữ và giám sát vận hành nâng cao.

---

**Tài liệu tham chiếu:** `README.md`, `docs/manual-test.md`, `docs/seed-data.md`, `migrations/`, `scripts/test-oversell.mjs`.
