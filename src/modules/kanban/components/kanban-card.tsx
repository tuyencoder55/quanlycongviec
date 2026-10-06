import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Layers, Box, Hash, GripVertical, Clock } from 'lucide-react';
import type { KanbanTask } from '../types';
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
    opacity: isDragging ? 0.3 : 1,
  };

  const isOverdue =
    task.due_date &&
    !task.done &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  // Cấu hình nhãn mức độ ưu tiên tối giản, không bị loè loẹt
  const priorityConfig = {
    urgent: { text: 'Khẩn cấp', dot: 'bg-rose-400', badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    high: { text: 'Cao', dot: 'bg-amber-400', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    medium: { text: 'Vừa', dot: 'bg-indigo-400', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    low: { text: 'Thấp', dot: 'bg-slate-400', badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  }[task.priority] || { text: 'Vừa', dot: 'bg-indigo-400', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-card/70 hover:bg-card p-3 shadow-2xs transition-all duration-150 select-none ${
        isOverlay
          ? 'shadow-xl border-primary/70 scale-102 rotate-1 cursor-grabbing bg-card ring-1 ring-primary/40'
          : 'border-border/50 hover:border-border/90 hover:shadow-xs cursor-pointer'
      } ${task.done ? 'opacity-65 bg-card/30' : ''}`}
      onClick={onClick}
    >
      {/* Nút handle kéo thả tinh tế (chỉ hiện khi rê chuột) */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2.5 right-2 p-1 text-muted-foreground/30 hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity rounded"
        title="Kéo thả thẻ"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Header thẻ: Mức độ ưu tiên & Nhãn & Hạn chót */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pr-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border font-mono inline-flex items-center gap-1 ${priorityConfig.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
            {priorityConfig.text}
          </span>

          {task.labels &&
            task.labels.map((label, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.2 rounded bg-secondary/80 text-secondary-foreground border border-border/40 font-mono"
              >
                {label}
              </span>
            ))}
        </div>

        {/* Hạn chót ở header nếu có */}
        {task.due_date && (
          <div
            className={`text-[10px] font-mono flex items-center gap-1 ${
              isOverdue
                ? 'text-rose-400 font-semibold'
                : 'text-muted-foreground/80'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        )}
      </div>

      {/* Tiêu đề thẻ (Tên file sản xuất) */}
      <h4
        className={`text-xs font-medium text-foreground tracking-tight leading-snug font-mono break-all ${
          task.done ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Mô tả ngắn nếu có */}
      {task.description && (
        <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-1 leading-normal">
          {task.description}
        </p>
      )}

      {/* Các chip mã bóc tách: Bảng, Khuôn, PO */}
      {(task.board_code || task.mold_code || task.ref_value) && (
        <div className="flex flex-wrap items-center gap-1 pt-2 mt-2 border-t border-border/40 text-[10px] font-mono">
          {task.board_code && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-2.5 h-2.5" />
              <span>{task.board_code}</span>
            </span>
          )}
          {task.mold_code && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Box className="w-2.5 h-2.5" />
              <span>{task.mold_code}</span>
            </span>
          )}
          {task.ref_value && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Hash className="w-2.5 h-2.5" />
              <span>PO: {task.ref_value}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
