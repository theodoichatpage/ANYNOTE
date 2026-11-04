# Google Sheets: trạng thái triển khai

Tính năng chưa hoạt động trong giao diện. `sync/google-sheet.mjs` mới chỉ là thành phần đọc dữ liệu: kiểm tra liên kết Google Sheets, chọn đúng tab theo gid và lấy các hàng qua Sheets API. Chưa có OAuth, Google Picker, lưu token, tự đồng bộ, ghi dữ liệu hoặc bảo vệ xung đột. Không sử dụng thông tin thật trong bản thử.

## Chuẩn bị Google Cloud

1. Tạo hoặc chọn dự án Google Cloud; bật Google Sheets API và Google Drive API.
2. Cấu hình màn hình đồng ý OAuth, chọn đối tượng phù hợp, thêm tài khoản thử nếu cần.
3. Tạo OAuth client đúng loại: Desktop cho ứng dụng Electron dùng trình duyệt hệ thống và PKCE; bản web cần client Web riêng và cấu hình origin/redirect tương ứng. Không đưa client secret, token hoặc dữ liệu thực lên GitHub. Chưa có client ID mặc định.
4. Để truy cập có giới hạn theo tệp với `drive.file`, cần quy trình Google Picker hoặc cách cấp quyền cụ thể cho file; không coi việc có link là đã có quyền. Không yêu cầu quyền rộng hơn một cách âm thầm.

## Lưu ý thiết kế

Google Sheet hiện hữu có thể chứa mật khẩu, cookie và khóa FA ở dạng đọc được. Lưu như vậy không đáp ứng yêu cầu mã hóa bằng mật khẩu chính; ai có quyền xem sheet có thể đọc chúng. Trước khi đồng bộ thật cần hoàn thành mã hóa, bảo vệ token, xử lý xung đột, sao lưu và thử khôi phục. Không ghi đè sheet khi có thay đổi chưa được đối chiếu. Ở giai đoạn này, chỉ dùng sheet thử với dữ liệu giả.

Tài liệu Google: https://developers.google.com/identity/protocols/oauth2/native-app và https://developers.google.com/workspace/sheets/api/scopes
