import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  Check,
  AlertCircle,
  Folder,
  Layers,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import {
  optimizeImage,
  formatBytes,
  type OptimizedImageResult,
} from '../utils/image-optimizer';
import { uploadExportImage } from '../utils/storage-upload';
import { useExports } from '../hooks/use-exports';

interface ImageUploadModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string[]; // [year, month, day, subfolder]
  onSuccess?: () => void;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onOpenChange,
  currentPath,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimized, setOptimized] = useState<OptimizedImageResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [qualityPreset, setQualityPreset] = useState<number>(0.82); // Mặc định 82% siêu nét

  // Dữ liệu form
  const [fileName, setFileName] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [note, setNote] = useState('');
  const [exportDate, setExportDate] = useState('');
  const [subfolderName, setSubfolderName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { createExport } = useExports();

  // Xác định ngày và thư mục con từ currentPath
  useEffect(() => {
    if (isOpen) {
      const year = currentPath[0] || '2026';
      const month = currentPath[1] || `${year}-10`;
      const day = currentPath[2] || '10-16';
      const sub = currentPath[3] || '';

      const fullDate = `${month.slice(0, 4)}-${day}`;
      setExportDate(fullDate);
      setSubfolderName(sub);
      setErrorMessage(null);
      setSelectedFile(null);
      setOptimized(null);
      setFileName('');
      setBoardCode('');
      setNote('');
    }
  }, [isOpen, currentPath]);

  // Hỗ trợ dán ảnh trực tiếp từ clipboard (Ctrl + V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, qualityPreset]);

  // Xử lý nén ảnh
  const handleProcessFile = async (file: File, quality = qualityPreset) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn file hình ảnh (PNG, JPG, JPEG, WEBP...)');
      return;
    }

    setSelectedFile(file);
    setIsOptimizing(true);
    setErrorMessage(null);

    // Tự động gợi ý tên file và mã bảng
    const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const cleanRaw = rawName.replace(/\s+/g, '-');
    setFileName(cleanRaw);

    const firstToken = cleanRaw.split(/[-_]/)[0];
    if (firstToken && firstToken.length >= 4) {
      setBoardCode(firstToken.toUpperCase());
    } else {
      setBoardCode(cleanRaw.toUpperCase());
    }

    try {
      const result = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality,
        outputFormat: 'image/webp',
      });
      setOptimized(result);
    } catch (err: any) {
      console.error('Lỗi khi tối ưu ảnh:', err);
      setErrorMessage(err.message || 'Không thể xử lý ảnh');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Đổi mức chất lượng nén
  const handleChangeQuality = async (newQuality: number) => {
    setQualityPreset(newQuality);
    if (selectedFile) {
      await handleProcessFile(selectedFile, newQuality);
    }
  };

  // Kéo thả file
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Lưu và upload ảnh
  const handleSaveImage = async () => {
    if (!optimized) {
      setErrorMessage('Vui lòng chọn ảnh trước khi lưu');
      return;
    }
    if (!fileName.trim()) {
      setErrorMessage('Vui lòng nhập tên cho file ảnh');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. Tải ảnh lên Supabase Storage (với fallback base64 an toàn)
      const folderArr = [
        currentPath[0] || '2026',
        currentPath[1] || '2026-10',
        currentPath[2] || '10-16',
        subfolderName.trim() || undefined,
      ].filter(Boolean) as string[];

      const finalImageUrl = await uploadExportImage(
        optimized.blob,
        optimized.dataUrl,
        fileName.trim(),
        folderArr
      );

      // 2. Thêm bản ghi vào database exports
      await createExport({
        type: 'image',
        board_code: (boardCode.trim() || fileName.trim()).toUpperCase(),
        full_name: `${fileName.trim()}.webp`,
        exported_at: exportDate,
        subfolder: subfolderName.trim() || undefined,
        image_url: finalImageUrl,
        file_size_bytes: optimized.optimizedSize,
        note: note.trim() || undefined,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu ảnh xuất:', err);
      setErrorMessage(err.message || 'Lỗi khi lưu ảnh vào database');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
            <FileImage className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-semibold">
            Tải Lên Đơn Xuất Bảng / Khuôn (Đối Chiếu)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ảnh chụp phiếu giao nhận, đơn xuất xưởng dùng để đối chiếu sau này. Hệ thống tự động nén WebP giữ chữ viết sắc nét và tiết kiệm 95% bộ nhớ.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 py-1 text-xs">
          {/* KHU VỰC CHỌN / DÁN ẢNH */}
          {!optimized && !isOptimizing && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-emerald-500/60 rounded-2xl p-6 text-center cursor-pointer bg-card/30 hover:bg-card/60 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground text-xs">
                Kéo thả ảnh vào đây hoặc nhấp để chọn file
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hoặc ấn <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh chụp màn hình trực tiếp
              </p>
            </div>
          )}

          {/* ĐANG XỬ LÝ NÉN */}
          {isOptimizing && (
            <div className="p-8 text-center bg-card/40 rounded-2xl border border-border/60">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
              <p className="font-medium text-foreground text-xs">
                Đang scale kích thước & nén WebP giữ nét...
              </p>
            </div>
          )}

          {/* KẾT QUẢ SAU KHI NÉN & XEM TRƯỚC */}
          {optimized && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-border/80 bg-black/40 flex items-center justify-center max-h-56 p-2">
                <img
                  src={optimized.dataUrl}
                  alt="Xem trước"
                  className="max-h-52 object-contain rounded-lg"
                />
                <button
                  onClick={() => {
                    setOptimized(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 hover:bg-black text-[10px] text-white border border-white/20 transition-colors"
                >
                  Chọn ảnh khác
                </button>
              </div>

              {/* BẢNG SO SÁNH DUNG LƯỢNG TRƯỚC & SAU */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-card/50 border border-border/60">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-mono">
                    Ảnh gốc ban đầu
                  </div>
                  <div className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                    {formatBytes(optimized.originalSize)}
                    <span className="text-[10px] font-normal text-muted-foreground/70 ml-1">
                      ({optimized.originalWidth} × {optimized.originalHeight})
                    </span>
                  </div>
                </div>

                <div className="border-l border-border/50 pl-3">
                  <div className="text-[10px] text-emerald-400 uppercase font-mono flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Đã tối ưu siêu nét (WebP)
                  </div>
                  <div className="font-mono text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <span>{formatBytes(optimized.optimizedSize)}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      ({optimized.width} × {optimized.height})
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      -{optimized.reductionPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* TÙY CHỌN MỨC ĐỘ NÉN */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card/30 border border-border/40 text-[11px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Mức độ nét:</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'Siêu nét (85%)', val: 0.85 },
                    { label: 'Cân bằng (75%)', val: 0.75 },
                    { label: 'Siêu nhẹ (65%)', val: 0.65 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleChangeQuality(p.val)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors ${
                        qualityPreset === p.val
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CÁC TRƯỜNG THÔNG TIN CỦA FILE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Tên file hiển thị <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="VD: 13502-W1_HINH_MAU"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Mã Bảng / Khuôn (nếu có)
                  </label>
                  <Input
                    value={boardCode}
                    onChange={(e) => setBoardCode(e.target.value)}
                    placeholder="VD: 13502-W1"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Ngày xuất
                  </label>
                  <Input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Thư mục con
                  </label>
                  <Input
                    value={subfolderName}
                    onChange={(e) => setSubfolderName(e.target.value)}
                    placeholder="VD: bestway, chiều (để trống nếu gốc ngày)"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  Ghi chú đính kèm
                </label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú chi tiết cho ảnh này..."
                  className="text-xs"
                />
              </div>

              {/* BREADCRUMB ĐƯỜNG DẪN THƯ MỤC LƯU */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono bg-muted/40 p-2 rounded-lg border border-border/40">
                <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Lưu vào: {exportDate.slice(0, 4)} &gt; {exportDate.slice(0, 7)} &gt;{' '}
                  {exportDate.slice(5, 10)}
                  {subfolderName ? ` > ${subfolderName}` : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="text-xs"
          >
            Hủy
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveImage}
            disabled={!optimized || isUploading || !fileName.trim()}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Đang lưu ảnh...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Lưu ảnh vào thư mục
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
