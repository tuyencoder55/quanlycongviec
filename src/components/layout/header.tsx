import React from 'react';
import { Search, Plus, Bell, Shield, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewTaskClick: () => void;
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  onSearchChange,
  onNewTaskClick,
  onMobileMenuToggle,
}) => {
  const { role, isAdmin } = useAuth();

  return (
    <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between shrink-0 z-30">
      {/* Nút menu mở sidebar trên điện thoại + Tìm kiếm */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="lg:hidden w-8 h-8 text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm mã bảng, mã khuôn, số PO..."
            className="w-full h-9 bg-card/60 border border-input rounded-xl pl-9 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-accent px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Cluster hành động bên phải */}
      <div className="flex items-center gap-3">
        {/* Huy hiệu vai trò */}
        <div className="hidden sm:flex items-center">
          <Badge
            variant={isAdmin ? 'indigo' : 'outline'}
            className="gap-1.5 py-1 px-2.5 font-mono text-[11px] uppercase tracking-wider"
          >
            <Shield className="w-3 h-3" />
            <span>{role}</span>
          </Badge>
        </div>

        {/* Thông báo */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground relative"
          title="Thông báo"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-destructive absolute top-1.5 right-1.5 ring-2 ring-background" />
        </Button>

        {/* Nút thêm nhanh nếu là admin */}
        {isAdmin && (
          <Button
            onClick={onNewTaskClick}
            size="sm"
            variant="gradient"
            className="gap-1.5 shadow-sm text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Thẻ việc mới</span>
          </Button>
        )}
      </div>
    </header>
  );
};
