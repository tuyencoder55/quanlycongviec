import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  ArrowRight,
  Check,
  Key,
  ExternalLink,
} from 'lucide-react';
import {
  scanScreenshotWithGemini,
  matchScannedItemsWithSystem,
  getGeminiApiKey,
  saveGeminiApiKey,
  sanitizeApiKey,
  type MatchedScannedItem,
} from '../utils/ai-scanner';
import { useExports } from '../hooks/use-exports';
import { useKanban } from '../../kanban/hooks/use-kanban';
import { formatDate } from '../../../lib/utils';

interface AiScannerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onSuccess?: () => void;
}

export const AiScannerModal: React.FC<AiScannerModalProps> = ({
  isOpen,
  onOpenChange,
  isAdmin,
  onSuccess,
}) => {
  const { exportsList, createExport, refetch: refetchExports } = useExports();
  const { columns, updateTask, refetch: refetchKanban } = useKanban();

  // Gom toàn bộ task Kanban để đối chiếu
  const allTasks = columns.flatMap((c) => c.tasks);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawImageData, setRawImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [matchedItems, setMatchedItems] = useState<MatchedScannedItem[]>([]);
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoCompleteTasks, setAutoCompleteTasks] = useState(true);

  // Quản lý API Key tiện lợi ngay trên giao diện
  const [currentKey, setCurrentKey] = useState<string>(() => getGeminiApiKey());
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getGeminiApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cập nhật key mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      const saved = getGeminiApiKey();
      setCurrentKey(saved);
      setApiKeyInput(saved);
      if (!saved) {
        setShowKeyConfig(true);
      }
    }
  }, [isOpen]);

  // Lắng nghe phím Ctrl + V dán ảnh
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Nếu người dùng đang gõ trong input text (ví dụ input API key), không can thiệp paste
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleProcessImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, currentKey]);

  // Xử lý file ảnh khi dán hoặc upload
  const handleProcessImageFile = (file: File) => {
    setScanError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);

      // Tách base64 data không kèm header data:image/xxx;base64,
      const base64Data = result.split(',')[1];
      const mime = file.type || 'image/png';
      if (base64Data) {
        setRawImageData({ base64: base64Data, mimeType: mime });
        await runAiScan(base64Data, mime);
      }
    };
    reader.readAsDataURL(file);
  };

  // Gọi AI quét ảnh và đối chiếu dữ liệu
  const runAiScan = async (base64Data: string, mimeType: string, customKey?: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const extractedList = await scanScreenshotWithGemini(base64Data, mimeType, customKey);
      if (extractedList.length === 0) {
        setScanError('AI không tìm thấy tên file nào trong ảnh. Anh vui lòng kiểm tra lại ảnh chụp.');
        setMatchedItems([]);
        return;
      }

      // Đối chiếu danh sách AI tìm được với database hiện tại
      const matched = matchScannedItemsWithSystem(extractedList, allTasks, exportsList);
      setMatchedItems(matched);
    } catch (err: any) {
      console.error('Lỗi khi AI phân tích ảnh:', err);
      const msg = err.message || 'Lỗi khi AI đọc ảnh. Vui lòng thử lại.';
      setScanError(msg);
      // Nếu là lỗi xác thực, tự động mở phần cấu hình API Key để người dùng dễ kiểm tra
      if (msg.includes('API') || msg.includes('401') || msg.includes('403') || msg.includes('Khóa API')) {
        setShowKeyConfig(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Lưu API Key và quét lại ảnh nếu có
  const handleSaveKey = async (overrideKey?: string) => {
    const targetKey = overrideKey !== undefined ? overrideKey : apiKeyInput;
    const cleanKey = sanitizeApiKey(targetKey);
    if (!cleanKey) return;
    saveGeminiApiKey(cleanKey);
    setCurrentKey(cleanKey);
    setApiKeyInput(cleanKey);
    setShowKeyConfig(false);
    setScanError(null);

    // Nếu đã có ảnh đang chờ, tự động quét lại ngay bằng key mới
    if (rawImageData) {
      await runAiScan(rawImageData.base64, rawImageData.mimeType, cleanKey);
    }
  };

  // Toggle tick chọn từng item
  const handleToggleItem = (id: string) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selectedToExport: !item.selectedToExport } : item
      )
    );
  };

  // Toggle chọn tất cả
  const handleToggleAll = (select: boolean) => {
    setMatchedItems((prev) =>
      prev.map((item) => ({ ...item, selectedToExport: select }))
    );
  };

  // Xác nhận xuất vào Xuất Khuôn Bảng
  const handleConfirmExport = async () => {
    if (!isAdmin) return;
    const selected = matchedItems.filter((item) => item.selectedToExport);
    if (selected.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const item of selected) {
        // 1. Tạo dòng xuất tương ứng
        if (item.actionSuggest === 'export_po_only' || item.ref_value) {
          // Bảng đã có trước đó, chỉ xuất thêm PO
          await createExport({
            type: 'po',
            board_code: item.board_code,
            mold_code: item.mold_code,
            ref_kind: item.ref_kind || 'po',
            ref_value: item.ref_value,
            full_name: item.full_name,
            exported_at: exportDate,
            note: item.actionLabel,
          });
        } else {
          // Xuất mới Bảng
          await createExport({
            type: 'board',
            board_code: item.board_code,
            mold_code: item.mold_code,
            full_name: item.full_name,
            exported_at: exportDate,
            note: 'Xuất bảng từ AI Scanner',
          });

          // Xuất mới Khuôn nếu có mã khuôn
          if (item.mold_code) {
            await createExport({
              type: 'mold',
              board_code: item.board_code,
              mold_code: item.mold_code,
              full_name: item.full_name,
              exported_at: exportDate,
              note: 'Xuất khuôn từ AI Scanner',
            });
          }
        }

        // 2. Tự động tick hoàn thành thẻ trên Kanban nếu được chọn
        if (autoCompleteTasks && item.matchedTask && !item.matchedTask.done) {
          const doneCol = columns.find((c) => c.title.toLowerCase().includes('xong'));
          await updateTask({
            id: item.matchedTask.id,
            updates: {
              done: true,
              column_id: doneCol?.id || item.matchedTask.column_id,
            },
          });
        }
      }

      await refetchExports();
      await refetchKanban();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu xuất từ AI:', err);
      alert(`Đã xảy ra lỗi: ${err.message || 'Không thể ghi nhận xuất'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset modal
  const handleReset = () => {
    setImagePreview(null);
    setRawImageData(null);
    setMatchedItems([]);
    setScanError(null);
  };

  const selectedCount = matchedItems.filter((i) => i.selectedToExport).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-5 gap-4 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  AI Đọc Ảnh Chụp & Đối Chiếu Xuất Khuôn Bảng
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Chụp màn hình danh sách file rồi bấm <strong>Ctrl + V</strong> — AI sẽ tự đọc, đối chiếu Kanban và tự động chuyển qua xuất khuôn bảng.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                className={`h-7 text-xs gap-1 border-border/60 ${
                  !currentKey
                    ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Cấu hình Google Gemini API Key"
              >
                <Key className="w-3 h-3 text-amber-400" />
                <span>{currentKey ? 'Đổi API Key' : 'Nhập API Key'}</span>
              </Button>

              {imagePreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs gap-1 border-border/60 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Quét ảnh khác</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* PHẦN CẤU HÌNH API KEY (TỰ ĐỘNG HIỆN HOẶC KHI BẤM NÚT) */}
        {showKeyConfig && (
          <div className="p-3 bg-secondary/60 rounded-xl border border-border/70 space-y-2.5 shrink-0 text-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>Cấu hình Gemini API Key</span>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span>Lấy API Key miễn phí tại Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Dán mã API Key (ví dụ: AQ... hoặc AIzaSy...)"
                className="h-8 text-xs font-mono bg-card/80 border-border/70"
              />
              <Button
                size="sm"
                onClick={() => handleSaveKey()}
                disabled={!apiKeyInput.trim()}
                className="h-8 text-xs px-3 font-medium shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Lưu Key & Thử lại
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              API Key được lưu an toàn trực tiếp trên trình duyệt của anh (localStorage), không cần chỉnh file .env hay deploy lại Vercel.
            </p>
          </div>
        )}

        {/* VÙNG 1: DÁN ẢNH HOẶC TẢI ẢNH (KHI CHƯA CÓ KẾT QUẢ) */}
        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 min-h-[260px] border-2 border-dashed border-border/80 hover:border-primary/60 bg-card/30 hover:bg-card/60 transition-all rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessImageFile(file);
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-secondary/80 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h4 className="text-sm font-semibold text-foreground">
              Bấm <kbd className="px-2 py-0.5 bg-secondary text-primary rounded font-mono text-xs border border-border">Ctrl + V</kbd> để dán ảnh chụp màn hình ngay
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Hoặc nhấp vào đây để chọn file ảnh chụp từ máy tính. AI sẽ tự động đọc tên file, mã bảng, khuôn và số PO.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden space-y-3">
            {/* Thanh trạng thái AI Scan */}
            <div className="flex items-center justify-between bg-card/60 px-3 py-2 rounded-xl border border-border/60 shrink-0 text-xs">
              <div className="flex items-center gap-2">
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-foreground font-medium">
                      AI đang đọc và bóc tách danh sách file từ ảnh...
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-foreground font-medium">
                      Đã nhận diện thành công: <strong>{matchedItems.length}</strong> file
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  Đã chọn: <strong className="text-primary font-mono">{selectedCount}</strong>/{matchedItems.length}
                </span>
                <button
                  onClick={() => handleToggleAll(selectedCount !== matchedItems.length)}
                  className="text-primary hover:underline text-xs font-medium"
                >
                  {selectedCount === matchedItems.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                </button>
              </div>
            </div>

            {/* Báo lỗi nếu có */}
            {scanError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{scanError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyConfig(true)}
                  className="h-6 text-[11px] px-2 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 shrink-0"
                >
                  Đổi API Key
                </Button>
              </div>
            )}

            {/* BẢNG KẾT QUẢ ĐỐI CHIẾU THÔNG MINH */}
            <div className="flex-1 min-h-0 overflow-auto border border-border/50 rounded-xl bg-card/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur-md border-b border-border/60 text-muted-foreground font-mono select-none">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={matchedItems.length > 0 && selectedCount === matchedItems.length}
                        onChange={(e) => handleToggleAll(e.target.checked)}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="py-2 px-3 min-w-[200px] font-medium border-r border-border/40">
                      Tên file bóc tách
                    </th>
                    <th className="py-2 px-3 min-w-[140px] font-medium border-r border-border/40">
                      Mã Bảng & Khuôn
                    </th>
                    <th className="py-2 px-3 min-w-[120px] font-medium border-r border-border/40">
                      Số PO
                    </th>
                    <th className="py-2 px-3 min-w-[130px] font-medium border-r border-border/40">
                      Trạng thái Kanban
                    </th>
                    <th className="py-2 px-3 min-w-[160px] font-medium border-r border-border/40">
                      Lịch sử Xuất trước đó
                    </th>
                    <th className="py-2 px-3 min-w-[180px] font-medium">
                      Đề xuất của AI
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/30">
                  {matchedItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`hover:bg-accent/40 transition-colors cursor-pointer select-none ${
                        item.selectedToExport ? 'bg-primary/5' : 'opacity-70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-2 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={item.selectedToExport}
                          onChange={() => handleToggleItem(item.id)}
                          className="rounded border-border"
                        />
                      </td>

                      {/* Tên file */}
                      <td className="py-2 px-3 border-r border-border/30 font-mono text-[11px] text-foreground font-medium">
                        <span className="truncate block max-w-[220px]" title={item.full_name}>
                          {item.full_name}
                        </span>
                      </td>

                      {/* Mã Bảng & Khuôn */}
                      <td className="py-2 px-3 border-r border-border/30 font-mono">
                        <div className="flex items-center gap-1 flex-wrap text-[10px]">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {item.board_code}
                          </span>
                          {item.mold_code && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {item.mold_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Số PO */}
                      <td className="py-2 px-3 border-r border-border/30 font-mono text-[11px] text-amber-400">
                        {item.ref_value ? `PO ${item.ref_value}` : '-'}
                      </td>

                      {/* Trạng thái Kanban */}
                      <td className="py-2 px-3 border-r border-border/30 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                            item.isTaskDone
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.matchedTask
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-secondary text-muted-foreground border-border/50'
                          }`}
                        >
                          {item.isTaskDone && <Check className="w-2.5 h-2.5" />}
                          <span>{item.taskStatusLabel}</span>
                        </span>
                      </td>

                      {/* Lịch sử Xuất trước đó */}
                      <td className="py-2 px-3 border-r border-border/30 font-mono text-[10px]">
                        <div className="space-y-0.5 text-muted-foreground">
                          <div>
                            Bảng: {item.boardExportedDate ? (
                              <strong className="text-indigo-400">{formatDate(item.boardExportedDate)}</strong>
                            ) : (
                              <span>chưa xuất</span>
                            )}
                          </div>
                          <div>
                            Khuôn: {item.moldExportedDate ? (
                              <strong className="text-emerald-400">{formatDate(item.moldExportedDate)}</strong>
                            ) : (
                              <span>chưa xuất</span>
                            )}
                          </div>
                          {item.poExportedDate && (
                            <div>
                              PO: <strong className="text-amber-400">{formatDate(item.poExportedDate)}</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Đề xuất hành động */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            item.actionSuggest === 'export_po_only'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : item.actionSuggest === 'already_exported_all'
                              ? 'bg-secondary text-muted-foreground border-border/60'
                              : 'bg-primary/15 text-primary border-primary/30'
                          }`}
                        >
                          <span>{item.actionLabel}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VÙNG 3: FOOTER THIẾT LẬP VÀ XÁC NHẬN CHUYỂN */}
        {matchedItems.length > 0 && (
          <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Ngày xuất:</span>
                <input
                  type="date"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  className="h-7 bg-background border border-input rounded-md px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                <input
                  type="checkbox"
                  checked={autoCompleteTasks}
                  onChange={(e) => setAutoCompleteTasks(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span>Đồng thời đánh dấu HOÀN THÀNH trên Kanban</span>
              </label>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs"
              >
                Hủy
              </Button>

              <Button
                size="sm"
                onClick={handleConfirmExport}
                disabled={isSubmitting || selectedCount === 0 || !isAdmin}
                className="h-8 gap-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-3.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? 'Đang chuyển...'
                    : `Chuyển ${selectedCount} file vào Xuất khuôn bảng`}
                </span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
