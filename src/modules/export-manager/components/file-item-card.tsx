import React, { useState } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
import { formatBytes } from '../utils/image-optimizer';
import {
  FileText,
  FileImage,
  Copy,
  Check,
  Pencil,
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
      className={`group relative flex items-center justify-between gap-3.5 py-3 pl-3.5 pr-3 rounded-[12px] border transition-colors cursor-grab active:cursor-grabbing select-none ${
        isHighlighted
          ? 'border-dot-po bg-tag-po-bg ring-2 ring-dot-po/40'
          : isSelected
          ? 'border-primary/35 bg-primary/[0.08]'
          : 'border-[var(--border)] bg-row hover:bg-row-hover hover:border-[var(--border-strong)]'
      }`}
    >
      {/* Bên trái: Checkbox + Tay kéo + Ô PDF/Ảnh + Nội dung 2 dòng */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Ô tick chọn & tay kéo 6 chấm */}
        <div
          className="flex items-center gap-2 shrink-0"
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
              className="w-4 h-4 rounded-[4px] border-[var(--border-strong)] cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-row"
              title="Chọn file này"
            />
          )}

          <div
            className="text-faint group-hover:text-subtle cursor-grab transition-colors"
            title="Nắm kéo file thả vào thư mục"
          >
            <GripVertical className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </div>
        </div>

        {/* Ô PDF 44x44 hoặc Thumbnail đơn xuất */}
        {hasImage && item.image_url && !imageError ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewImage?.(item);
            }}
            className="relative w-11 h-11 rounded-[10px] overflow-hidden border border-[var(--border-strong)] bg-track shrink-0 cursor-pointer"
            title="Click để phóng to xem đơn xuất đối chiếu"
          >
            <img
              src={item.image_url}
              alt={item.full_name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
          </div>
        ) : isImageOnly ? (
          <div className="w-11 h-11 rounded-[10px] bg-track border border-[var(--border)] flex flex-col items-center justify-center text-subtle shrink-0">
            <FileImage className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-[10px] bg-pdf-bg border border-pdf-border flex flex-col items-center justify-center text-pdf-text shrink-0">
            <FileText className="w-[16px] h-[16px]" strokeWidth={1.8} />
            <span className="text-[8px] font-bold font-mono tracking-wider leading-none mt-0.5">
              PDF
            </span>
          </div>
        )}

        {/* Phần nội dung 2 dòng theo DESIGN.md mục 5 */}
        <div className="min-w-0 flex-1">
          {/* Dòng trên: tên file mono 13.5px/500, 1 dòng cắt "..." + nút copy nhỏ 24px */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="font-mono text-[13.5px] font-medium text-text truncate leading-snug"
              title={item.full_name}
            >
              {item.full_name}
            </span>

            {isHighlighted && (
              <span className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-dot-po text-on-primary shrink-0">
                Đang tìm
              </span>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="w-6 h-6 rounded-[6px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors shrink-0"
              title="Sao chép tên file"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-dot-mold" strokeWidth={2} />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={1.8} />
              )}
            </button>
          </div>

          {/* Dòng dưới: nhãn mã bảng, khuôn, PO, ngày và ghi chú */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {isImageOnly ? (
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-emerald-500/10 text-dot-mold">
                Đơn xuất xưởng
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-tag-board-bg text-tag-board-text">
                {item.board_code}
              </span>
            )}

            {!isImageOnly && item.is_legacy && (
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-track text-muted-text">
                Hồ sơ cũ
              </span>
            )}

            {item.mold_code && (
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-emerald-500/10 text-dot-mold">
                {item.mold_code}
              </span>
            )}

            {item.ref_value && (
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-tag-po-bg text-tag-po-text">
                {item.ref_kind === 'po' ? `PO ${item.ref_value}` : item.ref_value}
              </span>
            )}

            {item.file_size_bytes && (
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-track text-muted-text">
                {formatBytes(item.file_size_bytes)}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[12px] text-muted-text font-mono">
              <Calendar className="w-3.5 h-3.5 text-subtle" strokeWidth={1.8} />
              <span>{formatDate(item.exported_at)}</span>
            </span>

            {item.note && (
              <span className="text-[12px] text-subtle truncate max-w-[260px] hidden md:inline">
                {item.note}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cụm nút bên phải: Xem đơn / Kèm đơn, Sửa, Xóa */}
      <div className="flex items-center gap-1 shrink-0">
        {hasImage && onViewImage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewImage(item);
            }}
            className="h-8 px-3 rounded-full text-[12px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-dot-mold border border-dot-mold/30 inline-flex items-center gap-1.5 transition-colors"
            title="Bấm để xem ảnh đơn xuất bảng/khuôn đối chiếu"
          >
            <Eye className="w-[15px] h-[15px]" strokeWidth={1.8} />
            <span>Xem đơn xuất</span>
          </button>
        )}

        {!hasImage && isAdmin && onAttachImage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAttachImage(item);
            }}
            className="h-8 px-2.5 rounded-[8px] text-[12px] font-medium text-muted-text hover:text-text hover:bg-track inline-flex items-center gap-1.5 transition-colors"
            title="Đính kèm ảnh chụp đơn xuất bảng/khuôn vào dòng này"
          >
            <Paperclip className="w-[15px] h-[15px] text-subtle" strokeWidth={1.8} />
            <span className="hidden sm:inline">Kèm đơn</span>
          </button>
        )}

        {isAdmin && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
            title="Sửa thông tin"
          >
            <Pencil className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </button>
        )}

        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-pdf-text hover:bg-pdf-bg transition-colors"
            title="Xóa dòng"
          >
            <Trash2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </button>
        )}
      </div>
    </div>
  );
};
