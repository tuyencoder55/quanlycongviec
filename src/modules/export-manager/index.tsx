import React, { useState } from 'react';
import { useExports } from './hooks/use-exports';
import { useAuth } from '../../hooks/use-auth';
import { ExportTable } from './components/export-table';
import { ExportDialog } from './components/export-dialog';
import type { ExportItem, ExportFormData, ExportTypeFilter, ExportDateFilter } from './types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Search,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Box,
  Hash,
  Download,
  CheckCircle2,
} from 'lucide-react';

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
  const [selectedItem, setSelectedItem] = useState<ExportItem | null>(null);

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
    setIsDialogOpen(true);
  };

  const handleEdit = (item: ExportItem) => {
    if (!isAdmin) return;
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Anh có chắc muốn xóa dòng xuất xưởng này khỏi database không?')) {
      await deleteExport(id);
    }
  };

  const handleSave = async (formData: ExportFormData, id?: string) => {
    if (id) {
      await updateExport({ id, updates: formData });
    } else {
      await createExport(formData);
    }
  };

  // Xuất file CSV để mở trực tiếp trong Excel hoặc Google Sheets
  const handleExportCSV = () => {
    const headers = ['STT', 'Ngày xuất', 'Loại', 'Mã Bảng', 'Mã Khuôn', 'Số PO/Tham chiếu', 'Tên đầy đủ', 'Ghi chú'];
    const rows = filteredList.map((item, idx) => [
      idx + 1,
      item.exported_at,
      item.type,
      item.board_code,
      item.mold_code || '',
      item.ref_value || '',
      `"${item.full_name.replace(/"/g, '""')}"`,
      `"${(item.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xuat_xuong_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Banner tiêu đề module */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-indigo-950/40 via-card to-card p-5 shadow-sm backdrop-blur-sm shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="indigo" className="gap-1 font-mono text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                Google Sheets Database
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {stats.total} dòng ghi nhận
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Tra Cứu Xuất Xưởng (Bảng / Khuôn / PO)
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Bảng tra cứu nguồn sự thật duy nhất của hệ thống. Nhấp vào bất kỳ ô mã nào để copy nhanh.
              Mỗi bảng và khuôn chỉ xuất một lần; PO mới được xuất bổ sung theo đợt.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs gap-1.5 border-border/80"
              title="Tải về file CSV để mở bằng Excel hoặc Google Sheets"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất CSV / Excel</span>
            </Button>

            {isAdmin && (
              <Button
                variant="gradient"
                size="sm"
                onClick={handleOpenAdd}
                className="text-xs gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ghi nhận xuất</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tổng số dòng xuất
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Dữ liệu toàn hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Bảng đã xuất
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{stats.boardCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mã bảng khác nhau</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Khuôn đã xuất
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Box className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{stats.moldCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Mã khuôn duy nhất</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              PO hoàn tất
            </CardTitle>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold font-mono">{stats.poCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Lô hàng xuất xưởng</p>
          </CardContent>
        </Card>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc kiểu Google Sheets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/60 backdrop-blur-sm shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ mã bảng, khuôn, số PO để lọc..."
              className="w-full h-8 bg-background/60 border border-input rounded-xl pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Lọc theo loại */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60 text-xs">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'board', label: 'Bảng' },
              { id: 'mold', label: 'Khuôn' },
              { id: 'po', label: 'PO' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as ExportTypeFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === t.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Lọc theo ngày */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60 text-xs">
            {[
              { id: 'all', label: 'Mọi lúc' },
              { id: 'today', label: 'Hôm nay' },
              { id: '7days', label: '7 ngày qua' },
              { id: 'month', label: 'Tháng này' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as ExportDateFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === d.id
                    ? 'bg-secondary-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Bảng dữ liệu dạng Google Sheets */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ExportTable
          items={filteredList}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Hộp thoại thêm / sửa dòng xuất */}
      <ExportDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialItem={selectedItem}
        onSave={handleSave}
        isAdmin={isAdmin}
      />
    </div>
  );
};
