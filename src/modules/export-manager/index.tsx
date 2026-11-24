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
import {
  ListFilter,
  Plus,
  RefreshCw,
  Download,
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
  const { isAdmin, permissions } = useAuth();
  const canCreate = permissions.can_create_export;
  const canUpload = permissions.can_upload_files;
  const canAiScan = permissions.can_ai_scan;
  const canEdit = permissions.can_edit;
  const canDelete = permissions.can_delete;
  const canExportCsv = permissions.can_export_csv;

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

  // Đường dẫn hiện tại trong cây thư mục
  const [currentExplorerPath, setCurrentExplorerPath] = useState<string[]>([]);

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
    if (!canCreate) return;
    setSelectedItem(null);
    setDefaultFolderData({});
    setIsDialogOpen(true);
  };

  const handleNewExportInFolder = (subfolder?: string, date?: string) => {
    if (!canCreate && !canUpload) return;
    setSelectedItem(null);
    setDefaultFolderData({ subfolder, date });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ExportItem) => {
    if (!canEdit && !canUpload) return;
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi xuất này không?')) {
      await deleteExport(id);
    }
  };

  const handleSave = async (formData: ExportFormData) => {
    if (selectedItem) {
      // Sửa
      await updateExport({
        id: selectedItem.id,
        updates: {
          type: formData.type,
          board_code: formData.board_code,
          mold_code: formData.mold_code || null,
          ref_kind: formData.ref_kind || null,
          ref_value: formData.ref_value || null,
          full_name: formData.full_name,
          exported_at: formData.exported_at,
          subfolder: formData.subfolder || null,
          image_url: formData.image_url || null,
          file_size_bytes: formData.file_size_bytes || null,
          is_legacy: formData.is_legacy ?? false,
          note: formData.note || null,
        },
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
    } else {
      // Tạo mới
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
        boardDate = item.is_legacy ? 'Đã xuất trước đây' : item.exported_at;
      } else if (item.board_code) {
        const found = exportsList.find(
          (e) => (e.type === 'board' || e.is_legacy) && e.board_code.toLowerCase() === item.board_code.toLowerCase()
        );
        if (found) boardDate = found.is_legacy ? 'Đã xuất trước đây' : found.exported_at;
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
        `"${item.board_code}"`,
        `"${item.mold_code || ''}"`,
        `"${item.ref_value ? (item.ref_kind === 'po' ? 'PO ' + item.ref_value : item.ref_value) : ''}"`,
        `"${item.subfolder || ''}"`,
        `"${boardDate}"`,
        `"${moldDate}"`,
        `"${poDate}"`,
        `"${item.full_name.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xuat_khuon_bang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Hàng 1: 4 ô thống kê + cụm nút hành động theo DESIGN.md mục 5 */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Khối 4 ô thống kê (nền --surface, viền --border, bo 10px/12px) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface border border-[var(--border)] rounded-[12px] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)] shrink-0">
          <div className="px-4 py-2.5 min-w-[104px]">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-text">
              <span className="w-[6px] h-[6px] rounded-full bg-text shrink-0" />
              <span>Tổng xuất</span>
            </div>
            <div className="font-mono text-[18px] font-semibold text-text leading-tight mt-0.5 tabular-nums">
              {stats.total}
            </div>
          </div>

          <div className="px-4 py-2.5 min-w-[104px]">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-text">
              <span className="w-[7px] h-[7px] rounded-full bg-dot-board shrink-0" />
              <span>Bảng</span>
            </div>
            <div className="font-mono text-[18px] font-semibold text-text leading-tight mt-0.5 tabular-nums">
              {stats.boardCount}
            </div>
          </div>

          <div className="px-4 py-2.5 min-w-[104px]">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-text">
              <span className="w-[7px] h-[7px] rounded-full bg-dot-mold shrink-0" />
              <span>Khuôn</span>
            </div>
            <div className="font-mono text-[18px] font-semibold text-text leading-tight mt-0.5 tabular-nums">
              {stats.moldCount}
            </div>
          </div>

          <div className="px-4 py-2.5 min-w-[104px]">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-text">
              <span className="w-[7px] h-[7px] rounded-full bg-dot-po shrink-0" />
              <span>PO</span>
            </div>
            <div className="font-mono text-[18px] font-semibold text-text leading-tight mt-0.5 tabular-nums">
              {stats.poCount}
            </div>
          </div>
        </div>

        {/* Cụm nút hành động bên phải (nút lớn cao 40px, bo 10px) */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {canExportCsv && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-3.5 rounded-[10px] bg-surface border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-row-hover text-[13px] font-medium text-text inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors"
              title="Tải về file CSV để mở bằng Excel hoặc Google Sheets"
            >
              <Download className="w-[15px] h-[15px] text-subtle" strokeWidth={1.8} />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-10 w-10 rounded-[10px] bg-transparent hover:bg-row-hover text-subtle hover:text-text inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors disabled:opacity-40"
            title="Tải lại dữ liệu"
          >
            <RefreshCw
              className={`w-[16px] h-[16px] ${isLoading ? 'animate-spin' : ''}`}
              strokeWidth={1.8}
            />
          </button>

          {canAiScan && (
            <button
              type="button"
              onClick={() => setIsAiScannerOpen(true)}
              className="h-10 px-3.5 rounded-[10px] bg-ai-bg border border-ai-border text-ai-text hover:brightness-105 text-[13px] font-medium inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-all"
              title="Chụp màn hình và dán Ctrl+V để AI tự động nhận diện và đối chiếu"
            >
              <Sparkles className="w-[15px] h-[15px]" strokeWidth={1.8} />
              <span>AI Quét ảnh</span>
              <span className="font-mono text-[11px] opacity-80 hidden sm:inline">Ctrl+V</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="h-10 px-4 rounded-[10px] bg-primary hover:brightness-110 text-on-primary text-[13px] font-semibold inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-all"
            >
              <Plus className="w-[16px] h-[16px]" strokeWidth={2} />
              <span>Ghi nhận xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Hàng 2: Thanh bộ lọc phân đoạn (xuống dòng được khi màn hẹp) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface p-2.5 rounded-[12px] border border-[var(--border)] shrink-0">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Ô lọc nhanh rộng tối đa 340px */}
          <div className="relative w-full sm:w-[260px] lg:w-[320px] max-w-[340px]">
            <ListFilter
              className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
              strokeWidth={1.8}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc mã bảng, khuôn, PO..."
              className="w-full h-9 bg-bg border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[10px] pl-9 pr-3 text-[13px] text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors"
            />
          </div>

          {/* Thanh chọn loại: Tất cả / Bảng / Khuôn / PO */}
          <div className="inline-flex items-center bg-track p-[3px] rounded-[10px] border border-[var(--border)]">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'board', label: 'Bảng' },
              { id: 'mold', label: 'Khuôn' },
              { id: 'po', label: 'PO' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id as ExportTypeFilter)}
                className={`h-8 px-3 rounded-[7px] text-[13px] transition-colors ${
                  typeFilter === t.id
                    ? 'bg-selected text-selected-text font-medium shadow-xs'
                    : 'bg-transparent text-muted-text hover:text-text font-normal'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Thanh chọn thời gian: Mọi lúc / Hôm nay / 7 ngày qua / Tháng này */}
          <div className="inline-flex items-center bg-track p-[3px] rounded-[10px] border border-[var(--border)]">
            {[
              { id: 'all', label: 'Mọi lúc' },
              { id: 'today', label: 'Hôm nay' },
              { id: '7days', label: '7 ngày qua' },
              { id: 'month', label: 'Tháng này' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateFilter(d.id as ExportDateFilter)}
                className={`h-8 px-3 rounded-[7px] text-[13px] transition-colors ${
                  dateFilter === d.id
                    ? 'bg-selected text-selected-text font-medium shadow-xs'
                    : 'bg-transparent text-muted-text hover:text-text font-normal'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bên phải: Chuyển đổi Thư mục / Bảng + Số kết quả */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="inline-flex items-center bg-track p-[3px] rounded-[10px] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => handleViewModeChange('folder')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-[13px] transition-colors ${
                viewMode === 'folder'
                  ? 'bg-selected text-selected-text font-medium shadow-xs'
                  : 'bg-transparent text-muted-text hover:text-text font-normal'
              }`}
              title="Xem theo Cây thư mục (Năm > Tháng > Ngày > Thư mục con)"
            >
              <Folder className="w-[15px] h-[15px]" strokeWidth={1.8} />
              <span>Thư mục</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-[13px] transition-colors ${
                viewMode === 'table'
                  ? 'bg-selected text-selected-text font-medium shadow-xs'
                  : 'bg-transparent text-muted-text hover:text-text font-normal'
              }`}
              title="Xem theo Bảng phẳng tra cứu"
            >
              <Table className="w-[15px] h-[15px]" strokeWidth={1.8} />
              <span>Bảng</span>
            </button>
          </div>

          <div className="text-[12px] text-muted-text font-mono tabular-nums px-1 shrink-0">
            {viewMode === 'table'
              ? `${filteredList.filter((i) => i.type !== 'image').length} kết quả`
              : `${filteredList.length} kết quả`}
          </div>
        </div>
      </div>

      {/* VÙNG HIỂN THỊ CHÍNH: DẠNG CÂY THƯ MỤC HOẶC BẢNG */}
      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === 'folder' ? (
          <FolderExplorerView
            items={filteredList}
            isAdmin={isAdmin}
            permissions={permissions}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onNewExportInFolder={canCreate || canUpload ? handleNewExportInFolder : undefined}
            targetPath={folderNavigation?.path}
            highlightItemId={folderNavigation?.highlightItemId}
            revealTrigger={folderNavigation?.trigger}
            onPathChange={setCurrentExplorerPath}
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto rounded-[12px] border border-[var(--border)] bg-surface">
            <ExportTable
              items={filteredList.filter((i) => i.type !== 'image')}
              allExports={exportsList.filter((i) => i.type !== 'image')}
              isAdmin={canEdit || canDelete}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
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
        isAdmin={canCreate || canEdit || canUpload}
      />

      {/* Hộp thoại AI Đọc ảnh & Đối chiếu xuất xưởng */}
      <AiScannerModal
        isOpen={isAiScannerOpen}
        onOpenChange={setIsAiScannerOpen}
        isAdmin={canAiScan}
        onSuccess={refetch}
        defaultDate={
          currentExplorerPath[1] && currentExplorerPath[2]
            ? `${currentExplorerPath[1].slice(0, 4)}-${currentExplorerPath[2]}`
            : undefined
        }
        defaultSubfolder={currentExplorerPath[3] || undefined}
      />
    </div>
  );
};
