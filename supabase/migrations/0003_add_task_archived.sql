-- Migration: 0003_add_task_archived.sql
-- Mô tả: Thêm cột archived vào bảng tasks để hỗ trợ kho lưu trữ các công việc đã hoàn thành

alter table public.tasks
  add column if not exists archived boolean default false not null;

create index if not exists idx_tasks_archived on public.tasks(archived);
create index if not exists idx_tasks_done_archived on public.tasks(done, archived);
