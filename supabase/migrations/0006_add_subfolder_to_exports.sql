-- Migration: 0006_add_subfolder_to_exports.sql
-- Mô tả: Thêm cột subfolder để quản lý thư mục con tự đặt tên (ví dụ: bestway, chiều, ca 1...)

alter table public.exports 
add column if not exists subfolder text;

-- Index hỗ trợ lọc nhanh theo thư mục con
create index if not exists idx_exports_subfolder on public.exports (subfolder);
