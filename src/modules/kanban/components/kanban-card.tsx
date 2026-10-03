import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Tag, Layers, Box, Hash, GripVertical } from 'lucide-react';
import type { KanbanTask } from '../types';
import { Badge } from '../../../components/ui/badge';
import { formatDate } from '../../../lib/utils';

interface KanbanCardProps {
  task: KanbanTask;
  onClick?: () => void;
  isOverlay?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  onClick,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isOverdue =
    task.due_date &&
    !task.done &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  // Nhãn mức độ ưu tiên
  const priorityConfig = {
    urgent: { text: 'Khẩn cấp', class: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
    high: { text: 'Cao', class: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    medium: { text: 'Vừa', class: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    low: { text: 'Thấp', class: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  }[task.priority] || { text: 'Vừa', class: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border bg-card/80 backdrop-blur-sm p-3.5 shadow-sm transition-all duration-200 select-none ${
        isOverlay
          ? 'shadow-2xl border-primary/60 scale-105 rotate-1 cursor-grabbing bg-card ring-2 ring-primary/40'
          : 'hover:border-primary/40 hover:shadow-md cursor-pointer'
      } ${task.done ? 'opacity-70 bg-card/40' : ''}`}
      onClick={onClick}
    >
      {/* Nút kéo thả handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-2 p-1 text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Kéo thả thẻ"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Header thẻ: Mức độ ưu tiên & Trạng thái */}
      <div className="flex items-center gap-1.5 mb-2 pr-6">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border font-mono ${priorityConfig.class}`}
        >
          {priorityConfig.text}
        </span>

        {task.labels &&
          task.labels.map((label, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/60"
            >
              {label}
            </span>
          ))}
      </div>

      {/* Tiêu đề thẻ (Tên file) */}
      <h4
        className={`text-xs font-semibold text-foreground tracking-tight leading-relaxed font-mono ${
          task.done ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Mô tả ngắn nếu có */}
      {task.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
          {task.description}
        </p>
      )}

      {/* Thông tin mã tự động bóc tách (Bảng, Khuôn, PO) */}
      {(task.board_code || task.mold_code || task.ref_value) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-border/50 text-[10px] font-mono">
          {task.board_code && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              <Layers className="w-3 h-3" />
              <span>{task.board_code}</span>
            </span>
          )}
          {task.mold_code && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Box className="w-3 h-3" />
              <span>{task.mold_code}</span>
            </span>
          )}
          {task.ref_value && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Hash className="w-3 h-3" />
              <span>PO: {task.ref_value}</span>
            </span>
          )}
        </div>
      )}

      {/* Footer thẻ: Hạn chót & Thời gian tạo */}
      {task.due_date && (
        <div className="flex items-center justify-between pt-2 mt-1 text-[10px]">
          <div
            className={`flex items-center gap-1 font-mono ${
              isOverdue ? 'text-rose-400 font-semibold animate-pulse' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>
              {formatDate(task.due_date)} {isOverdue && '(Quá hạn)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
