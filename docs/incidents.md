# Incident Report

## Incident 1: API trả 500 khi backend không kết nối được DB

- Hiện tượng: mọi request cần dữ liệu đều lỗi `500`, frontend không tải được dashboard.
- Layer lỗi: `L2 External (Database)`
- Nguyên nhân: `DATABASE_URL` sai hoặc container `db` chưa healthy.
- Cách fix:
  - kiểm tra `.env`
  - chạy `docker compose ps`
  - xem `docker compose logs db`
  - chạy lại `docker compose up -d`
- Cách phòng tránh:
  - dùng `.env.example`
  - thêm healthcheck cho Postgres
  - chỉ cho backend khởi động sau khi `db` healthy

## Incident 2: CORS error khi frontend gọi backend khác domain

- Hiện tượng: browser chặn request, console báo lỗi CORS.
- Layer lỗi: `L3 Backend / Config`
- Nguyên nhân: `FRONTEND_URL` không khớp domain frontend thực tế.
- Cách fix:
  - cập nhật `FRONTEND_URL`
  - redeploy backend
- Cách phòng tránh:
  - không hardcode origin
  - tách cấu hình domain vào ENV
  - kiểm tra trước khi demo production

## Incident 3: Frontend hiển thị rỗng vì token hết hạn hoặc sai

- Hiện tượng: đang dùng app nhưng dashboard tự mất dữ liệu hoặc request trả `401`.
- Layer lỗi: `L4 Frontend` kết hợp `L3 Backend`
- Nguyên nhân: access token hết hạn hoặc token localStorage không còn hợp lệ.
- Cách fix:
  - đăng nhập lại
  - kiểm tra `JWT_SECRET`
  - xóa session cũ khỏi localStorage
- Cách phòng tránh:
  - xác minh token bằng endpoint `/api/auth/me`
  - tự logout khi token lỗi
  - dùng secret ổn định giữa các lần deploy
