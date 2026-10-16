import React, { useState, useRef, useEffect } from 'react';
import type { KanbanTask, KanbanColumn } from '../types';
import { TaskListRow } from './task-list-row';
import { Button } from '../../../components/ui/button';
import {
  Plus,
  CheckCircle2,
  CheckCheck,
  RotateCcw,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface TaskListViewProps {
  tasks: KanbanTask[];
  columns: KanbanColumn[];
  isAdmin: boolean;
  onToggleComplete: (task: KanbanTask) => Promise<void>;
  onChangeColumn: (task: KanbanTask, columnId: string) => Promise<void>;
  onEditTask: (task: KanbanTask) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask: () => void;
  onBatchComplete?: (taskIds: string[], done: boolean) => Promise<void>;
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
  onBatchComplete,
}) => {
  const completedCount = tasks.filter((t) => t.done).length;

  // Quản lý danh sách ID các công việc được chọn
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Kiểm tra trạng thái Chọn tất cả
  const isAllSelected = tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // Cập nhật trạng thái indeterminate cho ô checkbox trên Header
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  // Dọn dẹp các ID được chọn nếu danh sách tasks bị lọc hoặc thay đổi
  useEffect(() => {
    setSelectedIds((prev) => {
      const validTaskIds = new Set(tasks.map((t) => t.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validTaskIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [tasks]);

  // Xử lý bật/tắt Chọn tất cả
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)));
    }
  };

  // Xử lý chọn/bỏ chọn 1 dòng
  const handleToggleSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Xử lý hoàn thành hàng loạt
  const handleExecuteBatch = async (done: boolean) => {
    if (!onBatchComplete || selectedIds.size === 0) return;
    setIsBatchLoading(true);
    try {
      await onBatchComplete(Array.from(selectedIds), done);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Lỗi khi cập nhật hoàn thành hàng loạt:', err);
    } finally {
      setIsBatchLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full overflow-hidden rounded-xl border border-border/50 bg-card/30 relative">
      {/* Vùng cuộn bảng dữ liệu danh sách */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header Bảng danh sách */}
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-md border-b border-border/60 text-muted-foreground font-mono select-none">
            <tr>
              {/* Checkbox Chọn tất cả */}
              <th className="py-2.5 px-2 w-9 text-center border-r border-border/40">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-border/70 text-primary accent-primary cursor-pointer transition-transform hover:scale-110"
                  title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả công việc'}
                  aria-label="Chọn tất cả công việc"
                />
              </th>
              <th className="py-2.5 px-2 w-10 text-center border-r border-border/40 font-mono font-medium">
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
                isSelected={selectedIds.has(task.id)}
                onToggleSelect={() => handleToggleSelect(task.id)}
                onToggleComplete={onToggleComplete}
                onChangeColumn={onChangeColumn}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
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

      {/* THANH TÁC VỤ HÀNG LOẠT NỔI (BULK ACTION FLOATING BAR) */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-popover/95 border border-primary/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 text-xs select-none">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-foreground pr-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>
              Đã chọn <strong className="text-primary font-bold text-xs">{selectedIds.size}</strong> việc
            </span>
          </div>

          <div className="h-4 w-px bg-border/60" />

          {/* Nút bấm đánh dấu Hoàn thành hàng loạt */}
          {isAdmin && onBatchComplete && (
            <Button
              size="sm"
              disabled={isBatchLoading}
              onClick={() => handleExecuteBatch(true)}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-xs text-xs"
            >
              {isBatchLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span>Hoàn thành ({selectedIds.size})</span>
            </Button>
          )}

          {/* Nút đánh dấu Chưa xong hàng loạt */}
          {isAdmin && onBatchComplete && (
            <Button
              variant="outline"
              size="sm"
              disabled={isBatchLoading}
              onClick={() => handleExecuteBatch(false)}
              className="h-7 px-2.5 border-border/70 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
              title="Đánh dấu các việc này là Chưa xong"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Chưa xong</span>
            </Button>
          )}

          {/* Nút bỏ chọn */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="h-7 px-2 text-muted-foreground hover:text-foreground text-xs"
            title="Bỏ chọn tất cả"
          >
            <X className="w-3.5 h-3.5 mr-0.5" />
            <span>Bỏ chọn</span>
          </Button>
        </div>
      )}

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
