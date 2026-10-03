-- Migration: 0004_storage_stats_rpc.sql
-- Mô tả: Tạo hàm RPC public.get_storage_stats() trả về dung lượng thực tế của cơ sở dữ liệu Supabase

create or replace function public.get_storage_stats()
returns json as $$
declare
  db_size_bytes bigint;
  db_size_pretty text;
  tasks_count bigint := 0;
  completed_count bigint := 0;
  -- 500 MB = 524,288,000 bytes (Gói Free tiêu chuẩn của Supabase)
  limit_bytes bigint := 524288000;
  percent numeric := 0;
begin
  -- Lấy dung lượng hiện tại của toàn bộ Database Postgres
  select pg_database_size(current_database()) into db_size_bytes;
  select pg_size_pretty(db_size_bytes) into db_size_pretty;

  -- Đếm số lượng task nếu bảng tasks tồn tại
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tasks') then
    select count(*) from public.tasks into tasks_count;
    select count(*) from public.tasks where done = true or archived = true into completed_count;
  end if;

  -- Tính phần trăm dung lượng đã sử dụng
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

-- Cấp quyền gọi hàm cho cả authenticated và anon (viewer/admin)
grant execute on function public.get_storage_stats() to authenticated, anon;
