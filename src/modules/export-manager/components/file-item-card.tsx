import React, { useState } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
import { formatBytes } from '../utils/image-optimizer';
import { Button } from '../../../components/ui/button';
import {
  FileText,
  FileImage,
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  Eye,
  Paperclip,
  GripVertical,
} from 'lucide-react';

interface FileItemCardProps {
  item: ExportItem;
  isAdmin: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
  onDragStartItem?: (e: React.DragEvent, item: ExportItem) => void;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
  onViewImage?: (item: ExportItem) => void;
  onAttachImage?: (item: ExportItem) => void;
  isHighlighted?: boolean;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  item,
  isAdmin,
  isSelected = false,
  onToggleSelect,
  onDragStartItem,
  onEdit,
  onDelete,
  onViewImage,
  onAttachImage,
  isHighlighted = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Tự động cuộn đến file khi được nhảy tới từ bảng
  React.useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  const hasImage = Boolean(item.image_url);
  const isImageOnly = item.type === 'image';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.full_name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Nếu click vào checkbox hoặc nút thì bỏ qua
    if (onToggleSelect && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.stopPropagation();
      onToggleSelect(item.id, e.shiftKey);
      return;
    }

    if (hasImage && onViewImage) {
      onViewImage(item);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStartItem) {
      onDragStartItem(e, item);
    }
  };

  return (
    <div
      ref={cardRef}
      data-file-id={item.id}
      draggable={true}
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        isHighlighted
          ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/70 shadow-lg shadow-amber-500/10 animate-in fade-in'
          : isSelected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs'
          : 'border-border/60 bg-card/30 hover:bg-card hover:border-border'
      } ${hasImage ? 'hover:border-emerald-500/40 hover:shadow-xs' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* CHECKBOX CHỌN FILE VÀ TAY CẦM KÉO THẢ */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                const nativeEvent = e.nativeEvent as MouseEvent;
                onToggleSelect(item.id, Boolean(nativeEvent?.shiftKey));
              }}
              className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-1 focus:ring-primary accent-primary"
              title="Chọn file này"
            />
          )}

          <div
            className="text-muted-foreground/40 group-hover:text-muted-foreground/80 cursor-grab"
            title="Nắm kéo file thả vào thư mục"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* ICON HOẶC THUMBNAIL ĐƠN XUẤT */}
        {hasImage && item.image_url && !imageError ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewImage?.(item);
            }}
            className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 bg-emerald-950/20 shrink-0 shadow-xs group-hover:scale-105 transition-transform cursor-pointer"
            title="Click để phóng to xem đơn xuất đối chiếu"
          >
            <img
              src={item.image_url}
              alt={item.full_name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : isImageOnly ? (
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <FileImage className="w-5 h-5 text-emerald-400" />
            <span className="text-[8px] font-bold font-mono tracking-tighter text-emerald-400 mt-[-2px]">
              ĐƠN
            </span>
          </div>
        ) : (
          /* Icon file PDF chuyên nghiệp (đỏ Acrobat) */
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-rose-500" />
            <span className="text-[8px] font-bold font-mono tracking-tighter text-rose-400 mt-[-2px]">
              PDF
            </span>
          </div>
        )}

        {/* Thông tin file / đơn xuất */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold font-mono truncate max-w-[280px] sm:max-w-md block transition-colors ${
                isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
              }`}
              title={item.full_name}
            >
              {item.full_name}
            </span>
            {isHighlighted && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-400 text-slate-950 shadow-xs animate-pulse">
                Đang tìm
              </span>
            )}
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
              title="Sao chép tên"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Chip metadata: Mã Bảng, Khuôn, PO, Trạng thái đơn xuất */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {isImageOnly ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Đơn xuất xưởng
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {item.board_code}
              </span>
            )}

            {!isImageOnly && item.is_legacy && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-medium bg-secondary/80 text-muted-foreground border border-border/50">
                Hồ sơ cũ
              </span>
            )}

            {item.mold_code && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {item.mold_code}
              </span>
            )}

            {item.ref_value && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {item.ref_kind === 'po' ? `PO ${item.ref_value}` : item.ref_value}
              </span>
            )}

            {item.file_size_bytes && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-secondary text-foreground border border-border/50">
                {formatBytes(item.file_size_bytes)}
              </span>
            )}

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono ml-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(item.exported_at)}</span>
            </div>

            {item.note && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[150px] hidden md:inline">
                • {item.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* NÚT THAO TÁC XEM ĐƠN XUẤT VÀ QUẢN LÝ */}
      <div className="flex items-center gap-1.5 ml-2 shrink-0">
        {/* NÚT BẤM XEM ĐƠN XUẤT NỔI BẬT NẾU CÓ ẢNH */}
        {hasImage && onViewImage && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewImage(item);
            }}
            className="h-7 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-all"
            title="Bấm để xem ảnh đơn xuất bảng/khuôn đối chiếu"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="font-semibold">Xem đơn xuất</span>
          </Button>
        )}

        {/* Nút đính kèm ảnh đơn xuất nếu chưa có */}
        {!hasImage && isAdmin && onAttachImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAttachImage(item);
            }}
            className="h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1"
            title="Đính kèm ảnh chụp đơn xuất bảng/khuôn vào dòng này"
          >
            <Paperclip className="w-3 h-3" />
            <span className="hidden sm:inline">Kèm đơn</span>
          </Button>
        )}

        {/* Hành động sửa/xóa cho Admin */}
        {isAdmin && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
            title="Sửa thông tin"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        )}

        {isAdmin && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
            title="Xóa dòng"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
