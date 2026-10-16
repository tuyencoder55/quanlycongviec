import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';

interface FolderItemCardProps {
  name: string;
  itemCount: number;
  type: 'year' | 'month' | 'day' | 'subfolder';
  updatedAt?: string;
  onClick: () => void;
}

export const FolderItemCard: React.FC<FolderItemCardProps> = ({
  name,
  itemCount,
  type,
  updatedAt,
  onClick,
}) => {
  // Nhãn loại thư mục hiển thị tinh tế
  const getSubLabel = () => {
    switch (type) {
      case 'year':
        return 'Năm';
      case 'month':
        return 'Tháng';
      case 'day':
        return 'Ngày xuất';
      case 'subfolder':
        return 'Thư mục con';
      default:
        return 'Thư mục';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer select-none"
      title={`Nhấp để mở thư mục ${name}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon thư mục phong cách Windows Explorer hiện đại */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/15 to-yellow-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:from-amber-500/25 group-hover:to-yellow-500/20 transition-transform shrink-0 shadow-xs">
          <Folder className="w-5 h-5 fill-amber-400/20" />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors truncate font-mono">
            {name}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span>{getSubLabel()}</span>
            <span>•</span>
            <span className="font-mono text-muted-foreground/80">{itemCount} mục</span>
            {updatedAt && (
              <>
                <span>•</span>
                <span className="hidden sm:inline font-mono text-[9px]">{updatedAt}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
    </div>
  );
};
