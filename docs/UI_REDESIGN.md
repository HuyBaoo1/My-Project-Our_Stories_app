# Our Stories — UI sổ lưu niệm

Ngày: 2026-11-05. **Trạng thái: chờ chủ repo duyệt UI, vẫn thuộc Phase 1.**

## Thiết kế

Tham chiếu: ảnh màn hình CapLog được cung cấp, với nền giấy kẻ ô màu kem, xanh cobalt, bìa ngày trắng bo góc, số ngày lớn, collage sticker và lịch thoáng.

- Nền giấy `#eeece2`, mực cobalt `#172bbd`, wordmark serif nghiêng và nút Hôm nay dạng oval.
- Bìa ngày theo ngày đang chọn: năm/tháng, thứ, số thứ tự trong năm, số ngày lớn và liên kết mở trang nhật ký.
- Sticker dựng bằng emoji và CSS, gồm viền trắng, bóng nhẹ, xoay như miếng dán. Không thêm ảnh, upload, image database hoặc nguồn tài nguyên bên ngoài. Emoji có thể khác nhẹ theo hệ điều hành.
- Lịch FullCalendar Standard giữ bảy cột, bỏ đường viền bảng và nền header đặc. Ngày có ghi chú hiện sticker lấy từ emoji trong nội dung và badge đếm; nội dung thật không bị thay đổi.
- Hàng nút tròn lọc **lịch tháng** theo tên người viết trong dữ liệu mock; dấu cộng mở editor đúng ngày đang chọn. Bộ lọc giữ nguyên khi đổi tháng. Trang ngày vẫn chứa đầy đủ ghi chú chung.
- Desktop: bìa và lịch ở trái, trang ngày ở phải. Tablet/mobile: một cột; chọn ngày mở trang riêng và thanh điều hướng ở dưới.
- Ghi chú dạng giấy nhỏ, điểm nhấn xanh/lavender; editor, menu, lịch sử, thông báo xung đột và hộp xác nhận dùng chung theme.
- Menu tùy chọn tự đóng sau khi chọn chỉnh sửa/ẩn để không che nút xem lịch sử của ghi chú ngắn.

## Phạm vi

Thay đổi nằm trong layout, các trang, component lịch/bìa/bộ lọc, stylesheet, phần đóng menu ghi chú, kiểu day summary, theme-color và test UI. Không đổi Firestore Rules, schema dữ liệu lưu trữ, membership, Auth hoặc cấu hình dịch vụ. Không thêm dependency. Tất cả dữ liệu vẫn là mock trên trình duyệt, ghi chú/bản nháp hiện có được giữ nguyên.

Bộ lọc theo display name chỉ là thao tác trên fixtures local; không được dùng làm định danh hoặc phân quyền trong Firebase về sau.

## Kiểm tra

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, Vite 8.3.5, 2141 modules |
| `npm test` | PASS, 3 files / 21 tests |
| `npm run test:e2e` | PASS, 20 tests trên Chromium desktop 1440×1000 và mobile 360×800 |
| Built preview | HTTP 200; lịch 7 cột, trang ngày và editor không tràn ngang ở các kích thước đã kiểm tra; không có page error trong flow QA |

Trích output cuối:

```text
Test Files  3 passed (3)
     Tests  21 passed (21)

✓ 2141 modules transformed.

20 passed (1.2m)

PASS: final built UI HTTP 200; responsive 7-column calendar;
1440px/360px calendar, day and editor without horizontal overflow or page errors.
```

Browser regression gồm duyệt tháng/ngày, dữ liệu lịch sử, lưu và tải lại rich text, giữ bản nháp, lịch sử/soft-delete, link không an toàn, xung đột mẫu, route lỗi và join placeholder. Test mới kiểm tra bộ lọc người viết, giữ bộ lọc khi đổi tháng và dấu cộng mở đúng editor. Lượt đầu có một lỗi menu che lịch sử trên mobile; đã sửa đóng menu sau thao tác và chạy lại toàn bộ, 20/20 qua.

Đã xem ảnh chụp desktop/mobile và thu gọn bìa trên mobile để lịch xuất hiện sớm hơn. Mobile là browser emulation, chưa kiểm tra trên thiết bị thật. Rule tests không chạy lại trong lượt chỉnh UI vì rules và Firebase adapter không thay đổi; kết quả baseline cũ được giữ ở `PHASE_1_REPORT.md`. Dependency audit vẫn là điểm mở được ghi trong báo cáo Phase 1; không thay dependency trong lượt này.

## Xem thiết kế local

Chạy `npm run dev`, mở `http://127.0.0.1:5173/calendar`.

Ảnh QA nằm trong `artifacts/` và được gitignore:

- `ui-v2-desktop.png`: lịch và panel ngày ở desktop 1440px.
- `ui-v2-mobile.png`: phần đầu màn hình mobile 360px.
- `ui-v2-mobile-full.png`: toàn bộ trang lịch mobile.
- `ui-v2-mobile-calendar.png`: phần lịch khi cuộn trên mobile.
- `ui-v2-mobile-day.png`: trang ghi chú mobile.
- `ui-v2-mobile-editor.png`: editor mobile.

Không provisioning, OAuth, production writes, push source public hoặc deploy trong lượt thiết kế này. Chờ phản hồi về UI trước bước tiếp theo.
