---
name: kanban-board
description: Dùng khi làm module quản lý công việc kiểu Kanban kéo thả (cột, thẻ task, sắp xếp). Độc lập với module Export.
---
# Kanban Board

## Thư viện
`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## Mô hình dữ liệu
- `boards(id, name)` — (có thể chỉ 1 board lúc đầu)
- `columns(id, board_id, title, position float8)`
- `tasks(id, column_id, title, description, due_date, priority, labels text[], position float8, done bool)`

Mặc định 3 cột: "Cần làm", "Đang làm", "Xong".

## Sắp xếp (quan trọng)
Dùng `position` kiểu số thực. Thả thẻ vào giữa A và B: `position = (A.position + B.position) / 2`.
Thả đầu cột: `first.position - 1`. Thả cuối: `last.position + 1`.
=> Mỗi lần kéo chỉ UPDATE 1 dòng (column_id + position). Nếu khoảng cách quá nhỏ (<0.0001) thì đánh số lại cả cột.

## Hành vi
- Optimistic update: UI đổi ngay, gọi Supabase sau, lỗi thì hoàn tác + toast.
- Kéo thẻ giữa các cột và trong cùng cột; kéo cả cột để đổi thứ tự.
- Có DragOverlay để thẻ đang kéo nhìn đẹp.
- Click thẻ → mở Dialog sửa chi tiết (tiêu đề, mô tả, hạn, ưu tiên, nhãn).
- Thẻ quá hạn hiện màu cảnh báo.
- Hỗ trợ cảm ứng (TouchSensor, delay ~150ms) để dùng trên điện thoại.

## Nhãn và board
- Chỉ 1 board chung (không cần bảng `boards`; bỏ cột board_id).
- Nhãn màu cố định: Ưu tiên (đỏ), Gấp (cam), Chờ (vàng/xám). Cho phép chọn nhiều nhãn.
- Tiêu đề task thường là tên file kiểu "13502-W1 VY-1078 ... PO 22144368" → xem skill `export-manager` để parse và hiện tick xuất Bảng/Khuôn/PO.
