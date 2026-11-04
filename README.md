# Our Stories — Những ngày bên nhau

Nhật ký chung theo lịch, tiếng Việt, dành cho gia đình và bạn bè. **Phase 1: giao diện chạy bằng dữ liệu mẫu, chưa phải ứng dụng nhật ký riêng tư dùng thật.**

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
- Dữ liệu hư/không đọc được quay về fixture. Dữ liệu mẫu tập trung ở `src/mocks/fixtures.ts`.
- Chưa có Google login, membership, invite thật, realtime Firestore hoặc backup/restore.

## Kiểm tra

```bash
npm run lint
npm run typecheck
npm run build
npm test
npx playwright install chromium
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
- [Đề xuất schema và Firestore Rules](docs/FIRESTORE_PROPOSAL.md).
- [Checklist kiểm thử các phase tiếp theo](docs/TESTS_TO_WRITE.md).
- [Bộ tài liệu handoff gốc](docs/handoff/README.md), được giữ riêng với trạng thái lịch sử ban đầu.
- [Quy tắc cho agent](AGENTS.md).

## Điểm dừng

Chỉ Phase 0/1 được cho phép. Chưa tạo Firebase project, chưa bật Google OAuth, chưa ghi dữ liệu production và chưa deploy. Cần chủ repo duyệt phase tiếp theo trước các thao tác đó. Repo đang public; thay đổi sang private cũng cần chủ repo xác nhận. Không bật billing, Blaze, Functions, App Hosting hoặc Storage.
