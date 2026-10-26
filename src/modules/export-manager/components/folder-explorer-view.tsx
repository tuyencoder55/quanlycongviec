import React, { useState, useMemo, useEffect } from 'react';
import type { ExportItem } from '../types';
import { FolderItemCard } from './folder-item-card';
import { FileItemCard } from './file-item-card';
import { ImageUploadModal } from './image-upload-modal';
import { ImageLightboxModal } from './image-lightbox-modal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  Folder,
  FolderPlus,
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Plus,
  FileImage,
  FileText,
  UploadCloud,
  ImageIcon,
} from 'lucide-react';

interface FolderExplorerViewProps {
  items: ExportItem[];
  isAdmin: boolean;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
  onNewExportInFolder?: (subfolder?: string, date?: string) => void;
  targetPath?: string[];
  highlightItemId?: string | null;
  revealTrigger?: number;
}

export const FolderExplorerView: React.FC<FolderExplorerViewProps> = ({
  items,
  isAdmin,
  onEdit,
  onDelete,
  onNewExportInFolder,
  targetPath,
  highlightItemId,
  revealTrigger,
}) => {
  // Đường dẫn hiện tại: [] = Root, ['2026'], ['2026', '2026-10'], ['2026', '2026-10', '10-15'], ['2026', '2026-10', '10-15', 'bestway']
  const [currentPath, setCurrentPath] = useState<string[]>(() => {
    if (targetPath && targetPath.length > 0) return targetPath;
    if (items.length > 0) {
      const latestDate = items[0].exported_at; // YYYY-MM-DD
      const year = latestDate.slice(0, 4);
      const month = latestDate.slice(0, 7);
      return [year, month];
    }
    return ['2026', '2026-10'];
  });

  // Tự động nhảy tới thư mục mục tiêu khi người dùng bấm "Mở thư mục" từ bảng
  useEffect(() => {
    if (targetPath && targetPath.length > 0) {
      setCurrentPath(targetPath);
    }
  }, [targetPath, revealTrigger]);

  // Modal tạo thư mục mới
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Modal tải & nén ảnh
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Modal xem ảnh phóng to toàn màn hình (Lightbox)
  const [viewingImage, setViewingImage] = useState<ExportItem | null>(null);

  // Lưu trữ các thư mục người dùng tự tạo trên trình duyệt (giữ lại kể cả khi F5)
  const [customYears, setCustomYears] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexus_custom_years');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [customMonths, setCustomMonths] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexus_custom_months');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [customDays, setCustomDays] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexus_custom_days');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexus_custom_folders');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Menu ngữ cảnh chuột phải (Context Menu phong cách Windows Desktop)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isOpen: boolean;
  }>({ x: 0, y: 0, isOpen: false });

  // Đóng Context Menu khi click chuột ra ngoài hoặc ấn phím Esc
  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseMenu();
    };

    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Bắt sự kiện dán ảnh trực tiếp từ clipboard (Ctrl + V) trên trang Explorer
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isNewFolderOpen || isImageUploadOpen || viewingImage) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          setIsImageUploadOpen(true);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isNewFolderOpen, isImageUploadOpen, viewingImage]);

  // Bắt sự kiện chuột phải trên toàn bộ vùng Explorer
  const handleContainerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 220;
    const menuHeight = 180;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
    setContextMenu({ x, y, isOpen: true });
  };

  // Lọc items theo đường dẫn hiện tại
  const level = currentPath.length;
  const currentYear = currentPath[0];
  const currentMonth = currentPath[1];
  const currentDay = currentPath[2];
  const currentSubfolder = currentPath[3];

  // Danh sách các năm có trong dữ liệu + năm người dùng tự tạo
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    customYears.forEach((y) => set.add(y));
    items.forEach((item) => {
      if (item.exported_at) set.add(item.exported_at.slice(0, 4));
    });
    if (set.size === 0) set.add('2026');
    return Array.from(set).sort().reverse();
  }, [items, customYears]);

  // Danh sách các tháng trong năm được chọn + tháng tự tạo
  const availableMonths = useMemo(() => {
    if (!currentYear) return [];
    const set = new Set<string>();
    customMonths.forEach((m) => {
      if (m.startsWith(currentYear)) set.add(m);
    });
    items.forEach((item) => {
      if (item.exported_at && item.exported_at.startsWith(currentYear)) {
        set.add(item.exported_at.slice(0, 7)); // YYYY-MM
      }
    });
    if (set.size === 0) set.add(`${currentYear}-10`);
    return Array.from(set).sort().reverse();
  }, [items, currentYear, customMonths]);

  // Danh sách các ngày trong tháng được chọn + ngày tự tạo
  const availableDays = useMemo(() => {
    if (!currentMonth) return [];
    const map = new Map<string, number>();

    // Thêm các ngày người dùng tự tạo trong tháng này
    customDays.forEach((d) => {
      const tag = d.includes('-') && d.length === 5 ? d : d.slice(5, 10);
      if (!map.has(tag)) map.set(tag, 0);
    });

    items.forEach((item) => {
      if (item.exported_at && item.exported_at.startsWith(currentMonth)) {
        const dayTag = item.exported_at.slice(5, 10); // MM-DD
        map.set(dayTag, (map.get(dayTag) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dayTag, count]) => ({ dayTag, count }));
  }, [items, currentMonth, customDays]);

  // Các thư mục con và file trong ngày được chọn
  const dayContents = useMemo(() => {
    if (!currentMonth || !currentDay) return { subfolders: [], directFiles: [] };
    const fullDate = `${currentMonth.slice(0, 4)}-${currentDay}`; // YYYY-MM-DD
    const dayItems = items.filter((item) => item.exported_at === fullDate);

    const subfolderMap = new Map<string, number>();
    const directFiles: ExportItem[] = [];

    // Thêm các custom folder người dùng vừa tạo
    customFolders.forEach((f) => subfolderMap.set(f, 0));

    dayItems.forEach((item) => {
      if (item.subfolder && item.subfolder.trim()) {
        const folderName = item.subfolder.trim();
        subfolderMap.set(folderName, (subfolderMap.get(folderName) || 0) + 1);
      } else {
        directFiles.push(item);
      }
    });

    const subfolders = Array.from(subfolderMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    return { subfolders, directFiles };
  }, [items, currentMonth, currentDay, customFolders]);

  // Các file khi đã vào sâu trong thư mục con
  const subfolderFiles = useMemo(() => {
    if (!currentMonth || !currentDay || !currentSubfolder) return [];
    const fullDate = `${currentMonth.slice(0, 4)}-${currentDay}`;
    return items.filter(
      (item) =>
        item.exported_at === fullDate &&
        item.subfolder &&
        item.subfolder.toLowerCase() === currentSubfolder.toLowerCase()
    );
  }, [items, currentMonth, currentDay, currentSubfolder]);

  // Điều hướng
  const handleNavigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath((prev) => prev.slice(0, -1));
    }
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath([]); // Về thư mục Gốc
    } else {
      setCurrentPath((prev) => prev.slice(0, index + 1));
    }
  };

  // Tạo thư mục linh hoạt theo cấp hiện tại
  const handleCreateFolder = () => {
    const rawName = newFolderName.trim();
    if (!rawName) return;

    // CẤP 0: Tạo Năm mới
    if (level === 0) {
      const yearStr = rawName.slice(0, 4);
      if (!customYears.includes(yearStr)) {
        const updated = [...customYears, yearStr];
        setCustomYears(updated);
        localStorage.setItem('nexus_custom_years', JSON.stringify(updated));
      }
      setCurrentPath([yearStr]);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      return;
    }

    // CẤP 1: Tạo Tháng mới
    if (level === 1) {
      let monthStr = rawName;
      if (!monthStr.includes('-')) {
        const padded = monthStr.padStart(2, '0');
        monthStr = `${currentYear}-${padded}`;
      }
      if (!customMonths.includes(monthStr)) {
        const updated = [...customMonths, monthStr];
        setCustomMonths(updated);
        localStorage.setItem('nexus_custom_months', JSON.stringify(updated));
      }
      setCurrentPath([currentYear, monthStr]);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      return;
    }

    // CẤP 2: Tạo Ngày mới
    if (level === 2) {
      let dayStr = rawName;
      if (dayStr.length <= 2) {
        const monthNum = currentMonth.slice(5, 7);
        dayStr = `${monthNum}-${dayStr.padStart(2, '0')}`;
      }
      if (!customDays.includes(dayStr)) {
        const updated = [...customDays, dayStr];
        setCustomDays(updated);
        localStorage.setItem('nexus_custom_days', JSON.stringify(updated));
      }
      setCurrentPath([currentYear, currentMonth, dayStr]);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      return;
    }

    // CẤP 3: Tạo Thư mục con
    if (level >= 3) {
      if (!customFolders.includes(rawName)) {
        const updated = [...customFolders, rawName];
        setCustomFolders(updated);
        localStorage.setItem('nexus_custom_folders', JSON.stringify(updated));
      }
      setCurrentPath([currentYear, currentMonth, currentDay, rawName]);
      setNewFolderName('');
      setIsNewFolderOpen(false);
    }
  };

  // Tiêu đề và placeholder gợi ý tương ứng cho từng cấp
  const modalInfo = useMemo(() => {
    if (level === 0) {
      return {
        title: 'Tạo Thư Mục Năm Mới',
        desc: 'Nhập số năm bạn muốn tạo để phân loại hồ sơ xuất xưởng.',
        label: 'Năm:',
        placeholder: 'VD: 2027, 2025...',
        suggestions: ['2027', '2026', '2025'],
        btnText: 'Tạo Thư Mục Năm',
      };
    }
    if (level === 1) {
      return {
        title: `Tạo Thư Mục Tháng Mới (Năm ${currentYear})`,
        desc: `Thư mục tháng sẽ thuộc năm ${currentYear}. Bạn có thể nhập số tháng (ví dụ 11) hoặc định dạng YYYY-MM.`,
        label: 'Tháng:',
        placeholder: `VD: ${currentYear}-11 hoặc 11`,
        suggestions: [`${currentYear}-11`, `${currentYear}-12`, `${currentYear}-09`],
        btnText: 'Tạo Thư Mục Tháng',
      };
    }
    if (level === 2) {
      const monthNum = currentMonth ? currentMonth.slice(5, 7) : '10';
      return {
        title: `Tạo Thư Mục Ngày Mới (Tháng ${currentMonth})`,
        desc: `Thư mục ngày sẽ nằm trong ${currentMonth}. Bạn có thể nhập ngày trong tháng (ví dụ 16).`,
        label: 'Ngày (MM-DD):',
        placeholder: `VD: ${monthNum}-16 hoặc 16`,
        suggestions: [`${monthNum}-16`, `${monthNum}-17`, `${monthNum}-18`, `${monthNum}-20`],
        btnText: 'Tạo Thư Mục Ngày',
      };
    }
    return {
      title: `Tạo Thư Mục Con (Ngày ${currentDay})`,
      desc: `Thư mục con sẽ nằm trong ngày ${currentDay} (${currentMonth}). Anh có thể tự đặt tên tùy ý.`,
      label: 'Tên thư mục con:',
      placeholder: 'VD: bestway, chiều, sáng, ca 1...',
      suggestions: ['bestway', 'chiều', 'sáng', 'gấp', 'khách A'],
      btnText: 'Tạo Thư Mục Con',
    };
  }, [level, currentYear, currentMonth, currentDay]);

  // Tách riêng File PDF và File Ảnh trong Ngày
  const dayPdfs = useMemo(
    () => dayContents.directFiles.filter((f) => f.type !== 'image' && !f.image_url),
    [dayContents.directFiles]
  );
  const dayImages = useMemo(
    () => dayContents.directFiles.filter((f) => f.type === 'image' || Boolean(f.image_url)),
    [dayContents.directFiles]
  );

  // Tách riêng File PDF và File Ảnh trong Thư mục con
  const subfolderPdfs = useMemo(
    () => subfolderFiles.filter((f) => f.type !== 'image' && !f.image_url),
    [subfolderFiles]
  );
  const subfolderImages = useMemo(
    () => subfolderFiles.filter((f) => f.type === 'image' || Boolean(f.image_url)),
    [subfolderFiles]
  );

  return (
    <div
      onContextMenu={handleContainerContextMenu}
      className="flex flex-col h-full space-y-2.5 relative select-none"
    >
      {/* THANH BREADCRUMB PHONG CÁCH WINDOWS EXPLORER / NETWORK DRIVE */}
      <div className="flex items-center justify-between gap-2 bg-card/60 p-2 rounded-xl border border-border/60 shrink-0 text-xs shadow-xs">
        {/* Nhóm nút Back và Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto py-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateUp}
            disabled={currentPath.length === 0}
            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-30"
            title="Quay lại thư mục trước (Back)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>

          {/* Đường dẫn Cây thư mục */}
          <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground select-none flex-nowrap">
            <button
              onClick={() => handleNavigateToBreadcrumb(-1)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                currentPath.length === 0
                  ? 'text-foreground font-semibold bg-accent/60'
                  : 'hover:text-foreground hover:bg-secondary'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-primary" />
              <span>Gốc</span>
            </button>

            {currentPath.map((segment, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <button
                  onClick={() => handleNavigateToBreadcrumb(idx)}
                  className={`px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px] ${
                    idx === currentPath.length - 1
                      ? 'text-foreground font-semibold bg-accent/60'
                      : 'hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Nút thao tác nhanh bên phải: Tạo thư mục, Tải ảnh, Thêm file */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewFolderOpen(true)}
              className="h-7 text-xs gap-1 border-border/60 rounded-lg bg-card text-muted-foreground hover:text-foreground"
              title="Tạo thư mục mới (hoặc nhấp chuột phải)"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Thư mục mới</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImageUploadOpen(true)}
              className="h-7 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors"
              title="Tải ảnh lên thư mục này (nén WebP nét căng)"
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>Thêm ảnh</span>
            </Button>
          )}

          {isAdmin && onNewExportInFolder && (
            <Button
              size="sm"
              onClick={() => {
                const date =
                  currentMonth && currentDay
                    ? `${currentMonth.slice(0, 4)}-${currentDay}`
                    : undefined;
                onNewExportInFolder(currentSubfolder, date);
              }}
              className="h-7 text-xs gap-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs px-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm file vào đây</span>
            </Button>
          )}
        </div>
      </div>

      {/* VÙNG NỘI DUNG THƯ MỤC / DANH SÁCH FILE */}
      <div
        onContextMenu={handleContainerContextMenu}
        className="flex-1 min-h-0 overflow-y-auto p-3 rounded-xl border border-border/50 bg-card/20 space-y-4"
      >
        {/* CẤP 0: DANH SÁCH CÁC NĂM (GỐC) */}
        {level === 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
              <span>Chọn Năm</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Chuột phải vào vùng trống để tạo thư mục mới)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all duration-200 cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                      + Tạo năm mới
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      VD: 2027, 2028...
                    </div>
                  </div>
                </button>
              )}

              {availableYears.map((year) => (
                <FolderItemCard
                  key={year}
                  name={year}
                  type="year"
                  itemCount={
                    items.filter((i) => i.exported_at && i.exported_at.startsWith(year))
                      .length
                  }
                  onClick={() => setCurrentPath([year])}
                />
              ))}
            </div>
          </div>
        )}

        {/* CẤP 1: DANH SÁCH CÁC THÁNG */}
        {level === 1 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
              <span>Năm {currentYear} &gt; Chọn Tháng</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Chuột phải vào vùng trống để tạo tháng mới)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all duration-200 cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                      + Tạo tháng mới
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      VD: {currentYear}-11, {currentYear}-12...
                    </div>
                  </div>
                </button>
              )}

              {availableMonths.map((month) => (
                <FolderItemCard
                  key={month}
                  name={month}
                  type="month"
                  itemCount={
                    items.filter((i) => i.exported_at && i.exported_at.startsWith(month))
                      .length
                  }
                  onClick={() => setCurrentPath([currentYear, month])}
                />
              ))}
            </div>
          </div>
        )}

        {/* CẤP 2: DANH SÁCH CÁC NGÀY TRONG THÁNG */}
        {level === 2 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
              <span>Tháng {currentMonth} &gt; Chọn Ngày</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (Chuột phải vào vùng trống để tạo ngày mới)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all duration-200 cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                      + Tạo ngày mới
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      VD: 10-16, 10-17...
                    </div>
                  </div>
                </button>
              )}

              {availableDays.map(({ dayTag, count }) => (
                <FolderItemCard
                  key={dayTag}
                  name={dayTag}
                  type="day"
                  itemCount={count}
                  onClick={() => setCurrentPath([currentYear, currentMonth, dayTag])}
                />
              ))}
            </div>
          </div>
        )}

        {/* CẤP 3: BÊN TRONG THƯ MỤC NGÀY (GỒM THƯ MỤC CON, FILE PDF VÀ HÌNH ẢNH) */}
        {level === 3 && (
          <div className="space-y-5">
            {/* 1. Nhóm thư mục con (ví dụ: bestway, chiều...) */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
                <span>Thư Mục Con Trong Ngày {currentDay}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Chuột phải vào vùng trống để tạo thư mục mới)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsNewFolderOpen(true)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 transition-all duration-200 cursor-pointer select-none group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                        + Tạo thư mục con
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        bestway, chiều, ca 1...
                      </div>
                    </div>
                  </button>
                )}

                {dayContents.subfolders.map(({ name, count }) => (
                  <FolderItemCard
                    key={name}
                    name={name}
                    type="subfolder"
                    itemCount={count}
                    onClick={() =>
                      setCurrentPath([currentYear, currentMonth, currentDay, name])
                    }
                  />
                ))}
              </div>
            </div>

            {/* 2. Nhóm hình ảnh đính kèm trong ngày */}
            {dayImages.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Hình Ảnh Đính Kèm (Ngày {currentDay})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    {dayImages.length} hình ảnh
                  </span>
                </div>
                <div className="space-y-2">
                  {dayImages.map((file) => (
                    <FileItemCard
                      key={file.id}
                      item={file}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewImage={(item) => setViewingImage(item)}
                      isHighlighted={file.id === highlightItemId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Nhóm file xuất PDF trực tiếp nằm ở thư mục ngày */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>File Xuất PDF (Thư mục gốc ngày {currentDay})</span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  {dayPdfs.length} file
                </span>
              </div>

              {dayPdfs.length === 0 && dayImages.length === 0 && dayContents.subfolders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs bg-card/40 rounded-xl border border-dashed border-border space-y-2">
                  <div>Thư mục ngày {currentDay} chưa có file nào.</div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsImageUploadOpen(true)}
                      className="text-xs gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Thêm ảnh</span>
                    </Button>
                    {onNewExportInFolder && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const date = `${currentMonth.slice(0, 4)}-${currentDay}`;
                          onNewExportInFolder(undefined, date);
                        }}
                        className="text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm file PDF</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayPdfs.map((file) => (
                    <FileItemCard
                      key={file.id}
                      item={file}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewImage={(item) => setViewingImage(item)}
                      onAttachImage={(item) => onEdit?.(item)}
                      isHighlighted={file.id === highlightItemId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CẤP 4: BÊN TRONG THƯ MỤC CON (VÍ DỤ TRONG bestway HOẶC chiều) */}
        {level === 4 && (
          <div className="space-y-4">
            {/* Hình ảnh trong thư mục con */}
            {subfolderImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Hình Ảnh Trong Thư Mục "{currentSubfolder}"</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {subfolderImages.length} hình ảnh
                  </span>
                </div>
                <div className="space-y-2">
                  {subfolderImages.map((file) => (
                    <FileItemCard
                      key={file.id}
                      item={file}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewImage={(item) => setViewingImage(item)}
                      onAttachImage={(item) => onEdit?.(item)}
                      isHighlighted={file.id === highlightItemId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* File PDF trong thư mục con */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Danh Sách File Xuất Trong Thư Mục "{currentSubfolder}"</span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  {subfolderPdfs.length} file
                </span>
              </div>

              {subfolderPdfs.length === 0 && subfolderImages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs bg-card/40 rounded-xl border border-dashed border-border space-y-2">
                  <div>Thư mục "{currentSubfolder}" chưa có file nào.</div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsImageUploadOpen(true)}
                      className="text-xs gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Thêm ảnh</span>
                    </Button>
                    {onNewExportInFolder && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const date = `${currentMonth.slice(0, 4)}-${currentDay}`;
                          onNewExportInFolder(currentSubfolder, date);
                        }}
                        className="text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm file PDF</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {subfolderPdfs.map((file) => (
                    <FileItemCard
                      key={file.id}
                      item={file}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewImage={(item) => setViewingImage(item)}
                      isHighlighted={file.id === highlightItemId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MENU NGỮ CẢNH CHUỘT PHẢI (CONTEXT MENU NHƯ DESKTOP WINDOWS) */}
      {contextMenu.isOpen && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 select-none text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground border-b border-border/40 mb-1 flex items-center justify-between">
            <span>Menu thao tác</span>
            <span className="text-amber-400 font-semibold">Explorer</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
                setIsNewFolderOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent text-xs font-medium transition-colors text-left"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Thư mục mới...</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
                setIsImageUploadOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent text-xs font-medium transition-colors text-left"
            >
              <FileImage className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thêm hình ảnh...</span>
            </button>
          )}

          {isAdmin && onNewExportInFolder && (
            <button
              onClick={() => {
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
                const date =
                  currentMonth && currentDay
                    ? `${currentMonth.slice(0, 4)}-${currentDay}`
                    : undefined;
                onNewExportInFolder(currentSubfolder, date);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-accent text-xs font-medium transition-colors text-left"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Thêm file xuất xưởng...</span>
            </button>
          )}

          <div className="my-1 border-t border-border/40" />

          <button
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
              handleNavigateUp();
            }}
            disabled={currentPath.length === 0}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent text-xs transition-colors disabled:opacity-40 text-left"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Quay lại thư mục trước</span>
          </button>
        </div>
      )}

      {/* DIALOG TẠO THƯ MỤC LINH HOẠT TẠI MỌI CẤP */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-1">
              <FolderPlus className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-semibold">
              {modalInfo.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {modalInfo.desc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground text-xs">
                {modalInfo.label}
              </label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={modalInfo.placeholder}
                className="font-mono text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateFolder();
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-muted-foreground">
              <span>Gợi ý:</span>
              {modalInfo.suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewFolderName(tag)}
                  className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono border border-border/50 text-foreground hover:bg-accent transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewFolderOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {modalInfo.btnText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL TẢI ẢNH VÀ NÉN TỰ ĐỘNG WEBP */}
      <ImageUploadModal
        isOpen={isImageUploadOpen}
        onOpenChange={setIsImageUploadOpen}
        currentPath={currentPath}
      />

      {/* MODAL PHÓNG TO ẢNH FULL MÀN HÌNH (LIGHTBOX) */}
      <ImageLightboxModal
        item={viewingImage}
        isOpen={Boolean(viewingImage)}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
};
