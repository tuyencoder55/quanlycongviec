---
name: export-manager
description: Dùng khi làm hoặc sửa module xuất bảng / khuôn / PO và phần tra cứu "đã xuất chưa". Chỉ lưu TÊN/MÃ, không lưu PDF. Liên kết với task Kanban qua tick xuất.
---
# Export Manager

## Ý tưởng cốt lõi
Nguồn sự thật duy nhất là bảng `exports`. Tick trong task Kanban chỉ là đường tắt để TẠO dòng trong `exports`.
Người khác (viewer) tra cứu ở trang Tra cứu, chỉ đọc bảng `exports`.

## Cấu trúc tên (parse bằng regex, luôn cho user sửa tay nếu parse sai)
`13502-W1 VY-1078 H-3711 42633310 4 CUBE UNIT WHITE PO 22144368`
- board_code  = token đầu tiên (13502-W1)
- mold_code   = token khớp /^(VY|VX|VL|VXs)-\d+$/i (VY-1078)
- ref_kind    = 'po' nếu có "PO <số>", ngược lại 'date' nếu cuối tên là ngày
- ref_value   = số PO hoặc ngày
- phần còn lại (H-3711, 42633310, mô tả) giữ trong `rest` (text), chưa tách cột vì chưa rõ ý nghĩa.

## Dữ liệu
`exports`:
- id, type ('board' | 'mold' | 'po'), exported_at (date)
- board_code (text, bắt buộc), mold_code (text, null được)
- ref_kind ('po' | 'date', chỉ dùng khi type='po'), ref_value (text)
- full_name (text) — tên đầy đủ như tên file cũ, bỏ .pdf
- note, created_by, created_at
Ràng buộc chống trùng (partial unique index):
- type='board': UNIQUE (board_code)            → mỗi bảng chỉ xuất 1 lần
- type='mold' : UNIQUE (mold_code)             → mỗi khuôn chỉ xuất 1 lần
- type='po'   : UNIQUE (board_code, ref_kind, ref_value)  → PO/ngày mới thì được xuất tiếp

Quy tắc nghiệp vụ: bảng đã xuất rồi thì các lần sau CHỈ thêm dòng type='po'.
Khi xuất lần đầu có thể tick cả 3 một lúc (tạo 3 dòng).

## Liên kết với Kanban
`tasks` thêm cột: board_code, mold_code, ref_kind, ref_value (parse từ tiêu đề task lúc tạo/sửa).
Trên thẻ task hiện 3 checkbox: Bảng / Khuôn / PO.
- Trạng thái checkbox KHÔNG lưu trong task; tính từ `exports` (có dòng khớp thì tick sáng).
- Bảng/Khuôn đã xuất trước đó (do task khác) → hiện sẵn tick + nhãn "đã xuất ngày …", không cho tick lại.
- Tick = insert dòng vào `exports` (bắt hỏi xác nhận nhẹ), bỏ tick = xóa dòng đó (chỉ admin).
- Khi cả những ô cần thiết đã tick, gợi ý chuyển thẻ sang cột "Xong".

## Màn hình Tra cứu
1. Ô tìm: gõ mã bảng / mã khuôn / số PO / một phần tên → ra kết quả.
2. Kết quả theo mã bảng: Bảng đã xuất (ngày) • Khuôn đã xuất (ngày) • Danh sách PO đã xuất.
3. Lọc theo ngày, theo loại. Nhóm Năm → Tháng → Ngày giống thư mục cũ.
4. Nút copy tên đầy đủ.
5. Viewer chỉ xem; Admin thêm/sửa/xóa.

## Thêm hàng loạt
Ô dán nhiều tên (mỗi dòng 1 tên) → parse → bảng xem trước → chọn loại cần ghi → lưu, bỏ qua dòng trùng và báo lại.
