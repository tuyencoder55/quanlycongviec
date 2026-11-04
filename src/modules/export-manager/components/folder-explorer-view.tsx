import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ExportItem } from '../types';
import { FolderItemCard } from './folder-item-card';
import { FileItemCard } from './file-item-card';
import { ImageUploadModal } from './image-upload-modal';
import { ImageLightboxModal } from './image-lightbox-modal';
import { MoveFilesModal } from './move-files-modal';
import { useExports } from '../hooks/use-exports';
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
  FolderInput,
  ArrowLeft,
  ChevronRight,
  HardDrive,
  Plus,
  FileImage,
  FileText,
  Trash2,
  X,
  ArrowDownToLine,
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
  onPathChange?: (path: string[]) => void;
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
  onPathChange,
}) => {
  const { batchUpdateExports, batchDeleteExports, refetch } = useExports();

  // Đường dẫn hiện tại: [] = Root, ['2026'], ['2026', '2026-10'], ['2026', '2026-10', '10-15'], ['2026', '2026-10', '10-15', 'bestway']
  const [currentPath, setCurrentPath] = useState<string[]>(() => {
    if (targetPath && targetPath.length > 0) return targetPath;
    if (items.length > 0) {
      const latestDate = items[0].exported_at; // YYYY-MM-DD
      const year = latestDate.slice(0, 4);
      const month = latestDate.slice(0, 7);
      return [year, month];
    }
    const today = new Date().toISOString().slice(0, 10);
    const year = today.slice(0, 4);
    const month = today.slice(0, 7);
    return [year, month];
  });

  // Tự động nhảy tới thư mục mục tiêu khi người dùng bấm "Mở thư mục" từ bảng
  useEffect(() => {
    if (targetPath && targetPath.length > 0) {
      setCurrentPath(targetPath);
    }
  }, [targetPath, revealTrigger]);

  // Thông báo thay đổi đường dẫn cho component cha (để AI scanner nắm được folder hiện tại)
  useEffect(() => {
    onPathChange?.(currentPath);
  }, [currentPath, onPathChange]);

  // Danh sách các file được chọn (checkbox / quét chuột)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  // Khi chuyển thư mục thì xóa danh sách đã chọn
  useEffect(() => {
    setSelectedFileIds([]);
  }, [currentPath]);

  // Modal tạo thư mục mới
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Modal di chuyển file
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Kéo file vào Thư mục gốc khi đang ở trong thư mục con
  const [isOverRootDrop, setIsOverRootDrop] = useState(false);

  // Modal tải & nén ảnh
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Modal xem ảnh phóng to toàn màn hình (Lightbox)
  const [viewingImage, setViewingImage] = useState<ExportItem | null>(null);

  // Quét chuột chọn nhiều file (Marquee / Rubber-band selection như trên PC)
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const fileListContainerRef = useRef<HTMLDivElement>(null);

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

  // Lắng nghe mouseup toàn cục để kết thúc quét chuột
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setSelectionBox(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Bắt sự kiện dán ảnh trực tiếp từ clipboard (Ctrl + V) trên trang Explorer
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isNewFolderOpen || isImageUploadOpen || viewingImage || isMoveModalOpen) return;
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
  }, [isNewFolderOpen, isImageUploadOpen, viewingImage, isMoveModalOpen]);

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
      if (item.exported_at) {
        const d = item.exported_at.replace(/\//g, '-').slice(0, 10);
        if (d.length >= 4) set.add(d.slice(0, 4));
      }
    });
    if (set.size === 0) set.add(new Date().getFullYear().toString());
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items, customYears]);

  // Danh sách các tháng trong năm được chọn + tháng tự tạo
  const availableMonths = useMemo(() => {
    if (!currentYear) return [];
    const set = new Set<string>();
    customMonths.forEach((m) => {
      if (m.startsWith(currentYear)) set.add(m);
    });
    items.forEach((item) => {
      if (item.exported_at) {
        const d = item.exported_at.replace(/\//g, '-').slice(0, 10);
        if (d.startsWith(currentYear) && d.length >= 7) {
          set.add(d.slice(0, 7));
        }
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
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
      if (item.exported_at) {
        const d = item.exported_at.replace(/\//g, '-').slice(0, 10);
        if (d.startsWith(currentMonth) && d.length >= 10) {
          const dayTag = d.slice(5, 10);
          map.set(dayTag, (map.get(dayTag) || 0) + 1);
        }
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
    const dayItems = items.filter((item) => {
      const d = (item.exported_at || '').replace(/\//g, '-').slice(0, 10);
      return d === fullDate;
    });

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

    // Sắp xếp file mới tạo nhất lên đầu
    directFiles.sort((a, b) => {
      const timeA = new Date(a.created_at || a.exported_at).getTime();
      const timeB = new Date(b.created_at || b.exported_at).getTime();
      return timeB - timeA;
    });

    const subfolders = Array.from(subfolderMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        name,
        count,
      }));

    return { subfolders, directFiles };
  }, [items, currentMonth, currentDay, customFolders]);

  // Các file khi đã vào sâu trong thư mục con
  const subfolderFiles = useMemo(() => {
    if (!currentMonth || !currentDay || !currentSubfolder) return [];
    const fullDate = `${currentMonth.slice(0, 4)}-${currentDay}`;
    return items
      .filter((item) => {
        const d = (item.exported_at || '').replace(/\//g, '-').slice(0, 10);
        return (
          d === fullDate &&
          item.subfolder &&
          item.subfolder.toLowerCase() === currentSubfolder.toLowerCase()
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.exported_at).getTime();
        const timeB = new Date(b.created_at || b.exported_at).getTime();
        return timeB - timeA;
      });
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

  // Danh sách file PDF đang hiển thị ở màn hình hiện tại
  const currentPdfs = level === 4 ? subfolderPdfs : dayPdfs;

  // Xử lý chọn/bỏ chọn từng file (hỗ trợ Shift+Click dải file)
  const handleToggleSelectFile = (id: string, shiftKey: boolean, currentList: ExportItem[]) => {
    if (shiftKey && selectedFileIds.length > 0) {
      const lastSelectedId = selectedFileIds[selectedFileIds.length - 1];
      const lastIndex = currentList.findIndex((f) => f.id === lastSelectedId);
      const currentIndex = currentList.findIndex((f) => f.id === id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = currentList.slice(start, end + 1).map((f) => f.id);
        setSelectedFileIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        return;
      }
    }

    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn tất cả / Bỏ chọn tất cả file ở view hiện tại
  const handleSelectAllFiles = (files: ExportItem[]) => {
    const allIds = files.map((f) => f.id);
    const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedFileIds.includes(id));
    if (isAllSelected) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(allIds);
    }
  };

  // ==========================================
  // XỬ LÝ KÉO THẢ CHUỘT (HTML5 DRAG AND DROP)
  // ==========================================

  // Bắt đầu kéo 1 file hoặc nhóm file đã chọn
  const handleDragStartItem = (e: React.DragEvent, item: ExportItem) => {
    let idsToDrag = selectedFileIds;
    if (!selectedFileIds.includes(item.id)) {
      idsToDrag = [item.id];
      setSelectedFileIds([item.id]);
    }
    e.dataTransfer.setData('application/json', JSON.stringify(idsToDrag));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Thả file vào một thẻ Thư mục con hoặc Thư mục Ngày
  const handleDropFilesOnFolder = async (
    droppedIds: string[],
    targetName: string,
    targetType: 'year' | 'month' | 'day' | 'subfolder'
  ) => {
    if (droppedIds.length === 0) return;

    try {
      if (targetType === 'subfolder') {
        const fullDate = `${currentMonth?.slice(0, 4)}-${currentDay}`;
        await batchUpdateExports({
          ids: droppedIds,
          updates: {
            exported_at: fullDate,
            subfolder: targetName,
          },
        });
      } else if (targetType === 'day') {
        const fullDate = `${currentYear}-${targetName}`;
        await batchUpdateExports({
          ids: droppedIds,
          updates: {
            exported_at: fullDate,
            subfolder: null,
          },
        });
      }

      await refetch();
      setSelectedFileIds([]);
    } catch (err) {
      console.error('Lỗi khi thả file vào thư mục:', err);
    }
  };

  // Xác nhận di chuyển qua Hộp thoại MoveFilesModal
  const handleConfirmMoveModal = async (targetDate: string, targetSubfolder: string | null) => {
    if (selectedFileIds.length === 0) return;

    await batchUpdateExports({
      ids: selectedFileIds,
      updates: {
        exported_at: targetDate,
        subfolder: targetSubfolder,
      },
    });

    if (targetSubfolder && !customFolders.includes(targetSubfolder)) {
      const updated = [...customFolders, targetSubfolder];
      setCustomFolders(updated);
      localStorage.setItem('nexus_custom_folders', JSON.stringify(updated));
    }

    await refetch();
    setSelectedFileIds([]);
  };

  // Xóa hàng loạt file đã chọn
  const handleBatchDelete = async () => {
    if (!isAdmin || selectedFileIds.length === 0) return;
    if (window.confirm(`Anh có chắc chắn muốn xóa vĩnh viễn ${selectedFileIds.length} file đã chọn không?`)) {
      await batchDeleteExports(selectedFileIds);
      await refetch();
      setSelectedFileIds([]);
    }
  };

  // ==========================================
  // XỬ LÝ QUÉT CHUỘT VẼ KHUNG CHỌN (MARQUEE)
  // ==========================================
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Chỉ nhận chuột trái
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('[data-file-id]') ||
      target.closest('[role="dialog"]')
    ) {
      return;
    }

    isMouseDownRef.current = true;
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !selectionBox) return;

    setSelectionBox((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));

    const boxLeft = Math.min(selectionBox.startX, e.clientX);
    const boxRight = Math.max(selectionBox.startX, e.clientX);
    const boxTop = Math.min(selectionBox.startY, e.clientY);
    const boxBottom = Math.max(selectionBox.startY, e.clientY);

    if (fileListContainerRef.current) {
      const fileElements = fileListContainerRef.current.querySelectorAll('[data-file-id]');
      const newlySelected: string[] = [];

      fileElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Kiểm tra va chạm giao nhau giữa khung chữ nhật quét và thẻ file
        const isIntersecting = !(
          rect.right < boxLeft ||
          rect.left > boxRight ||
          rect.bottom < boxTop ||
          rect.top > boxBottom
        );

        const fileId = el.getAttribute('data-file-id');
        if (isIntersecting && fileId) {
          newlySelected.push(fileId);
        }
      });

      if (newlySelected.length > 0) {
        setSelectedFileIds((prev) => Array.from(new Set([...prev, ...newlySelected])));
      }
    }
  };

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

      {/* VÙNG NỘI DUNG THƯ MỤC / DANH SÁCH FILE CÓ HỖ TRỢ QUÉT CHUỘT VẼ KHUNG */}
      <div
        ref={fileListContainerRef}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onContextMenu={handleContainerContextMenu}
        className="flex-1 min-h-0 overflow-y-auto p-3 rounded-xl border border-border/50 bg-card/20 space-y-4 relative"
      >
        {/* CẤP 0: DANH SÁCH CÁC NĂM (GỐC) */}
        {level === 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
              <span>Chọn Năm • 年份列表</span>
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
              <span>Năm {currentYear} &gt; Chọn Tháng • 月份列表</span>
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
              <span>Tháng {currentMonth} &gt; Chọn Ngày • 日期列表</span>
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
                  onDropFiles={handleDropFilesOnFolder}
                />
              ))}
            </div>
          </div>
        )}

        {/* CẤP 3: BÊN TRONG THƯ MỤC NGÀY (GỒM THƯ MỤC CON, FILE PDF VÀ HÌNH ẢNH) */}
        {level === 3 && (
          <div className="space-y-5">
            {/* 1. Nhóm thư mục con (ví dụ: bestway, chiều, PO...) - Đóng vai trò Drop Target */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-between">
                <span>Thư Mục Con (Ngày {currentDay}) • 子目录</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Nắm file kéo thả trực tiếp vào ô thư mục bên dưới)
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
                    onDropFiles={handleDropFilesOnFolder}
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
                    <span>Hình Ảnh Đính Kèm (Ngày {currentDay}) • 图片附件</span>
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
                      isSelected={selectedFileIds.includes(file.id)}
                      onToggleSelect={(id, shiftKey) =>
                        handleToggleSelectFile(id, shiftKey, dayContents.directFiles)
                      }
                      onDragStartItem={handleDragStartItem}
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
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>File Xuất PDF (Ngày {currentDay}) • PDF 文件</span>
                </div>

                <div className="flex items-center gap-3">
                  {dayPdfs.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground text-[11px] normal-case select-none">
                      <input
                        type="checkbox"
                        checked={
                          dayPdfs.length > 0 &&
                          dayPdfs.every((p) => selectedFileIds.includes(p.id))
                        }
                        onChange={() => handleSelectAllFiles(dayPdfs)}
                        className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer accent-primary"
                      />
                      <span>Chọn tất cả ({dayPdfs.length})</span>
                    </label>
                  )}
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    {dayPdfs.length} file
                  </span>
                </div>
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
                      isSelected={selectedFileIds.includes(file.id)}
                      onToggleSelect={(id, shiftKey) =>
                        handleToggleSelectFile(id, shiftKey, dayPdfs)
                      }
                      onDragStartItem={handleDragStartItem}
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

        {/* CẤP 4: BÊN TRONG THƯ MỤC CON (VÍ DỤ TRONG bestway HOẶC PO) */}
        {level === 4 && (
          <div className="space-y-4">
            {/* Khu vực Drop Target thả chuột để di chuyển ngược ra ngoài Thư mục gốc ngày */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsOverRootDrop(true);
              }}
              onDragLeave={() => setIsOverRootDrop(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsOverRootDrop(false);
                const raw = e.dataTransfer.getData('application/json');
                if (raw) {
                  try {
                    const ids = JSON.parse(raw);
                    if (Array.isArray(ids) && ids.length > 0) {
                      const fullDate = `${currentMonth.slice(0, 4)}-${currentDay}`;
                      await handleConfirmMoveModal(fullDate, null);
                    }
                  } catch {}
                }
              }}
              onClick={() => setCurrentPath([currentYear, currentMonth, currentDay])}
              className={`p-3 rounded-xl border border-dashed transition-all flex items-center justify-between text-xs cursor-pointer select-none ${
                isOverRootDrop
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/60 shadow-lg scale-[1.01]'
                  : 'border-border/70 bg-card/40 text-muted-foreground hover:bg-card hover:border-amber-500/40 hover:text-foreground'
              }`}
              title="Nhấp để quay ra hoặc kéo file thả vào đây để đưa ra ngoài Thư mục gốc ngày"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span className="font-medium">Thư Mục Gốc Ngày {currentDay}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kéo thả file vào đây để đưa ra ngoài thư mục gốc</span>
              </div>
            </div>

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
                      isSelected={selectedFileIds.includes(file.id)}
                      onToggleSelect={(id, shiftKey) =>
                        handleToggleSelectFile(id, shiftKey, subfolderFiles)
                      }
                      onDragStartItem={handleDragStartItem}
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

                <div className="flex items-center gap-3">
                  {subfolderPdfs.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground text-[11px] normal-case select-none">
                      <input
                        type="checkbox"
                        checked={
                          subfolderPdfs.length > 0 &&
                          subfolderPdfs.every((p) => selectedFileIds.includes(p.id))
                        }
                        onChange={() => handleSelectAllFiles(subfolderPdfs)}
                        className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer accent-primary"
                      />
                      <span>Chọn tất cả ({subfolderPdfs.length})</span>
                    </label>
                  )}
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    {subfolderPdfs.length} file
                  </span>
                </div>
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
                      isSelected={selectedFileIds.includes(file.id)}
                      onToggleSelect={(id, shiftKey) =>
                        handleToggleSelectFile(id, shiftKey, subfolderPdfs)
                      }
                      onDragStartItem={handleDragStartItem}
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
      </div>

      {/* KHUNG QUÉT CHỮ NHẬT MARQUEE KHI KÉO CHUỘT (PHONG CÁCH PC) */}
      {selectionBox && (
        <div
          className="fixed border-2 border-primary/70 bg-primary/20 pointer-events-none rounded z-50 shadow-sm backdrop-blur-[1px]"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
          }}
        />
      )}

      {/* THANH CÔNG CỤ THAO TÁC HÀNG LOẠT (BATCH ACTION BAR NỔI DƯỚI ĐÁY) */}
      {selectedFileIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 border border-primary/40 shadow-2xl backdrop-blur-xl px-4 py-2.5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-foreground">
              Đã chọn <strong className="text-primary font-mono">{selectedFileIds.length}</strong> file
            </span>
          </div>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setIsMoveModalOpen(true)}
              className="h-8 text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs px-3"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Di chuyển tới...</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchDelete}
              className="h-8 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 rounded-xl gap-1 px-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFileIds([])}
            className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl px-2.5 gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Bỏ chọn</span>
          </Button>
        </div>
      )}

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

      {/* MODAL DI CHUYỂN NHIỀU FILE (MOVE FILES MODAL) */}
      <MoveFilesModal
        isOpen={isMoveModalOpen}
        onOpenChange={setIsMoveModalOpen}
        selectedCount={selectedFileIds.length}
        currentDate={
          currentMonth && currentDay
            ? `${currentMonth.slice(0, 4)}-${currentDay}`
            : new Date().toISOString().split('T')[0]
        }
        currentSubfolder={currentSubfolder}
        availableSubfolders={dayContents.subfolders.map((s) => s.name)}
        onConfirmMove={handleConfirmMoveModal}
      />

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
