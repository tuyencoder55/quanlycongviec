import React from 'react';
import type { KanbanTask, KanbanColumn } from '../types';
import { TaskListRow } from './task-list-row';
import { Plus, CheckCircle2 } from 'lucide-react';

interface TaskListViewProps {
  tasks: KanbanTask[];
  columns: KanbanColumn[];
  isAdmin: boolean;
  onToggleComplete: (task: KanbanTask) => Promise<void>;
  onChangeColumn: (task: KanbanTask, columnId: string) => Promise<void>;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  columns,
  isAdmin,
  onToggleComplete,
  onChangeColumn,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div className="w-full flex flex-col h-full overflow-hidden rounded-xl border border-border/50 bg-card/30">
      {/* Vùng cuộn bảng dữ liệu danh sách */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header Bảng danh sách */}
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-md border-b border-border/60 text-muted-foreground font-mono select-none">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center border-r border-border/40 font-mono font-medium">
                #
              </th>
              <th className="py-2.5 px-3 min-w-[240px] font-medium border-r border-border/40">
                Tên công việc / Tên file
              </th>
              <th className="py-2.5 px-3 min-w-[160px] font-medium border-r border-border/40">
                Mã Bảng & Khuôn
              </th>
              <th className="py-2.5 px-3 min-w-[130px] font-medium border-r border-border/40">
                Số PO / Tham chiếu
              </th>
              <th className="py-2.5 px-3 min-w-[120px] font-medium border-r border-border/40">
                Hạn chót
              </th>
              <th className="py-2.5 px-3 min-w-[90px] font-medium border-r border-border/40">
                Ưu tiên
              </th>
              <th className="py-2.5 px-3 min-w-[140px] font-medium">
                Trạng thái
              </th>
            </tr>
          </thead>

          {/* Dữ liệu các dòng công việc */}
          <tbody className="divide-y divide-border/30">
            {tasks.map((task, index) => (
              <TaskListRow
                key={task.id}
                index={index}
                task={task}
                columns={columns}
                isAdmin={isAdmin}
                onToggleComplete={onToggleComplete}
                onChangeColumn={onChangeColumn}
                onEdit={onEditTask}
              />
            ))}
          </tbody>
        </table>

        {/* Trạng thái trống nếu không có việc nào */}
        {tasks.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground">Không có công việc nào trong danh sách</p>
            <p className="text-[11px] text-muted-foreground">
              Tất cả các việc đã hoàn thành hoặc không có việc nào khớp với bộ lọc.
            </p>
            {isAdmin && (
              <button
                onClick={onAddTask}
                className="mt-2 text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm việc mới ngay</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer bảng danh sách: Thêm nhanh & Thống kê tiến độ */}
      <div className="py-2 px-3 border-t border-border/40 bg-secondary/30 flex items-center justify-between text-xs shrink-0 select-none">
        {isAdmin ? (
          <button
            onClick={onAddTask}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium py-1 px-2 rounded-md hover:bg-accent/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Thêm công việc mới...</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span>Tổng: <strong className="text-foreground">{tasks.length}</strong></span>
          <span>•</span>
          <span>Đã xong: <strong className="text-emerald-400">{completedCount}</strong></span>
          <span>•</span>
          <span>Còn lại: <strong className="text-amber-400">{tasks.length - completedCount}</strong></span>
        </div>
      </div>
    </div>
  );
};
