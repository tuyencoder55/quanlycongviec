import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Folder, FolderInput, Calendar, Plus, Check } from 'lucide-react';

interface MoveFilesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  currentDate: string;
  currentSubfolder?: string;
  availableSubfolders: string[];
  onConfirmMove: (targetDate: string, targetSubfolder: string | null) => Promise<void>;
}

export const MoveFilesModal: React.FC<MoveFilesModalProps> = ({
  isOpen,
  onOpenChange,
  selectedCount,
  currentDate,
  currentSubfolder,
  availableSubfolders,
  onConfirmMove,
}) => {
  const [targetDate, setTargetDate] = useState<string>(currentDate);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>(currentSubfolder || '');
  const [isCustomFolder, setIsCustomFolder] = useState<boolean>(false);
  const [customFolderName, setCustomFolderName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Đồng bộ lại khi mở modal
  useEffect(() => {
    if (isOpen) {
      setTargetDate(currentDate);
      setSelectedSubfolder(currentSubfolder || '');
      setIsCustomFolder(false);
      setCustomFolderName('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentDate, currentSubfolder]);

  // Danh sách các folder đề xuất (loại bỏ trùng lặp và rỗng)
  const allSubfolders = Array.from(
    new Set(availableSubfolders.map((f) => f.trim()).filter(Boolean))
  );

  const handleConfirm = async () => {
    let finalSubfolder: string | null = null;
    if (isCustomFolder) {
      const trimmed = customFolderName.trim();
      finalSubfolder = trimmed ? trimmed : null;
    } else {
      finalSubfolder = selectedSubfolder.trim() ? selectedSubfolder.trim() : null;
    }

    setIsSubmitting(true);
    try {
      await onConfirmMove(targetDate, finalSubfolder);
      onOpenChange(false);
    } catch (err) {
      console.error('Lỗi khi di chuyển file:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 border-border/80 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Di Chuyển {selectedCount} File Đã Chọn
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Chọn thư mục và ngày lưu trữ mới cho các file đã chọn.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* 1. Chọn Ngày xuất đích */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Ngày lưu trữ (Mặc định ngày hiện tại)</span>
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-9 font-mono bg-background text-xs"
            />
          </div>

          {/* 2. Chọn Thư mục đích */}
          <div className="space-y-2">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Thư mục con đích đến</span>
            </label>

            {/* Tùy chọn Thư mục gốc ngày (không nằm trong thư mục con) */}
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubfolder('');
                  setIsCustomFolder(false);
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  !isCustomFolder && selectedSubfolder === ''
                    ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/40'
                    : 'border-border/60 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span>📁 Thư mục gốc ngày (không nằm trong thư mục con)</span>
                </div>
                {!isCustomFolder && selectedSubfolder === '' && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>

              {/* Các thư mục con hiện có */}
              {allSubfolders.map((folderName) => (
                <button
                  key={folderName}
                  type="button"
                  onClick={() => {
                    setSelectedSubfolder(folderName);
                    setIsCustomFolder(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                    !isCustomFolder && selectedSubfolder.toLowerCase() === folderName.toLowerCase()
                      ? 'border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/40'
                      : 'border-border/60 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate font-mono">{folderName}</span>
                    {currentSubfolder?.toLowerCase() === folderName.toLowerCase() && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-secondary text-muted-foreground rounded">
                        hiện tại
                      </span>
                    )}
                  </div>
                  {!isCustomFolder && selectedSubfolder.toLowerCase() === folderName.toLowerCase() && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}

              {/* Tùy chọn Tạo thư mục con mới */}
              <button
                type="button"
                onClick={() => setIsCustomFolder(true)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  isCustomFolder
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium ring-1 ring-amber-500/40'
                    : 'border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>+ Tạo hoặc chuyển vào thư mục con mới...</span>
                </div>
                {isCustomFolder && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            </div>

            {/* Ô nhập tên thư mục mới khi chọn Custom */}
            {isCustomFolder && (
              <div className="pt-1 animate-in fade-in slide-in-from-top-1">
                <Input
                  type="text"
                  placeholder="Nhập tên thư mục mới (ví dụ: bestway, ca 1, tem...)"
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  autoFocus
                  className="h-9 text-xs bg-background border-amber-500/50 focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting || (isCustomFolder && !customFolderName.trim())}
            className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Đang di chuyển...'
                : `Di chuyển ${selectedCount} file`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

