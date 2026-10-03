---
description: Làm đẹp một màn hình bằng Google Stitch rồi áp vào code
---
1. Hỏi user: màn hình nào, cảm giác mong muốn (vd: tối giản, giống Linear/Notion), có ảnh tham khảo không.
2. Dùng Stitch (MCP) tạo thiết kế màn hình đó ở dark mode, bo góc lớn, theo design tokens của dự án.
3. Cho user xem và chọn phương án.
4. Chuyển thiết kế sang React + Tailwind + shadcn/ui: giữ nguyên logic/hook đã có, chỉ thay phần giao diện.
5. Đối chiếu: spacing, màu, font, responsive, trạng thái loading/empty/error.
6. Báo user những chỗ khác với bản Stitch (nếu có).
