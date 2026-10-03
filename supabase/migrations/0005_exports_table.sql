-- Migration: 0005_exports_table.sql
-- Mô tả: Tạo bảng exports lưu trữ lịch sử xuất Bảng, Khuôn, PO và ràng buộc chống trùng

create table if not exists public.exports (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('board', 'mold', 'po')),
  board_code text not null,
  mold_code text,
  ref_kind text check (ref_kind in ('po', 'date')),
  ref_value text,
  full_name text not null,
  exported_at date default current_date not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- Ràng buộc chống trùng theo quy tắc nghiệp vụ:
-- 1. Mỗi bảng chỉ xuất 1 lần
create unique index if not exists idx_unique_export_board
  on public.exports (board_code)
  where type = 'board';

-- 2. Mỗi khuôn chỉ xuất 1 lần (nếu có mã khuôn)
create unique index if not exists idx_unique_export_mold
  on public.exports (mold_code)
  where type = 'mold' and mold_code is not null;

-- 3. Mỗi PO mới theo bảng thì được xuất tiếp
create unique index if not exists idx_unique_export_po
  on public.exports (board_code, ref_kind, ref_value)
  where type = 'po' and ref_value is not null;

-- Các index hỗ trợ tìm kiếm siêu tốc
create index if not exists idx_exports_board_code on public.exports (board_code);
create index if not exists idx_exports_mold_code on public.exports (mold_code);
create index if not exists idx_exports_ref_value on public.exports (ref_value);
create index if not exists idx_exports_exported_at on public.exports (exported_at desc);
create index if not exists idx_exports_full_name_trgm on public.exports using gin (full_name gin_trgm_ops);

-- Bật Row Level Security (RLS)
alter table public.exports enable row level security;

-- Mọi người (kể cả Viewer) đều được quyền đọc để tra cứu
drop policy if exists "Cho phép đọc lịch sử xuất" on public.exports;
create policy "Cho phép đọc lịch sử xuất"
  on public.exports for select
  to authenticated, anon
  using (true);

-- Chỉ admin mới có quyền thêm/sửa/xóa dòng xuất xưởng
drop policy if exists "Chỉ admin được thay đổi lịch sử xuất" on public.exports;
create policy "Chỉ admin được thay đổi lịch sử xuất"
  on public.exports for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
