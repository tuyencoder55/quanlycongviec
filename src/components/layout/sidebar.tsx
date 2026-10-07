import React from 'react';
import {
  LayoutDashboard,
  Search,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Box,
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
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

  return (
    <aside className="w-60 h-screen border-r border-border/50 bg-card/40 backdrop-blur-xl flex flex-col justify-between p-3 select-none shrink-0 transition-all">
      {/* Cụm Header thương hiệu & Tạo nhanh */}
      <div>
        <div className="px-2 py-2.5 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Box className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground tracking-tight leading-tight flex items-center gap-1.5">
                Nexus Prod
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Cá nhân • Workspace
              </div>
            </div>
          </div>
        </div>

        {/* Nút tạo thẻ việc mới */}
        <div className="mb-4">
          <Button
            onClick={onNewTaskClick}
            className="w-full gap-2 font-medium h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thẻ việc mới</span>
            <kbd className="ml-auto text-[10px] font-mono opacity-60">N</kbd>
          </Button>
        </div>

        {/* Menu điều hướng chính phong cách Linear */}
        <nav className="space-y-1">
          <button
            onClick={() => onTabChange('kanban')}
            className={`w-full text-left rounded-lg px-2.5 py-2 flex items-center gap-2.5 transition-all text-xs font-medium ${
              activeTab === 'kanban'
                ? 'bg-accent text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span className="flex-1">Danh sách việc</span>
          </button>

          <button
            onClick={() => onTabChange('completed')}
            className={`w-full text-left rounded-lg px-2.5 py-2 flex items-center gap-2.5 transition-all text-xs font-medium ${
              activeTab === 'completed'
                ? 'bg-accent text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="flex-1">Task hoàn thành</span>
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`w-full text-left rounded-lg px-2.5 py-2 flex items-center gap-2.5 transition-all text-xs font-medium ${
              activeTab === 'search'
                ? 'bg-accent text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="flex-1">Tra cứu xuất khuôn bảng</span>
          </button>

          <button
            onClick={() => onTabChange('bulk')}
            className={`w-full text-left rounded-lg px-2.5 py-2 flex items-center gap-2.5 transition-all text-xs font-medium ${
              activeTab === 'bulk'
                ? 'bg-accent text-foreground font-semibold shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span className="flex-1">Thêm hàng loạt</span>
          </button>
        </nav>
      </div>

      {/* Footer Sidebar: Dung lượng + Chuyển role test + Thông tin cá nhân */}
      <div className="pt-2 border-t border-border/40 space-y-2">
        {/* Widget dung lượng */}
        <StorageWidget />

        {/* Nút chuyển đổi Admin / Viewer để designer test phân quyền */}
        <div className="bg-secondary/50 p-1.5 rounded-lg border border-border/40">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 px-1 font-mono">
            <span>Vai trò đang test:</span>
            {!isConfigured && <span className="text-amber-400">(Demo)</span>}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => switchDemoRole('admin')}
              className={`flex items-center justify-center gap-1 py-1 px-2 rounded text-[11px] font-medium transition-all ${
                role === 'admin'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              Admin
            </button>
            <button
              onClick={() => switchDemoRole('viewer')}
              className={`flex items-center justify-center gap-1 py-1 px-2 rounded text-[11px] font-medium transition-all ${
                role === 'viewer'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Eye className="w-3 h-3" />
              Viewer
            </button>
          </div>
        </div>

        {/* Thẻ người dùng cá nhân */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-card/60 border border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[10px] shrink-0 font-mono">
              DS
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                Designer
              </div>
            </div>
          </div>
          <Badge
            variant={role === 'admin' ? 'indigo' : 'outline'}
            className="text-[9px] px-1.5 py-0 uppercase font-mono tracking-wider h-4"
          >
            {role}
          </Badge>
        </div>
      </div>
    </aside>
  );
};
