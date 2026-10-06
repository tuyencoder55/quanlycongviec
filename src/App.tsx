import { useState } from 'react';
import { Sidebar, type ActiveTab } from './components/layout/sidebar';
import { Header } from './components/layout/header';
import { KanbanBoard } from './modules/kanban';
import { CompletedTasksScreen } from './modules/completed-tasks';
import { ExportManager } from './modules/export-manager';
import { Card } from './components/ui/card';
import { FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('kanban');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [newTaskTrigger, setNewTaskTrigger] = useState<number>(0);

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
              <Card className="border-dashed border border-border/80 bg-card/20 p-12 text-center rounded-xl my-auto">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground">
                    Khu vực Thêm Hàng Loạt (Bulk Insert)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dán danh sách hàng chục tên file cùng lúc, tự động bóc tách mã Bảng, Khuôn, PO và đẩy vào bảng Kanban nhanh chóng.
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
