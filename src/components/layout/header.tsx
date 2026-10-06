import React from 'react';
import { Search, Plus, Menu, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useTheme } from '../theme-provider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { ActiveTab } from './sidebar';

interface HeaderProps {
  activeTab?: ActiveTab;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewTaskClick: () => void;
  onMobileMenuToggle?: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  kanban: { title: 'Danh sách việc', subtitle: 'Danh sách có checkbox hoàn thành' },
  completed: { title: 'Đã hoàn thành', subtitle: 'Lịch sử & kho lưu trữ' },
  search: { title: 'Tra cứu xuất xưởng', subtitle: 'Danh mục Bảng, Khuôn & PO' },
  bulk: { title: 'Thêm hàng loạt', subtitle: 'Bóc tách mã file tự động' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'kanban',
  searchTerm,
  onSearchChange,
  onNewTaskClick,
  onMobileMenuToggle,
}) => {
  const { role, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.kanban;

  return (
    <header className="h-13 border-b border-border/50 bg-background/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Cụm điều hướng & Breadcrumb bên trái */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="lg:hidden w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Breadcrumb phẳng kiểu Linear */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
            Nexus
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <span className="text-foreground font-semibold flex items-center gap-1.5">
            {currentTabInfo.title}
          </span>
          <span className="text-[11px] text-muted-foreground font-normal hidden md:inline">
            • {currentTabInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Cụm công cụ bên phải: Tìm kiếm nhanh, Theme, Nút thêm việc */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ô tìm kiếm nhanh với phím tắt ⌘K */}
        <div className="relative w-44 sm:w-60 md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã bảng, khuôn, PO..."
            className="w-full h-8 bg-card/60 border border-border/60 rounded-lg pl-8 pr-10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/40 transition-all font-sans"
          />
          <kbd className="hidden sm:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/70 bg-secondary/80 px-1 py-0.2 rounded border border-border/50">
            ⌘K
          </kbd>
        </div>

        {/* Nút chuyển đổi giao diện Sáng / Tối */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg"
          title={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </Button>

        {/* Nút thêm việc nhanh nếu là Admin */}
        {isAdmin && (
          <Button
            onClick={onNewTaskClick}
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thẻ việc</span>
          </Button>
        )}
      </div>
    </header>
  );
};
