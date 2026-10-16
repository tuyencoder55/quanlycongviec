import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { ExportItem, ExportFormData } from '../types';
import type { ExportType } from '../../../types/database';
import { parseTaskTitle } from '../../kanban/utils/parser';
import {
  Sparkles,
  Layers,
  Box,
  Hash,
  FileImage,
  UploadCloud,
  X,
  Eye,
  RefreshCw,
  Paperclip,
} from 'lucide-react';
import { optimizeImage, formatBytes } from '../utils/image-optimizer';
import { uploadExportImage } from '../utils/storage-upload';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: ExportItem | null;
  defaultSubfolder?: string;
  defaultDate?: string;
  onSave: (formData: ExportFormData, id?: string) => Promise<void>;
  isAdmin: boolean;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onOpenChange,
  initialItem,
  defaultSubfolder,
  defaultDate,
  onSave,
  isAdmin,
}) => {
  const [type, setType] = useState<ExportType>('board');
  const [fullName, setFullName] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [moldCode, setMoldCode] = useState('');
  const [refValue, setRefValue] = useState('');
  const [exportedAt, setExportedAt] = useState(new Date().toISOString().split('T')[0]);
  const [subfolder, setSubfolder] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setFullName(initialItem.full_name);
      setBoardCode(initialItem.board_code);
      setMoldCode(initialItem.mold_code || '');
      setRefValue(initialItem.ref_value || '');
      setExportedAt(initialItem.exported_at || new Date().toISOString().split('T')[0]);
      setSubfolder(initialItem.subfolder || '');
      setNote(initialItem.note || '');
      setImageUrl(initialItem.image_url || null);
      setFileSizeBytes(initialItem.file_size_bytes || null);
    } else {
      setType('board');
      setFullName('');
      setBoardCode('');
      setMoldCode('');
      setRefValue('');
      setExportedAt(defaultDate || new Date().toISOString().split('T')[0]);
      setSubfolder(defaultSubfolder || '');
      setNote('');
      setImageUrl(null);
      setFileSizeBytes(null);
    }
  }, [initialItem, isOpen, defaultSubfolder, defaultDate]);

  // Hỗ trợ dán ảnh trực tiếp từ clipboard (Ctrl + V) khi đang mở dialog
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessOrderImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, exportedAt, subfolder, boardCode]);

  // Xử lý nén và tải ảnh đơn xuất
  const handleProcessOrderImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const optimized = await optimizeImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85, // Siêu nét để đọc rõ chữ viết tay trên đơn
        outputFormat: 'image/webp',
      });

      const folderArr = [
        exportedAt.slice(0, 4),
        exportedAt.slice(0, 7),
        exportedAt.slice(5, 10),
        subfolder.trim() || undefined,
      ].filter(Boolean) as string[];

      const cleanCode = (boardCode.trim() || 'don-xuat').toLowerCase();
      const uploadedUrl = await uploadExportImage(
        optimized.blob,
        optimized.dataUrl,
        `don_xuat_${cleanCode}`,
        folderArr
      );

      setImageUrl(uploadedUrl);
      setFileSizeBytes(optimized.optimizedSize);
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh đơn xuất:', err);
      alert('Không thể xử lý ảnh đơn xuất: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Phân tích tự động khi gõ tên file
  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!initialItem) {
      const parsed = parseTaskTitle(val);
      if (parsed.board_code) setBoardCode(parsed.board_code);
      if (parsed.mold_code) setMoldCode(parsed.mold_code);
      if (parsed.ref_value) setRefValue(parsed.ref_value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardCode.trim() || !isAdmin) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          type,
          board_code: boardCode.trim(),
          mold_code: moldCode.trim() || undefined,
          ref_kind: refValue.trim() ? 'po' : undefined,
          ref_value: refValue.trim() || undefined,
          full_name: fullName.trim() || boardCode.trim(),
          exported_at: exportedAt,
          subfolder: subfolder.trim() || undefined,
          image_url: imageUrl,
          file_size_bytes: fileSizeBytes,
          note: note.trim() || undefined,
        },
        initialItem?.id
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialItem ? 'Chỉnh Sửa Dòng Xuất Khuôn Bảng' : 'Ghi Nhận Xuất Khuôn Bảng Mới'}
            </DialogTitle>
            <DialogDescription>
              Lưu trữ thông tin xuất khuôn bảng và đính kèm ảnh đơn xuất đối chiếu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Loại xuất */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Loại xuất</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={type === 'board' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('board')}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Xuất Bảng</span>
                </Button>
                <Button
                  type="button"
                  variant={type === 'mold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('mold')}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Xuất Khuôn</span>
                </Button>
                <Button
                  type="button"
                  variant={type === 'po' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('po')}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Xuất PO</span>
                </Button>
              </div>
            </div>

            {/* Tên đầy đủ */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Tên đầy đủ của file xuất</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Dán tên file để AI tự bóc tách mã)
                </span>
              </label>
              <Input
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: 13502-W1 VY-1078 H-3711 PO 22144368"
                className="font-mono text-xs"
              />
            </div>

            {/* Các trường mã cụ thể */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  Mã Bảng <span className="text-destructive">*</span>
                </label>
                <Input
                  value={boardCode}
                  onChange={(e) => setBoardCode(e.target.value)}
                  placeholder="13502-W1"
                  required
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Mã Khuôn</label>
                <Input
                  value={moldCode}
                  onChange={(e) => setMoldCode(e.target.value)}
                  placeholder="VY-1078"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Số PO</label>
                <Input
                  value={refValue}
                  onChange={(e) => setRefValue(e.target.value)}
                  placeholder="22144368"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* ĐÍNH KÈM ẢNH ĐƠN XUẤT ĐỐI CHIẾU */}
            <div className="space-y-1.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <FileImage className="w-4 h-4" />
                  <span>Ảnh Đơn Xuất Kèm Theo (Phiếu Xuất Đối Chiếu)</span>
                </div>
                {imageUrl && fileSizeBytes && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatBytes(fileSizeBytes)} • WebP
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleProcessOrderImage(e.target.files[0]);
                }}
              />

              {isUploadingImage ? (
                <div className="p-3 text-center rounded-lg bg-card/60 border border-border/50 text-xs flex items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Đang nén và tải ảnh đơn xuất...</span>
                </div>
              ) : imageUrl ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-card/80 border border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={imageUrl}
                      alt="Đơn xuất"
                      className="w-10 h-10 object-cover rounded-lg border border-border/60 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-xs truncate">
                        Đã đính kèm ảnh đơn xuất
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Nén WebP nét căng để đối chiếu
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Đổi ảnh
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageUrl(null);
                        setFileSizeBytes(null);
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      title="Xóa ảnh đơn xuất"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 border border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-lg text-center cursor-pointer bg-card/20 hover:bg-card/40 transition-all text-xs"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Bấm chọn ảnh hoặc ấn <kbd className="px-1 py-0.2 rounded bg-muted font-mono text-[10px]">Ctrl+V</kbd> để dán ảnh đơn xuất</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ngày xuất */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Ngày xuất xưởng</label>
              <Input
                type="date"
                value={exportedAt}
                onChange={(e) => setExportedAt(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>

            {/* Thư mục con (tùy chọn) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Thư mục con (tự đặt tên)
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  VD: bestway, chiều, ca 1...
                </span>
              </div>
              <Input
                value={subfolder}
                onChange={(e) => setSubfolder(e.target.value)}
                placeholder="Để trống nếu nằm ở thư mục gốc của ngày"
                className="text-xs font-mono"
              />
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                <span className="text-[10px]">Gợi ý nhanh:</span>
                {['bestway', 'chiều', 'sáng', 'gấp'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSubfolder(tag)}
                    className="px-2 py-0.5 rounded-md bg-secondary/80 hover:bg-secondary text-[10px] font-mono border border-border/50 text-foreground transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Ghi chú thêm</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Xuất cho xưởng 2, kiểm tra khớp lệnh..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploadingImage}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting || isUploadingImage || !boardCode.trim()}
              className="text-xs"
            >
              {isSubmitting ? 'Đang lưu...' : initialItem ? 'Cập nhật' : 'Ghi nhận xuất'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
