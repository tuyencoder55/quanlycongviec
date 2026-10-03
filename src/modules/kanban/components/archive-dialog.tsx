import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { KanbanTask } from '../types';
import { formatDate } from '../../../lib/utils';
import {
  Archive,
  Search,
  RotateCcw,
  Calendar,
  Layers,
  Box,
  Hash,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface ArchiveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  archivedTasks: KanbanTask[];
  onRestore: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onSelectTask: (task: KanbanTask) => void;
  isAdmin: boolean;
}

export const ArchiveDialog: React.FC<ArchiveDialogProps> = ({
  isOpen,
  onOpenChange,
  archivedTasks,
  onRestore,
  onDelete,
  onSelectTask,
  isAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filtered = archivedTasks.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.board_code && t.board_code.toLowerCase().includes(q)) ||
      (t.mold_code && t.mold_code.toLowerCase().includes(q)) ||
      (t.ref_value && t.ref_value.toLowerCase().includes(q))
    );
  });

  const handleRestore = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setIsProcessing(taskId);
    try {
      await onRestore(taskId);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!onDelete || !isAdmin) return;
    if (window.confirm('Anh có chắc muốn xóa vĩnh viễn thẻ này không?')) {
      setIsProcessing(taskId);
      try {
        await onDelete(taskId);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Archive className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold">
                  Kho Lưu Trữ Công Việc Hoàn Thành
                </DialogTitle>
                <Badge variant="indigo" className="font-mono text-[11px]">
                  {archivedTasks.length} thẻ
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Các công việc sau khi hoàn tất quá <strong>7 ngày</strong> sẽ tự động được cất vào kho này để bảng Kanban luôn gọn gàng.
              Thông tin xuất xưởng vẫn được bảo lưu 100% để tra cứu.
            </DialogDescription>
          </DialogHeader>

          {/* Thanh tìm kiếm trong kho */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã bảng, mã khuôn, số PO trong kho lưu trữ..."
              className="w-full h-9 bg-secondary/50 border border-input rounded-xl pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Danh sách các task đã lưu trữ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {filtered.length > 0 ? (
            filtered.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  onSelectTask(task);
                  onOpenChange(false);
                }}
                className="group p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <h5 className="font-mono text-xs font-semibold text-foreground truncate">
                      {task.title}
                    </h5>
                  </div>

                  {/* Badges mã */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    {task.board_code && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        <Layers className="w-3 h-3" />
                        {task.board_code}
                      </span>
                    )}
                    {task.mold_code && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Box className="w-3 h-3" />
                        {task.mold_code}
                      </span>
                    )}
                    {task.ref_value && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Hash className="w-3 h-3" />
                        PO: {task.ref_value}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-muted-foreground ml-1">
                      <Calendar className="w-3 h-3" />
                      Lưu trữ: {formatDate(task.updated_at || task.created_at)}
                    </span>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleRestore(e, task.id)}
                      disabled={isProcessing === task.id}
                      className="h-7 text-xs gap-1.5 text-foreground hover:border-primary/50"
                      title="Đưa thẻ quay lại bảng Kanban"
                    >
                      <RotateCcw className={`w-3 h-3 ${isProcessing === task.id ? 'animate-spin' : ''}`} />
                      <span>Khôi phục</span>
                    </Button>
                  )}

                  {isAdmin && onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, task.id)}
                      disabled={isProcessing === task.id}
                      className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-2">
              <Archive className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                {searchTerm.trim()
                  ? 'Không tìm thấy thẻ nào khớp với từ khóa tìm kiếm.'
                  : 'Kho lưu trữ đang trống. Các thẻ hoàn tất quá 7 ngày sẽ tự động xuất hiện tại đây.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-border/60 bg-card/40 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
