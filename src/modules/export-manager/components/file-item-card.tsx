import React, { useState } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  FileText,
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';

interface FileItemCardProps {
  item: ExportItem;
  isAdmin: boolean;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.full_name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/30 hover:bg-card hover:border-border transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon file PDF chuyên nghiệp (đỏ Acrobat như ảnh chụp của anh) */}
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <FileText className="w-5 h-5 text-rose-500" />
          <span className="text-[8px] font-bold font-mono tracking-tighter text-rose-400 mt-[-2px]">
            PDF
          </span>
        </div>

        {/* Thông tin file */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-semibold text-foreground font-mono truncate max-w-[280px] sm:max-w-md block"
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

          {/* Chip metadata: Mã Bảng, Khuôn, PO */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {item.board_code}
            </span>

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
      {isAdmin && (
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
              title="Sửa thông tin"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
              title="Xóa dòng xuất"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
