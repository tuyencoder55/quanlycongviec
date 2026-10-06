import React from 'react';
import {
  Check,
  Calendar,
  Layers,
  Box,
  Hash,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { KanbanTask, KanbanColumn } from '../types';
import { formatDate } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';

interface TaskListRowProps {
  task: KanbanTask;
  columns: KanbanColumn[];
  isAdmin: boolean;
  onToggleComplete: (task: KanbanTask) => Promise<void>;
  onChangeColumn: (task: KanbanTask, columnId: string) => Promise<void>;
  onEdit: (task: KanbanTask) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export const TaskListRow: React.FC<TaskListRowProps> = ({
  task,
  columns,
  isAdmin,
  onToggleComplete,
  onChangeColumn,
  onEdit,
  onDelete,
}) => {
  const currentColumn = columns.find((c) => c.id === task.column_id);
  const isDone = task.done || currentColumn?.title.toLowerCase().includes('xong');

  const isOverdue =
    task.due_date &&
    !isDone &&
    new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  // Chữ cái viết tắt làm avatar icon như hình mẫu [S] Send NDA, [R] Review proposal
  const initialChar = (task.title.trim()[0] || 'T').toUpperCase();

  // Nhãn mức độ ưu tiên
  const priorityConfig = {
    urgent: { text: 'Khẩn cấp', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    high: { text: 'Cao', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    medium: { text: 'Vừa', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    low: { text: 'Thấp', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  }[task.priority] || { text: 'Vừa', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };

  // Màu trạng thái cột giống chuẩn giao diện mẫu
  const getStatusBadge = (colTitle: string) => {
    const title = colTitle.toLowerCase();
    if (title.includes('xong')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (title.includes('đang')) {
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
    return 'bg-secondary text-muted-foreground border-border/60';
  };

  return (
    <tr
      onClick={() => onEdit(task)}
      className={`group border-b border-border/40 hover:bg-accent/40 transition-colors cursor-pointer select-none text-xs ${
        isDone ? 'bg-card/20 text-muted-foreground/70' : 'bg-card/40 text-foreground'
      }`}
    >
      {/* 1. Nút Checkbox hoàn thành ở đầu dòng */}
      <td
        className="py-2.5 px-3 w-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-muted-foreground/40 hover:border-primary/80 bg-background/50 hover:bg-background'
          }`}
          title={isDone ? 'Bấm để mở lại việc này' : 'Bấm để đánh dấu HOÀN THÀNH'}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>
      </td>

      {/* 2. Tiêu đề công việc kèm icon avatar chữ tắt */}
      <td className="py-2.5 px-3 font-medium min-w-[240px]">
        <div className="flex items-center gap-2.5">
          {/* Badge chữ viết tắt tròn/vuông nhỏ xinh xắn giống hệt ảnh mẫu */}
          <div
            className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border ${
              isDone
                ? 'bg-muted/50 text-muted-foreground border-border/40'
                : 'bg-primary/15 text-primary border-primary/25'
            }`}
          >
            {initialChar}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`font-mono text-xs truncate block ${
                isDone ? 'line-through text-muted-foreground' : 'text-foreground'
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
        </div>
      </td>

      {/* 3. Mã Bảng & Mã Khuôn */}
      <td className="py-2.5 px-3 min-w-[160px] font-mono">
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
      <td className="py-2.5 px-3 min-w-[130px] font-mono text-muted-foreground">
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
      <td className="py-2.5 px-3 min-w-[120px] font-mono whitespace-nowrap">
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
      <td className="py-2.5 px-3 min-w-[100px] whitespace-nowrap">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.2 rounded border font-mono inline-block ${priorityConfig.class}`}
        >
          {priorityConfig.text}
        </span>
      </td>

      {/* 7. Trạng thái (Cần làm / Đang làm / Xong) có thể click đổi nhanh */}
      <td
        className="py-2.5 px-3 min-w-[120px] whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={task.column_id}
          onChange={(e) => onChangeColumn(task, e.target.value)}
          disabled={!isAdmin}
          className={`h-6 rounded-md px-2 text-[11px] font-medium border focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors ${getStatusBadge(
            currentColumn?.title || ''
          )}`}
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id} className="bg-card text-foreground">
              {col.title}
            </option>
          ))}
        </select>
      </td>

      {/* 8. Thao tác: Nút Edit (hình cây bút như ảnh) và Xóa */}
      <td
        className="py-2.5 px-3 w-16 text-right whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Sửa chi tiết"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Xóa công việc"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
