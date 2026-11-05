# Sticker cho ngày — Phase 1

Cập nhật 2026-11-06 theo yêu cầu **Keep the UI simple**. Vẫn là local mock, chờ duyệt UI.

## Luồng hiện tại

- **Tự thêm:** dán ảnh sticker đã cắt hoặc emoji từ bàn phím; nút chọn ảnh từ thiết bị là đường dự phòng.
- **Có sẵn:** chọn một trong 15 PNG mẫu.
- Xem trước rồi bấm **Dùng sticker** để gắn với ngày. Người viết đầu tiên vẫn được chọn một lần.
- Không có thư viện sticker cá nhân, lưu vào bộ sticker hoặc giao diện quản lý bộ sưu tập. Ảnh tự thêm không trở thành lựa chọn cho ngày khác.

## Vòng đời ảnh

Ảnh nháp được chuẩn bị trong bộ nhớ, chưa ghi IndexedDB. Đóng bộ chọn, đổi nguồn hoặc chọn ảnh khác thì bỏ ảnh nháp cũ. Chỉ lúc xác nhận, ảnh mới được giữ như dữ liệu đính kèm của ngày để trang ngày và lịch không mất hình sau reload; đây không phải lưu vào thư viện sticker dùng lại.

Nếu lưu metadata thất bại, cố gắng xóa bản ảnh vừa ghi và giữ preview trong hộp thoại để thử lại. IndexedDB và localStorage không có transaction chung; nếu bước dọn dẹp cũng lỗi, có thể còn dữ liệu ảnh không gắn ngày, nhưng không hiển thị thành thư viện. Dữ liệu đã xác nhận ở phiên bản trước được giữ để bảo toàn lịch sử, không tự xóa dữ liệu người dùng.

Ảnh PNG/JPEG/WebP tối đa 5 MB, cạnh tối đa 4096px, được kiểm tra header trước decode. Canvas chuyển local thành PNG tối đa 512px/192 KiB và thumbnail 96px, giữ alpha sẵn có; ảnh không được tự cắt nền. Dữ liệu ảnh lưu ArrayBuffer trong IndexedDB; localStorage chỉ giữ ID/metadata. Object URLs được thu hồi khi không còn dùng. Không upload, không thêm ảnh người dùng vào Git/log/artifact; QA chỉ dùng PNG fixture của repo.

Ảnh chưa đồng bộ giữa thiết bị/thành viên. Firestore vẫn deny-all, chưa có Firebase Storage hoặc deployment. Việc đồng bộ ảnh dùng chung cần thiết kế và phê duyệt ở phase sau.

## iPhone

Website chỉ nhận dữ liệu mà bàn phím/trình duyệt chuyển vào thao tác nhập hoặc paste; không liệt kê thư viện sticker riêng của iOS. Có thể thử Sao chép chủ thể từ Ảnh rồi Dán, hoặc chọn PNG đã cắt. Apple mô tả sticker trong các ứng dụng hỗ trợ: [hướng dẫn tạo sticker](https://support.apple.com/guide/iphone/make-stickers-from-your-photos-iph9b4106303/ios).

Paste ưu tiên image file; HTML chỉ được đọc để lấy data URI ảnh hợp lệ, không render hoặc tải URL ngoài. Native image insertion nhận data URI hoặc blob URL cùng origin. Tham khảo [ClipboardEvent.clipboardData](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData), [DataTransfer.files](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files), [WebKit: Safari 26.4 clipboard fixes](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/).

**Chưa kiểm thử bàn phím iPhone thật.** Playwright WebKit trên Windows chỉ kiểm tra engine/viewport và event tổng hợp.

## Kiểm tra

Đã chạy sau khi đơn giản hóa UI:

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run lint`, `npm run typecheck` | Qua |
| `npm test` | 72 unit tests qua |
| `npm run build` | Qua |
| `npm run test:e2e` | 62 tests qua trong 2,1 phút: Chromium desktop/mobile và WebKit |

Phạm vi browser gồm nhập ảnh/emoji, ảnh gắn ngày sau reload, không có lựa chọn dùng lại ở ngày khác, hủy/đổi nguồn không ghi ảnh, lỗi metadata dọn ảnh chưa gắn và hồi quy catalog/first writer. Đã kiểm tra trực quan [Tự thêm trên mobile](../artifacts/simple-sticker-picker-mobile.png), [Có sẵn trên mobile](../artifacts/simple-sticker-samples-mobile.png) và ảnh desktop tương ứng trong thư mục `artifacts/` bị Git ignore. Log browser: `artifacts/simple-stickers-e2e.log`. Firestore Rules không đổi; không chạy lại emulator cho thay đổi này.

Lượt trước tại commit `108c8d7` có 72 unit tests và 59 browser tests qua; thiết kế thư viện dùng lại trong lượt đó đã được thay bằng phạm vi hiện tại. Review catalog cũ không bao gồm cập nhật này. Không thêm dependency hoặc bật billing/dịch vụ cloud. Các rủi ro bảo mật/audit đã ghi trong báo cáo trước vẫn còn; local mock chưa dành cho nhật ký riêng tư dùng thật.
