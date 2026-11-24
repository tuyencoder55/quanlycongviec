import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
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
  accounts: { title: 'Quản lý tài khoản', subtitle: '' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'kanban',
  onMobileMenuToggle,
}) => {
  const { theme, toggleTheme } = useTheme();
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.kanban;

  return (
    <header className="h-14 border-b border-[var(--border)] bg-bg/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-30">
      {/* Breadcrumb trái theo hình Dashboard đầy đủ (Dark & Light) */}
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
          <span className="text-[12px] text-muted-text font-normal hidden md:inline truncate ml-1">
            {currentTabInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Nút chuyển đổi giao diện Sáng / Tối bên phải */}
      <div className="flex items-center gap-2">
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
