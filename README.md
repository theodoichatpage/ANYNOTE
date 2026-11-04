# AnyNote — bản phát triển thử nghiệm

Ứng dụng Electron dành cho Windows. **Chưa được bảo mật, không nhập tài khoản hoặc mật khẩu thật.** Dữ liệu chỉ tồn tại trong bộ nhớ và mất khi đóng ứng dụng. Đây chưa phải Phase 1 hoàn chỉnh và chưa phải bản phát hành 1.0.

## Chạy thử
Cần Node.js 22 và npm. Chạy `npm install`, `npm test`, `npm run build`, sau đó `npx electron .`. Quy trình GitHub chỉ kiểm tra mã nguồn; bộ cài sẽ được tạo sau khi ứng dụng hoàn thiện và kiểm thử.

## Tình trạng
Bảng sáu cột, tìm kiếm, lọc, phân trang, thêm/sửa/xóa và khôi phục chỉ với dữ liệu tạm. Đã bổ sung tạo mã TOTP cục bộ và sao chép một số trường trong Electron (clipboard tự xóa sau 30 giây nếu chưa bị thay đổi). Chưa có database, SQLCipher, Argon2id, mật khẩu chính, mã phục hồi, tự khóa, import/export, OAuth hoặc Google Drive. Chưa hỗ trợ đồng bộ, xung đột, sao lưu và khôi phục trên máy mới. Không sử dụng cho dữ liệu thật cho tới khi các tính năng bảo mật được triển khai và kiểm thử độc lập.

Google OAuth chưa cấu hình; không có Client ID hay Client Secret trong dự án. Chưa xác thực cài đặt trên Windows. Không phát hành Release cho đến khi đáp ứng các điều kiện bảo mật và kiểm thử.
