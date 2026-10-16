/**
 * Tiện ích Scale & Nén ảnh thông minh phía Client (Trình duyệt)
 * - Tự động giới hạn kích thước tối đa 1920px (chuẩn Full HD)
 * - Giữ nguyên tỷ lệ khung hình và độ sắc nét chi tiết (tem nhãn, chữ số, khuôn)
 * - Nén sang WebP chất lượng cao (giảm 90 - 96% dung lượng so với ảnh gốc)
 * - Không cần gửi ảnh nặng lên server, xử lý siêu nhanh bằng HTML5 Canvas
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 đến 1.0 (mặc định 0.82)
  outputFormat?: 'image/webp' | 'image/jpeg';
}

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  reductionPercentage: number;
}

/**
 * Định dạng dung lượng byte sang KB / MB dễ đọc
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Hàm nén và scale ảnh giữ độ sắc nét
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    outputFormat = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    // 1. Đọc file qua Object URL
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;

      // 2. Tính toán kích thước mới (giữ tỷ lệ khung hình)
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratioX = maxWidth / targetWidth;
        const ratioY = maxHeight / targetHeight;
        const scale = Math.min(ratioX, ratioY);

        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }

      // 3. Khởi tạo Canvas để vẽ lại
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Trình duyệt không hỗ trợ Canvas 2D'));
        return;
      }

      // 4. Cấu hình làm mượt chất lượng cao để chữ và chi tiết kỹ thuật sắc nét
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Nền trắng cho ảnh trong suốt nếu chuyển sang JPEG
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Vẽ ảnh lên canvas theo kích thước đã scale
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 5. Xuất ra Blob WebP (hoặc JPEG fallback)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback nếu trình duyệt cũ không hỗ trợ WebP
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  reject(new Error('Không thể nén ảnh'));
                  return;
                }
                finish(fallbackBlob, 'image/jpeg');
              },
              'image/jpeg',
              quality
            );
            return;
          }
          finish(blob, outputFormat);
        },
        outputFormat,
        quality
      );

      function finish(blob: Blob, mime: string) {
        const dataUrl = canvas.toDataURL(mime, quality);
        const originalSize = file.size;
        const optimizedSize = blob.size;

        // Tính % dung lượng đã tiết kiệm
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSize - optimizedSize) / originalSize) * 100)
        );

        // Tạo đối tượng File mới với phần mở rộng chuẩn .webp
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const ext = mime === 'image/webp' ? 'webp' : 'jpg';
        const optimizedFile = new File([blob], `${baseName}.${ext}`, {
          type: mime,
          lastModified: Date.now(),
        });

        resolve({
          file: optimizedFile,
          blob,
          dataUrl,
          originalSize,
          optimizedSize,
          originalWidth,
          originalHeight,
          width: targetWidth,
          height: targetHeight,
          reductionPercentage,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể đọc file ảnh. File có thể bị hỏng hoặc định dạng không hỗ trợ.'));
    };

    img.src = objectUrl;
  });
}
