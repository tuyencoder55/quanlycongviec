import React from 'react';
import {
  Check,
  Calendar,
  Layers,
  Box,
  Hash,
  AlertCircle,
} from 'lucide-react';
import type { KanbanTask, KanbanColumn } from '../types';
import { formatDate } from '../../../lib/utils';

interface TaskListRowProps {
  index: number;
  task: KanbanTask;
  columns: KanbanColumn[];
  isAdmin: boolean;
  onToggleComplete: (task: KanbanTask) => Promise<void>;
  onChangeColumn?: (task: KanbanTask, columnId: string) => Promise<void>;
  onEdit: (task: KanbanTask) => void;
  onDelete?: (taskId: string) => Promise<void>;
}

export const TaskListRow: React.FC<TaskListRowProps> = ({
  index,
  task,
  columns,
  isAdmin,
  onToggleComplete,
  onEdit,
}) => {
  const currentColumn = columns.find((c) => c.id === task.column_id);
  const isDone = task.done || currentColumn?.title.toLowerCase().includes('xong');

  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  // Nhãn mức độ ưu tiên
  const priorityConfig = {
    urgent: { text: 'Khẩn cấp', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    high: { text: 'Cao', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    medium: { text: 'Vừa', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    low: { text: 'Thấp', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  }[task.priority] || { text: 'Vừa', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };

  return (
    <tr
      onClick={() => onEdit(task)}
      className={`group border-b border-border/30 hover:bg-accent/40 transition-colors cursor-pointer select-none text-xs ${
        isDone ? 'bg-card/20 text-muted-foreground/70' : 'bg-card/40 text-foreground'
      }`}
    >
      {/* 1. Số thứ tự (STT) */}
      <td className="py-2.5 px-3 w-12 text-center text-muted-foreground/70 font-mono text-[11px] border-r border-border/30 bg-secondary/15">
        {index + 1}
      </td>

      {/* 2. Tiêu đề công việc (không có icon phía trước) */}
      <td className="py-2.5 px-3 font-medium min-w-[240px] border-r border-border/30">
        <div className="min-w-0">
          <span
            className={`font-mono text-xs truncate block ${
              isDone ? 'line-through text-muted-foreground/60' : 'text-foreground'
            }`}
          >
            {task.title}
          </span>
          {task.description && (
            <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>
      </td>

      {/* 3. Mã Bảng & Mã Khuôn */}
      <td className="py-2.5 px-3 min-w-[160px] font-mono border-r border-border/30">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.board_code ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
              <Layers className="w-2.5 h-2.5" />
              <span>{task.board_code}</span>
            </span>
          ) : (
            <span className="text-muted-foreground/40 text-[11px]">-</span>
          )}

          {task.mold_code && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              <Box className="w-2.5 h-2.5" />
              <span>{task.mold_code}</span>
            </span>
          )}
        </div>
      </td>

      {/* 4. Số PO / Ngày tham chiếu */}
      <td className="py-2.5 px-3 min-w-[130px] font-mono text-muted-foreground border-r border-border/30">
        {task.ref_value ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
            <Hash className="w-2.5 h-2.5" />
            <span>{task.ref_value}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-[11px]">-</span>
        )}
      </td>

      {/* 5. Hạn chót (Due date) */}
      <td className="py-2.5 px-3 min-w-[120px] font-mono whitespace-nowrap border-r border-border/30">
        {task.due_date ? (
          <div
            className={`inline-flex items-center gap-1 text-[11px] ${
              isOverdue
                ? 'text-rose-400 font-semibold'
                : 'text-muted-foreground'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.due_date)}</span>
            {isOverdue && <AlertCircle className="w-3 h-3 text-rose-400" />}
          </div>
        ) : (
          <span className="text-muted-foreground/40 text-[11px]">-</span>
        )}
      </td>

      {/* 6. Mức độ ưu tiên */}
      <td className="py-2.5 px-3 min-w-[90px] whitespace-nowrap border-r border-border/30">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.2 rounded border font-mono inline-block ${priorityConfig.class}`}
        >
          {priorityConfig.text}
        </span>
      </td>

      {/* 7. Trạng thái: Kiểu check hoàn thành 1-chạm (Click để tick xong / mở lại) */}
      <td
        className="py-2.5 px-3 min-w-[140px] whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          disabled={!isAdmin}
          className={`group/status inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none ${
            isDone
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-secondary/60 border-border/70 text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400'
          }`}
          title={isDone ? 'Bấm để đánh dấu chưa xong' : 'Bấm để check HOÀN THÀNH'}
        >
          {/* Ô checkbox tương tác trực quan */}
          <div
            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0 ${
              isDone
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                : 'border-muted-foreground/40 bg-background/50 group-hover/status:border-emerald-500 group-hover/status:bg-emerald-500/20'
            }`}
          >
            {isDone ? (
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            ) : (
              <Check className="w-2.5 h-2.5 text-emerald-400 opacity-0 group-hover/status:opacity-100 transition-opacity" />
            )}
          </div>

          <span className="font-mono text-[11px]">
            {isDone ? 'Hoàn thành' : (currentColumn?.title || 'Đang làm')}
          </span>
        </button>
      </td>
    </tr>
  );
};
