# Incident Report

## Incident 1: CORS sai domain sau khi deploy production

- Hiện tượng:
  Frontend mở được nhưng khi bấm đăng ký hoặc đăng nhập thì request bị browser chặn.
- Log:
  ```text
  Access to fetch at 'https://expense-flow-backend.vercel.app/api/auth/register'
  from origin 'https://quan-ly-chi-tieu-vbcv.vercel.app'
  has been blocked by CORS policy:
  The 'Access-Control-Allow-Origin' header has a value
  'https://expense-flow-three.vercel.app'
  that is not equal to the supplied origin.
  ```
- Layer lỗi: `L3 Backend / Config`
- Nguyên nhân:
  `FRONTEND_URL` trên backend Vercel vẫn là domain cũ, không khớp domain frontend production thật.
- Cách fix:
  - cập nhật `FRONTEND_URL=https://quan-ly-chi-tieu-vbcv.vercel.app`
  - redeploy backend
- Cách phòng tránh:
  - không hardcode origin
  - thêm `FRONTEND_URLS` để hỗ trợ nhiều domain
  - kiểm tra lại CORS sau mỗi lần đổi URL production

## Incident 2: DATABASE_URL sai format trên backend production

- Hiện tượng:
  Domain backend mở được nhưng `/api/health` trả `500`, Vercel hiển thị function crash.
- Log:
  ```text
  Error: getaddrinfo ENOTFOUND db.plfkdasoelnzkhzrztus.supabase.co
      at async initDatabase (file:///var/task/backend/src/db/init.js:38:3)
      at async ensureReady (file:///var/task/backend/api/index.js:13:3)
  ```
- Layer lỗi: `L2 Database / Config`
- Nguyên nhân:
  `DATABASE_URL` trên backend Vercel sai format:
  - dùng host không đúng cho serverless
  - password chứa ký tự `@` nhưng không encode
  - chuỗi kết nối được gõ tay
- Cách fix:
  - dùng đúng Supabase **Transaction pooler connection string**
  - cập nhật env backend trên Vercel
  - redeploy backend
- Cách phòng tránh:
  - luôn copy connection string trực tiếp từ Supabase Dashboard
  - không tự gõ tay DB URL

## Incident 3: Xóa danh mục đang được giao dịch sử dụng

- Hiện tượng:
  Người dùng bấm xóa danh mục nhưng thao tác không thành công dù đã đăng nhập và danh mục vẫn đang hiển thị trên giao diện.
- Log:
  ```text
  { "error": "Cannot delete category that is already used by transactions" }
  ```
- Layer lỗi: `L3 Backend / Business logic`
- Nguyên nhân:
  Danh mục đã được tham chiếu trong bảng `transactions`. Backend chủ động chặn xóa để đảm bảo toàn vẹn dữ liệu, tránh làm phát sinh giao dịch mồ côi.
- Cách fix:
  - giữ nguyên rule chặn xóa ở backend
  - yêu cầu người dùng xóa hoặc chuyển các giao dịch sang danh mục khác trước
  - frontend hiển thị thông báo rõ ràng cho người dùng
- Cách phòng tránh:
  - kiểm tra số lượng giao dịch đang dùng danh mục trước khi hiển thị nút xóa
  - có thể bổ sung hộp thoại xác nhận hoặc gợi ý chuyển giao dịch sang danh mục khác

## Incident 4: Giao dịch không khớp loại danh mục

- Hiện tượng:
  Người dùng chọn danh mục thuộc nhóm thu nhập nhưng lại tạo giao dịch kiểu chi tiêu, request bị từ chối.
- Log:
  ```text
  { "error": "Transaction type must match category type" }
  ```
- Layer lỗi: `L3 Backend / Validation`
- Nguyên nhân:
  Backend kiểm tra dữ liệu đầu vào và phát hiện `transaction.type` không khớp với `category.type`.
- Cách fix:
  - frontend chỉ hiển thị danh mục đúng với loại giao dịch đang chọn
  - backend tiếp tục giữ validation để chặn dữ liệu sai
- Cách phòng tránh:
  - đồng bộ form frontend với dữ liệu category
  - luôn validate lại ở backend

## Incident 5: Token hết hạn hoặc token localStorage không hợp lệ

- Hiện tượng:
  Người dùng đang thao tác bình thường nhưng sau đó dashboard không tải dữ liệu, request API trả `401`.
- Log:
  ```text
  { "error": "Unauthorized" }
  ```
- Layer lỗi: `L4 Frontend` kết hợp `L3 Backend`
- Nguyên nhân:
  Token đã hết hạn, bị xóa, hoặc token cũ trong localStorage không còn hợp lệ với backend hiện tại.
- Cách fix:
  - xóa session cũ
  - đăng nhập lại
  - frontend gọi `/api/auth/me` để xác minh trạng thái đăng nhập
- Cách phòng tránh:
  - kiểm tra token ngay khi app khởi động
  - tự logout khi token lỗi
  - dùng secret ổn định giữa các lần deploy
