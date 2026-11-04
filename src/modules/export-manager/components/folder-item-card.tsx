import React, { useState } from 'react';
import { Folder, ChevronRight, ArrowDownToLine } from 'lucide-react';

interface FolderItemCardProps {
  name: string;
  itemCount: number;
  type: 'year' | 'month' | 'day' | 'subfolder';
  updatedAt?: string;
  onClick: () => void;
  onDropFiles?: (droppedFileIds: string[], targetName: string, type: 'year' | 'month' | 'day' | 'subfolder') => void;
}

export const FolderItemCard: React.FC<FolderItemCardProps> = ({
  name,
  itemCount,
  type,
  updatedAt,
  onClick,
  onDropFiles,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Nhãn loại thư mục hiển thị tinh tế (song ngữ Việt - Trung chuẩn thứ tự thời gian)
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
    // Chỉ tắt khi chuột rời hẳn khỏi card
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

  return (
    <div
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
        isDragOver
          ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-500/60 shadow-lg scale-[1.02]'
          : 'border-border/60 bg-card/40 hover:bg-card hover:border-amber-500/40 hover:shadow-md'
      }`}
      title={
        isDragOver
          ? `Thả chuột để chuyển file vào thư mục ${name}`
          : `Nhấp để mở thư mục ${name}`
      }
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon thư mục phong cách Windows Explorer hiện đại */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-xs ${
            isDragOver
              ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-300 scale-110 animate-pulse'
              : 'bg-gradient-to-tr from-amber-500/15 to-yellow-500/10 border border-amber-500/25 text-amber-400 group-hover:scale-105 group-hover:from-amber-500/25 group-hover:to-yellow-500/20'
          }`}
        >
          {isDragOver ? (
            <ArrowDownToLine className="w-5 h-5 text-emerald-300" />
          ) : (
            <Folder className="w-5 h-5 fill-amber-400/20" />
          )}
        </div>

        <div className="min-w-0">
          <div
            className={`text-xs font-semibold transition-colors truncate font-mono ${
              isDragOver ? 'text-emerald-300' : 'text-foreground group-hover:text-amber-400'
            }`}
          >
            {name}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            {isDragOver ? (
              <span className="text-emerald-400 font-medium animate-pulse">
                Thả chuột để chuyển file vào đây...
              </span>
            ) : (
              <>
                <span>{getSubLabel()}</span>
                <span>•</span>
                <span className="font-mono text-muted-foreground/80">{itemCount} mục</span>
                {updatedAt && (
                  <>
                    <span>•</span>
                    <span className="hidden sm:inline font-mono text-[9px]">{updatedAt}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ChevronRight
        className={`w-4 h-4 transition-all shrink-0 ml-2 ${
          isDragOver
            ? 'text-emerald-400 translate-x-1'
            : 'text-muted-foreground/50 group-hover:text-amber-400 group-hover:translate-x-0.5'
        }`}
      />
    </div>
  );
};
