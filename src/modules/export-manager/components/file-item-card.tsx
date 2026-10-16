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
  Maximize2,
  Folder,
} from 'lucide-react';

interface FileItemCardProps {
  item: ExportItem;
  isAdmin: boolean;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
  onViewImage?: (item: ExportItem) => void;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onViewImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = item.type === 'image' || Boolean(item.image_url);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.full_name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCardClick = () => {
    if (isImage && onViewImage) {
      onViewImage(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/30 hover:bg-card hover:border-border transition-all duration-200 ${
        isImage ? 'cursor-pointer hover:border-emerald-500/40' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* ICON HOẶC THUMBNAIL ẢNH */}
        {isImage && item.image_url && !imageError ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onViewImage?.(item);
            }}
            className="relative w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-950/20 shrink-0 shadow-xs group-hover:scale-105 transition-transform cursor-pointer"
            title="Click để phóng to ảnh xem chi tiết"
          >
            <img
              src={item.image_url}
              alt={item.full_name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        ) : isImage ? (
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <FileImage className="w-5 h-5 text-emerald-400" />
            <span className="text-[8px] font-bold font-mono tracking-tighter text-emerald-400 mt-[-2px]">
              IMG
            </span>
          </div>
        ) : (
          /* Icon file PDF chuyên nghiệp (đỏ Acrobat) */
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-rose-500" />
            <span className="text-[8px] font-bold font-mono tracking-tighter text-rose-400 mt-[-2px]">
              PDF
            </span>
          </div>
        )}

        {/* Thông tin file */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-semibold text-foreground font-mono truncate max-w-[280px] sm:max-w-md block group-hover:text-primary transition-colors"
              title={item.full_name}
            >
              {item.full_name}
            </span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
              title="Sao chép tên file"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Chip metadata: Mã Bảng, Khuôn, PO, Dung lượng */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {isImage ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Hình ảnh WebP
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {item.board_code}
              </span>
            )}

            {isImage && item.file_size_bytes && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-secondary text-foreground border border-border/50">
                {formatBytes(item.file_size_bytes)}
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

      {/* Hành động sửa/xóa cho Admin */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
        {isImage && onViewImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewImage(item);
            }}
            className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
            title="Xem phóng to ảnh"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        )}

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
