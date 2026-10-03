import type { ParsedCodeResult } from '../types';

/**
 * Trích xuất tự động thông tin từ tên file theo chuẩn:
 * [Mã bảng] [Mã khuôn] ... [PO số hoặc Ngày]
 * Ví dụ: "13502-W1 VY-1078 H-3711 42633310 4 CUBE UNIT WHITE PO 22144368"
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

  // Tách các từ/token theo khoảng trắng
  const tokens = trimmed.split(/\s+/);

  // 1. board_code: Luôn lấy token đầu tiên
  const board_code = tokens.length > 0 ? tokens[0] : null;

  // 2. mold_code: Token khớp /^(VY|VX|VL|VXs|vy|vx|vl|vxs)-\d+$/i
  const moldRegex = /^(VY|VX|VL|VXs)-\d+$/i;
  const moldToken = tokens.find((t) => moldRegex.test(t));
  const mold_code = moldToken ? moldToken.toUpperCase() : null;

  // 3. ref_kind & ref_value: Tìm kiếm chuỗi "PO <số>" hoặc Ngày ở cuối tên
  let ref_kind: 'po' | 'date' | null = null;
  let ref_value: string | null = null;

  // Kiểm tra mẫu "PO 22144368" hoặc "PO22144368" hoặc "PO: 22144368"
  const poMatch = trimmed.match(/\bPO\s*[:#-]?\s*([0-9a-zA-Z_-]+)\b/i);
  if (poMatch) {
    ref_kind = 'po';
    ref_value = poMatch[1];
  } else {
    // Kiểm tra nếu cuối tên có định dạng ngày như YYYY-MM-DD hoặc DD.MM.YYYY hoặc DD-MM-YYYY
    const dateMatch = trimmed.match(
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
