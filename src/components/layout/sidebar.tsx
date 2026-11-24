import React from 'react';
import {
  Search,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Box,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';
import { StorageWidget } from './storage-widget';
import type { FeatureConfig } from '../../config/features';

export type ActiveTab = 'kanban' | 'completed' | 'search' | 'bulk';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewTaskClick: () => void;
  onOpenSettings: () => void;
  features: FeatureConfig;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onNewTaskClick,
  onOpenSettings,
  features,
}) => {
  const { role, switchDemoRole, isConfigured } = useAuth();

  return (
    <aside className="w-60 h-screen border-r border-[var(--border)] bg-track/60 dark:bg-surface flex flex-col justify-between p-3 select-none shrink-0 transition-colors">
      {/* Cụm Header thương hiệu & Menu điều hướng */}
      <div>
        <div className="px-2 py-2 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-ai-bg border border-ai-border flex items-center justify-center text-ai-text shrink-0">
              <Box className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-text tracking-[-0.01em] leading-tight">
                Nexus Prod
              </div>
              <div className="text-[11px] text-muted-text flex items-center gap-1.5 mt-0.5">
                <span className="w-[6px] h-[6px] rounded-full bg-dot-mold inline-block shrink-0" />
                <span className="truncate">Cá nhân • Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nút tạo thẻ việc mới (chỉ hiện khi module Danh sách việc được bật) */}
        {features.showKanban && (
          <div className="mb-3">
            <Button
              onClick={onNewTaskClick}
              className="w-full gap-2 font-semibold h-9 rounded-[10px] bg-primary hover:brightness-110 text-on-primary text-[13px]"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} />
              <span>Thẻ việc mới</span>
              <kbd className="ml-auto text-[10px] font-mono opacity-75">N</kbd>
            </Button>
          </div>
        )}

        {/* Menu điều hướng chính */}
        <nav className="space-y-1">
          {features.showKanban && (
            <button
              onClick={() => onTabChange('kanban')}
              className={`w-full text-left rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 transition-colors text-[13px] ${
                activeTab === 'kanban'
                  ? 'bg-selected text-selected-text font-medium border border-[var(--border)] shadow-xs'
                  : 'text-muted-text hover:text-text hover:bg-row-hover font-normal'
              }`}
            >
              <CheckCircle2
                className={`w-[16px] h-[16px] shrink-0 ${
                  activeTab === 'kanban' ? 'text-dot-board' : 'text-subtle'
                }`}
                strokeWidth={1.8}
              />
              <span className="flex-1 truncate">Danh sách việc</span>
            </button>
          )}

          {features.showCompleted && (
            <button
              onClick={() => onTabChange('completed')}
              className={`w-full text-left rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 transition-colors text-[13px] ${
                activeTab === 'completed'
                  ? 'bg-selected text-selected-text font-medium border border-[var(--border)] shadow-xs'
                  : 'text-muted-text hover:text-text hover:bg-row-hover font-normal'
              }`}
            >
              <CheckCircle2
                className={`w-[16px] h-[16px] shrink-0 ${
                  activeTab === 'completed' ? 'text-dot-mold' : 'text-subtle'
                }`}
                strokeWidth={1.8}
              />
              <span className="flex-1 truncate">Task hoàn thành</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('search')}
            className={`w-full text-left rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 transition-colors text-[13px] ${
              activeTab === 'search'
                ? 'bg-selected text-selected-text font-medium border border-[var(--border)] shadow-xs'
                : 'text-muted-text hover:text-text hover:bg-row-hover font-normal'
            }`}
          >
            <Search
              className={`w-[16px] h-[16px] shrink-0 ${
                activeTab === 'search' ? 'text-dot-board' : 'text-subtle'
              }`}
              strokeWidth={1.8}
            />
            <span className="flex-1 leading-snug">Tra cứu xuất khuôn bảng</span>
          </button>

          {features.showBulkScanner && (
            <button
              onClick={() => onTabChange('bulk')}
              className={`w-full text-left rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 transition-colors text-[13px] ${
                activeTab === 'bulk'
                  ? 'bg-selected text-selected-text font-medium border border-[var(--border)] shadow-xs'
                  : 'text-muted-text hover:text-text hover:bg-row-hover font-normal'
              }`}
            >
              <FileSpreadsheet
                className={`w-[16px] h-[16px] shrink-0 ${
                  activeTab === 'bulk' ? 'text-dot-po' : 'text-subtle'
                }`}
                strokeWidth={1.8}
              />
              <span className="flex-1 truncate">Thêm hàng loạt</span>
            </button>
          )}

          {/* Nút Cài đặt hiển thị Module */}
          <div className="pt-2.5 mt-2.5 border-t border-[var(--border)]">
            <button
              onClick={onOpenSettings}
              className="w-full text-left rounded-[10px] px-2.5 py-2 flex items-center gap-2.5 transition-colors text-[13px] font-normal text-muted-text hover:text-text hover:bg-row-hover group"
            >
              <Settings
                className="w-[16px] h-[16px] text-subtle group-hover:text-text transition-colors shrink-0"
                strokeWidth={1.8}
              />
              <span className="flex-1 truncate">Cài đặt hiển thị</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Footer Sidebar: Dung lượng + Chuyển role test + Thông tin cá nhân */}
      <div className="pt-3 space-y-2.5">
        <StorageWidget />

        {/* Nút chuyển đổi Admin / Viewer */}
        <div className="bg-surface p-2.5 rounded-[12px] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[11px] text-muted-text mb-2 px-0.5">
            <span>Vai trò đang test:</span>
            {!isConfigured && <span className="text-dot-po font-mono">(Demo)</span>}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => switchDemoRole('admin')}
              className={`flex items-center justify-center gap-1.5 h-8 px-2 rounded-[8px] text-[12px] font-medium transition-colors ${
                role === 'admin'
                  ? 'bg-primary text-on-primary'
                  : 'bg-track text-muted-text hover:text-text'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.8} />
              Admin
            </button>
            <button
              onClick={() => switchDemoRole('viewer')}
              className={`flex items-center justify-center gap-1.5 h-8 px-2 rounded-[8px] text-[12px] font-medium transition-colors ${
                role === 'viewer'
                  ? 'bg-selected text-selected-text border border-[var(--border-strong)]'
                  : 'bg-track text-muted-text hover:text-text'
              }`}
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
              Viewer
            </button>
          </div>
        </div>

        {/* Thẻ người dùng cá nhân */}
        <div className="flex items-center justify-between px-2.5 py-2 rounded-[12px] bg-surface border border-[var(--border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-tag-board-bg text-tag-board-text flex items-center justify-center font-semibold text-[11px] shrink-0 font-mono">
              DS
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text truncate">
                Designer
              </div>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-row-hover transition-colors"
            title="Cài đặt hiển thị Module"
          >
            <Settings className="w-[15px] h-[15px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
};
