-- Migration: 0007_add_image_support_to_exports.sql
-- Mô tả: Thêm hỗ trợ lưu ảnh vào thư mục (image_url, file_size_bytes, mở rộng type 'image')

-- 1. Thêm cột image_url và file_size_bytes vào bảng exports
alter table public.exports 
  add column if not exists image_url text,
  add column if not exists file_size_bytes bigint;

-- 2. Mở rộng ràng buộc type để hỗ trợ thêm giá trị 'image'
alter table public.exports 
  drop constraint if exists exports_type_check;

alter table public.exports 
  add constraint exports_type_check 
  check (type in ('board', 'mold', 'po', 'image'));

-- 3. Tạo index hỗ trợ truy vấn lọc file ảnh và dung lượng
create index if not exists idx_exports_type on public.exports (type);
create index if not exists idx_exports_image_url on public.exports (image_url) where image_url is not null;

-- 4. Cấu hình Storage Bucket 'export-images' trên Supabase (nếu chưa có)
insert into storage.buckets (id, name, public) 
values ('export-images', 'export-images', true)
on conflict (id) do nothing;

-- 5. Thiết lập quyền RLS cho bucket 'export-images'
-- Cho phép mọi người (kể cả khách / anon) xem ảnh công khai qua link
drop policy if exists "Công khai xem ảnh export" on storage.objects;
create policy "Công khai xem ảnh export"
  on storage.objects for select
  using (bucket_id = 'export-images');

-- Cho phép người dùng tải ảnh lên bucket
drop policy if exists "Cho phép tải ảnh export lên" on storage.objects;
create policy "Cho phép tải ảnh export lên"
  on storage.objects for insert
  to authenticated, anon
  with check (bucket_id = 'export-images');

-- Cho phép người dùng cập nhật/ghi đè ảnh
drop policy if exists "Cho phép cập nhật ảnh export" on storage.objects;
create policy "Cho phép cập nhật ảnh export"
  on storage.objects for update
  to authenticated, anon
  using (bucket_id = 'export-images');

-- Cho phép admin xóa ảnh khỏi bucket
drop policy if exists "Cho phép xóa ảnh export" on storage.objects;
create policy "Cho phép xóa ảnh export"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'export-images');
