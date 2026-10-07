import type { KanbanTask } from '../../kanban/types';
import type { ExportItem } from '../types';

export interface ScannedFileItem {
  id: string;
  full_name: string;
  board_code: string;
  mold_code?: string;
  ref_kind?: 'po' | 'date';
  ref_value?: string;
}

export interface MatchedScannedItem extends ScannedFileItem {
  // Trạng thái đối chiếu trên Kanban
  matchedTask?: KanbanTask;
  isTaskDone: boolean;
  taskStatusLabel: string;

  // Trạng thái đối chiếu trên Xuất khuôn bảng
  boardExportedDate?: string; // Ngày bảng đã xuất trước đó
  moldExportedDate?: string;  // Ngày khuôn đã xuất trước đó
  poExportedDate?: string;    // Ngày PO đã xuất trước đó
  isPoAlreadyExported: boolean;

  // Hành động xuất được đề xuất
  actionSuggest: 'export_po_only' | 'export_all' | 'already_exported_all';
  actionLabel: string;

  // Checkbox người dùng chọn xuất
  selectedToExport: boolean;
}

/**
 * Lấy API Key từ localStorage trước, nếu không có mới lấy từ .env
 */
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string') return envKey.trim();
  return '';
}

/**
 * Lưu API Key vào localStorage để người dùng có thể đổi trực tiếp trên web
 */
export function saveGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    const cleanKey = key.trim().replace(/^["']|["']$/g, '');
    if (cleanKey) {
      localStorage.setItem('gemini_api_key', cleanKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }
}

/**
 * Gọi Google Gemini AI đọc ảnh chụp màn hình và trích xuất danh sách file
 */
export async function scanScreenshotWithGemini(
  base64Data: string,
  mimeType: string = 'image/png',
  customKey?: string
): Promise<ScannedFileItem[]> {
  const apiKey = (customKey || getGeminiApiKey()).trim().replace(/^["']|["']$/g, '');
  if (!apiKey) {
    throw new Error('Chưa có Gemini API Key. Anh vui lòng nhập API Key để sử dụng tính năng này.');
  }

  const prompt = `Bạn là chuyên gia bóc tách tên file sản xuất cho xưởng in/khuôn bảng.
Hãy đọc toàn bộ danh sách tên file trong ảnh chụp màn hình này (dù là trong thư mục Windows, bảng tính Excel, hay danh sách Zalo).
Với mỗi file/dòng, hãy phân tích cú pháp chuẩn sau:
- "board_code": mã bảng (thường là token đầu tiên dạng 13502-W1, 14200-A2, 12800-B1...).
- "mold_code": mã khuôn (thường có tiền tố VY-, VX-, VL-, VXS- kèm số, ví dụ VY-1078, VX-2041, VL-0992...). Nếu không có thì để null.
- "ref_kind": "po" nếu có số PO, hoặc "date" nếu có ngày tham chiếu. Nếu không có thì null.
- "ref_value": số PO (ví dụ 22144368) hoặc ngày tháng. Nếu không có thì null.
- "full_name": tên đầy đủ gốc của file (loại bỏ phần đuôi mở rộng .pdf/.ai/.cdr nếu có).

QUAN TRỌNG: Trả về duy nhất một mảng JSON các đối tượng, theo cấu trúc:
[
  {
    "full_name": "13502-W1 VY-1078 H-3711 PO 22144368",
    "board_code": "13502-W1",
    "mold_code": "VY-1078",
    "ref_kind": "po",
    "ref_value": "22144368"
  }
]`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  // Danh sách model ưu tiên thử theo thứ tự (tương thích cả AQ. và AIza keys)
  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-2.5-flash-lite',
  ];

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: 'POST',
        // 'omit' ngăn trình duyệt gửi cookie Google/OAuth gây lỗi 401 ACCESS_TOKEN_TYPE_UNSUPPORTED
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsedErrMsg = '';
        try {
          const jsonErr = JSON.parse(errText);
          parsedErrMsg = jsonErr.error?.message || '';
        } catch {
          // ignore parse error
        }

        // Nếu lỗi 404 (model không tìm thấy), thử model tiếp theo trong danh sách
        if (response.status === 404) {
          lastError = new Error(`Model ${model} không khả dụng. Đang thử model khác...`);
          continue;
        }

        throw new Error(
          parsedErrMsg || `Lỗi Gemini API (${response.status}): ${errText.slice(0, 300)}`
        );
      }

      const result = await response.json();
      const rawJson = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('AI không nhận diện được văn bản hoặc không trả về nội dung.');
      }

      const parsed = JSON.parse(rawJson);
      const list = Array.isArray(parsed) ? parsed : parsed.files || parsed.items || [];
      return list
        .map((item: any, idx: number) => ({
          id: `ai-item-${Date.now()}-${idx}`,
          full_name: String(item.full_name || item.name || '').trim(),
          board_code: String(item.board_code || '').trim(),
          mold_code: item.mold_code ? String(item.mold_code).trim() : undefined,
          ref_kind: item.ref_kind === 'po' || item.ref_kind === 'date' ? item.ref_kind : undefined,
          ref_value: item.ref_value ? String(item.ref_value).trim() : undefined,
        }))
        .filter((item: ScannedFileItem) => item.board_code || item.full_name);
    } catch (err: any) {
      lastError = err;
      // Nếu là lỗi xác thực 401 hoặc permission 403, không cần loop mà ném lỗi ra ngay
      if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('API key not valid'))) {
        throw new Error(`Khóa API không hợp lệ hoặc chưa được kích hoạt (${err.message}). Anh kiểm tra lại API Key nhé.`);
      }
    }
  }

  throw lastError || new Error('Không thể kết nối đến AI. Anh vui lòng kiểm tra lại mạng hoặc API Key.');
}

/**
 * Đối chiếu danh sách AI trích xuất với hệ thống (Kanban tasks và Exports lịch sử)
 */
export function matchScannedItemsWithSystem(
  items: ScannedFileItem[],
  tasks: KanbanTask[],
  exportsList: ExportItem[]
): MatchedScannedItem[] {
  return items.map((item) => {
    const boardLower = item.board_code.toLowerCase();
    const moldLower = item.mold_code ? item.mold_code.toLowerCase() : undefined;
    const poVal = item.ref_value;

    // 1. Đối chiếu trên Kanban (Đã làm file chưa)
    const matchedTask = tasks.find((t) => {
      if (t.board_code && t.board_code.toLowerCase() === boardLower) {
        if (poVal && t.ref_value) return t.ref_value === poVal;
        return true;
      }
      return t.title.toLowerCase().includes(boardLower);
    });

    const isTaskDone = Boolean(matchedTask && (matchedTask.done || matchedTask.column_id));
    let taskStatusLabel = 'Chưa có trên Kanban';
    if (matchedTask) {
      taskStatusLabel = matchedTask.done ? 'Đã làm xong file' : 'Đang làm trong Kanban';
    }

    // 2. Đối chiếu trên lịch sử Xuất khuôn bảng
    // Ngày xuất Bảng
    const boardExp = exportsList.find(
      (e) => e.type === 'board' && e.board_code.toLowerCase() === boardLower
    );
    const boardExportedDate = boardExp ? boardExp.exported_at : undefined;

    // Ngày xuất Khuôn
    let moldExportedDate: string | undefined;
    if (moldLower) {
      const moldExp = exportsList.find(
        (e) => e.type === 'mold' && e.mold_code && e.mold_code.toLowerCase() === moldLower
      );
      moldExportedDate = moldExp ? moldExp.exported_at : undefined;
    }

    // Ngày xuất PO
    let poExportedDate: string | undefined;
    if (poVal) {
      const poExp = exportsList.find(
        (e) =>
          e.type === 'po' &&
          e.board_code.toLowerCase() === boardLower &&
          e.ref_value === poVal
      );
      poExportedDate = poExp ? poExp.exported_at : undefined;
    }

    const isPoAlreadyExported = Boolean(poExportedDate);

    // 3. Đưa ra đề xuất xuất xưởng thông minh
    let actionSuggest: 'export_po_only' | 'export_all' | 'already_exported_all' = 'export_all';
    let actionLabel = 'Xuất mới (Bảng + Khuôn + PO)';
    let selectedToExport = true;

    if (isPoAlreadyExported) {
      actionSuggest = 'already_exported_all';
      actionLabel = 'Đã xuất PO này trước đó';
      selectedToExport = false; // Mặc định không tick nếu đã xuất rồi
    } else if (boardExportedDate) {
      // Bảng đã xuất trước đó, bây giờ chỉ xuất thêm PO
      actionSuggest = 'export_po_only';
      actionLabel = 'Chỉ xuất thêm PO mới (Bảng/Khuôn đã có)';
      selectedToExport = true;
    }

    return {
      ...item,
      matchedTask,
      isTaskDone,
      taskStatusLabel,
      boardExportedDate,
      moldExportedDate,
      poExportedDate,
      isPoAlreadyExported,
      actionSuggest,
      actionLabel,
      selectedToExport,
    };
  });
}
