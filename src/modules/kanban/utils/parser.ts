import type { ParsedCodeResult } from '../types';

/**
 * Trích xuất tự động thông tin từ tên file theo chuẩn xưởng sản xuất:
 * [Mã bảng] [Mã khuôn] ... [PO số hoặc Ngày]
 * Ví dụ:
 * - "13502-W1 VY-1078 H-3711 PO 22144368" -> board: 13502-W1, mold: VY-1078, PO: 22144368
 * - "13853-W4+13854-W4_VY-1115_VY-1116_76-A01722..." -> board: 13853-W4+13854-W4, mold: VY-1115+VY-1116
 * Hỗ trợ phân tách bằng khoảng trắng, dấu gạch dưới _, dấu cộng +
 * Hỗ trợ nhận diện đồng thời nhiều mã khuôn (VY-1115, VY-1116) và ghép lại bằng dấu '+'
 */
export function parseTaskTitle(title: string): ParsedCodeResult {
  const trimmed = title.trim();
  if (!trimmed) {
    return {
      board_code: null,
      mold_code: null,
      ref_kind: null,
      ref_value: null,
      raw: title,
    };
  }

  // Loại bỏ phần mở rộng đuôi file nếu có (.pdf, .ai, .cdr, v.v.)
  const cleanTitle = trimmed.replace(/\.(pdf|ai|cdr|eps|indd|jpg|jpeg|png)$/i, '');

  // Chuẩn hóa khoảng trắng quanh dấu '+' (ví dụ: "13853-W4 + 13854-W4" -> "13853-W4+13854-W4")
  const normalized = cleanTitle.replace(/\s*\+\s*/g, '+');

  // 1. Tách các token linh hoạt theo cả khoảng trắng VÀ dấu gạch dưới '_'
  const tokens = normalized.split(/[\s_]+/).filter(Boolean);

  // 2. Tìm TẤT CẢ các mã khuôn có trong chuỗi (ví dụ: VY-1115, VY-1116, VX-2041, VL-0992...)
  // Hỗ trợ tiền tố VY, VX, VL, VXS, VYS, VXL kèm số
  const moldRegex = /(?:^|[^a-zA-Z0-9])(V[YXL]|VXS|VYS|VXL)[\s_-]*(\d+[A-Za-z0-9]*)/gi;
  const foundMolds: string[] = [];
  let moldMatch: RegExpExecArray | null;

  while ((moldMatch = moldRegex.exec(normalized)) !== null) {
    const prefix = moldMatch[1].toUpperCase();
    const number = moldMatch[2].toUpperCase();
    const code = `${prefix}-${number}`;
    if (!foundMolds.includes(code)) {
      foundMolds.push(code);
    }
  }

  // Nếu có từ 2 khuôn trở lên, nối lại bằng dấu '+' (ví dụ: VY-1115+VY-1116)
  const mold_code = foundMolds.length > 0 ? foundMolds.join('+') : null;

  // 3. board_code: Lấy token đầu tiên nếu nó KHÔNG phải là mã khuôn
  let board_code: string | null = null;
  if (tokens.length > 0) {
    const isFirstTokenMold = /^(V[YXL]|VXS|VYS|VXL)[\s_-]*\d+/i.test(tokens[0]);
    if (!isFirstTokenMold) {
      board_code = tokens[0];
    }
  }

  // 4. ref_kind & ref_value: Tìm kiếm chuỗi "PO <số>" hoặc Ngày ở cuối tên
  let ref_kind: 'po' | 'date' | null = null;
  let ref_value: string | null = null;

  // Kiểm tra mẫu "PO 22144368" hoặc "PO_22144368" hoặc "PO22144368" hoặc "PO: 22144368"
  const poMatch = normalized.match(/(?:^|[\s_])PO[\s_:#-]*([0-9a-zA-Z-]+)/i);
  if (poMatch) {
    ref_kind = 'po';
    ref_value = poMatch[1];
  } else {
    // Kiểm tra nếu cuối tên có định dạng ngày như YYYY-MM-DD hoặc DD.MM.YYYY hoặc DD-MM-YYYY
    const dateMatch = normalized.match(
      /(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2}[-./]\d{2,4})\s*$/
    );
    if (dateMatch) {
      ref_kind = 'date';
      ref_value = dateMatch[1];
    }
  }

  return {
    board_code,
    mold_code,
    ref_kind,
    ref_value,
    raw: trimmed,
  };
}
