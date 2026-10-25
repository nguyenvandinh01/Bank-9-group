# Checklist kiểm thử thủ công

Chuẩn bị:

```bash
npm run db:reset:local
npm run db:seed:local
npm run dev
```

Mở http://localhost:5173. Admin: `admin@bank9.local` / `Bank9@Demo2026!`.

Một số test làm thay đổi dữ liệu; chạy lại reset + seed nếu cần trạng thái ban đầu.

---

## 1. Trang chủ và điều hướng

- Mở `/`.
- Kiểm tra banner, danh mục, sản phẩm nổi bật, sản phẩm mới, footer thông tin cửa hàng.
- Bấm logo, menu Điện thoại / Laptop / Máy tính, giỏ hàng, tra cứu đơn.

**Kỳ vọng:** trang tải không lỗi, link điều hướng đúng, số lượng sản phẩm hiển thị hợp lý.

## 2. Tìm kiếm tiếng Việt không dấu

- Vào `/san-pham`, nhập `dien thoai` hoặc `điện thoại`.
- Thử `iphone`, `laptop gaming`, `may tinh`.

**Kỳ vọng:** kết quả khớp theo tên/mô tả, không phân biệt hoa thường và dấu; từ khóa rỗng trả về toàn bộ.

## 3. Lọc, sắp xếp, phân trang

- Chọn danh mục `Laptop`, thương hiệu `Apple`.
- Đặt khoảng giá, sắp xếp giá tăng/giảm, tên A–Z.
- Chuyển trang 2.

**Kỳ vọng:** bộ lọc kết hợp đúng, URL giữ tham số, số trang và tổng kết quả chính xác, không trùng sản phẩm.

## 4. Chi tiết sản phẩm

- Mở một sản phẩm còn nhiều hàng (ví dụ iPhone 15 Pro Max).
- Chuyển giữa các phiên bản, xem ảnh và thông số.

**Kỳ vọng:** giá, tồn kho, thông số đổi theo variant; variant hết hàng bị vô hiệu hóa hoặc báo hết hàng.

## 5. Giỏ hàng

- Thêm 2 sản phẩm, tăng/giảm số lượng, xóa một dòng.
- Tải lại trang.
- Thử tăng một variant lên quá 10 hoặc quá tồn kho.

**Kỳ vọng:** giỏ hàng còn nguyên sau reload, tạm tính đúng, số lượng bị chặn ở mức tối đa cho phép.

## 6. Thanh toán COD

- Thêm iPhone 15 128GB vào giỏ, vào `/thanh-toan`.
- Nhập họ tên, SĐT `0901234567`, địa chỉ đủ dài, chọn COD, nhập `WELCOME10`.
- Gửi đơn.

**Kỳ vọng:** tạo đơn thành công, chuyển tới `/don-hang/<mã>`, trạng thái `Chờ xác nhận COD`, tổng tiền đã trừ mã giảm giá, giỏ hàng được xóa.

## 7. Thanh toán QR

- Tạo đơn mới với phương thức QR, không dùng mã giảm giá.
- Kiểm tra trang đơn hàng.

**Kỳ vọng:** trạng thái `Chờ thanh toán`, hiển thị ảnh VietQR, số tiền và nội dung chuyển khoản là mã đơn; có đếm ngược hạn giữ hàng (mặc định 30 phút). Trạng thái tự làm mới khi còn chờ.

## 8. Chống gửi trùng (idempotency)

- Dùng DevTools hoặc curl gửi cùng một payload checkout hai lần với cùng header `Idempotency-Key`.

```bash
curl -X POST http://localhost:5173/api/checkout \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: manual-test-0001" \
  -d '{"customerName":"Idem Test","phone":"0901112223","address":"123 Duong Test Quan 1","paymentMethod":"cod","items":[{"variantId":3,"qty":1}]}'
```

**Kỳ vọng:** lần đầu trả `201` với mã đơn mới; lần hai trả `200`, `reused: true` và cùng mã đơn; tồn kho chỉ bị giữ một lần.

## 9. Tra cứu đơn hàng

- Vào `/tra-cuu-don`, nhập `B9-DEMO-0002` + `0912345678`.
- Thử lại với số điện thoại sai.

**Kỳ vọng:** đơn đúng hiển thị trạng thái, sản phẩm, lịch sử; sai SĐT trả lỗi không tìm thấy đơn.

## 10. Khách hủy đơn

- Tra cứu `B9-DEMO-0001` bằng `0901234567` (hoặc đơn COD vừa tạo).
- Bấm hủy đơn và xác nhận.
- Kiểm tra tồn kho khả dụng của sản phẩm trước/sau.

**Kỳ vọng:** đơn chuyển `Đã hủy`, không thể hủy lại; tồn kho khả dụng tăng đúng số lượng đã giữ.

## 11. Chống oversell

- Chạy ở terminal khác khi dev server đang chạy:

```bash
npm run test:oversell
```

**Kỳ vọng:** `PASS`, đúng 1 đơn được tạo trong 5 request đồng thời cho variant còn 1 hàng, 4 request nhận `409 OUT_OF_STOCK`, tồn kho được hoàn sau khi hủy đơn test.

## 12. Đăng nhập admin

- Vào `/admin` khi chưa đăng nhập.
- Đăng nhập sai mật khẩu 5 lần liên tiếp, sau đó đăng nhập đúng.
- Đăng xuất, mở lại `/admin`.
- Gọi `GET /api/admin/stats` không có cookie.

**Kỳ vọng:** bị chặn khi chưa đăng nhập; sai 5 lần bị giới hạn tạm thời; đăng nhập đúng vào dashboard; sau đăng xuất không truy cập được; API admin trả `401`.

## 13. Dashboard

- Đăng nhập admin, mở `/admin`.

**Kỳ vọng:** tổng đơn, đơn chờ, doanh thu, doanh thu hôm nay, danh sách tồn kho thấp (gồm PC Workstation 0 hàng và ASUS ROG 1 hàng), 8 đơn gần nhất.

## 14. CRUD sản phẩm và upload ảnh

- Vào `/admin/san-pham/moi`.
- Tạo sản phẩm mới: tên, danh mục, thương hiệu, mô tả, ít nhất một variant (SKU, tên, giá, tồn kho).
- Upload ảnh PNG/JPEG/WebP.
- Lưu, mở lại sản phẩm, sửa giá/tồn kho.
- Xóa sản phẩm (soft delete).

**Kỳ vọng:** sản phẩm xuất hiện ở storefront khi đang bán; ảnh upload hiển thị qua `/api/images/...`; sau xóa, sản phẩm biến mất khỏi storefront nhưng đơn cũ vẫn giữ dữ liệu.

## 15. Danh mục và thương hiệu

- Vào `/admin/danh-muc`, thêm danh mục mới, sửa tên, thêm thương hiệu mới.
- Thử xóa danh mục `Laptop` hoặc thương hiệu `Apple`.

**Kỳ vọng:** thêm/sửa thành công; xóa bị chặn với thông báo danh mục/thương hiệu còn sản phẩm; xóa được mục mới chưa có sản phẩm.

## 16. Xử lý đơn hàng

- Tạo một đơn QR mới, mở `/admin/don-hang`.
- Mở chi tiết đơn, bấm xác nhận thanh toán.
- Chuyển trạng thái sang `Đang giao`, nhập mã vận đơn `GHN-TEST-999`.
- Chuyển tiếp sang `Hoàn thành`.
- Thử chuyển lùi hoặc xác nhận thanh toán lần hai.

**Kỳ vọng:** đơn `paid` sau xác nhận, tồn kho thực giảm và giải phóng giữ hàng; mã vận đơn lưu vào đơn; chỉ cho phép bước chuyển hợp lệ; xác nhận lần hai trả `alreadyConfirmed` hoặc lỗi phù hợp.

## 17. Cài đặt cửa hàng

- Vào `/admin/cai-dat`, đổi tên cửa hàng, hotline, thông tin ngân hàng, phí ship.
- Lưu, tải lại trang chủ và tạo đơn QR mới.

**Kỳ vọng:** thông tin mới hiển thị ở storefront; phí ship và ngưỡng miễn phí áp dụng cho đơn mới; mã VietQR dùng đúng BIN/số tài khoản/chủ tài khoản mới.

## 18. Hết hạn giữ hàng và kiểm tra bảo mật

- Chạy `POST /api/dev/run-expiry` (local, `ENVIRONMENT=development`).
- Kiểm tra các đơn `pending_payment` đã quá hạn.
- Thử upload file `.txt` hoặc ảnh quá dung lượng vào `/api/admin/uploads`.
- Gửi POST `/api/checkout` với header `Origin: https://evil.example`.

**Kỳ vọng:** đơn quá hạn chuyển `expired`, tồn kho và lượt dùng mã được hoàn; đơn đã thanh toán không bị ảnh hưởng; upload sai định dạng/quá lớn bị từ chối; request khác origin bị chặn (403).
