import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import type { KanbanColumn, KanbanTask, TaskFormData } from '../types';
import type { PriorityLevel } from '../../../types/database';
import { parseTaskTitle } from '../utils/parser';
import { Trash2, Sparkles, Layers, Box, Hash } from 'lucide-react';

interface TaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
  initialTask?: KanbanTask | null;
  defaultColumnId?: string;
  onSave: (formData: TaskFormData, taskId?: string) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  isAdmin: boolean;
}

const AVAILABLE_LABELS = ['Ưu tiên', 'Gấp', 'Chờ', 'Cần kiểm tra', 'Đã duyệt'];

export const TaskDialog: React.FC<TaskDialogProps> = ({
  isOpen,
  onOpenChange,
  columns,
  initialTask,
  defaultColumnId,
  onSave,
  onDelete,
  isAdmin,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setColumnId(initialTask.column_id);
      setPriority(initialTask.priority);
      setDueDate(initialTask.due_date || '');
      setSelectedLabels(initialTask.labels || []);
    } else {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setPriority('medium');
      setDueDate('');
      setSelectedLabels([]);
    }
  }, [initialTask, defaultColumnId, columns, isOpen]);

  // Phân tích tự động mã trực tiếp khi người dùng gõ tiêu đề
  const parsed = parseTaskTitle(title);

  const toggleLabel = (label: string) => {
    if (!isAdmin) return;
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isAdmin) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          column_id: columnId || columns[0]?.id,
          priority,
          due_date: dueDate || undefined,
          labels: selectedLabels,
          board_code: parsed.board_code,
          mold_code: parsed.mold_code,
          ref_kind: parsed.ref_kind,
          ref_value: parsed.ref_value,
        },
        initialTask?.id
      );
      onOpenChange(false);
    } catch (err) {
      console.error('Lỗi khi lưu thẻ việc:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialTask || !onDelete || !isAdmin) return;
    if (window.confirm('Anh có chắc muốn xóa thẻ việc này không?')) {
      setIsSubmitting(true);
      try {
        await onDelete(initialTask.id);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialTask ? 'Chi tiết Thẻ Công Việc' : 'Thêm Thẻ Công Việc Mới'}
            </DialogTitle>
            <DialogDescription>
              {isAdmin
                ? 'Nhập tên file định dạng: [Mã bảng] [Mã khuôn] ... [PO / Ngày]. Hệ thống sẽ tự động tách mã.'
                : 'Bạn đang xem ở chế độ chỉ đọc (Viewer).'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Tiêu đề (Tên file) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Tiêu đề công việc (Tên file) <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: 13502-W1 VY-1078 H-3711 PO 22144368"
                className="font-mono text-xs"
                disabled={!isAdmin}
                required
              />
            </div>

            {/* Khung hiển thị kết quả phân tích mã tự động (Live preview) */}
            {title.trim().length > 0 && (
              <div className="bg-secondary/60 p-3 rounded-xl border border-border/50 text-xs space-y-1.5 font-mono">
                <div className="text-muted-foreground font-sans font-medium text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Trích xuất tự động:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Badge variant="indigo" className="gap-1 font-mono text-[11px]">
                    <Layers className="w-3 h-3" />
                    Mã bảng: {parsed.board_code || 'Chưa nhận diện'}
                  </Badge>
                  <Badge variant="emerald" className="gap-1 font-mono text-[11px]">
                    <Box className="w-3 h-3" />
                    Mã khuôn: {parsed.mold_code || 'Không có'}
                  </Badge>
                  {parsed.ref_value && (
                    <Badge variant="amber" className="gap-1 font-mono text-[11px]">
                      <Hash className="w-3 h-3" />
                      {parsed.ref_kind === 'po' ? `PO: ${parsed.ref_value}` : `Ngày: ${parsed.ref_value}`}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Cột và Mức độ ưu tiên */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Cột công việc</label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  disabled={!isAdmin}
                  className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Vừa (Mặc định)</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>
            </div>

            {/* Hạn chót */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Hạn hoàn thành</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!isAdmin}
                className="text-xs font-mono"
              />
            </div>

            {/* Nhãn gắn thẻ */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Nhãn đánh dấu</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_LABELS.map((lbl) => {
                  const isSelected = selectedLabels.includes(lbl);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => toggleLabel(lbl)}
                      disabled={!isAdmin}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ghi chú mô tả */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Mô tả thêm</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm về đơn hàng hoặc khuôn..."
                rows={3}
                disabled={!isAdmin}
                className="w-full rounded-xl border border-input bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            {initialTask && isAdmin ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-destructive hover:bg-destructive/10 text-xs gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa thẻ</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Đóng
              </Button>
              {isAdmin && (
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSubmitting || !title.trim()}
                  className="text-xs"
                >
                  {isSubmitting ? 'Đang lưu...' : initialTask ? 'Cập nhật' : 'Tạo thẻ việc'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
