# n8n-electric

Ứng dụng desktop cross-platform (Electron) tích hợp n8n workflow và Python script.

## Tính năng
- Chạy workflow tự động hóa với n8n (offline)
- Gọi Python script (đóng gói binary)
- UI đơn giản: chọn file Excel, chạy flow, xem kết quả
- Lưu tham số user local (JSON/SQLite)
- Hỗ trợ auto-update toàn bộ app

## Cấu trúc thư mục
- `app/`: Electron app (UI, main process)
- `python_scripts/`: Script Python (hoặc binary)
- `n8n_flows/`: Flow n8n mẫu (JSON)
- `config/`: Tham số user

## Hướng dẫn chạy thử
```bash
cd app
npm install
npm start
```

## Demo flow mẫu
1. Nhận file Excel đầu vào
2. Chạy script1.py: lọc dữ liệu
3. Chạy script2.py: tổng hợp dữ liệu
4. Xuất file kết quả

---

> Xem chi tiết trong từng thư mục và file mẫu.

