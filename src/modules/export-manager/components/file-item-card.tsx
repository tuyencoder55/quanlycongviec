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

  const rowBaseClass = `group relative rounded-[12px] border transition-colors cursor-grab active:cursor-grabbing select-none ${
    isHighlighted
      ? 'border-dot-po bg-tag-po-bg ring-2 ring-dot-po/40'
      : isSelected
      ? 'border-primary/35 bg-primary/[0.08]'
      : 'border-[var(--border)] bg-row hover:bg-row-hover hover:border-[var(--border-strong)]'
  }`;

  // ============================================================================
  // 1. DÒNG HÌNH ẢNH ĐÍNH KÈM (ĐƠN XUẤT XƯỞNG) — Theo hình Dashboard đầy đủ
  // ============================================================================
  if (isImageOnly) {
    return (
      <div
        ref={cardRef}
        data-file-id={item.id}
        draggable={true}
        onDragStart={handleDragStart}
        onClick={handleCardClick}
        className={`${rowBaseClass} flex items-center justify-between gap-3.5 py-3 pl-3.5 pr-3`}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {onToggleSelect && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  const nativeEvent = e.nativeEvent as MouseEvent;
                  onToggleSelect(item.id, Boolean(nativeEvent?.shiftKey));
                }}
                className="w-4 h-4 rounded-[4px] border-[var(--border-strong)] cursor-pointer accent-primary"
                title="Chọn hình ảnh này"
              />
            </div>
          )}

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
          ) : (
            <div className="w-11 h-11 rounded-[10px] bg-track border border-[var(--border)] flex items-center justify-center text-subtle shrink-0">
              <FileImage className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div
              className="font-mono text-[13.5px] font-medium text-text truncate leading-snug"
              title={item.full_name}
            >
              {item.full_name}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-emerald-500/10 text-dot-mold">
                Đơn xuất xưởng
              </span>
              {item.file_size_bytes && (
                <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-track text-muted-text">
                  {formatBytes(item.file_size_bytes)}
                </span>
              )}
              <span className="text-[12px] text-muted-text font-mono tabular-nums">
                {formatDate(item.exported_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasImage && onViewImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewImage(item);
              }}
              className="h-8 px-3.5 rounded-full text-[12px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-dot-mold border border-dot-mold/35 inline-flex items-center gap-1.5 transition-colors"
              title="Bấm để xem ảnh đơn xuất đối chiếu"
            >
              <Eye className="w-[15px] h-[15px]" strokeWidth={1.8} />
              <span>Xem đơn xuất</span>
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
  }

  // ============================================================================
  // 2. DÒNG FILE XUẤT PDF — Căn cột thẳng hàng theo hình Dashboard đầy đủ
  //    Cột: Tên file | Bảng | Khuôn | PO | Ngày | Thao tác (4 icon)
  // ============================================================================
  return (
    <div
      ref={cardRef}
      data-file-id={item.id}
      draggable={true}
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      className={`${rowBaseClass} grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_104px_96px_132px_90px_136px] items-center gap-3 py-3 pl-3.5 pr-3`}
    >
      {/* CỘT 1: Checkbox + Tay kéo + Ô PDF + Tên file & Ghi chú */}
      <div className="flex items-center gap-3 min-w-0">
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
              className="w-4 h-4 rounded-[4px] border-[var(--border-strong)] cursor-pointer accent-primary"
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

        {/* Ô PDF 44x44 hoặc thumbnail nếu file có đính kèm ảnh */}
        {hasImage && item.image_url && !imageError ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewImage?.(item);
            }}
            className="relative w-11 h-11 rounded-[10px] overflow-hidden border border-dot-mold/40 bg-track shrink-0 cursor-pointer"
            title="Click để xem ảnh đơn xuất đính kèm"
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
        ) : (
          <div className="w-11 h-11 rounded-[10px] bg-pdf-bg border border-pdf-border flex flex-col items-center justify-center text-pdf-text shrink-0">
            <FileText className="w-[16px] h-[16px]" strokeWidth={1.8} />
            <span className="text-[8px] font-bold font-mono tracking-wider leading-none mt-0.5">
              PDF
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
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
          </div>
          <div className="text-[12px] text-muted-text truncate mt-0.5">
            {item.note || (item.is_legacy ? 'Hồ sơ xuất cũ' : 'Xuất mới (Bảng + Khuôn + PO)')}
          </div>
        </div>
      </div>

      {/* CỘT 2: Bảng */}
      <div className="flex items-center lg:justify-start flex-wrap gap-1.5 lg:gap-0">
        <span className="px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-tag-board-bg text-tag-board-text truncate max-w-full">
          {item.board_code}
        </span>

        {/* Hiển thị gọn các chip còn lại trên mobile (< lg) */}
        <div className="flex items-center gap-1.5 flex-wrap lg:hidden">
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
          <span className="text-[12px] font-mono text-muted-text tabular-nums">
            {formatDate(item.exported_at)}
          </span>
        </div>
      </div>

      {/* CỘT 3: Khuôn (Desktop) */}
      <div className="hidden lg:flex items-center">
        {item.mold_code ? (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-emerald-500/10 text-dot-mold truncate max-w-full">
            {item.mold_code}
          </span>
        ) : (
          <span className="text-[12px] text-faint font-mono">—</span>
        )}
      </div>

      {/* CỘT 4: PO (Desktop) */}
      <div className="hidden lg:flex items-center">
        {item.ref_value ? (
          <span className="px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-mono font-medium bg-tag-po-bg text-tag-po-text truncate max-w-full">
            {item.ref_kind === 'po' ? `PO ${item.ref_value}` : item.ref_value}
          </span>
        ) : (
          <span className="text-[12px] text-faint font-mono">—</span>
        )}
      </div>

      {/* CỘT 5: Ngày (Desktop) */}
      <div className="hidden lg:flex items-center text-[12px] font-mono text-muted-text tabular-nums">
        {formatDate(item.exported_at)}
      </div>

      {/* CỘT 6: Cụm 4 nút thao tác icon bên phải (Kèm đơn / Xem đơn, Copy, Sửa, Xóa) */}
      <div className="flex items-center justify-end gap-0.5 shrink-0">
        {hasImage && onViewImage ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewImage(item);
            }}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-dot-mold hover:bg-emerald-500/10 transition-colors"
            title="Xem ảnh đơn xuất đính kèm"
          >
            <Eye className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </button>
        ) : (
          isAdmin &&
          onAttachImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAttachImage(item);
              }}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
              title="Kèm ảnh đơn xuất"
            >
              <Paperclip className="w-[15px] h-[15px]" strokeWidth={1.8} />
            </button>
          )
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
          title="Sao chép tên file"
        >
          {copied ? (
            <Check className="w-[15px] h-[15px] text-dot-mold" strokeWidth={2} />
          ) : (
            <Copy className="w-[15px] h-[15px]" strokeWidth={1.8} />
          )}
        </button>

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
