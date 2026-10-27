import React, { useState, useEffect } from 'react';
import { useExports } from './hooks/use-exports';
import { useAuth } from '../../hooks/use-auth';
import { ExportTable } from './components/export-table';
import { ExportDialog } from './components/export-dialog';
import { FolderExplorerView } from './components/folder-explorer-view';
import type {
  ExportItem,
  ExportFormData,
  ExportTypeFilter,
  ExportDateFilter,
  ExportViewMode,
} from './types';
import { Button } from '../../components/ui/button';
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Layers,
  Box,
  Hash,
  Database,
  Sparkles,
  Folder,
  Table,
} from 'lucide-react';
import { AiScannerModal } from './components/ai-scanner-modal';

interface ExportManagerProps {
  externalSearch?: string;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ externalSearch = '' }) => {
  const {
    exportsList,
    stats,
    isLoading,
    refetch,
    createExport,
    updateExport,
    deleteExport,
  } = useExports();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ExportTypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<ExportDateFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExportItem | null>(null);
  const [defaultFolderData, setDefaultFolderData] = useState<{
    subfolder?: string;
    date?: string;
  }>({});

  // Chế độ xem: Cây thư mục (folder) hoặc Bảng phẳng (table)
  const [viewMode, setViewMode] = useState<ExportViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_export_view_mode');
      if (saved === 'folder' || saved === 'table') return saved;
    }
    return 'folder';
  });

  const handleViewModeChange = (mode: ExportViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_export_view_mode', mode);
    }
  };

  // Điều hướng nhanh từ Bảng sang Cây thư mục (Open path / Reveal in folder)
  const [folderNavigation, setFolderNavigation] = useState<{
    path: string[];
    highlightItemId: string;
    trigger: number;
  } | null>(null);

  // Tự động tắt viền sáng highlight sau 4 giây
  useEffect(() => {
    if (folderNavigation?.highlightItemId) {
      const timer = setTimeout(() => {
        setFolderNavigation((prev) =>
          prev ? { ...prev, highlightItemId: '' } : null
        );
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [folderNavigation?.trigger]);

  const handleRevealInFolder = (item: ExportItem) => {
    // 1. Chuẩn hóa chuỗi ngày an toàn (hỗ trợ cả YYYY-MM-DD lẫn timestamp)
    const rawDate = item.exported_at || new Date().toISOString().split('T')[0];
    const dateStr = rawDate.replace(/\//g, '-').slice(0, 10);
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(0, 7);
    const day = dateStr.slice(5, 10);

    const subfolder = item.subfolder ? item.subfolder.trim() : '';
    const path = subfolder ? [year, month, day, subfolder] : [year, month, day];

    // 2. Tắt các bộ lọc loại/ngày để cây thư mục hiển thị trọn vẹn mọi file
    setTypeFilter('all');
    setDateFilter('all');

    // 3. Thiết lập đường dẫn đích và hiệu ứng highlight
    setFolderNavigation({
      path,
      highlightItemId: item.id,
      trigger: Date.now(),
    });
    handleViewModeChange('folder');
  };

  // Lọc dữ liệu theo từ khóa và bộ lọc loại, ngày
  const query = (externalSearch || searchTerm).trim().toLowerCase();
  const filteredList = exportsList.filter((item) => {
    // 1. Lọc theo từ khóa tìm kiếm
    if (query) {
      const matchQuery =
        item.board_code.toLowerCase().includes(query) ||
        (item.mold_code && item.mold_code.toLowerCase().includes(query)) ||
        (item.ref_value && item.ref_value.toLowerCase().includes(query)) ||
        item.full_name.toLowerCase().includes(query) ||
        (item.note && item.note.toLowerCase().includes(query));

      if (!matchQuery) return false;
    }

    // 2. Lọc theo loại xuất (Bảng, Khuôn, PO)
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // 3. Lọc theo khoảng ngày
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.exported_at).getTime();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      if (dateFilter === 'today') {
        if (itemDate < startOfToday) return false;
      } else if (dateFilter === '7days') {
        if (now.getTime() - itemDate > 7 * 86400000) return false;
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        if (itemDate < startOfMonth) return false;
      }
    }

    return true;
  });

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setSelectedItem(null);
    setDefaultFolderData({});
    setIsDialogOpen(true);
  };

  const handleNewExportInFolder = (subfolder?: string, date?: string) => {
    if (!isAdmin) return;
    setSelectedItem(null);
    setDefaultFolderData({ subfolder, date });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ExportItem) => {
    if (!isAdmin) return;
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Anh có chắc muốn xóa dòng xuất khuôn bảng này khỏi database không?')) {
      await deleteExport(id);
    }
  };

  const handleSave = async (formData: ExportFormData, id?: string) => {
    if (id) {
      await updateExport({ id, updates: formData });
      // Tự động điều hướng Cây thư mục đến đúng folder Năm > Tháng > Ngày của file vừa cập nhật
      const rawDate = formData.exported_at || new Date().toISOString().split('T')[0];
      const dateStr = rawDate.replace(/\//g, '-').slice(0, 10);
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(0, 7);
      const day = dateStr.slice(5, 10);
      const subfolder = formData.subfolder ? formData.subfolder.trim() : '';
      const path = subfolder ? [year, month, day, subfolder] : [year, month, day];
      setFolderNavigation({
        path,
        highlightItemId: id,
        trigger: Date.now(),
      });
      handleViewModeChange('folder');
    } else {
      const newItem = await createExport(formData);
      // Tự động mở đúng folder Năm > Tháng > Ngày và highlight sáng viền vàng file vừa tạo
      if (newItem) {
        handleRevealInFolder(newItem);
      } else {
        const rawDate = formData.exported_at || new Date().toISOString().split('T')[0];
        const dateStr = rawDate.replace(/\//g, '-').slice(0, 10);
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(0, 7);
        const day = dateStr.slice(5, 10);
        const subfolder = formData.subfolder ? formData.subfolder.trim() : '';
        const path = subfolder ? [year, month, day, subfolder] : [year, month, day];
        setTypeFilter('all');
        setDateFilter('all');
        setFolderNavigation({
          path,
          highlightItemId: '',
          trigger: Date.now(),
        });
        handleViewModeChange('folder');
      }
    }
  };

  // Xuất file CSV để mở trực tiếp trong Excel hoặc Google Sheets
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Mã Bảng',
      'Mã Khuôn',
      'Số PO/Tham chiếu',
      'Thư mục con',
      'Ngày xuất Bảng',
      'Ngày xuất Khuôn',
      'Ngày xuất PO',
      'Tên đầy đủ',
    ];

    const rows = filteredList.map((item, idx) => {
      // 1. Ngày xuất Bảng
      let boardDate = '';
      if (item.type === 'board') {
        boardDate = item.exported_at;
      } else if (item.board_code) {
        const found = exportsList.find(
          (e) => e.type === 'board' && e.board_code.toLowerCase() === item.board_code.toLowerCase()
        );
        if (found) boardDate = found.exported_at;
      }

      // 2. Ngày xuất Khuôn
      let moldDate = '';
      if (item.type === 'mold') {
        moldDate = item.exported_at;
      } else if (item.mold_code) {
        const moldCodeLower = item.mold_code.toLowerCase();
        const found = exportsList.find(
          (e) =>
            e.type === 'mold' &&
            e.mold_code &&
            e.mold_code.toLowerCase() === moldCodeLower
        );
        if (found) moldDate = found.exported_at;
      }

      // 3. Ngày xuất PO
      let poDate = '';
      if (item.type === 'po') {
        poDate = item.exported_at;
      } else if (item.ref_value) {
        const found = exportsList.find(
          (e) =>
            e.type === 'po' &&
            e.board_code.toLowerCase() === item.board_code.toLowerCase() &&
            e.ref_value === item.ref_value
        );
        if (found) poDate = found.exported_at;
      }

      return [
        idx + 1,
        item.board_code,
        item.mold_code || '',
        item.ref_value ? (item.ref_kind === 'po' ? `PO ${item.ref_value}` : item.ref_value) : '',
        item.subfolder || '',
        boardDate,
        moldDate,
        poDate,
        `"${item.full_name.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xuat_khuon_bang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Thanh số liệu thống kê nhanh gọn kiểu Linear pills */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 px-0.5">
        {/* Nhóm chip thống kê mini */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/60 border border-border/50 text-xs">
            <Database className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Tổng xuất:</span>
            <span className="font-mono font-bold text-foreground">{stats.total}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
            <Layers className="w-3 h-3" />
            <span>Bảng:</span>
            <span className="font-mono font-bold">{stats.boardCount}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Box className="w-3 h-3" />
            <span>Khuôn:</span>
            <span className="font-mono font-bold">{stats.moldCount}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <Hash className="w-3 h-3" />
            <span>PO:</span>
            <span className="font-mono font-bold">{stats.poCount}</span>
          </div>
        </div>

        {/* Nút hành động bên phải */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs gap-1.5 border-border/60 rounded-lg bg-card/40 text-muted-foreground hover:text-foreground"
            title="Tải về file CSV để mở bằng Excel hoặc Google Sheets"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {isAdmin && (
            <>
              <Button
                size="sm"
                onClick={() => setIsAiScannerOpen(true)}
                className="h-8 text-xs gap-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 shadow-xs px-2.5 transition-all"
                title="Chụp màn hình và dán Ctrl+V để AI tự động nhận diện và đối chiếu"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Quét ảnh (Ctrl+V)</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="h-8 text-xs gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs px-2.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ghi nhận xuất</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc phân đoạn kiểu Linear */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card/40 p-2 rounded-xl border border-border/50 shrink-0">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Ô tìm kiếm nội bộ */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc mã bảng, khuôn, PO..."
              className="w-full h-8 bg-card/60 border border-border/60 rounded-lg pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/80"
            />
          </div>

          {/* Lọc theo loại */}
          <div className="flex items-center gap-0.5 bg-secondary/50 p-0.5 rounded-lg border border-border/50 text-xs">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'board', label: 'Bảng' },
              { id: 'mold', label: 'Khuôn' },
              { id: 'po', label: 'PO' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as ExportTypeFilter)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  typeFilter === t.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Lọc theo ngày */}
          <div className="flex items-center gap-0.5 bg-secondary/50 p-0.5 rounded-lg border border-border/50 text-xs">
            {[
              { id: 'all', label: 'Mọi lúc' },
              { id: 'today', label: 'Hôm nay' },
              { id: '7days', label: '7 ngày qua' },
              { id: 'month', label: 'Tháng này' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as ExportDateFilter)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  dateFilter === d.id
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Chuyển đổi Dạng Cây Thư Mục / Dạng Bảng */}
          <div className="flex items-center gap-0.5 bg-secondary/70 p-0.5 rounded-lg border border-border/60 text-xs shrink-0">
            <button
              onClick={() => handleViewModeChange('folder')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'folder'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Xem theo Cây thư mục (Năm > Tháng > Ngày > Thư mục con)"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Thư Mục</span>
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Xem theo Bảng phẳng tra cứu"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="font-medium">Bảng</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono px-2 shrink-0">
          {viewMode === 'table'
            ? `${filteredList.filter((i) => i.type !== 'image').length} kết quả`
            : `${filteredList.length} kết quả`}
        </div>
      </div>

      {/* VÙNG HIỂN THỊ CHÍNH: DẠNG CÂY THƯ MỤC HOẶC BẢNG GOOGLE SHEETS */}
      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === 'folder' ? (
          <FolderExplorerView
            items={filteredList}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onNewExportInFolder={handleNewExportInFolder}
            targetPath={folderNavigation?.path}
            highlightItemId={folderNavigation?.highlightItemId}
            revealTrigger={folderNavigation?.trigger}
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/50 bg-card/20">
            <ExportTable
              items={filteredList.filter((i) => i.type !== 'image')}
              allExports={exportsList.filter((i) => i.type !== 'image')}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRevealInFolder={handleRevealInFolder}
            />
          </div>
        )}
      </div>

      {/* Hộp thoại thêm / sửa dòng xuất */}
      <ExportDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialItem={selectedItem}
        defaultSubfolder={defaultFolderData.subfolder}
        defaultDate={defaultFolderData.date}
        onSave={handleSave}
        isAdmin={isAdmin}
      />

      {/* Hộp thoại AI Đọc ảnh & Đối chiếu xuất xưởng */}
      <AiScannerModal
        isOpen={isAiScannerOpen}
        onOpenChange={setIsAiScannerOpen}
        isAdmin={isAdmin}
        onSuccess={refetch}
      />
    </div>
  );
};
