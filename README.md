# Our Stories — Những ngày bên nhau

Nhật ký chung theo lịch, tiếng Việt, dành cho gia đình và bạn bè. **Phase 1: giao diện chạy bằng dữ liệu mẫu, chưa phải ứng dụng nhật ký riêng tư dùng thật.**

Giao diện hiện tại theo hướng sổ lưu niệm: nền giấy kẻ ô màu kem, xanh cobalt, bìa ngày với số lớn. Bộ chọn sticker có hai lựa chọn: **Tự thêm** qua paste/ảnh/emoji và chọn hình **Có sẵn**. Xem [thiết kế UI](docs/UI_REDESIGN.md) và [sticker cá nhân Phase 1](docs/PERSONAL_STICKERS_PHASE1.md). **Đang chờ duyệt UI.**

## Chạy local

Yêu cầu: Node.js 24.13+ (môi trường đã kiểm tra), npm 11; Java 21+ để chạy Firestore Emulator. Không cần tài khoản Firebase, Google OAuth hoặc thẻ thanh toán.

```bash
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173**. Các trang: `/calendar`, `/day/2026-11-05`, `/join`, `/about`. Giao diện tự chọn ngày hiện tại theo `Asia/Ho_Chi_Minh`; có thể duyệt tháng cũ.

- Lịch tháng FullCalendar; panel ngày trên desktop, trang ngày riêng trên mobile.
- Tiptap: đoạn văn, xuống dòng, đậm/nghiêng, danh sách, liên kết HTTP(S), emoji.
- Thử thêm/sửa/ẩn ghi chú: JSON nằm trong `localStorage`, bản nháp trong `sessionStorage`. Không nhập dữ liệu riêng tư. Xóa dữ liệu trình duyệt có thể làm mất bản mẫu.
- Revision/conflict/history trong mock chỉ minh họa. Không bảo đảm ghi đồng thời giữa các tab hoặc các thiết bị.
- Thử tính năng sticker: mở một ngày trống, lưu ghi chú đầu tiên, bấm **Chọn sticker cho ngày**, chọn và xác nhận. Chỉ người viết đầu tiên được chọn một lần; chưa chọn thì để chờ. Sticker xuất hiện trên lịch và trang ngày, vẫn được giữ sau khi ẩn ghi chú đầu tiên. Bản mẫu cũ không có thứ tự lưu đáng tin cậy sẽ không tự cấp quyền chọn.
- Tab **Tự thêm**: chạm ô để nhập emoji, dán ảnh sticker đã cắt hoặc dùng **Chọn ảnh từ thiết bị**, rồi bấm **Dùng sticker**. Ảnh chỉ gắn với ngày được xác nhận, không thêm vào bộ sticker hay thư viện dùng lại. Hủy thì bỏ ảnh nháp; ảnh đã gắn được giữ local để trang ngày vẫn hiển thị sau reload. Không có upload hoặc đồng bộ sang thiết bị khác.
- Bàn phím sticker iPhone phụ thuộc hỗ trợ thực tế của Safari/iOS; chưa được kiểm tra trên iPhone thật. Có đường dự phòng Sao chép chủ thể từ Ảnh rồi Dán, hoặc chọn ảnh PNG. Không hứa đọc trực tiếp thư viện sticker riêng của iOS.
- Bộ lọc người viết thay đổi số lượng và preview ghi chú; sticker đã chọn vẫn hiện vì thuộc về ngày chung. Ngày cũ chưa rõ người viết đầu tiên được ghi **Chưa rõ**, không hiển thị như một lựa chọn đang chờ.
- Bộ 15 sticker chỉ là file tĩnh trong repo; không có upload hoặc lưu ảnh vào database. [Contact sheet](public/stickers/contact-sheet.png) và [ghi chú chất lượng/quyền phân phối](docs/STICKER_ASSETS.md) cần được review trước phát hành.
- Dữ liệu hư/không đọc được quay về fixture. Dữ liệu mẫu tập trung ở `src/mocks/fixtures.ts`.
- Chưa có Google login, membership, invite thật, realtime Firestore hoặc backup/restore.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
npm test
npx playwright install chromium webkit
npm run test:e2e
npm run test:rules
```

`test:rules` tự khởi động rồi tắt Firestore Emulator bằng project **demo-our-stories**. Bộ test này chỉ kiểm tra rules **deny-all của Phase 1**, không xác nhận thiết kế membership/invite tương lai. `npm test` chỉ chạy unit tests, không cần emulator.

```bash
npm run emulators
```

Lệnh trên chạy Auth (9099), Firestore (8080), Hosting (5000, cần build trước) và Emulator UI (4000), chỉ bind `127.0.0.1`. Không cần `firebase login`. Lần đầu CLI tải emulator từ nguồn Firebase chính thức. Dừng bằng Ctrl+C. UI vẫn dùng mock, không tự kết nối emulator. `.env.example` chỉ chứa giá trị demo; không cần sao chép để chạy mock.

## Tài liệu

- [Báo cáo Phase 1](PHASE_1_REPORT.md): kết quả thực tế, giới hạn và bước tiếp theo.
- [Ma trận yêu cầu và rủi ro](docs/REQUIREMENTS_MATRIX.md).
- [Thiết kế lại UI và ảnh QA](docs/UI_REDESIGN.md).
- [Thiết kế first writer/sticker](docs/FIRST_WRITER_DESIGN.md): phần mock đã triển khai và phần Firestore còn là đề xuất.
- [Sticker cá nhân, clipboard và giới hạn iPhone](docs/PERSONAL_STICKERS_PHASE1.md): cập nhật mới nhất, thay phạm vi chỉ dùng catalog cố định.
- [Báo cáo sticker Phase 1](docs/STICKER_PHASE1_REPORT.md), [QA](docs/STICKER_QA.md) và [review Standards/Spec](docs/STICKER_REVIEW.md).
- [Đề xuất schema và Firestore Rules](docs/FIRESTORE_PROPOSAL.md).
- [Checklist kiểm thử các phase tiếp theo](docs/TESTS_TO_WRITE.md).
- [Bộ tài liệu handoff gốc](docs/handoff/README.md), được giữ riêng với trạng thái lịch sử ban đầu.
- [Quy tắc cho agent](AGENTS.md).

## Điểm dừng

Chỉ Phase 0/1 được cho phép. Chưa tạo Firebase project, chưa bật Google OAuth, chưa ghi dữ liệu production và chưa deploy. Cần chủ repo duyệt phase tiếp theo trước các thao tác đó. Repo đang public; thay đổi sang private cũng cần chủ repo xác nhận. Không bật billing, Blaze, Functions, App Hosting hoặc Storage.
