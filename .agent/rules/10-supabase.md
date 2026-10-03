---
trigger: always_on
---
# Supabase — Quy tắc

- Mọi bảng BẬT RLS. Không bao giờ để bảng public không policy.
- 2 role: `admin` (đọc/ghi hết), `viewer` (chỉ đọc). Lưu trong bảng `profiles(id, role)`.
- Helper SQL: `public.is_admin()` trả về true nếu user hiện tại là admin; dùng trong policy.
- Mỗi thay đổi schema = 1 file trong `supabase/migrations/NNNN_ten.sql`. Không sửa file cũ.
- Cột chuẩn: `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at` (trigger tự cập nhật).
- Chỉ dùng ANON key ở frontend. TUYỆT ĐỐI không đưa service_role key vào code frontend.
- Tạo index cho cột hay lọc/tìm (ngày, loại, tên file).
- Tìm kiếm tên file: dùng `pg_trgm` + index GIN để `ilike '%abc%'` nhanh.
