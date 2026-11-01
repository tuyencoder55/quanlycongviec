import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ExportRow, Database } from '../../types/database';
import type { ExportItem, ExportFormData } from './types';

// Dữ liệu mẫu ban đầu (để trống khi kết nối database thật)
const FALLBACK_EXPORTS: ExportItem[] = [];

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

    if (error) {
      console.warn('Chưa có bảng exports trên Supabase, dùng dữ liệu mẫu:', error?.message);
      return [...localExportsStore];
    }

    return (data || []) as ExportItem[];
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
