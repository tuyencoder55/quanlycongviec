---
description: Bắt đầu một module mới (lên kế hoạch → chờ duyệt → DB → UI → test)
---
1. Hỏi user: mục tiêu module, dữ liệu cần lưu, ai được sửa (admin) / xem (viewer).
2. Viết kế hoạch ngắn: bảng DB, danh sách màn hình, file sẽ tạo. DỪNG và chờ user nói "duyệt".
3. Tạo migration SQL trong `supabase/migrations/` (bảng + RLS + index). Cho user xem trước khi chạy.
4. Tạo `src/modules/<tên>/` gồm api.ts, hooks, types.ts, components.
5. Dựng UI bằng shadcn/ui theo rule UI. Nếu là màn hình chính → gợi ý chạy `/ui-polish`.
6. Thêm route + mục trong sidebar.
7. Đưa 3–5 bước test thủ công cho user.
