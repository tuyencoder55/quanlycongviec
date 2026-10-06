import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Archive, Sparkles } from 'lucide-react';
import type { KanbanColumn as KanbanColumnType, KanbanTask } from '../types';
import { KanbanCard } from './kanban-card';
import { Button } from '../../../components/ui/button';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCardClick: (task: KanbanTask) => void;
  onAddTaskClick: (columnId: string) => void;
  isAdmin: boolean;
  onOpenArchive?: () => void;
  archivedCount?: number;
  onArchiveAllDone?: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onCardClick,
  onAddTaskClick,
  isAdmin,
  onOpenArchive,
  archivedCount = 0,
  onArchiveAllDone,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map((t) => t.id);
  const isDoneColumn = column.title.toLowerCase().includes('xong');

  // Điểm nhấn màu sắc thanh lịch theo tiêu đề cột
  const columnTheme = {
    'Cần làm': { dot: 'bg-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    'Đang làm': { dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    'Xong': { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  }[column.title] || { dot: 'bg-primary', badge: 'bg-primary/10 text-primary border-primary/20' };

  return (
    <div
      className={`w-72 sm:w-80 flex-shrink-0 flex flex-col max-h-full rounded-xl border transition-all duration-150 select-none ${
        isOver
          ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border/50 bg-card/25 backdrop-blur-xs'
      }`}
    >
      {/* Header cột tinh giản */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full ${columnTheme.dot} shrink-0`} />
          <h3 className="font-semibold text-xs tracking-tight text-foreground uppercase truncate">
            {column.title}
          </h3>
          <span
            className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border ${columnTheme.badge}`}
          >
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút xem Kho lưu trữ nếu là cột Xong */}
          {isDoneColumn && onOpenArchive && (
            <button
              onClick={onOpenArchive}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-colors"
              title="Xem kho lưu trữ các việc đã hoàn thành"
            >
              <Archive className="w-3 h-3" />
              <span>Kho ({archivedCount})</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onAddTaskClick(column.id)}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded transition-colors"
              title="Thêm nhanh vào cột này"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Vùng danh sách thẻ kéo thả */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[140px]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="h-24 rounded-lg border border-dashed border-border/40 flex flex-col items-center justify-center text-center p-2 text-muted-foreground/50 text-[11px]">
            <span>Kéo thẻ vào đây</span>
            {isAdmin && (
              <button
                onClick={() => onAddTaskClick(column.id)}
                className="mt-1 text-[11px] text-primary hover:underline font-medium"
              >
                + Tạo việc mới
              </button>
            )}
          </div>
        )}

        {/* Thông báo tự động cất vào kho cho cột Xong */}
        {isDoneColumn && archivedCount > 0 && onOpenArchive && (
          <div
            onClick={onOpenArchive}
            className="p-2 rounded-lg border border-dashed border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] flex items-center justify-between cursor-pointer transition-colors mt-2"
          >
            <div className="flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Đã cất {archivedCount} việc vào kho</span>
            </div>
            <span className="font-semibold underline">Xem kho →</span>
          </div>
        )}
      </div>

      {/* Footer cột Xong: Nút dọn dẹp / cất thẻ ngay */}
      {isDoneColumn && isAdmin && column.tasks.length > 0 && onArchiveAllDone && (
        <div className="p-1.5 border-t border-border/40 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchiveAllDone}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground h-7 gap-1.5"
            title="Chuyển tất cả thẻ đã xong hiện tại vào Kho lưu trữ"
          >
            <Archive className="w-3 h-3" />
            <span>Dọn dẹp cất vào kho</span>
          </Button>
        </div>
      )}
    </div>
  );
};
