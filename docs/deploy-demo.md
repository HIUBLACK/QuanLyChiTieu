# Demo Deploy Checklist

## 1. Chuẩn bị

- Tạo `.env` từ `.env.example`
- Điền `JWT_SECRET`
- Đảm bảo Docker Desktop đang chạy

## 2. Build và chạy hệ thống

```bash
docker compose up -d --build
```

## 3. Kiểm tra bắt buộc khi demo

### System

- Mở frontend: `http://localhost:8080`
- Mở backend health: `http://localhost:3001/api/health`
- Đăng ký tài khoản mới
- Tạo danh mục và giao dịch
- Xem dashboard cập nhật số liệu

### Docker

```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

### CI/CD

- Mở tab Actions trên GitHub
- Chứng minh workflow chạy đủ `lint`, `test`, `build`
- Trình bày branch `main`, `dev`, `feature/*`

## 4. Layer Debug Thinking

- `L4 Frontend`: kiểm tra console browser, request network, lỗi state/UI
- `L3 Backend`: kiểm tra `docker compose logs backend`, status code API, validation
- `L2 External`: kiểm tra Postgres container, healthcheck, connection string
- `L1 Infrastructure`: kiểm tra container status, port mapping, compose network

## 5. Gợi ý deploy thật

### Docker VPS

1. Clone repo lên Ubuntu VPS
2. Tạo `.env`
3. Chạy `docker compose up -d --build`
4. Mở port `8080`, `3001` nếu cần
5. Gắn reverse proxy Nginx domain ngoài nếu muốn

### Render / Railway / VPS

- Backend deploy trước
- Database cấu hình trước backend
- Frontend cấu hình lại `VITE_API_BASE_URL`
- Kiểm tra CORS sau khi đổi domain
