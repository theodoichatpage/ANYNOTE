# Bản web thử nghiệm: chọn Google Sheet

Cấu hình OAuth Client ID loại Web, Browser API key và Cloud project number tại môi trường build qua các biến trong `.env.example`. Các biến Vite được công khai trong mã phía trình duyệt, không dùng client secret hoặc token ở đây. Giới hạn API key theo HTTP referrer và các API Google cần dùng. Tạo OAuth consent screen, thêm origin của web và tài khoản thử nghiệm nếu ứng dụng đang ở chế độ thử. Bật Google Picker API, Drive API và Sheets API. Không ghi dữ liệu người dùng vào mã nguồn.

Sau khi thiết lập, nút Google dùng GIS và Google Picker với quyền `drive.file` để người dùng chọn bảng. Mã hiện tại chỉ xin quyền, chọn file và đọc danh sách tên tab; CHƯA nhập các hàng, ghi sheet, đồng bộ hai chiều, lưu token, hỗ trợ offline hoặc khôi phục. Chưa kiểm thử OAuth thực tế. Bản web là bản thử, không dùng tài khoản hay dữ liệu thực. Phần desktop cần luồng OAuth native PKCE riêng; không mặc định rằng cấu hình web dùng được trong Electron.

Google Cloud cần được thiết lập bởi chủ dự án. Không nhúng URL sheet riêng tư vào bản web công khai.
