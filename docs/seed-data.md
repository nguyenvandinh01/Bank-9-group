# Dữ liệu seed

File `scripts/seed.sql` tạo dữ liệu demo cho Bank9 Tech. Mọi mốc thời gian dùng `strftime('%s','now') * 1000` nên đơn hàng luôn có thời điểm tạo/hết hạn tương đối so với lúc seed.

## Tổng quan

| Nhóm | Số lượng |
| --- | --- |
| Danh mục | 3 |
| Thương hiệu | 12 |
| Sản phẩm | 24 |
| Biến thể (variant) | 30 |
| Đơn hàng demo | 7 |
| Mã giảm giá | 5 |

Ảnh sản phẩm là SVG placeholder trong `public/seed/`, được tạo bởi `npm run seed:generate`.

## Danh mục

1. `dien-thoai` — Điện thoại
2. `laptop` — Laptop
3. `may-tinh` — Máy tính

## Tài khoản admin local

| Trường | Giá trị |
| --- | --- |
| Email | `admin@bank9.local` |
| Mật khẩu | `Bank9@Demo2026!` |

Giá trị nằm trong `.dev.vars` (không commit). Trên production, đặt qua `wrangler secret put`.

## Mã giảm giá

| Mã | Loại | Điều kiện | Ghi chú |
| --- | --- | --- | --- |
| `WELCOME10` | Giảm 10%, tối đa 500.000 ₫ | Đơn từ 5.000.000 ₫ | Dùng để test giảm theo % |
| `FREESHIP` | Giảm 30.000 ₫ | Đơn từ 3.000.000 ₫ | Tương đương miễn phí ship |
| `LAPTOP500` | Giảm 500.000 ₫ | Đơn từ 15.000.000 ₫ | Đơn demo 0007 dùng mã này |
| `EXPIRED2024` | Giảm 10%, tối đa 300.000 ₫ | — | Đã hết hạn, dùng để test lỗi |
| `USEDUP` | Giảm 100.000 ₫ | — | Đã hết lượt, dùng để test lỗi |

## Đơn hàng demo

Tra cứu tại `/tra-cuu-don` bằng mã đơn + số điện thoại.

| Mã đơn | SĐT | Trạng thái | Thanh toán | Tổng | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `B9-DEMO-0001` | `0901234567` | `pending_payment` | QR | 29.990.000 ₫ | iPhone 15 Pro Max, còn hạn giữ hàng sau khi seed |
| `B9-DEMO-0002` | `0912345678` | `paid` | QR | 19.990.000 ₫ | iPhone 15 128GB, đã xác nhận thanh toán |
| `B9-DEMO-0003` | `0987654321` | `shipping` | QR | 27.990.000 ₫ | MacBook Air M3, mã vận đơn `GHN123456789` |
| `B9-DEMO-0004` | `0933334444` | `completed` | COD | 9.020.000 ₫ | PC văn phòng, có phí ship 30.000 ₫ |
| `B9-DEMO-0005` | `0944445555` | `cancelled` | QR | 6.520.000 ₫ | Khách đổi ý |
| `B9-DEMO-0006` | `0955556666` | `expired` | QR | 15.990.000 ₫ | Hết hạn giữ hàng |
| `B9-DEMO-0007` | `0966667777` | `pending_payment` | QR | 22.490.000 ₫ | PC Gaming RTX 4060, dùng `LAPTOP500` (giảm 500.000 ₫) |

## Tồn kho và giữ hàng

- Mỗi variant có một dòng `inventory` với `on_hand` và `reserved`.
- `available = on_hand - reserved`, là con số hiển thị cho khách.
- Seed giữ chỗ cho đơn `B9-DEMO-0001` và `B9-DEMO-0007`, đồng thời trừ `on_hand` cho các đơn đã thanh toán/giao.
- Một variant được cố ý để **1 hàng** (ASUS ROG Zephyrus G14 — `ROG-G14-R9-4060`) phục vụ test oversell.
- Một variant để **0 hàng** (PC Workstation RTX 4090) để thấy cảnh báo tồn kho thấp trên dashboard.

## Làm mới dữ liệu

```bash
npm run db:reset:local
npm run db:seed:local
```

`reset.sql` chỉ xóa dữ liệu, giữ schema và migration. `seed.sql` tự xóa dữ liệu cũ trước khi nạp nên có thể chạy lại, nhưng **không chạy seed trên production** nếu đang có đơn thật.

Sau khi reset + seed, các đơn `pending_payment` có hạn giữ hàng mới. Chạy `npm run dev` rồi gọi `POST /api/dev/run-expiry` (chỉ môi trường development) để test job hết hạn ngay, hoặc chờ cron 5 phút trên môi trường deploy.
