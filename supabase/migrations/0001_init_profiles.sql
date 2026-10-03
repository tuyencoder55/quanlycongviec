-- Migration: 0001_init_profiles.sql
-- Mô tả: Khởi tạo bảng profiles lưu vai trò (admin / viewer) và hàm kiểm tra quyền is_admin()

-- 1. Bật extension cần thiết
create extension if not exists "pgcrypto";

-- 2. Tạo trigger function để tự động cập nhật cột updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. Tạo bảng profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('admin', 'viewer')) default 'viewer',
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Bật trigger cập nhật updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- 5. Tạo hàm helper public.is_admin() để dùng trong các RLS policy
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 6. Bật Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 7. Chính sách RLS cho profiles:
-- Người dùng đã đăng nhập có thể đọc thông tin profile của chính mình, hoặc Admin đọc được tất cả
create policy "Cho phép người dùng đọc profile của mình"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Chỉ Admin mới có quyền cập nhật profile và role
create policy "Chỉ admin được cập nhật profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Tự động thêm dòng profile khi có user mới đăng ký qua auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    -- User đầu tiên có thể set là admin hoặc mặc định viewer
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
