import React, { useState } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Layers,
  Box,
  Hash,
  ArrowUpDown,
  FileText,
  Calendar,
  FolderOpen,
} from 'lucide-react';

interface ExportTableProps {
  items: ExportItem[];
  allExports?: ExportItem[];
  isAdmin: boolean;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
  onRevealInFolder?: (item: ExportItem) => void;
}

type SortField =
  | 'board_code'
  | 'mold_code'
  | 'ref_value'
  | 'board_date'
  | 'mold_date'
  | 'po_date'
  | 'full_name';
type SortOrder = 'asc' | 'desc';

export const ExportTable: React.FC<ExportTableProps> = ({
  items,
  allExports = [],
  isAdmin,
  onEdit,
  onDelete,
  onRevealInFolder,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('board_code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Bảng tra cứu chỉ hiển thị hồ sơ xuất xưởng (Bảng, Khuôn, PO). File ảnh chỉ hiển thị ở dạng Cây Thư Mục
  const validItems = items.filter((item) => item.type !== 'image');
  const pool = (allExports.length > 0 ? allExports : validItems).filter((e) => e.type !== 'image');

  // Tra cứu chéo ngày xuất riêng biệt cho từng thành phần: Bảng, Khuôn, PO
  const getExportDates = (item: ExportItem) => {
    // 1. Ngày xuất Bảng: lấy từ chính dòng này (nếu là board) hoặc dòng xuất bảng có cùng mã
    let boardDate: string | null = null;
    if (item.type === 'board') {
      boardDate = item.exported_at;
    } else if (item.board_code) {
      const found = pool.find(
        (e) => e.type === 'board' && e.board_code.toLowerCase() === item.board_code.toLowerCase()
      );
      if (found) boardDate = found.exported_at;
    }

    // 2. Ngày xuất Khuôn: lấy từ chính dòng này (nếu là mold) hoặc dòng xuất khuôn có cùng mã khuôn
    let moldDate: string | null = null;
    if (item.type === 'mold') {
      moldDate = item.exported_at;
    } else if (item.mold_code) {
      const moldCodeLower = item.mold_code.toLowerCase();
      const found = pool.find(
        (e) =>
          e.type === 'mold' &&
          e.mold_code &&
          e.mold_code.toLowerCase() === moldCodeLower
      );
      if (found) moldDate = found.exported_at;
    }

    // 3. Ngày xuất PO: lấy từ chính dòng này (nếu là PO) hoặc dòng xuất PO có cùng mã bảng & số PO
    let poDate: string | null = null;
    if (item.type === 'po') {
      poDate = item.exported_at;
    } else if (item.ref_value) {
      const found = pool.find(
        (e) =>
          e.type === 'po' &&
          e.board_code.toLowerCase() === item.board_code.toLowerCase() &&
          e.ref_value === item.ref_value
      );
      if (found) poDate = found.exported_at;
    }

    return { boardDate, moldDate, poDate };
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sắp xếp dữ liệu theo cột được chọn
  const sortedItems = [...validItems].sort((a, b) => {
    const datesA = getExportDates(a);
    const datesB = getExportDates(b);

    let valA = '';
    let valB = '';

    if (sortField === 'board_date') {
      valA = datesA.boardDate || '';
      valB = datesB.boardDate || '';
    } else if (sortField === 'mold_date') {
      valA = datesA.moldDate || '';
      valB = datesB.moldDate || '';
    } else if (sortField === 'po_date') {
      valA = datesA.poDate || '';
      valB = datesB.poDate || '';
    } else {
      valA = a[sortField] || '';
      valB = b[sortField] || '';
    }

    const cmp = valA.localeCompare(valB);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  if (items.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl border border-dashed border-border/50 bg-card/20">
        <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-foreground">Không có dữ liệu xuất nào</h4>
        <p className="text-[11px] text-muted-foreground mt-1">
          Không tìm thấy dòng xuất khuôn bảng nào phù hợp với bộ lọc tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/50 bg-card/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header Bảng tính Google Sheets */}
          <thead>
            <tr className="border-b border-border/80 bg-secondary/70 text-muted-foreground font-mono select-none">
              <th className="py-2.5 px-3 w-12 text-center border-r border-border/50 font-semibold">
                #
              </th>

              <th
                onClick={() => handleSort('board_code')}
                className="py-2.5 px-3 w-32 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Mã Bảng</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('mold_code')}
                className="py-2.5 px-3 w-28 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Mã Khuôn</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('ref_value')}
                className="py-2.5 px-3 w-36 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Số PO / Ngày</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {/* 3 Cột ngày xuất riêng biệt cho Bảng, Khuôn và PO */}
              <th
                onClick={() => handleSort('board_date')}
                className="py-2.5 px-3 w-32 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Layers className="w-3 h-3" />
                  <span>Ngày xuất Bảng</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('mold_date')}
                className="py-2.5 px-3 w-32 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Box className="w-3 h-3" />
                  <span>Ngày xuất Khuôn</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('po_date')}
                className="py-2.5 px-3 w-32 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Hash className="w-3 h-3" />
                  <span>Ngày xuất PO</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('full_name')}
                className="py-2.5 px-3 min-w-[280px] border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tên đầy đủ (Tên file gốc)</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              {(isAdmin || onRevealInFolder) && (
                <th className="py-2.5 px-3 w-24 text-center font-semibold">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>

          {/* Dữ liệu các dòng Bảng tính */}
          <tbody className="divide-y divide-border/50 font-mono">
            {sortedItems.map((item, index) => {
              const { boardDate, moldDate, poDate } = getExportDates(item);

              const isNameCopied = copiedId === `name-${item.id}`;
              const isBoardCopied = copiedId === `board-${item.id}`;
              const isMoldCopied = copiedId === `mold-${item.id}`;
              const isPoCopied = copiedId === `po-${item.id}`;

              return (
                <tr
                  key={item.id}
                  onDoubleClick={() => onRevealInFolder?.(item)}
                  className="group hover:bg-accent/40 transition-colors font-sans"
                  title="Nhấp đúp chuột vào dòng để mở vị trí trong Thư Mục"
                >
                  {/* STT */}
                  <td className="py-2 px-3 text-center text-muted-foreground/70 font-mono text-[11px] border-r border-border/40 bg-secondary/15">
                    {index + 1}
                  </td>

                  {/* Mã Bảng */}
                  <td className="py-2 px-3 border-r border-border/40 font-mono font-semibold text-primary">
                    <div
                      onClick={() => copyToClipboard(item.board_code, `board-${item.id}`)}
                      className="inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                      title="Nhấp để copy mã bảng"
                    >
                      <span>{item.board_code}</span>
                      {isBoardCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground" />
                      )}
                    </div>
                  </td>

                  {/* Mã Khuôn */}
                  <td className="py-2 px-3 border-r border-border/40 font-mono text-emerald-400">
                    {item.mold_code ? (
                      <div
                        onClick={() => copyToClipboard(item.mold_code!, `mold-${item.id}`)}
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                        title="Nhấp để copy mã khuôn"
                      >
                        <span>{item.mold_code}</span>
                        {isMoldCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 font-sans">-</span>
                    )}
                  </td>

                  {/* Số PO / Tham chiếu */}
                  <td className="py-2 px-3 border-r border-border/40 font-mono text-amber-400">
                    {item.ref_value ? (
                      <div
                        onClick={() => copyToClipboard(item.ref_value!, `po-${item.id}`)}
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                        title="Nhấp để copy PO / Tham chiếu"
                      >
                        <span>{item.ref_kind === 'po' ? `PO ${item.ref_value}` : item.ref_value}</span>
                        {isPoCopied ? (
                          <Check className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 font-sans">-</span>
                    )}
                  </td>

                  {/* 1. Ngày xuất Bảng */}
                  <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap border-r border-border/40">
                    {boardDate ? (
                      <span className="inline-flex items-center gap-1 text-indigo-400/90 font-medium">
                        <Calendar className="w-3 h-3 opacity-60" />
                        <span>{formatDate(boardDate)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30 font-sans">-</span>
                    )}
                  </td>

                  {/* 2. Ngày xuất Khuôn */}
                  <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap border-r border-border/40">
                    {moldDate ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400/90 font-medium">
                        <Calendar className="w-3 h-3 opacity-60" />
                        <span>{formatDate(moldDate)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30 font-sans">-</span>
                    )}
                  </td>

                  {/* 3. Ngày xuất PO */}
                  <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap border-r border-border/40">
                    {poDate ? (
                      <span className="inline-flex items-center gap-1 text-amber-400/90 font-medium">
                        <Calendar className="w-3 h-3 opacity-60" />
                        <span>{formatDate(poDate)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30 font-sans">-</span>
                    )}
                  </td>

                  {/* Tên đầy đủ (File) - Nhấp vào tên file để mở thư mục */}
                  <td className="py-2 px-3 border-r border-border/40 font-mono text-[11px] text-foreground/80">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => onRevealInFolder?.(item)}
                        className="flex items-center gap-1.5 min-w-0 cursor-pointer group/file hover:text-primary transition-colors flex-1"
                        title={`Nhấp để mở thư mục chứa file này (${item.subfolder ? item.subfolder : `Ngày ${formatDate(item.exported_at)}`})`}
                      >
                        {item.subfolder ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 group-hover/file:bg-amber-500/25 group-hover/file:border-amber-500/50 shrink-0 transition-all flex items-center gap-1 shadow-2xs">
                            <span>📁 {item.subfolder}</span>
                            <FolderOpen className="w-2.5 h-2.5 opacity-60 group-hover/file:opacity-100" />
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground border border-border/50 group-hover/file:text-foreground shrink-0 transition-all flex items-center gap-1">
                            <FolderOpen className="w-2.5 h-2.5 opacity-60 group-hover/file:opacity-100 text-amber-400" />
                          </span>
                        )}
                        <span className="truncate group-hover/file:underline font-medium text-foreground">
                          {item.full_name}
                        </span>
                      </div>

                      {/* Nút Copy riêng biệt */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.full_name, `name-${item.id}`);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Sao chép tên file này"
                      >
                        {isNameCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Thao tác */}
                  {(isAdmin || onRevealInFolder) && (
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Nút Mở vị trí thư mục (Reveal in folder) */}
                        {onRevealInFolder && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRevealInFolder(item);
                            }}
                            className="h-7 px-2 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors font-medium shadow-2xs"
                            title={`Mở vị trí trong Cây Thư Mục (${item.subfolder ? `thư mục ${item.subfolder}` : `ngày ${formatDate(item.exported_at)}`})`}
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mở folder</span>
                          </Button>
                        )}
                        {isAdmin && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            className="w-6 h-6 text-muted-foreground hover:text-foreground rounded-lg"
                            title="Sửa dòng xuất"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        {isAdmin && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item.id)}
                            className="w-6 h-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            title="Xóa dòng xuất"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer bảng tính tổng kết số dòng */}
      <div className="py-2 px-4 bg-secondary/40 border-t border-border/70 flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
        <span>
          Tổng cộng: <strong className="text-foreground">{items.length}</strong> dòng xuất khuôn bảng
        </span>
        <span>Mẹo: Nhấp vào bất kỳ ô mã hoặc tên file nào để copy nhanh</span>
      </div>
    </div>
  );
};
