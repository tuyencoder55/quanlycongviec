import React, { useState } from 'react';
import { Folder, ChevronRight, ArrowDownToLine, MoreVertical } from 'lucide-react';

interface FolderItemCardProps {
  name: string;
  itemCount: number;
  type: 'year' | 'month' | 'day' | 'subfolder';
  updatedAt?: string;
  isAdmin?: boolean;
  onClick: () => void;
  onDropFiles?: (droppedFileIds: string[], targetName: string, type: 'year' | 'month' | 'day' | 'subfolder') => void;
  onFolderContextMenu?: (e: React.MouseEvent, name: string, type: 'year' | 'month' | 'day' | 'subfolder', itemCount: number) => void;
}

export const FolderItemCard: React.FC<FolderItemCardProps> = ({
  name,
  itemCount,
  type,
  updatedAt,
  isAdmin = false,
  onClick,
  onDropFiles,
  onFolderContextMenu,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getSubLabel = () => {
    switch (type) {
      case 'year':
        return 'Năm • 年';
      case 'month':
        return 'Tháng • 月';
      case 'day':
        return 'Ngày • 日';
      case 'subfolder':
        return 'Thư mục con • 目录';
      default:
        return 'Thư mục';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onDropFiles) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!onDropFiles) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const ids = JSON.parse(dataStr);
        if (Array.isArray(ids) && ids.length > 0) {
          onDropFiles(ids, name, type);
        }
      }
    } catch (err) {
      console.error('Lỗi khi đọc file kéo thả:', err);
    }
  };

  const handleCardContextMenu = (e: React.MouseEvent) => {
    if (onFolderContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onFolderContextMenu(e, name, type, itemCount);
    }
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={handleCardContextMenu}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center justify-between p-3 rounded-[12px] border transition-colors cursor-pointer select-none ${
        isDragOver
          ? 'border-dot-mold bg-emerald-500/10 ring-2 ring-dot-mold/40'
          : 'border-[var(--border)] bg-row hover:bg-row-hover hover:border-[var(--border-strong)]'
      }`}
      title={
        isDragOver
          ? `Thả chuột để chuyển file vào thư mục ${name}`
          : `Nhấp để mở hoặc chuột phải để tùy chọn/xóa ${name}`
      }
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors shrink-0 ${
            isDragOver
              ? 'bg-emerald-500/20 text-dot-mold'
              : 'bg-tag-po-bg text-tag-po-text'
          }`}
        >
          {isDragOver ? (
            <ArrowDownToLine className="w-[18px] h-[18px]" strokeWidth={1.8} />
          ) : (
            <Folder className="w-[18px] h-[18px]" strokeWidth={1.8} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`text-[13px] font-semibold transition-colors truncate font-mono ${
              isDragOver ? 'text-dot-mold' : 'text-text'
            }`}
          >
            {name}
          </div>
          <div className="text-[11px] text-muted-text flex items-center gap-1.5 mt-0.5">
            {isDragOver ? (
              <span className="text-dot-mold font-medium">
                Thả chuột để chuyển file vào đây...
              </span>
            ) : (
              <>
                <span>{getSubLabel()}</span>
                <span className="text-faint">•</span>
                <span className="font-mono text-subtle">{itemCount} mục</span>
                {updatedAt && (
                  <>
                    <span className="text-faint">•</span>
                    <span className="hidden sm:inline font-mono text-[10px] text-subtle">{updatedAt}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {isAdmin && onFolderContextMenu && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFolderContextMenu(e, name, type, itemCount);
            }}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-subtle hover:text-text hover:bg-track rounded-[8px] transition-all"
            title="Tùy chọn thư mục (Xóa, quản lý)"
          >
            <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        )}

        <ChevronRight
          className={`w-4 h-4 transition-transform shrink-0 ${
            isDragOver
              ? 'text-dot-mold translate-x-0.5'
              : 'text-faint group-hover:text-subtle group-hover:translate-x-0.5'
          }`}
          strokeWidth={1.8}
        />
      </div>
    </div>
  );
};
