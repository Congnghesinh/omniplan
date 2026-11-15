# OmniPlan — Personal AI Life Operating System (App & Zalo Bot)

OmniPlan là hệ thống trợ lý cá nhân thông minh toàn diện quản lý 4 trụ cột cuộc sống người dùng:
1. **Sức khỏe (Health Management)**: Nước uống, cân nặng, BMI, bữa ăn & calo, kế hoạch tập luyện, thói quen và cảnh báo.
2. **Học tập (Learning Management)**: Flashcard Leitner Spaced Repetition, Active Recall, đồng hồ Pomodoro Focus, giải bài tập và quản lý môn học.
3. **Công việc (Work Management)**: Nhiệm vụ, mức độ ưu tiên, deadline, tóm tắt cuộc họp và sắp xếp lịch làm việc tối ưu.
4. **Tài chính (Financial Management)**: Thu chi, ví tiền, hạn mức ngân sách tháng, quét hóa đơn bằng Vision AI (OCR).

Hệ thống tích hợp **đồng bộ 2 chiều (Bi-directional Sync)** với **Zalo Bot Platform chính thức**, sử dụng chung bộ não AI, hồ sơ người dùng, bộ nhớ thông minh và cơ sở dữ liệu.

---

## 🏛 Kiến trúc Hệ thống

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Responsive CSS hỗ trợ Light/Dark mode.
- **Backend**: Express (Node.js/ESNext), RESTful API, Server-Sent / Streaming ready, Multer.
- **AI Core Engine & Orchestrator**:
  - Hỗ trợ mô hình đa phương thức tiên tiến (Google Gemini 2.5 Flash qua `@google/genai`).
  - Bộ xử lý cục bộ thông minh (Deterministic NLP Fallback Engine) đảm bảo hoạt động 100% tin cậy ngay cả khi ngoại tuyến hoặc chưa cấu hình API key.
- **Multimodal Services**:
  - **Vision**: OCR hóa đơn & biên lai (`analyzeReceipt`), nhận diện món ăn & ước tính calo (`analyzeFood`).
  - **Audio**: Speech-to-Text (`transcribeAudio`), tóm tắt cuộc họp & trích xuất việc cần làm.
  - **Documents**: Phân tích PDF, Word, Excel, CSV, Markdown (`analyzeDocument`).
- **AI Personality Engine**: 11 phong cách tính cách (Standard, Friendly, Funny, Strict Coach, Mentor, Executive, Teacher, Financial Advisor, Wellness Companion, Creative, Custom) với các thanh trượt điều chỉnh độ thân thiện, hài hước, kỷ luật, chủ động.
- **AI Memory System**: 6 tầng trí nhớ (Short-term, Long-term, Semantic, Episodic, Preference, Goal, Cross-platform).
- **AI Action Engine**: Tự động chuyển đổi ngôn ngữ tự nhiên thành Action Cards (Thêm thu chi, uống nước, cân nặng, tạo việc...) kèm cơ chế Xác nhận (Confirmation) và Hoàn tác (Undo).
- **Zalo Bot Service**:
  - Webhook URL chính thức: `/api/zalo/webhook`.
  - Cơ chế liên kết tài khoản OTP 6 chữ số (`/link <mã>`, hạn 15 phút).
  - Tự động chống trùng lặp tin nhắn (`msg_id` deduplication).
  - Trình giả lập Zalo Bot trực tiếp trên giao diện để kiểm thử mà không cần chờ cấu hình Zalo Cloud.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Biến môi trường (.env)
Sao chép `.env.example` thành `.env` và điền các API Key tương ứng:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
ZALO_BOT_TOKEN=your_zalo_bot_token_here
ZALO_BOT_SECRET_KEY=your_zalo_bot_secret_key_here
```

### 3. Build & Khởi chạy

- **Khởi chạy Backend Server (Port 3001):**
  ```bash
  npm run server
  ```

- **Khởi chạy Frontend Dev Server (Port 5173 - Proxy API sang 3001):**
  ```bash
  npm run dev
  ```

- **Build Production:**
  ```bash
  npm run build
  ```

---

## 📱 Hướng dẫn Liên kết Zalo Bot

1. Đăng nhập vào App OmniPlan, mở mục **Cài đặt & AI** > chọn tab **Tích hợp Zalo Bot**.
2. Nhấn nút **"Tạo mã liên kết một lần (OTP)"** để nhận mã 6 chữ số (ví dụ: `646641`).
3. Mở Zalo, nhắn tin cho bot OmniPlan với cú pháp:
   ```text
   /link 646641
   ```
4. Bot phản hồi xác nhận liên kết thành công. Từ thời điểm này, mọi câu lệnh nhắn trên Zalo như:
   - *"Hôm nay tôi đã tiêu 150 nghìn tiền ăn uống"*
   - *"Uống 350ml nước"*
   - *"Thêm việc nộp báo cáo dự án vào 17h"*
   - */today, /work, /health, /finance, /personality*
   đều sẽ **tự động cập nhật trực tiếp vào App OmniPlan theo thời gian thực**.

---

## 🧪 Kết quả Kiểm thử Hệ thống (Verification Summary)

Đã chạy kiểm thử tự động toàn diện qua kịch bản tích hợp:
- [x] **Health check**: Backend khởi chạy ổn định, phản hồi 200 OK.
- [x] **Multi-Intent Chat**: Nhận diện đồng thời 2 hành động trong câu *"Chi 45k ăn trưa và uống 500ml nước"*.
- [x] **Action Execution & DB Persistence**: Lưu chính xác vào bảng dữ liệu sức khỏe và giao dịch thu chi.
- [x] **Zalo OTP & Linking**: Tạo mã 6 chữ số có thời hạn 15 phút, liên kết thành công tài khoản Zalo User ID với App User ID.
- [x] **Zalo Natural Language & 2-way Sync**: Nhận lệnh chi tiêu từ Zalo, tự động ghi sổ tài chính vào App.
- [x] **Cross-Domain Intelligence**: Tự động phát hiện khi người dùng có nhiều việc gấp nhưng thiếu nước uống, đưa ra khuyến nghị cân bằng công việc - sức khỏe.
- [x] **Proactive AI**: Sinh bản tin Daily Briefing và Night Review chuẩn xác.
