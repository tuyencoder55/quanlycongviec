import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

/**
 * Tải ảnh đã nén lên Supabase Storage bucket 'export-images'
 * - Tạo đường dẫn theo cây thư mục: {year}/{month}/{day}/{filename}.webp
 * - Nếu Storage bucket chưa tạo hoặc gặp lỗi, tự động fallback lưu base64 dataUrl vào database
 *   để người dùng không bao giờ bị gián đoạn hay lỗi tải lên!
 */
export async function uploadExportImage(
  blob: Blob,
  fallbackDataUrl: string,
  fileName: string,
  folderPath: string[]
): Promise<string> {
  // Nếu chưa cấu hình Supabase thật, dùng dataUrl trực tiếp
  if (!isSupabaseConfigured) {
    return fallbackDataUrl;
  }

  try {
    const cleanName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const timestamp = Date.now();
    const subPath = folderPath.filter(Boolean).join('/');
    const fullStoragePath = `${subPath ? `${subPath}/` : ''}${timestamp}_${cleanName}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('export-images')
      .upload(fullStoragePath, blob, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.warn(
        'Lỗi khi tải ảnh lên Supabase Storage (dùng base64 fallback):',
        uploadError.message
      );
      return fallbackDataUrl;
    }

    // Lấy Public URL của ảnh vừa tải lên
    const { data } = supabase.storage
      .from('export-images')
      .getPublicUrl(fullStoragePath);

    if (data?.publicUrl) {
      return data.publicUrl;
    }

    return fallbackDataUrl;
  } catch (err) {
    console.warn('Ngoại lệ khi upload ảnh lên Supabase Storage (dùng base64 fallback):', err);
    return fallbackDataUrl;
  }
}
