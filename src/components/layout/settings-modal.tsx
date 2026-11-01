import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { SlidersHorizontal, RotateCcw, CheckCircle2, FileSpreadsheet, Search } from 'lucide-react';
import type { FeatureConfig } from '../../config/features';

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  features: FeatureConfig;
  onToggleFeature: (key: keyof FeatureConfig) => void;
  onResetFeatures: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onOpenChange,
  features,
  onToggleFeature,
  onResetFeatures,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Cài đặt hiển thị Module
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tùy chỉnh bật / tắt các mục trên thanh điều hướng Sidebar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2.5 py-3">
          {/* 1. Tra cứu xuất khuôn bảng (Luôn bật làm màn hình chính) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 opacity-90">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Tra cứu xuất khuôn bảng</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                    Mặc định
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Quản lý xuất xưởng, cây thư mục và tra cứu mã file
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 font-medium px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              Luôn bật
            </div>
          </div>

          {/* 2. Danh sách việc */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 hover:bg-secondary/60 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Danh sách việc (Kanban)
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Quản lý thẻ việc, kéo thả trạng thái và checklist
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleFeature('showKanban')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                features.showKanban ? 'bg-indigo-600' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  features.showKanban ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Task hoàn thành */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 hover:bg-secondary/60 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Task hoàn thành
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Kho lưu trữ các đầu việc đã hoàn tất
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleFeature('showCompleted')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                features.showCompleted ? 'bg-emerald-600' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  features.showCompleted ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Thêm hàng loạt */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 hover:bg-secondary/60 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Thêm hàng loạt (AI Scanner)
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Bóc tách mã file và đối chiếu xuất hàng loạt
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleFeature('showBulkScanner')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                features.showBulkScanner ? 'bg-amber-600' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  features.showBulkScanner ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground/80 px-1 pt-1 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Tự động lưu cấu hình trên trình duyệt máy bạn</span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFeatures}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục gốc</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 px-4 rounded-xl"
          >
            <span>Xong</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
