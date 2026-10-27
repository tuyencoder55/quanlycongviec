import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ExportRow, Database } from '../../types/database';
import type { ExportItem, ExportFormData } from './types';

// Dữ liệu mẫu phong phú mô phỏng thực tế xưởng sản xuất để preview ngay
const FALLBACK_EXPORTS: ExportItem[] = [
  {
    id: 'exp-1',
    type: 'board',
    board_code: '13502-W1',
    mold_code: 'VY-1078',
    ref_kind: 'po',
    ref_value: '22144368',
    full_name: '13502-W1 VY-1078 H-3711 42633310 4 CUBE UNIT WHITE PO 22144368',
    exported_at: '2026-10-15',
    subfolder: 'bestway',
    note: 'Xuất bảng chính cho xưởng hoàn thiện',
    created_by: null,
    created_at: new Date('2026-10-15T08:30:00Z').toISOString(),
  },
  {
    id: 'exp-2',
    type: 'mold',
    board_code: '13502-W1',
    mold_code: 'VY-1078',
    ref_kind: 'po',
    ref_value: '22144368',
    full_name: '13502-W1 VY-1078 H-3711 PO 22144368',
    exported_at: '2026-10-15',
    subfolder: 'bestway',
    note: 'Xuất khuôn ép nhiệt VY-1078',
    created_by: null,
    created_at: new Date('2026-10-15T09:00:00Z').toISOString(),
  },
  {
    id: 'exp-3',
    type: 'po',
    board_code: '13502-W1',
    mold_code: 'VY-1078',
    ref_kind: 'po',
    ref_value: '22144368',
    full_name: '13502-W1 VY-1078 PO 22144368',
    exported_at: '2026-10-15',
    subfolder: 'chiều',
    note: 'Lô hàng PO đợt ca chiều',
    created_by: null,
    created_at: new Date('2026-10-15T14:15:00Z').toISOString(),
  },
  {
    id: 'exp-4',
    type: 'board',
    board_code: '14765-W4',
    mold_code: 'VY-0104',
    ref_kind: 'po',
    ref_value: '2308200015',
    full_name: '14765-W4 VY-0104 A-4732 2308200015',
    exported_at: '2026-10-15',
    subfolder: null, // Nằm trực tiếp trong thư mục ngày 10-15
    note: 'Xuất trực tiếp trong thư mục ngày',
    created_by: null,
    created_at: new Date('2026-10-15T15:06:00Z').toISOString(),
  },
  {
    id: 'exp-5',
    type: 'po',
    board_code: '13502-W1',
    mold_code: 'VY-1078',
    ref_kind: 'po',
    ref_value: '22144390',
    full_name: '13502-W1 VY-1078 PO 22144390',
    exported_at: '2026-10-14',
    subfolder: 'bestway',
    note: 'Lô hàng PO đợt 2 bổ sung hôm qua',
    created_by: null,
    created_at: new Date('2026-10-14T10:00:00Z').toISOString(),
  },
  {
    id: 'exp-6',
    type: 'board',
    board_code: '14200-A2',
    mold_code: 'VX-2041',
    ref_kind: 'po',
    ref_value: '22155890',
    full_name: '14200-A2 VX-2041 H-3890 PO 22155890',
    exported_at: '2026-10-14',
    subfolder: 'chiều',
    note: 'Xuất bảng mẫu kiểm định chất lượng',
    created_by: null,
    created_at: new Date('2026-10-14T15:20:00Z').toISOString(),
  },
  {
    id: 'exp-7',
    type: 'mold',
    board_code: '14200-A2',
    mold_code: 'VX-2041',
    ref_kind: 'po',
    ref_value: '22155890',
    full_name: '14200-A2 VX-2041 PO 22155890',
    exported_at: '2026-10-13',
    subfolder: 'bestway',
    note: 'Khuôn VX-2041 đạt chuẩn',
    created_by: null,
    created_at: new Date('2026-10-13T11:00:00Z').toISOString(),
  },
  {
    id: 'exp-8',
    type: 'board',
    board_code: '12800-B1',
    mold_code: 'VL-0992',
    ref_kind: 'po',
    ref_value: '22099120',
    full_name: '12800-B1 VL-0992 H-3650 PO 22099120',
    exported_at: '2026-10-12',
    subfolder: null,
    note: 'Xuất xưởng hoàn tất',
    created_by: null,
    created_at: new Date('2026-10-12T09:30:00Z').toISOString(),
  },
  {
    id: 'exp-9',
    type: 'board',
    board_code: '11900-C3',
    mold_code: 'VY-0845',
    ref_kind: 'po',
    ref_value: '21980442',
    full_name: '11900-C3 VY-0845 H-3510 PO 21980442',
    exported_at: '2026-10-06',
    subfolder: 'bestway',
    note: 'Đơn hàng đầu tháng',
    created_by: null,
    created_at: new Date('2026-10-06T08:00:00Z').toISOString(),
  },
];

let localExportsStore: ExportItem[] = [...FALLBACK_EXPORTS];

export async function fetchExportsApi(): Promise<ExportItem[]> {
  if (!isSupabaseConfigured) {
    return [...localExportsStore];
  }

  try {
    const { data, error } = await supabase
      .from('exports')
      .select('*')
      .order('exported_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Chưa có bảng exports trên Supabase, dùng dữ liệu mẫu:', error?.message);
      return [...localExportsStore];
    }

    return data as ExportItem[];
  } catch (err) {
    console.error('Lỗi khi tải danh sách exports từ Supabase:', err);
    return [...localExportsStore];
  }
}

export async function createExportApi(formData: ExportFormData): Promise<ExportItem> {
  const insertPayload: Database['public']['Tables']['exports']['Insert'] = {
    type: formData.type,
    board_code: formData.board_code,
    mold_code: formData.mold_code || null,
    ref_kind: formData.ref_kind || null,
    ref_value: formData.ref_value || null,
    full_name: formData.full_name,
    exported_at: formData.exported_at,
    subfolder: formData.subfolder || null,
    image_url: formData.image_url || null,
    file_size_bytes: formData.file_size_bytes || null,
    is_legacy: formData.is_legacy ?? false,
    note: formData.note || null,
  };

  const createLocal = (): ExportItem => ({
    id: 'local-exp-' + Date.now(),
    type: formData.type,
    board_code: formData.board_code,
    mold_code: formData.mold_code || null,
    ref_kind: formData.ref_kind || null,
    ref_value: formData.ref_value || null,
    full_name: formData.full_name,
    exported_at: formData.exported_at,
    subfolder: formData.subfolder || null,
    image_url: formData.image_url || null,
    file_size_bytes: formData.file_size_bytes || null,
    is_legacy: formData.is_legacy ?? false,
    note: formData.note || null,
    created_by: null,
    created_at: new Date().toISOString(),
  });

  if (!isSupabaseConfigured) {
    const item = createLocal();
    localExportsStore = [item, ...localExportsStore];
    return item;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('exports') as any)
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) {
    console.warn('Lỗi ghi dòng xuất lên Supabase (lưu dự phòng):', error?.message);
    const item = createLocal();
    localExportsStore = [item, ...localExportsStore];
    return item;
  }

  return data as ExportItem;
}

export async function updateExportApi(id: string, updates: Partial<ExportRow>): Promise<void> {
  localExportsStore = localExportsStore.map((e) => (e.id === id ? { ...e, ...updates } : e));

  if (!isSupabaseConfigured) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('exports') as any).update(updates).eq('id', id);
  if (error) {
    console.error('Lỗi cập nhật dòng xuất trên Supabase:', error);
  }
}

export async function deleteExportApi(id: string): Promise<void> {
  localExportsStore = localExportsStore.filter((e) => e.id !== id);

  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('exports').delete().eq('id', id);
  if (error) {
    console.error('Lỗi xóa dòng xuất trên Supabase:', error);
  }
}
