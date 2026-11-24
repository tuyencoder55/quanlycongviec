-- Migration: 0009_app_accounts.sql
-- Mô tả: Tạo bảng tài khoản nội bộ (app_accounts) hỗ trợ đăng nhập username/password
--        mã hóa bcrypt và phân quyền 7 chức năng chi tiết cho nhân viên.

create extension if not exists "pgcrypto";

-- 1. Tạo bảng app_accounts
create table if not exists public.app_accounts (
  id uuid default gen_random_uuid() primary key,
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'staff')) default 'staff',
  is_locked boolean not null default false,
  permissions jsonb not null default '{
    "can_view": true,
    "can_create_export": false,
    "can_upload_files": false,
    "can_ai_scan": false,
    "can_edit": false,
    "can_delete": false,
    "can_export_csv": true
  }'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index tìm kiếm nhanh theo username và role
create index if not exists idx_app_accounts_username on public.app_accounts (lower(username));
create index if not exists idx_app_accounts_role on public.app_accounts (role);
create index if not exists idx_app_accounts_locked on public.app_accounts (is_locked);

-- Trigger tự động cập nhật updated_at
drop trigger if exists update_app_accounts_updated_at on public.app_accounts;
create trigger update_app_accounts_updated_at
  before update on public.app_accounts
  for each row execute function public.handle_updated_at();

-- Bật RLS (không cho select trực tiếp để bảo vệ cột password_hash; truy cập qua RPC security definer)
alter table public.app_accounts enable row level security;

-- 2. RPC: Đăng nhập bằng tên đăng nhập và mật khẩu
create or replace function public.login_account(p_username text, p_password text)
returns json as $$
declare
  v_acc public.app_accounts%rowtype;
begin
  select * into v_acc
  from public.app_accounts
  where lower(username) = lower(trim(p_username))
  limit 1;

  if not found then
    return json_build_object('success', false, 'error', 'Sai tên đăng nhập hoặc mật khẩu.');
  end if;

  if v_acc.is_locked then
    return json_build_object('success', false, 'error', 'Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.');
  end if;

  if v_acc.password_hash <> crypt(p_password, v_acc.password_hash) then
    return json_build_object('success', false, 'error', 'Sai tên đăng nhập hoặc mật khẩu.');
  end if;

  return json_build_object(
    'success', true,
    'account', json_build_object(
      'id', v_acc.id,
      'username', v_acc.username,
      'display_name', v_acc.display_name,
      'role', v_acc.role,
      'is_locked', v_acc.is_locked,
      'permissions', v_acc.permissions,
      'created_at', v_acc.created_at,
      'updated_at', v_acc.updated_at
    )
  );
end;
$$ language plpgsql security definer;

-- 3. RPC: Lấy danh sách tài khoản (ẩn hoàn toàn password_hash)
create or replace function public.get_app_accounts()
returns json as $$
begin
  return coalesce(
    (
      select json_agg(
        json_build_object(
          'id', a.id,
          'username', a.username,
          'display_name', a.display_name,
          'role', a.role,
          'is_locked', a.is_locked,
          'permissions', a.permissions,
          'created_at', a.created_at,
          'updated_at', a.updated_at
        )
        order by (case when a.role = 'admin' then 0 else 1 end), a.created_at asc
      )
      from public.app_accounts a
    ),
    '[]'::json
  );
end;
$$ language plpgsql security definer;

-- 4. RPC: Lấy thông tin 1 tài khoản theo ID (dùng kiểm tra lại phiên đăng nhập)
create or replace function public.get_app_account_by_id(p_id uuid)
returns json as $$
declare
  v_acc public.app_accounts%rowtype;
begin
  select * into v_acc from public.app_accounts where id = p_id limit 1;
  if not found then
    return null;
  end if;
  return json_build_object(
    'id', v_acc.id,
    'username', v_acc.username,
    'display_name', v_acc.display_name,
    'role', v_acc.role,
    'is_locked', v_acc.is_locked,
    'permissions', v_acc.permissions,
    'created_at', v_acc.created_at,
    'updated_at', v_acc.updated_at
  );
end;
$$ language plpgsql security definer;

-- 5. RPC: Tạo tài khoản mới (Admin cấp cho nhân viên hoặc admin khác)
create or replace function public.create_app_account(
  p_username text,
  p_display_name text,
  p_password text,
  p_role text default 'staff',
  p_permissions jsonb default null
)
returns json as $$
declare
  v_clean_username text := lower(trim(p_username));
  v_acc public.app_accounts%rowtype;
  v_perms jsonb := coalesce(
    p_permissions,
    '{
      "can_view": true,
      "can_create_export": false,
      "can_upload_files": false,
      "can_ai_scan": false,
      "can_edit": false,
      "can_delete": false,
      "can_export_csv": true
    }'::jsonb
  );
begin
  if length(v_clean_username) < 2 then
    return json_build_object('success', false, 'error', 'Tên đăng nhập phải có ít nhất 2 ký tự.');
  end if;

  if exists (select 1 from public.app_accounts where lower(username) = v_clean_username) then
    return json_build_object('success', false, 'error', 'Tên đăng nhập này đã tồn tại.');
  end if;

  insert into public.app_accounts (username, display_name, password_hash, role, permissions)
  values (
    v_clean_username,
    trim(p_display_name),
    crypt(p_password, gen_salt('bf')),
    case when p_role = 'admin' then 'admin' else 'staff' end,
    v_perms
  )
  returning * into v_acc;

  return json_build_object(
    'success', true,
    'account', json_build_object(
      'id', v_acc.id,
      'username', v_acc.username,
      'display_name', v_acc.display_name,
      'role', v_acc.role,
      'is_locked', v_acc.is_locked,
      'permissions', v_acc.permissions,
      'created_at', v_acc.created_at,
      'updated_at', v_acc.updated_at
    )
  );
end;
$$ language plpgsql security definer;

-- 6. RPC: Cập nhật thông tin & phân quyền tài khoản
create or replace function public.update_app_account(
  p_id uuid,
  p_display_name text,
  p_role text,
  p_is_locked boolean,
  p_permissions jsonb
)
returns json as $$
declare
  v_acc public.app_accounts%rowtype;
begin
  update public.app_accounts
  set
    display_name = trim(p_display_name),
    role = case when p_role = 'admin' then 'admin' else 'staff' end,
    is_locked = coalesce(p_is_locked, is_locked),
    permissions = coalesce(p_permissions, permissions)
  where id = p_id
  returning * into v_acc;

  if not found then
    return json_build_object('success', false, 'error', 'Không tìm thấy tài khoản.');
  end if;

  return json_build_object(
    'success', true,
    'account', json_build_object(
      'id', v_acc.id,
      'username', v_acc.username,
      'display_name', v_acc.display_name,
      'role', v_acc.role,
      'is_locked', v_acc.is_locked,
      'permissions', v_acc.permissions,
      'created_at', v_acc.created_at,
      'updated_at', v_acc.updated_at
    )
  );
end;
$$ language plpgsql security definer;

-- 7. RPC: Đặt lại mật khẩu tài khoản
create or replace function public.reset_app_account_password(p_id uuid, p_new_password text)
returns json as $$
begin
  if length(p_new_password) < 4 then
    return json_build_object('success', false, 'error', 'Mật khẩu mới phải có ít nhất 4 ký tự.');
  end if;

  update public.app_accounts
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_id;

  if not found then
    return json_build_object('success', false, 'error', 'Không tìm thấy tài khoản.');
  end if;

  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- 8. RPC: Xóa tài khoản
create or replace function public.delete_app_account(p_id uuid)
returns json as $$
begin
  delete from public.app_accounts where id = p_id;
  return json_build_object('success', true);
end;
$$ language plpgsql security definer;

-- Cấp quyền gọi các hàm RPC cho anon & authenticated
grant execute on function public.login_account(text, text) to anon, authenticated;
grant execute on function public.get_app_accounts() to anon, authenticated;
grant execute on function public.get_app_account_by_id(uuid) to anon, authenticated;
grant execute on function public.create_app_account(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.update_app_account(uuid, text, text, boolean, jsonb) to anon, authenticated;
grant execute on function public.reset_app_account_password(uuid, text) to anon, authenticated;
grant execute on function public.delete_app_account(uuid) to anon, authenticated;

-- 9. Khởi tạo tài khoản Admin mặc định: tài khoản "admin" / mật khẩu "admin"
insert into public.app_accounts (username, display_name, password_hash, role, permissions)
values (
  'admin',
  'Admin',
  crypt('admin', gen_salt('bf')),
  'admin',
  '{
    "can_view": true,
    "can_create_export": true,
    "can_upload_files": true,
    "can_ai_scan": true,
    "can_edit": true,
    "can_delete": true,
    "can_export_csv": true
  }'::jsonb
)
on conflict (username) do nothing;
