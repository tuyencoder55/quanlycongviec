---
description: Tạo thay đổi database Supabase an toàn
---
1. Xác định thay đổi (bảng/cột/index/policy).
2. Tạo file `supabase/migrations/NNNN_ten.sql` (NNNN = số tiếp theo). Không sửa file cũ.
3. Đảm bảo: bật RLS, policy `select` cho authenticated, `insert/update/delete` cho `is_admin()`.
4. Cập nhật type TypeScript tương ứng.
5. Hướng dẫn user dán SQL vào Supabase → SQL Editor và chạy; báo cách kiểm tra.
