# DESIGN.md — Nexus (Tra cứu xuất khuôn bảng)

Tài liệu thiết kế giao diện. Hỗ trợ 2 chế độ: **Dark** (mặc định) và **Light**, đổi qua nút mặt trời/mặt trăng trên thanh trên cùng.
Chỉ đổi giao diện. KHÔNG đổi logic, dữ liệu, Supabase.

## 1. Nguyên tắc
- Tối giản: ít viền, ít màu chói. Chỉ 1 nút màu đặc trên mỗi khu vực (Ghi nhận xuất; Thêm file vào đây).
- Mã bảng / khuôn / PO luôn dùng font mono và nhãn màu để mắt quét nhanh.
- Cấu trúc (layout) giống nhau ở cả 2 chế độ. Light chỉ đổi giá trị màu theo bảng bên dưới.
- Chữ nhỏ phải đủ tương phản (>= 4.5:1). Không dùng màu xám nhạt hơn token `--muted`.

## 2. Font
- UI: **Inter** (400, 500, 600), có hỗ trợ tiếng Việt.
- Mã bảng, khuôn, PO, tên file, số thống kê, ngày trong đường dẫn: **JetBrains Mono** (400, 500, 600).
- Cỡ chữ: tên trang 15px/600 · tên file 13.5px/500 mono · nút và bộ lọc 13px · nhãn nhỏ và ghi chú 12px · nhãn bảng/PO 11.5px mono/500.

## 3. Màu — dùng CSS variables

```css
:root {            /* LIGHT */
  --bg:            #faf9f6;
  --surface:       #ffffff;   /* ô thống kê, ô tìm kiếm, thanh thư mục */
  --row:           #ffffff;
  --row-hover:     #f6f4ef;
  --border:        #e8e4dc;
  --border-strong: #d9d4c9;
  --track:         #efede7;   /* nền thanh chọn (segmented) */
  --selected:      #ffffff;   /* mục đang chọn trong thanh chọn */
  --selected-text: #1f1d1a;
  --text:          #1f1d1a;
  --muted:         #6b6760;
  --subtle:        #8a857b;   /* icon phụ, tay kéo */
  --faint:         #b5b0a5;   /* dấu "/" trong đường dẫn */

  --primary:       #4b5bf5;
  --on-primary:    #ffffff;

  --ai-bg:         #edf1ff;
  --ai-border:     #c9d3fb;
  --ai-text:       #2f48b8;

  --tag-board-bg:  #e8edff;  --tag-board-text: #2f48b8;
  --tag-po-bg:     #fff1d6;  --tag-po-text:    #8a5a00;
  --dot-board:     #3b5bdb;
  --dot-mold:      #2b8a5f;
  --dot-po:        #c47f00;

  --pdf-bg:        #fdecec;  --pdf-border: #f5c2c2;  --pdf-text: #c92a2a;
}

.dark {            /* DARK (mặc định) */
  --bg:            #0b0c0f;
  --surface:       #111317;
  --row:           #101216;
  --row-hover:     #14161b;
  --border:        rgba(255,255,255,.07);
  --border-strong: rgba(255,255,255,.12);
  --track:         #111317;
  --selected:      #23262e;
  --selected-text: #ffffff;
  --text:          #e8e9ec;
  --muted:         #8e94a0;
  --subtle:        #7a808b;
  --faint:         #4a4f59;

  --primary:       #4b5bf5;
  --on-primary:    #ffffff;

  --ai-bg:         rgba(154,166,255,.08);
  --ai-border:     rgba(154,166,255,.35);
  --ai-text:       #c3cbff;

  --tag-board-bg:  rgba(154,166,255,.12);  --tag-board-text: #b4bdff;
  --tag-po-bg:     rgba(242,196,107,.12);  --tag-po-text:    #f2c46b;
  --dot-board:     #9aa6ff;
  --dot-mold:      #5fd3a3;
  --dot-po:        #f2c46b;

  --pdf-bg:        rgba(255,107,107,.10);  --pdf-border: rgba(255,107,107,.22);  --pdf-text: #ff8a8a;
}
```

Nếu dự án dùng Tailwind/shadcn: map các biến trên vào `tailwind.config` (ví dụ `bg: 'var(--bg)'`) và dùng class `dark` trên thẻ `<html>`. Giữ cơ chế đổi sáng/tối đang có, chỉ thay giá trị màu.

## 4. Bo góc, khoảng cách, kích thước
- Bo góc: nút và ô nhập 10px · dòng danh sách 12px · thanh thư mục 12px · nhãn nhỏ 6px · nút icon 8px · ô PDF 10px.
- Chiều cao: nút lớn 40px · nút nhỏ (thanh thư mục) 34px · mục trong thanh chọn 32px (nền thanh có padding 3px, bo 10px).
- Nội dung rộng tối đa 1280px, căn giữa, padding ngang 32px, padding trên 28px. Khoảng cách giữa các khối lớn 20px.
- Dòng danh sách: padding 12px 12px 12px 14px · khoảng cách giữa các dòng 8px · khoảng cách trong dòng 14px.
- Mọi thành phần bấm được >= 32px; nút chính >= 40px.

## 5. Thành phần (từ trên xuống)

**Thanh trên cùng**: trái là "Nexus" (muted) / "Tra cứu xuất khuôn bảng" (600). Phải là ô tìm nhanh rộng 300px có gợi ý phím "Ctrl K", và nút đổi sáng/tối. Có đường kẻ mỏng bên dưới (`--border`).

**Hàng thống kê + nút**: trái là 4 ô thống kê nhỏ (nền `--surface`, viền `--border`, bo 10px): Tổng xuất, Bảng, Khuôn, PO. Mỗi ô gồm nhãn muted và số mono 16px/600. Bảng, Khuôn, PO có chấm tròn 7px màu `--dot-*`. Phải là các nút theo thứ tự: Xuất CSV (viền), nút icon tải lại (trong suốt), AI Quét ảnh + "Ctrl+V" (màu `--ai-*`, có icon lấp lánh), Ghi nhận xuất (nền `--primary`, chữ `--on-primary`, đậm 600, có dấu +).

**Hàng bộ lọc** (xuống dòng được khi màn hẹp):
- Ô lọc rộng tối đa 340px.
- Thanh chọn "Tất cả / Bảng / Khuôn / PO".
- Thanh chọn "Mọi lúc / Hôm nay / 7 ngày qua / Tháng này".
- Phải: thanh chọn "Thư mục / Bảng" (có icon) và chữ mono "54 kết quả".
- Mục đang chọn: nền `--selected`, chữ `--selected-text`, đậm 500. Mục khác: nền trong suốt, chữ `--muted`.

**Thanh thư mục**: một khối nền `--surface`, bo 12px, viền `--border`. Trái là nút quay lại, rồi đường dẫn Gốc / 2026 / 2026-11 / 11-02 (phần mã dùng mono, dấu "/" màu `--faint`, thư mục hiện tại có nền `--selected` bo 6px). Phải là: Thư mục mới (viền), Thêm ảnh (viền), Thêm file vào đây (nền `--primary`).

**Dòng file** (mỗi dòng là một thẻ, nền `--row`, viền `--border`, hover đổi sang `--row-hover` và viền `--border-strong`):
- Từ trái sang: ô tick chọn (accent `--primary`) · tay kéo 6 chấm (`--faint`) · ô PDF 44x44 · phần nội dung · cụm nút bên phải.
- Phần nội dung gồm 2 dòng. Dòng trên: tên file mono 13.5px/500, một dòng, cắt bằng dấu "…" khi dài, kèm nút sao chép nhỏ 24px. Dòng dưới: nhãn mã bảng (`--tag-board-*`), nhãn "PO xxxxxxxxx" (`--tag-po-*`), icon lịch + ngày 12px muted, rồi ghi chú "Xuất mới (Bảng + Khuôn + PO)" 12px màu `--subtle`.
- Cụm nút phải: "Kèm đơn" (icon kẹp giấy + chữ, muted), nút sửa, nút xóa (icon 15px, màu `--subtle`, hover thì sáng lên, nền trong suốt chuyển sang nền mờ).
- Ô PDF: nền `--pdf-bg`, viền `--pdf-border`, icon file + chữ "PDF" 8px đậm màu `--pdf-text`.

## 6. Trạng thái
- Hover: đổi nền nhẹ (dòng sang `--row-hover`; nút trong suốt thêm nền mờ ~6%).
- Focus bàn phím: viền 2px `--primary`, cách 2px.
- Dòng đang chọn (tick): nền chuyển sang `--primary` ở độ mờ 8%, viền `--primary` ở độ mờ 35%.
- Icon dùng nét 1.8px, bo tròn đầu nét (kiểu Lucide), 15-17px.

## 7. Quy tắc cho AI khi sửa code
- Chỉ sửa class, CSS, JSX trình bày. Không đổi tên biến, hàm, props, query, schema.
- Giữ nguyên mọi chức năng: lọc, tìm, chuyển Thư mục/Bảng, Ghi nhận xuất, AI Quét ảnh (Ctrl+V), Xuất CSV, kéo thả, chọn nhiều dòng, sao chép tên file.
- Không hard-code mã màu trong component. Luôn dùng biến ở mục 3.
- Làm từng bước, mỗi bước xong báo file đã sửa.
