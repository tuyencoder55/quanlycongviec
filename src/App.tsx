import { useState } from 'react';
import { Sidebar, type ActiveTab } from './components/layout/sidebar';
import { Header } from './components/layout/header';
import { KanbanBoard } from './modules/kanban';
import { CompletedTasksScreen } from './modules/completed-tasks';
import { ExportManager } from './modules/export-manager';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Sparkles, FileSpreadsheet } from 'lucide-react';
import { useAuth } from './hooks/use-auth';
import { AiScannerModal } from './modules/export-manager/components/ai-scanner-modal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kanban');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [newTaskTrigger, setNewTaskTrigger] = useState<number>(0);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState<boolean>(false);
  const { isAdmin } = useAuth();

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
          activeTab={activeTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewTaskClick={() => {
            setActiveTab('kanban');
            setNewTaskTrigger((prev) => prev + 1);
          }}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 overflow-hidden p-3 lg:p-4 flex flex-col min-h-0">
          {/* Hiển thị Tab tương ứng - Tối ưu 100% diện tích làm việc */}
          <div className="flex-1 min-h-0 flex flex-col">
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
              <div className="flex-1 flex items-center justify-center p-4">
                <Card className="border border-border/80 bg-card/40 p-8 max-w-lg w-full text-center rounded-2xl shadow-xl backdrop-blur-sm space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground">
                      AI Tự Động Quét Ảnh & Đối Chiếu Xuất Xưởng
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Chụp màn hình danh sách tên file (thư mục, Excel, Zalo), AI sẽ tự động phân tích mã Bảng, Khuôn, PO, đối chiếu với Kanban và lịch sử xuất để tự động chuyển sang Xuất khuôn bảng.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => setIsAiScannerOpen(true)}
                      className="h-10 px-5 gap-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-600 text-white shadow-md hover:shadow-indigo-500/20 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Mở Trình Quét AI (Ctrl + V)</span>
                    </Button>
                  </div>

                  <div className="border-t border-border/40 pt-4 text-[11px] text-muted-foreground flex items-center justify-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hỗ trợ dán ảnh phím tắt Ctrl + V trực tiếp</span>
                  </div>
                </Card>

                <AiScannerModal
                  isOpen={isAiScannerOpen}
                  onOpenChange={setIsAiScannerOpen}
                  isAdmin={isAdmin}
                  onSuccess={() => setActiveTab('search')}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
