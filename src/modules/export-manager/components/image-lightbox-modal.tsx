import React, { useState, useEffect } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
import { formatBytes } from '../utils/image-optimizer';
import {
  X,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  Folder,
  Layers,
  FileImage,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface ImageLightboxModalProps {
  item: ExportItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  // Reset zoom khi mở ảnh mới
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen, item]);

  // Đóng khi nhấn Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item || !item.image_url) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.image_url!;
    link.download = `${item.full_name || 'anh-xuat-kho'}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(item.image_url!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Nút đóng góc phải */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card border border-border/40 transition-colors"
        title="Đóng (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Thanh công cụ nổi trên đầu */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 shadow-xl text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-3.5 h-3.5 mr-1" />
          <span>Thu nhỏ</span>
        </Button>

        <span className="font-mono text-[11px] text-amber-400 px-1 font-semibold">
          {Math.round(zoom * 100)}%
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-3.5 h-3.5 mr-1" />
          <span>Phóng to</span>
        </Button>

        {zoom !== 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(1)}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            title="Kích thước gốc"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset</span>
          </Button>
        )}

        <div className="h-4 w-px bg-border/60 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          title="Sao chép link ảnh"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 mr-1" />
          )}
          <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          title="Tải ảnh về máy"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          <span>Tải về</span>
        </Button>
      </div>

      {/* Vùng hiển thị ảnh chính */}
      <div
        className="w-full h-full flex items-center justify-center overflow-auto p-4 md:p-12 cursor-grab active:cursor-grabbing select-none"
        onClick={onClose}
      >
        <div
          className="relative transition-transform duration-150 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={item.image_url}
            alt={item.full_name}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            draggable={false}
          />
        </div>
      </div>

      {/* Thanh thông tin chi tiết dưới đáy */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 shadow-xl text-xs max-w-[90vw] overflow-x-auto">
        <div className="flex items-center gap-1.5 font-semibold text-foreground shrink-0 font-mono">
          <FileImage className="w-4 h-4 text-emerald-400" />
          <span className="truncate max-w-[200px] sm:max-w-xs">{item.full_name}</span>
        </div>

        {item.board_code && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
            Mã: {item.board_code}
          </span>
        )}

        {item.subfolder && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
            <Folder className="w-3 h-3" />
            {item.subfolder}
          </span>
        )}

        {item.file_size_bytes ? (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium">
            {formatBytes(item.file_size_bytes)}
          </span>
        ) : null}

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono shrink-0">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(item.exported_at)}</span>
        </div>

        {item.note && (
          <span className="text-[11px] text-muted-foreground truncate max-w-xs hidden md:inline">
            • {item.note}
          </span>
        )}
      </div>
    </div>
  );
};
