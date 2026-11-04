# AnyNote — bản thử nghiệm

AnyNote là ứng dụng quản lý tài khoản đang được phát triển cho Windows và xem trước trên web. **Chỉ dùng dữ liệu giả:** dữ liệu hiện chỉ nằm trong bộ nhớ, mất khi tải lại hoặc đóng ứng dụng và chưa được mã hóa hoặc đồng bộ.

## Chạy và kiểm tra

Cần Node.js 22 và npm: `npm ci`, `npm test`, `npm run build`. Để chạy web cục bộ: `npm run dev`; để mở desktop sau khi build: `npx electron .`.

## Tình trạng

Giao diện hỗ trợ dán nhiều dòng tài khoản thử, phân nhóm, tìm kiếm, sửa, xác nhận xóa, và sao chép các trường. Mã FA được hiển thị nguyên văn, không tạo mã xác thực. Không sử dụng cho dữ liệu thật.

Kết nối Google web đang phát triển: xin quyền, chọn file và kiểm tra danh sách tab cần cấu hình Google Cloud; chưa đọc hàng vào giao diện, ghi Sheet hay đồng bộ. Xem `docs/google-web-preview.md`. Chưa có SQLCipher, Argon2id, mật khẩu chính, lưu trữ lâu dài, mã khôi phục, OAuth desktop, đồng bộ hoặc xử lý xung đột. Các tính năng này phải được hoàn thành và kiểm thử trước khi lưu thông tin thật.

Bộ cài Windows chưa được tạo hay xác thực. Quy trình hiện tại chỉ chạy kiểm tra; không phát hành EXE trong giai đoạn này.
