import { useState } from 'react';
import { Sidebar, type ActiveTab } from './components/layout/sidebar';
import { Header } from './components/layout/header';
import { KanbanBoard } from './modules/kanban';
import { CompletedTasksScreen } from './modules/completed-tasks';
import { ExportManager } from './modules/export-manager';
import { Badge } from './components/ui/badge';
import { Card } from './components/ui/card';
import { useAuth } from './hooks/use-auth';
import { Sparkles, Database, ExternalLink, Search, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kanban');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [newTaskTrigger, setNewTaskTrigger] = useState<number>(0);

  const { role, isConfigured } = useAuth();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar điều hướng */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          onNewTaskClick={() => {
            setActiveTab('kanban');
            setNewTaskTrigger((prev) => prev + 1);
          }}
        />
      </div>

      {/* Lớp phủ mờ (Backdrop) trên màn hình cảm ứng điện thoại */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Vùng hiển thị nội dung chính */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewTaskClick={() => {
            setActiveTab('kanban');
            setNewTaskTrigger((prev) => prev + 1);
          }}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 flex flex-col min-h-0">
          {/* Banner thông báo trạng thái kết nối */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-indigo-950/40 via-card to-card p-4 shadow-sm backdrop-blur-sm shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" className="gap-1 font-mono text-xs">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Nexus Prod Core
                  </Badge>
                  {!isConfigured && (
                    <Badge variant="amber" className="text-xs font-mono">
                      Chế độ Dự phòng
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs font-mono uppercase">
                    Quyền: {role}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Hệ thống Quản lý Công việc & Xuất Sản xuất
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/80 px-3 py-1.5 rounded-xl bg-card hover:bg-accent transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Hiển thị Tab tương ứng */}
          <div className="flex-1 min-h-0">
            {activeTab === 'kanban' && (
              <KanbanBoard
                key={newTaskTrigger}
                externalSearch={searchTerm}
              />
            )}

            {activeTab === 'completed' && (
              <CompletedTasksScreen
                externalSearch={searchTerm}
                onNavigateToKanban={() => setActiveTab('kanban')}
              />
            )}

            {activeTab === 'search' && (
              <ExportManager
                externalSearch={searchTerm}
              />
            )}

            {activeTab === 'bulk' && (
              <Card className="border-dashed border-2 border-border/70 bg-card/30 p-12 text-center rounded-2xl">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground">
                    Khu vực Thêm Hàng Loạt (Bulk Insert)
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hỗ trợ dán danh sách hàng chục tên file cùng lúc, tự động bóc tách mã và đẩy vào bảng Kanban nhanh chóng.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
