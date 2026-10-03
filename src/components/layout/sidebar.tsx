import React from 'react';
import {
  LayoutDashboard,
  Search,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Eye,
  Sun,
  Moon,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useTheme } from '../theme-provider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { StorageWidget } from './storage-widget';

export type ActiveTab = 'kanban' | 'completed' | 'search' | 'bulk';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewTaskClick: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onNewTaskClick,
}) => {
  const { role, switchDemoRole, isConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 h-screen border-r border-border/60 bg-card/60 backdrop-blur-xl flex flex-col justify-between p-3 select-none shrink-0 transition-all">
      {/* Header thương hiệu */}
      <div>
        <div className="px-3 py-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-[0_0_16px_-4px_rgba(99,102,241,0.3)]">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground tracking-tight leading-tight flex items-center gap-1.5">
                Nexus Prod
              </div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Production Core
              </div>
            </div>
          </div>
        </div>

        {/* Nút tạo thẻ việc mới */}
        <div className="px-1 mb-5">
          <Button
            onClick={onNewTaskClick}
            variant="gradient"
            className="w-full gap-2 font-medium shadow-md h-10 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Thẻ việc mới</span>
          </Button>
        </div>

        {/* Menu điều hướng chính */}
        <nav className="space-y-1 px-1">
          <button
            onClick={() => onTabChange('kanban')}
            className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all text-sm font-medium ${
              activeTab === 'kanban'
                ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="flex-1">Bảng việc (Kanban)</span>
          </button>

          <button
            onClick={() => onTabChange('completed')}
            className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all text-sm font-medium ${
              activeTab === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="flex-1">Task hoàn thành</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all text-sm font-medium ${
              activeTab === 'search'
                ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1">Tra cứu xuất xưởng</span>
          </button>

          <button
            onClick={() => onTabChange('bulk')}
            className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-all text-sm font-medium ${
              activeTab === 'bulk'
                ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="flex-1">Thêm hàng loạt</span>
          </button>
        </nav>
      </div>

      {/* Footer Sidebar: User Profile & Role & Theme */}
      <div className="pt-3 border-t border-border/60 space-y-2.5">
        {/* Widget hiển thị dung lượng Supabase */}
        <StorageWidget />

        {/* Nút chuyển nhanh chế độ xem Admin / Viewer (rất tiện để designer test phân quyền) */}
        <div className="bg-secondary/70 p-2 rounded-xl border border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 px-1 font-mono">
            <span>Vai trò đang test:</span>
            {!isConfigured && <span className="text-[10px] text-amber-400">(Demo Mode)</span>}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => switchDemoRole('admin')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                role === 'admin'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              onClick={() => switchDemoRole('viewer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                role === 'viewer'
                  ? 'bg-secondary-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Viewer
            </button>
          </div>
        </div>

        {/* Thông tin người dùng & Đổi theme */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-accent/40 border border-border/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              TN
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                Trần Nam
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={role === 'admin' ? 'indigo' : 'outline'}
                  className="text-[10px] px-1.5 py-0 uppercase font-mono tracking-wider h-4"
                >
                  {role}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};
