# Sticker cá nhân từ bàn phím / clipboard — Phase 1

Ngày: 2026-11-06. Yêu cầu mới thay lựa chọn chỉ gồm catalog cố định bằng sticker do người dùng tự thêm. **Vẫn Phase 1, local mock, chưa đồng bộ ảnh hay triển khai Firebase.** Kế hoạch catalog 15 ảnh trước đây được giữ như tài liệu lịch sử; PNG mẫu vẫn dùng được để tương thích với ngày đã chọn trước đó.

## Giao diện và luồng nhận ảnh

- Tab mặc định **Sticker của bạn** có ô chỉnh sửa nhận ảnh từ `paste` hoặc ảnh được bàn phím chèn vào, một emoji từ bàn phím và nút **Chọn ảnh từ thiết bị** dự phòng.
- **Dán từ clipboard** chỉ đọc khi người dùng bấm nút, thông qua API mà trình duyệt cung cấp; không tự đọc clipboard khi mở trang. Nếu API/permission không khả dụng, hướng dẫn nhấn giữ ô và dùng Dán.
- Paste ưu tiên image file; HTML chỉ được kiểm tra để lấy một `data:image/png|jpeg|webp;base64` khi cần. Không render HTML clipboard và không tải ảnh từ URL ngoài. Native image insertion chỉ nhận data URL hợp lệ hoặc blob URL cùng origin.
- Tab **Bộ mẫu** giữ 15 PNG cũ và các lựa chọn cũ; sticker cá nhân không bị giới hạn vào danh sách này.
- Người viết đầu tiên vẫn phải xác nhận một lần. Thêm ảnh vào thư viện chưa có nghĩa đã gán cho ngày. Không gán khi ảnh chưa tải thành công, lưu ảnh lỗi hoặc lưu metadata ngày thất bại.
- Emoji là một grapheme được xác thực, gồm emoji có màu da, gia đình ZWJ, cờ và keycap; không coi văn bản tùy ý, URL hoặc HTML là sticker.

## Hỗ trợ iPhone và giới hạn đã biết

Apple hướng dẫn tạo sticker bằng **Ảnh → nhấn giữ chủ thể → Add Sticker**, dùng trong bàn phím/các ứng dụng hỗ trợ. Đây không phải bảo đảm rằng mọi webview/Safari đều đưa cùng dữ liệu ảnh cho trang web. [Apple: tạo sticker từ ảnh](https://support.apple.com/guide/iphone/make-stickers-from-your-photos-iph9b4106303/ios), [Apple: sticker với bàn phím](https://support.apple.com/en-ca/guide/iphone/iph69df21ec5/27/ios/27).

Luồng dự phòng: **Ảnh → nhấn giữ chủ thể → Sao chép → quay lại ô sticker và Dán**; hoặc chọn PNG đã cắt từ thiết bị. Giao diện không liệt kê trực tiếp bộ sticker cá nhân của iOS. Website chỉ nhận dữ liệu mà hệ điều hành/trình duyệt chuyển cho thao tác nhập/dán, không truy cập tài khoản iCloud hay thư viện sticker riêng của hệ điều hành.

WebKit ghi nhận Safari 26.4 đã sửa tình huống Copy Image mang theo URL làm website nhận URL thay vì ảnh. Điều này củng cố việc cần fallback và ưu tiên dữ liệu ảnh; nó không xác nhận bàn phím sticker trên một iPhone cụ thể. [WebKit clipboard fixes](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/).

Clipboard paste được xử lý bằng [`ClipboardEvent.clipboardData`](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData) và [`DataTransfer.files`](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files). API đọc clipboard theo nút là cách bổ sung; event paste và chọn file vẫn là đường dự phòng.

**Chưa kiểm thử iPhone thật.** Playwright WebKit trên Windows là kiểm tra web engine/viewport, không mô phỏng thư viện sticker, bàn phím, quyền clipboard hoặc hệ điều hành iOS thật. Trước khi nghiệm thu cần thử bàn phím sticker, Sao chép/Dán chủ thể và chọn file trên Safari của thiết bị mục tiêu.

## Lưu dữ liệu và quyền chọn

- Ảnh import được giải mã local, thu nhỏ giữ tỉ lệ thành PNG tối đa 512px; thumbnail tối đa 96px. Giữ alpha nếu ảnh có alpha, không tự cắt nền mới hoặc gửi ảnh đi xử lý ở dịch vụ ngoài.
- Chỉ nhận PNG/JPEG/WebP tối đa 5 MB, giới hạn kích thước ảnh; output PNG được giới hạn dung lượng. SVG, HTML và ảnh giả header bị từ chối. Sticker động không được bảo đảm giữ chuyển động; mục tiêu hiện tại là ảnh tĩnh.
- Binary ảnh nằm trong **IndexedDB của origin trên thiết bị**, dưới dạng ArrayBuffer, không trong localStorage, Firestore, Git hoặc log. Blob URLs chỉ được tạo khi cần hiển thị rồi thu hồi khi hết dùng. LocalStorage của diary chỉ lưu ID `personal-<UUID>` hoặc ID emoji đã mã hóa, cùng metadata ngày.
- Store kiểm tra ảnh cá nhân tồn tại trước khi gán và kiểm tra lại quyền người viết đầu tiên sau lần đọc async. Catalog/emoji tiếp tục dùng đường lưu đồng bộ cũ; các guard first-writer và không thay lựa chọn đã gán được dùng chung.
- Ngày đã gán giữ nguyên ID và attribution sau reload, chỉnh sửa/ẩn ghi chú. Dữ liệu cũ chỉ dùng catalog vẫn tương thích. Nếu ảnh local bị xóa mà metadata còn, hiển thị thiếu ảnh thay vì tự gán sticker khác hoặc chuyển người viết đầu tiên.
- Không có bảo đảm atomic giữa IndexedDB và localStorage hay giữa các tab/thiết bị. Import bị hủy hoặc metadata lưu lỗi có thể để ảnh trong thư viện để dùng lại; không có thao tác xóa thư viện tự động làm mất ảnh lịch sử.
- Bản thân nhập ảnh không phát request upload. Object URLs được thu hồi khi hết dùng. Ảnh người dùng không được copy vào repo, artifact QA hoặc dịch vụ bên ngoài; test chỉ dùng fixture công khai đã có trong repo.

## Khác biệt so với bản dùng chung tương lai

Ảnh chỉ ở thiết bị thêm nó. Cùng một ID sẽ không khiến thành viên trên máy khác tự nhận được binary ảnh. Vì vậy đây chưa phải thiết kế lưu sticker dùng chung production.

Để sử dụng thật phải duyệt lại yêu cầu **không upload/không image storage** và chọn một phương án lưu ảnh dùng chung, phân quyền, retention, quota và backup. Không tự nhét base64 ảnh vào Firestore để lách quyết định này, không bật billing/Storage hoặc dịch vụ trả phí trong Phase 1. Các transaction, membership/rules và deployment vẫn chưa được triển khai.

## Kiểm tra và điểm dừng

Đã thực thi ngày 2026-11-06:

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run lint` | Qua, không lỗi/cảnh báo lint |
| `npm run typecheck` | Qua |
| `npm test` | 72 tests qua, 7 files |
| `npm run build` | Qua |
| `npm run test:e2e` | 59 tests qua trong 2,7 phút; Chromium desktop/mobile và WebKit viewport iPhone 13 |

27 browser cases kiểm tra 9 luồng sticker cá nhân trên ba cấu hình; 32 cases còn lại kiểm tra hồi quy giao diện và catalog cũ trên Chromium desktop/mobile. Các luồng mới gồm emoji, clipboard image, ảnh từ thiết bị và dùng lại, native image insertion tổng hợp, lỗi lưu metadata, đầu vào không hợp lệ/URL ngoài, IndexedDB không khả dụng và ảnh local đã mất. Kiểm tra ảnh dán không phát sinh request HTTP ra origin ngoài. Unit tests bổ sung xác thực ID/emoji và header/kích thước ảnh PNG/JPEG/WebP trước decode. Firestore Rules không đổi; không chạy lại emulator trong lượt cập nhật này.

Kiểm thử đầu tiên đã tái hiện lỗi thiếu mục nhập cá nhân trước khi triển khai. Lượt browser đầu phát hiện lỗi WebKit Windows không persist được Blob vào IndexedDB; probe độc lập cho kết quả text qua, Blob lỗi `UnknownError`, ArrayBuffer qua. Đã đổi persistence sang ArrayBuffer và chạy lại toàn bộ suite thành công. Một assertion đọc metadata quá sớm sau thao tác async cũng được đổi thành assertion chờ trạng thái lưu thực tế.

Đã kiểm tra trực quan ảnh chụp desktop/mobile. Artifact local (bị Git ignore) dùng PNG fixture của repo, không dùng ảnh riêng tư:

- [Bộ chọn desktop](../artifacts/personal-sticker-picker-desktop.png)
- [Bộ chọn mobile](../artifacts/personal-sticker-picker-mobile.png)
- [Trang ngày mobile sau khi lưu](../artifacts/personal-sticker-day-mobile.png)
- Log browser: `artifacts/personal-stickers-final-e2e.log`.

Không thêm dependency, không bật dịch vụ Firebase, không upload, push hoặc deploy. Rủi ro bảo mật và audit dependency đã ghi trong báo cáo trước vẫn chưa được giải quyết bởi thay đổi UI này. Không coi thao tác paste tổng hợp trong automation là bằng chứng bàn phím iPhone thật hoạt động. UI và luồng sticker cá nhân vẫn chờ chủ repo duyệt trong Phase 1.
