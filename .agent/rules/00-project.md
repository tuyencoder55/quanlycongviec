---
trigger: always_on
---
# Workspace — Quy tắc chung

## Bối cảnh
- Web app cá nhân (1 chủ sở hữu). KHÔNG phải ERP/CRM, không làm multi-tenant.
- Người dùng là designer, biết code ở mức cơ bản → giải thích bằng tiếng Việt, đơn giản, comment code bằng tiếng Việt.

## Stack (cố định, không tự ý đổi)
- React + Vite + TypeScript + TailwindCSS + shadcn/ui
- Supabase: Auth, Postgres, (Storage chỉ khi thật sự cần)
- Deploy: Vercel
- Kanban kéo thả: @dnd-kit/core + @dnd-kit/sortable
- Server state: @tanstack/react-query. State cục bộ: useState/zustand nhỏ.
- CẤM: Express, NestJS, Docker, Redux, Socket.io, microservices.

## Cách làm việc
1. Làm TỪNG MODULE một. Trước khi code phải đưa kế hoạch ngắn (bảng DB, màn hình, file sẽ tạo) và CHỜ user duyệt.
2. Không đụng module khác khi đang làm một module.
3. Sau mỗi module: liệt kê cách test thủ công (3–5 bước).
4. Nếu thiếu thông tin → hỏi user, đừng đoán.

## Cấu trúc thư mục
src/
  modules/<tên-module>/{components,hooks,api.ts,types.ts,index.tsx}
  components/ui/      (shadcn)
  lib/supabase.ts
  lib/utils.ts
supabase/migrations/  (mỗi thay đổi DB = 1 file .sql đánh số)

## Code style
- Component nhỏ (<200 dòng), tách hook cho logic gọi Supabase.
- Tên biến/hàm tiếng Anh; text hiển thị cho user tiếng Việt.
- Luôn có trạng thái loading / empty / error.
- Không hardcode URL/key: dùng .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
