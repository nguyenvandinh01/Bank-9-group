# Bank9 Tech

Web app thương mại điện tử demo bán điện thoại, laptop và máy tính, chạy hoàn toàn trên Cloudflare: **Workers + D1 + R2**, giao diện React + TypeScript + Tailwind CSS.

Dự án phục vụ demo nội bộ: có storefront, trang quản trị, thanh toán chuyển khoản QR nội địa (VietQR, admin xác nhận thủ công) và COD. Không tích hợp cổng thanh toán hay đơn vị vận chuyển thật.

## Tính năng

**Storefront**
- Trang chủ, danh mục, thương hiệu, sản phẩm nổi bật/mới.
- Tìm kiếm tiếng Việt không dấu bằng SQLite FTS5, lọc theo danh mục/thương hiệu/giá, sắp xếp, phân trang.
- Chi tiết sản phẩm với nhiều phiên bản (variant), tồn kho khả dụng, thông số kỹ thuật.
- Giỏ hàng lưu trong `localStorage` (zustand persist).
- Thanh toán COD hoặc QR VietQR, áp mã giảm giá, chống gửi trùng bằng `Idempotency-Key`.
- Tra cứu đơn hàng bằng mã đơn + số điện thoại, theo dõi trạng thái, tự động làm mới khi chờ thanh toán, khách tự hủy đơn khi đơn còn chờ xử lý.

**Quản trị**
- Đăng nhập bằng session cookie ký HMAC-SHA256, rate limit đăng nhập.
- Dashboard doanh thu, đơn chờ xử lý, tồn kho thấp, đơn gần đây.
- CRUD sản phẩm (soft delete), biến thể, tồn kho, ảnh (upload R2).
- CRUD danh mục/thương hiệu, chặn xóa khi còn sản phẩm.
- Xử lý đơn: xác nhận thanh toán QR, chuyển trạng thái, nhập mã vận đơn.
- Cấu hình cửa hàng và tài khoản nhận chuyển khoản dùng cho VietQR.

**Kỹ thuật**
- Giữ chỗ tồn kho có điều kiện (`on_hand - reserved >= qty`), chống oversell khi request đồng thời.
- Đơn hết hạn được cron `*/5 * * * *` giải phóng tồn kho và lượt dùng mã giảm giá.
- Trigger D1 bảo vệ chuyển trạng thái và thanh toán không hợp lệ.
- Rate limit theo IP cho checkout/tra cứu/đăng nhập; kiểm tra same-origin cho request ghi.
- Ảnh upload giới hạn PNG/JPEG/WebP và dung lượng, phục vụ qua Worker với cache immutable.

## Stack

| Thành phần | Công nghệ |
| --- | --- |
| Runtime | Cloudflare Workers (free plan) |
| API | Hono + Zod |
| Database | Cloudflare D1 (SQLite), Drizzle schema + SQL migrations |
| File | Cloudflare R2 |
| Frontend | React 19, React Router, TanStack Query, Zustand, Tailwind CSS v4 |
| Build | Vite 8 + `@cloudflare/vite-plugin` |
| Test | Vitest (unit) + script kiểm thử oversell qua HTTP |

Yêu cầu: Node.js **22.12+** (khuyến nghị 24) và npm. Không cần tài khoản Cloudflare để chạy local.

## Chạy local

```bash
npm install
# PowerShell
Copy-Item .dev.vars.example .dev.vars
# macOS/Linux: cp .dev.vars.example .dev.vars

npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Mở http://127.0.0.1:5173.

- Admin: http://127.0.0.1:5173/admin/login
- Email: `admin@bank9.local`
- Mật khẩu: `Bank9@Demo2026!`

Mỗi lần chạy `npm run dev`, preflight `scripts/check-env.mjs` sẽ kiểm tra phiên bản Node và tự tạo `.dev.vars` từ file mẫu nếu chưa có.

**Lưu ý khi localhost báo `ERR_CONNECTION_REFUSED`:**

- Terminal phải đang chạy `npm run dev`; đóng terminal hoặc nhấn Ctrl+C thì server dừng và trình duyệt báo lỗi này.
- Chờ log hiện dòng `Local: http://127.0.0.1:5173/` rồi mới mở trình duyệt (lần đầu Worker local khởi động hơi lâu).
- Nếu cổng 5173 đang bị tiến trình cũ chiếm, Vite sẽ thoát do `strictPort: true`. Tắt tiến trình cũ rồi chạy lại.

Thông tin đăng nhập và `SESSION_SECRET` trong `.dev.vars` chỉ dùng cho local; file này đã được gitignore.

### Làm mới dữ liệu demo

```bash
npm run db:reset:local
npm run db:seed:local
```

Seed dùng mốc thời gian tương đối so với lúc chạy, nên chạy lại reset + seed để các đơn `pending_payment` có hạn giữ hàng mới.

Chi tiết dữ liệu mẫu: [docs/seed-data.md](docs/seed-data.md).

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Vite dev server + Worker local, D1/R2 local (có preflight kiểm tra Node/`.dev.vars`) |
| `npm run build` | Typecheck và build worker + client vào `dist/` |
| `npm run preview` | Xem bản build local |
| `npm run typecheck` | `tsc -b` cho client, worker, config |
| `npm test` | Unit test Vitest |
| `npm run test:oversell` | Gọi API thật để kiểm tra chống oversell (cần dev server + dữ liệu seed) |
| `npm run db:migrate:local` | Áp migrations D1 local |
| `npm run db:seed:local` | Nạp dữ liệu mẫu local |
| `npm run db:reset:local` | Xóa dữ liệu local (giữ schema) |
| `npm run db:migrate:remote` | Áp migrations D1 remote |
| `npm run db:seed:remote` | Nạp seed lên D1 remote (chỉ nên chạy một lần trên DB mới) |
| `npm run deploy:check` | Kiểm tra `wrangler.jsonc` đã có D1 `database_id` thật chưa |
| `npm run deploy` | Kiểm tra config, build rồi `wrangler deploy` |
| `npm run seed:generate` | Tạo lại ảnh SVG placeholder trong `public/seed/` |

`test:oversell` cần `npm run dev` đang chạy. Mặc định gọi `http://localhost:5173`, có thể đổi bằng biến môi trường `BASE_URL`; script chọn một variant còn đúng 1 hàng, bắn 5 checkout đồng thời, kỳ vọng đúng 1 đơn được tạo, sau đó hủy đơn để hoàn kho.

## Cấu trúc

```
src/
  client/          React SPA: pages, admin, components, store, lib
  shared/          Types, Zod schemas, constants dùng chung
  worker/          Hono app, routes, services, D1 schema, crypto/validate
migrations/        SQL migrations (schema, FTS5, trigger guards)
scripts/           seed.sql, reset.sql, test-oversell.mjs, generate-seed.mjs
public/seed/       Ảnh placeholder sản phẩm
docs/              Dữ liệu seed và checklist kiểm thử thủ công
tests/             Unit test Vitest
```

## API chính

Tất cả response thành công bọc trong `{ "data": ... }`, lỗi là `{ "error": { "code", "message", "details" } }`.

**Public**
- `GET /api/home`, `/api/products`, `/api/products/:slug`, `/api/categories`, `/api/brands`, `/api/settings/public`
- `POST /api/checkout` — bắt buộc header `Idempotency-Key` (8–100 ký tự)
- `GET /api/orders/:code?phone=`, `GET /api/orders/:code/status?phone=`, `POST /api/orders/:code/cancel`
- `GET /api/images/:key`

**Admin** (cần cookie `bank9_admin`)
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`
- `GET /api/admin/stats`
- CRUD `/api/admin/products`, `/api/admin/categories`, `/api/admin/brands`
- `GET /api/admin/orders`, `GET /api/admin/orders/:code`
- `POST /api/admin/orders/:code/confirm-payment`, `POST /api/admin/orders/:code/status`
- `GET|PUT /api/admin/settings`, `POST /api/admin/uploads`

Route `POST /api/dev/run-expiry` chỉ hoạt động khi `ENVIRONMENT=development` để chạy job hết hạn thủ công.

## Deploy lên Cloudflare

> **Quan trọng:** đây là **Cloudflare Worker** (Vite + Worker + D1 + R2 + cron), không phải site tĩnh. **Không deploy bằng Cloudflare Pages.** Nếu connect repo vào Pages, Pages chỉ phục vụ nguyên source (`/src/client/main.tsx`) nên trang trắng và mọi `/api/*` đều trả về HTML.

### Cách 1 — Deploy từ máy local

1. Đăng nhập và tạo tài nguyên (chỉ làm một lần):

```bash
npx wrangler login
npx wrangler d1 create bank9-db
npx wrangler r2 bucket create bank9-images
```

2. Cập nhật `database_id` trong `wrangler.jsonc` bằng ID do lệnh `d1 create` trả về. (Repo để ID giả `00000000-...` cho tiện chạy local; deploy với ID giả sẽ lỗi.)

3. Đặt secret cho môi trường production (không dùng giá trị demo):

```bash
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

4. Áp migrations và seed dữ liệu (chỉ seed một lần trên DB mới):

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

5. Kiểm tra cấu hình rồi deploy:

```bash
npm run deploy:check
npm run deploy
```

`deploy:check` sẽ báo lỗi rõ ràng nếu `database_id` vẫn còn là ID giả. Sau khi deploy, Worker chạy tại `https://bank9-tech.<tài-khoản>.workers.dev` (hoặc domain gắn trong dashboard).

### Cách 2 — Deploy tự động từ GitHub (Workers Builds)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Workers** → **Connect to Git** (không chọn Pages).
2. Chọn repo `Bank-9-group`, branch `main`.
3. Build command: `npm run build`; Deploy command: `npm run deploy`.
4. Tạo D1/R2 và cập nhật `database_id` như Cách 1; thêm `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` trong **Settings → Variables and Secrets**.
5. Mỗi lần push lên `main`, Cloudflare build và deploy lại.

Nếu repo đã có project Pages `bank-9-group` (trang `bank-9-group.pages.dev`), hãy xóa project đó trong dashboard — nó không thể chạy backend Worker/D1/R2 của app này.

`ENVIRONMENT` trong `wrangler.jsonc` là `production`. Khi chạy local, `.dev.vars` ghi đè thành `development`.

### Lỗi deploy thường gặp

| Hiện tượng | Nguyên nhân / cách sửa |
| --- | --- |
| `pages.dev` trắng trang | Đang deploy bằng Pages. Chuyển sang Worker (Cách 1 hoặc 2), xóa project Pages. |
| `Couldn't find a D1 DB with ID ...` | `database_id` trong `wrangler.jsonc` vẫn là ID giả hoặc chưa tạo D1. Chạy `npx wrangler d1 create bank9-db` rồi cập nhật ID. |
| Mở web được nhưng API 500 / không có sản phẩm | Chưa chạy `npm run db:migrate:remote` + `npm run db:seed:remote`, hoặc thiếu secret production. |
| Đăng nhập admin thất bại | Chưa đặt `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` bằng `wrangler secret put`. |
| Upload ảnh lỗi | Chưa tạo bucket R2 `bank9-images` hoặc binding không khớp. |

Lưu ý free plan: mỗi request có giới hạn CPU, cron chạy mỗi 5 phút. Ảnh demo là SVG tĩnh trong `public/seed/`; ảnh admin upload nằm trong R2.

## Kiểm thử

```bash
npm test
npm run typecheck
npm run build
npm run test:oversell   # cần npm run dev ở terminal khác
```

Checklist thủ công 18 bước: [docs/manual-test.md](docs/manual-test.md).

## Bảo mật và giới hạn

- Đây là demo: mật khẩu admin mặc định công khai, không dùng cho production.
- Đổi `ADMIN_PASSWORD` và `SESSION_SECRET` khi deploy; không commit `.dev.vars`.
- QR là chuyển khoản thật nếu cấu hình tài khoản thật — admin phải đối soát và xác nhận thủ công.
- Chưa có tài khoản khách, review, wishlist, email giao dịch, webhook thanh toán, tích hợp vận chuyển, hoá đơn điện tử, SSR/SEO hay đa ngôn ngữ.
- SQLite/D1 phù hợp quy mô demo; chưa tối ưu cho traffic lớn.
