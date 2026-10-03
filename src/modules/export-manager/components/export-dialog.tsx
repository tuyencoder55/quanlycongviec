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
import type { ExportItem, ExportFormData } from '../types';
import type { ExportType } from '../../../types/database';
import { parseTaskTitle } from '../../kanban/utils/parser';
import { Sparkles, Layers, Box, Hash } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: ExportItem | null;
  onSave: (formData: ExportFormData, id?: string) => Promise<void>;
  isAdmin: boolean;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onOpenChange,
  initialItem,
  onSave,
  isAdmin,
}) => {
  const [type, setType] = useState<ExportType>('board');
  const [fullName, setFullName] = useState('');
  const [boardCode, setBoardCode] = useState('');
  const [moldCode, setMoldCode] = useState('');
  const [refValue, setRefValue] = useState('');
  const [exportedAt, setExportedAt] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setFullName(initialItem.full_name);
      setBoardCode(initialItem.board_code);
      setMoldCode(initialItem.mold_code || '');
      setRefValue(initialItem.ref_value || '');
      setExportedAt(initialItem.exported_at || new Date().toISOString().split('T')[0]);
      setNote(initialItem.note || '');
    } else {
      setType('board');
      setFullName('');
      setBoardCode('');
      setMoldCode('');
      setRefValue('');
      setExportedAt(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [initialItem, isOpen]);

  // Phân tích tự động khi gõ tên file
  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!initialItem) {
      const parsed = parseTaskTitle(val);
      if (parsed.board_code) setBoardCode(parsed.board_code);
      if (parsed.mold_code) setMoldCode(parsed.mold_code);
      if (parsed.ref_value) setRefValue(parsed.ref_value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardCode.trim() || !isAdmin) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          type,
          board_code: boardCode.trim(),
          mold_code: moldCode.trim() || undefined,
          ref_kind: refValue.trim() ? 'po' : undefined,
          ref_value: refValue.trim() || undefined,
          full_name: fullName.trim() || boardCode.trim(),
          exported_at: exportedAt,
          note: note.trim() || undefined,
        },
        initialItem?.id
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialItem ? 'Chỉnh Sửa Dòng Xuất Xưởng' : 'Ghi Nhận Xuất Xưởng Mới'}
            </DialogTitle>
            <DialogDescription>
              Lưu trữ thông tin xuất xưởng vào cơ sở dữ liệu. Nhập tên file để hệ thống tự động bóc tách mã.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Loại xuất */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Loại xuất xưởng</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'board', label: 'Xuất Bảng', desc: 'Mỗi bảng 1 lần' },
                  { id: 'mold', label: 'Xuất Khuôn', desc: 'Mỗi khuôn 1 lần' },
                  { id: 'po', label: 'Xuất PO', desc: 'Theo từng đợt PO' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as ExportType)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      type === item.id
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40'
                        : 'border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tên file gốc */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Tên file gốc (Tự động tách mã)
              </label>
              <Input
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: 13502-W1 VY-1078 H-3711 PO 22144368"
                className="font-mono text-xs"
              />
            </div>

            {/* Các trường mã cụ thể */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  Mã Bảng <span className="text-destructive">*</span>
                </label>
                <Input
                  value={boardCode}
                  onChange={(e) => setBoardCode(e.target.value)}
                  placeholder="13502-W1"
                  required
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Mã Khuôn</label>
                <Input
                  value={moldCode}
                  onChange={(e) => setMoldCode(e.target.value)}
                  placeholder="VY-1078"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Số PO</label>
                <Input
                  value={refValue}
                  onChange={(e) => setRefValue(e.target.value)}
                  placeholder="22144368"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Ngày xuất */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Ngày xuất xưởng</label>
              <Input
                type="date"
                value={exportedAt}
                onChange={(e) => setExportedAt(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Ghi chú thêm</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Xuất cho xưởng 2, kiểm tra khớp lệnh..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting || !boardCode.trim()}
              className="text-xs"
            >
              {isSubmitting ? 'Đang lưu...' : initialItem ? 'Cập nhật' : 'Ghi nhận xuất'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
