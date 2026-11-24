import React from 'react';
import { Search, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { Button } from '../ui/button';
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
  search: { title: 'Tra cứu xuất khuôn bảng', subtitle: 'Danh mục Bảng, Khuôn & PO' },
  bulk: { title: 'Thêm hàng loạt', subtitle: 'Bóc tách mã file tự động' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'kanban',
  searchTerm,
  onSearchChange,
  onMobileMenuToggle,
}) => {
  const { theme, toggleTheme } = useTheme();
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.kanban;

  return (
    <header className="h-14 border-b border-[var(--border)] bg-bg/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-30">
      {/* Cụm điều hướng & Breadcrumb bên trái theo DESIGN.md mục 5 */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="lg:hidden w-9 h-9 rounded-[8px] text-subtle hover:text-text hover:bg-row-hover"
        >
          <Menu className="w-[17px] h-[17px]" strokeWidth={1.8} />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium text-muted-text hidden sm:inline">
            Nexus
          </span>
          <span className="text-[13px] text-faint hidden sm:inline">/</span>
          <span className="text-[15px] font-semibold text-text tracking-[-0.01em] truncate">
            {currentTabInfo.title}
          </span>
          <span className="text-[12px] text-muted-text font-normal hidden md:inline truncate">
            {currentTabInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Cụm công cụ bên phải: Ô tìm nhanh 300px + Nút đổi Sáng / Tối */}
      <div className="flex items-center gap-2.5">
        <div className="relative w-44 sm:w-64 md:w-[300px]">
          <Search
            className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã bảng, khuôn, PO..."
            className="w-full h-9 bg-surface border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[10px] pl-9 pr-14 text-[13px] text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors font-sans"
          />
          <kbd className="hidden sm:inline-flex items-center absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono text-subtle bg-track px-1.5 py-0.5 rounded-[6px] border border-[var(--border)]">
            Ctrl K
          </kbd>
        </div>

        {/* Nút chuyển đổi giao diện Sáng / Tối */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-row-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors"
          title={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-[17px] h-[17px]" strokeWidth={1.8} />
          ) : (
            <Moon className="w-[17px] h-[17px]" strokeWidth={1.8} />
          )}
        </button>
      </div>
    </header>
  );
};
