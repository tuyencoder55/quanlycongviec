import React, { useState } from 'react';
import { useKanban } from '../kanban/hooks/use-kanban';
import { useAuth } from '../../hooks/use-auth';
import { formatDate } from '../../lib/utils';
import type { KanbanTask } from '../kanban/types';
import { TaskDialog } from '../kanban/components/task-dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  CheckCircle2,
  Search,
  RotateCcw,
  Trash2,
  Calendar,
  Layers,
  Box,
  Hash,
  RefreshCw,
  AlertTriangle,
  Archive,
  Database,
  CheckSquare,
  Square,
} from 'lucide-react';

interface CompletedTasksScreenProps {
  externalSearch?: string;
  onNavigateToKanban?: () => void;
}

export const CompletedTasksScreen: React.FC<CompletedTasksScreenProps> = ({
  externalSearch = '',
  onNavigateToKanban,
}) => {
  const {
    columns,
    archivedTasks,
    isLoading,
    refetch,
    restoreTask,
    deleteTask,
    clearAllArchived,
  } = useKanban();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lọc theo từ khóa tìm kiếm
  const query = (externalSearch || searchTerm).trim().toLowerCase();
  const filteredTasks = archivedTasks.filter((t) => {
    if (!query) return true;
    return (
      t.title.toLowerCase().includes(query) ||
      (t.board_code && t.board_code.toLowerCase().includes(query)) ||
      (t.mold_code && t.mold_code.toLowerCase().includes(query)) ||
      (t.ref_value && t.ref_value.toLowerCase().includes(query))
    );
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Khôi phục 1 task quay về bảng Kanban
  const handleRestoreSingle = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await restoreTask(taskId);
  };

  // Xóa vĩnh viễn 1 task khỏi Database
  const handleDeleteSingle = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (window.confirm('Anh có chắc muốn xóa vĩnh viễn thẻ này khỏi Database Supabase không?')) {
      await deleteTask(taskId);
      setSelectedIds((prev) => prev.filter((i) => i !== taskId));
    }
  };

  // Xóa các task đã chọn hoặc toàn bộ kho khỏi Database Supabase
  const handleConfirmClear = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);
    try {
      const targets = selectedIds.length > 0 ? selectedIds : undefined;
      await clearAllArchived(targets);
      setSelectedIds([]);
      setIsClearAllDialogOpen(false);
    } catch (err) {
      console.error('Lỗi khi xóa sạch kho:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Thống kê nhanh
  const totalTasks = archivedTasks.length;
  const boardCount = new Set(archivedTasks.map((t) => t.board_code).filter(Boolean)).size;
  const poCount = archivedTasks.filter((t) => t.ref_value).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Banner tiêu đề module */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-card to-card p-5 shadow-sm backdrop-blur-sm shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" className="gap-1 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Kho Task Hoàn Thành
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {totalTasks} công việc đã lưu
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Kho Lưu Trữ Công Việc Hoàn Thành
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Toàn bộ các thẻ việc sau khi hoàn tất sẽ được tập trung tại đây để bảng Kanban luôn gọn gàng.
              Khi anh bấm <strong>Xóa khỏi Database</strong>, dữ liệu sẽ được xóa thẳng ở Supabase để giải phóng bộ nhớ.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToKanban && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToKanban}
                className="text-xs gap-1.5"
              >
                <span>← Quay lại Bảng việc</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng thẻ hoàn thành
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Archive className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{totalTasks}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Lưu trữ an toàn</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Mã bảng khác nhau
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{boardCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Bảng đã xử lý xong</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Đơn hàng có số PO
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{poCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Khớp lệnh thành công</p>
          </CardContent>
        </Card>
      </div>

      {/* Thanh công cụ tìm kiếm & Thao tác xóa hàng loạt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã bảng, khuôn, PO trong kho hoàn thành..."
              className="w-full h-8 bg-background/60 border border-input rounded-xl pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {filteredTasks.length > 0 && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
              title="Chọn tất cả để xóa"
            >
              {selectedIds.length === filteredTasks.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {selectedIds.length > 0 ? `Đã chọn (${selectedIds.length})` : 'Chọn tất cả'}
              </span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          {isAdmin && totalTasks > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearAllDialogOpen(true)}
              className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {selectedIds.length > 0
                  ? `Xóa ${selectedIds.length} thẻ đã chọn`
                  : 'Xóa sạch kho (Dọn Supabase)'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Danh sách thẻ hoàn thành */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isSelected = selectedIds.includes(task.id);
            return (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setIsDetailOpen(true);
                }}
                className={`group p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-sm ${
                  isSelected
                    ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border/60 bg-card/60 hover:bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(task.id);
                      }}
                      className="mt-0.5 sm:mt-0 text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <h4 className="font-mono text-xs font-semibold text-foreground truncate">
                        {task.title}
                      </h4>
                    </div>

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
                        Xong: {formatDate(task.updated_at || task.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút hành động cho từng thẻ */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleRestoreSingle(e, task.id)}
                      className="h-7 text-xs gap-1.5 text-foreground hover:border-primary/50"
                      title="Đưa thẻ này quay lại bảng việc Kanban"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Khôi phục</span>
                    </Button>
                  )}

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteSingle(e, task.id)}
                      className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Xóa vĩnh viễn thẻ này khỏi Database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <Card className="border-dashed border-2 border-border/70 bg-card/30 p-12 text-center rounded-2xl">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-foreground">
                {searchTerm.trim()
                  ? 'Không tìm thấy thẻ nào khớp từ khóa'
                  : 'Chưa có task nào trong kho hoàn thành'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchTerm.trim()
                  ? 'Anh thử kiểm tra lại mã bảng, khuôn hoặc số PO xem đã đúng chưa nhé.'
                  : 'Khi các công việc trên bảng Kanban hoàn thành (hoặc kéo vào cột Xong quá 7 ngày), chúng sẽ tự động được cất vào kho này.'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog chi tiết task khi click vào */}
      {selectedTask && (
        <TaskDialog
          isOpen={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          columns={columns}
          initialTask={selectedTask}
          onSave={async () => {}}
          onDelete={async (id) => {
            await deleteTask(id);
            setIsDetailOpen(false);
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* Dialog xác nhận xóa sạch kho khỏi Supabase */}
      <Dialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base">
              {selectedIds.length > 0
                ? `Xác nhận xóa vĩnh viễn ${selectedIds.length} task đã chọn?`
                : 'Xác nhận xóa sạch toàn bộ kho Task Hoàn Thành?'}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              Hành động này sẽ <strong>XÓA THẲNG và VĨNH VIỄN</strong> dữ liệu khỏi cơ sở dữ liệu Supabase để giải phóng bộ nhớ. 
              Các thẻ này sẽ không thể khôi phục lại được.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-xs text-destructive flex items-center gap-2">
            <Database className="w-4 h-4 shrink-0" />
            <span>Dung lượng trên Supabase sẽ được giải phóng ngay sau khi xóa.</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearAllDialogOpen(false)}
              disabled={isDeleting}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmClear}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Đang xóa...' : 'Đồng ý xóa vĩnh viễn'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
