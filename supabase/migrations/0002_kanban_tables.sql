-- Migration: 0002_kanban_tables.sql
-- Mô tả: Tạo các bảng cho Module 1: Kanban Board (columns, tasks), trigger updated_at, và thiết lập RLS

-- 1. Bảng columns (Cột công việc trên bảng Kanban)
create table if not exists public.columns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  position double precision not null default 0,
  created_at timestamptz default now() not null
);

-- 2. Bảng tasks (Thẻ công việc)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  column_id uuid references public.columns(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium' not null,
  labels text[] default '{}'::text[] not null,
  position double precision not null default 0,
  done boolean default false not null,
  board_code text,
  mold_code text,
  ref_kind text check (ref_kind in ('po', 'date')),
  ref_value text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Tạo index phục vụ tìm kiếm và sắp xếp nhanh
create index if not exists idx_columns_position on public.columns(position asc);
create index if not exists idx_tasks_column_position on public.tasks(column_id, position asc);
create index if not exists idx_tasks_board_code on public.tasks(board_code);
create index if not exists idx_tasks_mold_code on public.tasks(mold_code);
create index if not exists idx_tasks_due_date on public.tasks(due_date);

-- Bật extension pg_trgm để hỗ trợ tìm kiếm ilike mượt mà
create extension if not exists "pg_trgm";
create index if not exists idx_tasks_title_trgm on public.tasks using gin (title gin_trgm_ops);

-- 4. Bật trigger tự động cập nhật cột updated_at cho tasks
drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- 5. Bật Row Level Security (RLS)
alter table public.columns enable row level security;
alter table public.tasks enable row level security;

-- 6. Chính sách bảo mật RLS cho columns:
-- Cho phép đọc danh sách cột (cả user đăng nhập và khách)
drop policy if exists "Cho phép đọc danh sách cột" on public.columns;
create policy "Cho phép đọc danh sách cột"
  on public.columns for select
  to authenticated, anon
  using (true);

-- Chỉ admin mới có quyền thêm/sửa/xóa cột
drop policy if exists "Chỉ admin được thay đổi cột" on public.columns;
create policy "Chỉ admin được thay đổi cột"
  on public.columns for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Chính sách bảo mật RLS cho tasks:
-- Cho phép đọc thẻ công việc
drop policy if exists "Cho phép đọc thẻ công việc" on public.tasks;
create policy "Cho phép đọc thẻ công việc"
  on public.tasks for select
  to authenticated, anon
  using (true);

-- Chỉ admin mới có quyền thêm/sửa/xóa thẻ công việc
drop policy if exists "Chỉ admin được thay đổi thẻ công việc" on public.tasks;
create policy "Chỉ admin được thay đổi thẻ công việc"
  on public.tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 8. Tạo 3 cột mặc định nếu bảng đang trống: Cần làm, Đang làm, Xong
insert into public.columns (id, title, position)
values
  ('c1111111-1111-1111-1111-111111111111', 'Cần làm', 1000),
  ('c2222222-2222-2222-2222-222222222222', 'Đang làm', 2000),
  ('c3333333-3333-3333-3333-333333333333', 'Xong', 3000)
on conflict (id) do nothing;
