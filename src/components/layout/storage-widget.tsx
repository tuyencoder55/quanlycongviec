import React, { useState } from 'react';
import { useStorageStats } from '../../hooks/use-storage-stats';
import { Database, HardDrive, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface StorageWidgetProps {
  compact?: boolean;
}

export const StorageWidget: React.FC<StorageWidgetProps> = ({ compact = false }) => {
  const { stats, isLoading, refetch } = useStorageStats();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const percent = Math.min(Math.max(stats.usage_percentage, 0.5), 100);

  // Chọn màu theo mức độ dung lượng
  const colorConfig =
    percent > 80
      ? { bar: 'bg-rose-500', text: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
      : percent > 50
      ? { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
      : { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className="group p-2.5 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/70 hover:border-primary/40 transition-all cursor-pointer space-y-2 select-none"
        title="Nhấp để xem chi tiết bộ nhớ Supabase"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors font-medium">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px]">Bộ nhớ Supabase</span>
          </div>
          <span className={`font-mono text-[11px] font-semibold ${colorConfig.text}`}>
            {stats.usage_percentage}%
          </span>
        </div>

        {/* Thanh Progress Bar */}
        <div className="w-full h-1.5 bg-background/80 rounded-full overflow-hidden border border-border/40">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorConfig.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>{stats.db_size_pretty}</span>
          <span>{stats.limit_pretty}</span>
        </div>
      </div>

      {/* Dialog chi tiết dung lượng */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
              <HardDrive className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base flex items-center gap-2">
              <span>Chi Tiết Dung Lượng Supabase</span>
              <Badge variant="indigo" className="font-mono text-[10px]">
                PostgreSQL
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thông số dung lượng thực tế được truy vấn trực tiếp từ cơ sở dữ liệu Supabase của anh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Box tiến trình */}
            <div className="bg-secondary/60 p-3.5 rounded-xl border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between font-mono">
                <span className="text-muted-foreground font-sans">Đã sử dụng:</span>
                <span className="font-bold text-foreground">
                  {stats.db_size_pretty} / {stats.limit_pretty} ({stats.usage_percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border/40">
                <div
                  className={`h-full rounded-full transition-all ${colorConfig.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Gói miễn phí: 500 MB (tha hồ lưu trữ hàng chục ngàn task sản xuất).</span>
              </div>
            </div>

            {/* Chi tiết dữ liệu bảng */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <div className="text-muted-foreground text-[10px] font-sans">Tổng thẻ công việc</div>
                <div className="text-base font-bold text-foreground mt-0.5">{stats.tasks_count}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/60">
                <div className="text-muted-foreground text-[10px] font-sans">Thẻ đã hoàn thành</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{stats.completed_count}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs text-muted-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Đo lại dung lượng</span>
            </Button>

            <div className="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg bg-card"
              >
                <span>Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <Button size="sm" onClick={() => setIsDetailOpen(false)} className="text-xs">
                Đóng
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
