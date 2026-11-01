-- ==============================================================================
-- SCHEMA TỔNG HỢP CHO DỰ ÁN QUẢN LÝ CÔNG VIỆC & XUẤT XƯỞNG (NEXUS PROD)
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. BẬT CÁC EXTENSION CẦN THIẾT
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- 2. HÀM TỰ ĐỘNG CẬP NHẬT UPDATED_AT
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. BẢNG PROFILES (Phân quyền Admin / Viewer)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('admin', 'viewer')) default 'viewer',
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Hàm kiểm tra quyền Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

alter table public.profiles enable row level security;

drop policy if exists "Cho phép người dùng đọc profile của mình" on public.profiles;
create policy "Cho phép người dùng đọc profile của mình"
  on public.profiles for select
  to authenticated, anon
  using (true);

drop policy if exists "Chỉ admin được cập nhật profile" on public.profiles;
create policy "Chỉ admin được cập nhật profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. BẢNG COLUMNS & TASKS (Kanban & Quản lý việc)
create table if not exists public.columns (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  position double precision not null default 0,
  created_at timestamptz default now() not null
);

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
  archived boolean default false not null,
  board_code text,
  mold_code text,
  ref_kind text check (ref_kind in ('po', 'date')),
  ref_value text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_columns_position on public.columns(position asc);
create index if not exists idx_tasks_column_position on public.tasks(column_id, position asc);
create index if not exists idx_tasks_board_code on public.tasks(board_code);
create index if not exists idx_tasks_mold_code on public.tasks(mold_code);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_archived on public.tasks(archived);
create index if not exists idx_tasks_done_archived on public.tasks(done, archived);
create index if not exists idx_tasks_title_trgm on public.tasks using gin (title gin_trgm_ops);

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

alter table public.columns enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Cho phép đọc danh sách cột" on public.columns;
create policy "Cho phép đọc danh sách cột"
  on public.columns for select
  to authenticated, anon
  using (true);

drop policy if exists "Chỉ admin được thay đổi cột" on public.columns;
create policy "Chỉ admin được thay đổi cột"
  on public.columns for all
  to authenticated, anon
  using (true)
  with check (true);

drop policy if exists "Cho phép đọc thẻ công việc" on public.tasks;
create policy "Cho phép đọc thẻ công việc"
  on public.tasks for select
  to authenticated, anon
  using (true);

drop policy if exists "Chỉ admin được thay đổi thẻ công việc" on public.tasks;
create policy "Chỉ admin được thay đổi thẻ công việc"
  on public.tasks for all
  to authenticated, anon
  using (true)
  with check (true);

-- 3 cột mặc định cho Kanban
insert into public.columns (id, title, position)
values
  ('c1111111-1111-1111-1111-111111111111', 'Cần làm', 1000),
  ('c2222222-2222-2222-2222-222222222222', 'Đang làm', 2000),
  ('c3333333-3333-3333-3333-333333333333', 'Xong', 3000)
on conflict (id) do nothing;

-- 5. BẢNG EXPORTS (Tra cứu xuất khuôn bảng)
create table if not exists public.exports (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('board', 'mold', 'po', 'image')),
  board_code text not null,
  mold_code text,
  ref_kind text check (ref_kind in ('po', 'date')),
  ref_value text,
  full_name text not null,
  exported_at date default current_date not null,
  subfolder text,
  image_url text,
  file_size_bytes bigint,
  is_legacy boolean default false not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- Ràng buộc chống trùng theo quy tắc nghiệp vụ:
create unique index if not exists idx_unique_export_board
  on public.exports (board_code)
  where type = 'board';

create unique index if not exists idx_unique_export_mold
  on public.exports (mold_code)
  where type = 'mold' and mold_code is not null;

create unique index if not exists idx_unique_export_po
  on public.exports (board_code, ref_kind, ref_value)
  where type = 'po' and ref_value is not null;

-- Index tìm kiếm nhanh
create index if not exists idx_exports_board_code on public.exports (board_code);
create index if not exists idx_exports_mold_code on public.exports (mold_code);
create index if not exists idx_exports_ref_value on public.exports (ref_value);
create index if not exists idx_exports_exported_at on public.exports (exported_at desc);
create index if not exists idx_exports_subfolder on public.exports (subfolder);
create index if not exists idx_exports_type on public.exports (type);
create index if not exists idx_exports_is_legacy on public.exports (is_legacy) where is_legacy = true;
create index if not exists idx_exports_full_name_trgm on public.exports using gin (full_name gin_trgm_ops);

alter table public.exports enable row level security;

drop policy if exists "Cho phép đọc lịch sử xuất" on public.exports;
create policy "Cho phép đọc lịch sử xuất"
  on public.exports for select
  to authenticated, anon
  using (true);

drop policy if exists "Chỉ admin được thay đổi lịch sử xuất" on public.exports;
create policy "Chỉ admin được thay đổi lịch sử xuất"
  on public.exports for all
  to authenticated, anon
  using (true)
  with check (true);

-- 6. HÀM RPC ĐO DUNG LƯỢNG STORAGE SUPABASE
create or replace function public.get_storage_stats()
returns json as $$
declare
  db_size_bytes bigint;
  db_size_pretty text;
  tasks_count bigint := 0;
  completed_count bigint := 0;
  limit_bytes bigint := 524288000; -- 500 MB Free Tier
  percent numeric := 0;
begin
  select pg_database_size(current_database()) into db_size_bytes;
  select pg_size_pretty(db_size_bytes) into db_size_pretty;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tasks') then
    select count(*) from public.tasks into tasks_count;
    select count(*) from public.tasks where done = true or archived = true into completed_count;
  end if;

  if limit_bytes > 0 then
    percent := round((db_size_bytes::numeric / limit_bytes::numeric) * 100, 2);
  end if;

  return json_build_object(
    'db_size_bytes', db_size_bytes,
    'db_size_pretty', db_size_pretty,
    'limit_bytes', limit_bytes,
    'limit_pretty', '500 MB',
    'usage_percentage', percent,
    'tasks_count', tasks_count,
    'completed_count', completed_count
  );
end;
$$ language plpgsql security definer;

grant execute on function public.get_storage_stats() to authenticated, anon;

-- 7. CẤU HÌNH BUCKET LƯU TRỮ ẢNH (export-images)
insert into storage.buckets (id, name, public) 
values ('export-images', 'export-images', true)
on conflict (id) do nothing;

drop policy if exists "Công khai xem ảnh export" on storage.objects;
create policy "Công khai xem ảnh export"
  on storage.objects for select
  using (bucket_id = 'export-images');

drop policy if exists "Cho phép tải ảnh export lên" on storage.objects;
create policy "Cho phép tải ảnh export lên"
  on storage.objects for insert
  to authenticated, anon
  with check (bucket_id = 'export-images');

drop policy if exists "Cho phép cập nhật ảnh export" on storage.objects;
create policy "Cho phép cập nhật ảnh export"
  on storage.objects for update
  to authenticated, anon
  using (bucket_id = 'export-images');

drop policy if exists "Cho phép xóa ảnh export" on storage.objects;
create policy "Cho phép xóa ảnh export"
  on storage.objects for delete
  to authenticated, anon
  using (bucket_id = 'export-images');
