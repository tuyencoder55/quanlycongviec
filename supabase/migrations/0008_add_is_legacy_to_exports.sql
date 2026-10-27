-- Migration: 0008_add_is_legacy_to_exports.sql
-- Mô tả: Thêm cột is_legacy để đánh dấu hồ sơ xuất cũ từ trước (không bắt buộc ngày tháng)

alter table public.exports
  add column if not exists is_legacy boolean default false not null;

create index if not exists idx_exports_is_legacy on public.exports (is_legacy) where is_legacy = true;
