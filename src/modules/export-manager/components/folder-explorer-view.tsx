import React, { useState, useMemo } from 'react';
import type { ExportItem } from '../types';
import { FolderItemCard } from './folder-item-card';
import { FileItemCard } from './file-item-card';
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
  FileText,
  Search,
} from 'lucide-react';

interface FolderExplorerViewProps {
  items: ExportItem[];
  isAdmin: boolean;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
  onNewExportInFolder?: (subfolder?: string, date?: string) => void;
}

export const FolderExplorerView: React.FC<FolderExplorerViewProps> = ({
  items,
  isAdmin,
  onEdit,
  onDelete,
  onNewExportInFolder,
}) => {
  // Đường dẫn hiện tại: [] = Root, ['2026'], ['2026', '2026-10'], ['2026', '2026-10', '10-15'], ['2026', '2026-10', '10-15', 'bestway']
  const [currentPath, setCurrentPath] = useState<string[]>(() => {
    // Nếu có dữ liệu, khởi đầu ngay tại tháng mới nhất để người dùng thấy folder ngày thân thuộc
    if (items.length > 0) {
      const latestDate = items[0].exported_at; // YYYY-MM-DD
      const year = latestDate.slice(0, 4);
      const month = latestDate.slice(0, 7);
      return [year, month];
    }
    return ['2026', '2026-10'];
  });

  // Modal tạo thư mục con mới
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [customFolders, setCustomFolders] = useState<string[]>([]);

  // Lọc items theo đường dẫn hiện tại
  const level = currentPath.length;
  const currentYear = currentPath[0];
  const currentMonth = currentPath[1];
  const currentDay = currentPath[2];
  const currentSubfolder = currentPath[3];

  // Danh sách các năm có trong dữ liệu
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.exported_at) set.add(item.exported_at.slice(0, 4));
    });
    if (set.size === 0) set.add('2026');
    return Array.from(set).sort().reverse();
  }, [items]);

  // Danh sách các tháng trong năm được chọn
  const availableMonths = useMemo(() => {
    if (!currentYear) return [];
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.exported_at && item.exported_at.startsWith(currentYear)) {
        set.add(item.exported_at.slice(0, 7)); // YYYY-MM
      }
    });
    if (set.size === 0) set.add(`${currentYear}-10`);
    return Array.from(set).sort().reverse();
  }, [items, currentYear]);

  // Danh sách các ngày trong tháng được chọn (hiển thị định dạng MM-DD như trong ảnh của anh)
  const availableDays = useMemo(() => {
    if (!currentMonth) return [];
    const map = new Map<string, number>(); // dayTag (MM-DD) -> số file
    items.forEach((item) => {
      if (item.exported_at && item.exported_at.startsWith(currentMonth)) {
        const dayTag = item.exported_at.slice(5, 10); // MM-DD (ví dụ 10-15)
        map.set(dayTag, (map.get(dayTag) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dayTag, count]) => ({ dayTag, count }));
  }, [items, currentMonth]);

  // Các thư mục con và file trong ngày được chọn
  const dayContents = useMemo(() => {
    if (!currentMonth || !currentDay) return { subfolders: [], directFiles: [] };
    const fullDate = `${currentMonth.slice(0, 4)}-${currentDay}`; // YYYY-MM-DD
    const dayItems = items.filter((item) => item.exported_at === fullDate);

    // Gom các thư mục con
    const subfolderMap = new Map<string, number>();
    const directFiles: ExportItem[] = [];

    // Thêm các custom folder người dùng vừa tạo (nếu có)
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
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  // Tạo thư mục mới
  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCustomFolders((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setIsNewFolderOpen(false);
    setNewFolderName('');
    // Chuyển thẳng vào thư mục vừa tạo
    if (currentDay) {
      setCurrentPath([...currentPath.slice(0, 3), name]);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2.5">
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
            title="Quay lại thư mục trước"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>

          {/* Đường dẫn Cây thư mục */}
          <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground select-none flex-nowrap">
            <button
              onClick={() => handleNavigateToBreadcrumb(-1)}
              className="flex items-center gap-1 hover:text-foreground px-1.5 py-0.5 rounded hover:bg-secondary transition-colors"
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

        {/* Nút thao tác nhanh bên phải */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && currentDay && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewFolderOpen(true)}
              className="h-7 text-xs gap-1 border-border/60 rounded-lg bg-card text-muted-foreground hover:text-foreground"
              title="Tạo thư mục con mới trong ngày này (như bestway, chiều...)"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Thư mục mới</span>
            </Button>
          )}

          {isAdmin && onNewExportInFolder && (
            <Button
              size="sm"
              onClick={() => {
                const date = currentMonth && currentDay ? `${currentMonth.slice(0, 4)}-${currentDay}` : undefined;
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
      <div className="flex-1 min-h-0 overflow-y-auto p-3 rounded-xl border border-border/50 bg-card/20 space-y-4">
        {/* CẤP 0: DANH SÁCH CÁC NĂM */}
        {level === 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider">
              Chọn Năm
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {availableYears.map((year) => (
                <FolderItemCard
                  key={year}
                  name={year}
                  type="year"
                  itemCount={items.filter((i) => i.exported_at.startsWith(year)).length}
                  onClick={() => setCurrentPath([year])}
                />
              ))}
            </div>
          </div>
        )}

        {/* CẤP 1: DANH SÁCH CÁC THÁNG TRONG NĂM */}
        {level === 1 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider">
              Các Tháng Trong Năm {currentYear}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {availableMonths.map((month) => (
                <FolderItemCard
                  key={month}
                  name={month}
                  type="month"
                  itemCount={items.filter((i) => i.exported_at.startsWith(month)).length}
                  onClick={() => setCurrentPath([currentYear, month])}
                />
              ))}
            </div>
          </div>
        )}

        {/* CẤP 2: DANH SÁCH CÁC NGÀY TRONG THÁNG (GIỐNG HỆT ẢNH 1 CỦA ANH) */}
        {level === 2 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider">
              Các Ngày Xuất Trong Tháng {currentMonth}
            </div>
            {availableDays.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Chưa có ngày nào xuất trong tháng này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
            )}
          </div>
        )}

        {/* CẤP 3: BÊN TRONG THƯ MỤC NGÀY (GIỐNG HỆT ẢNH 2 CỦA ANH: GỒM THƯ MỤC CON VÀ CÁC FILE) */}
        {level === 3 && (
          <div className="space-y-4">
            {/* Nhóm thư mục con (ví dụ: bestway, chiều...) */}
            {dayContents.subfolders.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Thư Mục Con Trong Ngày {currentDay}</span>
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    {dayContents.subfolders.length} thư mục
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
            )}

            {/* Nhóm file trực tiếp nằm ở thư mục ngày */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
                <span>File Xuất Trực Tiếp (Thư mục gốc ngày {currentDay})</span>
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  {dayContents.directFiles.length} file
                </span>
              </div>

              {dayContents.directFiles.length === 0 && dayContents.subfolders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs bg-card/40 rounded-xl border border-dashed border-border">
                  Thư mục ngày {currentDay} chưa có file nào. Anh bấm "+ Thêm file vào đây" hoặc "+ Thư mục mới" để bắt đầu nhé.
                </div>
              ) : (
                <div className="space-y-2">
                  {dayContents.directFiles.map((file) => (
                    <FileItemCard
                      key={file.id}
                      item={file}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CẤP 4: BÊN TRONG THƯ MỤC CON (VÍ DỤ TRONG bestway HOẶC chiều) */}
        {level === 4 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
              <span>
                Danh Sách File Trong Thư Mục "{currentSubfolder}" (Ngày {currentDay})
              </span>
              <span className="text-[10px] text-muted-foreground/80 font-normal">
                {subfolderFiles.length} file
              </span>
            </div>

            {subfolderFiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs bg-card/40 rounded-xl border border-dashed border-border">
                Thư mục "{currentSubfolder}" chưa có file xuất nào. Bấm "+ Thêm file vào đây" để ghi nhận xuất vào thư mục này.
              </div>
            ) : (
              <div className="space-y-2">
                {subfolderFiles.map((file) => (
                  <FileItemCard
                    key={file.id}
                    item={file}
                    isAdmin={isAdmin}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DIALOG TẠO THƯ MỤC CON MỚI */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-1">
              <FolderPlus className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-semibold">Tạo Thư Mục Mới</DialogTitle>
            <DialogDescription className="text-xs">
              Thư mục mới sẽ được tạo trong ngày <strong>{currentDay}</strong> ({currentMonth}). Anh có thể tự đặt tên tùy ý.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground text-xs">Tên thư mục con:</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="VD: bestway, chiều, sáng, ca 1..."
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
              <span>Gợi ý tên:</span>
              {['bestway', 'chiều', 'sáng', 'gấp', 'khách A'].map((tag) => (
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
              Tạo Thư Mục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
