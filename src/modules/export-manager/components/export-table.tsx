import React, { useState } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
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
  History,
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
    let isBoardLegacy = Boolean(item.is_legacy);

    if (item.type === 'board') {
      boardDate = item.exported_at;
    } else if (item.board_code) {
      const found = pool.find(
        (e) => e.board_code.toLowerCase() === item.board_code.toLowerCase() && (e.type === 'board' || e.is_legacy)
      );
      if (found) {
        boardDate = found.exported_at;
        if (found.is_legacy) isBoardLegacy = true;
      }
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

    return { boardDate, moldDate, poDate, isBoardLegacy };
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
      valA = datesA.isBoardLegacy ? '0000-00-00' : (datesA.boardDate || '');
      valB = datesB.isBoardLegacy ? '0000-00-00' : (datesB.boardDate || '');
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
      <div className="p-12 text-center rounded-[12px] border border-dashed border-[var(--border-strong)] bg-surface">
        <FileText className="w-8 h-8 text-faint mx-auto mb-2" strokeWidth={1.8} />
        <h4 className="text-[13px] font-semibold text-text">Không có dữ liệu xuất nào</h4>
        <p className="text-[12px] text-muted-text mt-1">
          Không tìm thấy dòng xuất khuôn bảng nào phù hợp với bộ lọc tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[12px] bg-surface flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12.5px]">
          {/* Header Bảng tra cứu — 1 dòng không nhảy chữ */}
          <thead>
            <tr className="border-b border-[var(--border)] bg-track text-muted-text font-mono text-[11.5px] select-none">
              <th className="py-2.5 px-3 w-11 text-center border-r border-[var(--border)] font-medium whitespace-nowrap">
                #
              </th>

              <th
                onClick={() => handleSort('board_code')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Mã Bảng</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              <th
                onClick={() => handleSort('mold_code')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Mã Khuôn</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              <th
                onClick={() => handleSort('ref_value')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Số PO / Ngày</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              {/* 3 Cột ngày xuất riêng biệt cho Bảng, Khuôn và PO */}
              <th
                onClick={() => handleSort('board_date')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5 text-tag-board-text">
                  <Layers className="w-3 h-3 shrink-0" />
                  <span>Xuất Bảng</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              <th
                onClick={() => handleSort('mold_date')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5 text-dot-mold">
                  <Box className="w-3 h-3 shrink-0" />
                  <span>Xuất Khuôn</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              <th
                onClick={() => handleSort('po_date')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5 text-tag-po-text">
                  <Hash className="w-3 h-3 shrink-0" />
                  <span>Xuất PO</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              <th
                onClick={() => handleSort('full_name')}
                className="py-2.5 px-3 border-r border-[var(--border)] font-medium hover:text-text cursor-pointer transition-colors whitespace-nowrap"
              >
                <div className="inline-flex items-center gap-1.5">
                  <span>Tên đầy đủ (Tên file gốc)</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
                </div>
              </th>

              {(isAdmin || onRevealInFolder) && (
                <th className="py-2.5 px-3 text-center font-medium whitespace-nowrap">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>

          {/* Dữ liệu các dòng Bảng tính — đồng bộ token Light & Dark */}
          <tbody className="divide-y divide-[var(--border)] font-mono">
            {sortedItems.map((item, index) => {
              const { boardDate, moldDate, poDate, isBoardLegacy } = getExportDates(item);

              const isNameCopied = copiedId === `name-${item.id}`;
              const isBoardCopied = copiedId === `board-${item.id}`;
              const isMoldCopied = copiedId === `mold-${item.id}`;
              const isPoCopied = copiedId === `po-${item.id}`;

              return (
                <tr
                  key={item.id}
                  onDoubleClick={() => onRevealInFolder?.(item)}
                  className="group bg-row hover:bg-row-hover transition-colors font-sans"
                  title="Nhấp đúp chuột vào dòng để mở vị trí trong Thư Mục"
                >
                  {/* STT */}
                  <td className="py-2.5 px-3 text-center text-subtle font-mono text-[12px] border-r border-[var(--border)] whitespace-nowrap tabular-nums">
                    {index + 1}
                  </td>

                  {/* Mã Bảng */}
                  <td className="py-2.5 px-3 border-r border-[var(--border)] font-mono whitespace-nowrap">
                    <div
                      onClick={() => copyToClipboard(item.board_code, `board-${item.id}`)}
                      className="inline-flex items-center gap-1.5 cursor-pointer group/copy"
                      title="Nhấp để copy mã bảng"
                    >
                      <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-tag-board-bg text-tag-board-text">
                        {item.board_code}
                      </span>
                      {isBoardCopied ? (
                        <Check className="w-3.5 h-3.5 text-dot-mold shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-80 transition-opacity text-subtle shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Mã Khuôn */}
                  <td className="py-2.5 px-3 border-r border-[var(--border)] font-mono whitespace-nowrap">
                    {item.mold_code ? (
                      <div
                        onClick={() => copyToClipboard(item.mold_code!, `mold-${item.id}`)}
                        className="inline-flex items-center gap-1.5 cursor-pointer group/copy"
                        title="Nhấp để copy mã khuôn"
                      >
                        <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-emerald-500/10 text-dot-mold">
                          {item.mold_code}
                        </span>
                        {isMoldCopied ? (
                          <Check className="w-3.5 h-3.5 text-dot-mold shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-80 transition-opacity text-subtle shrink-0" />
                        )}
                      </div>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  {/* Số PO / Tham chiếu */}
                  <td className="py-2.5 px-3 border-r border-[var(--border)] font-mono whitespace-nowrap">
                    {item.ref_value ? (
                      <div
                        onClick={() => copyToClipboard(item.ref_value!, `po-${item.id}`)}
                        className="inline-flex items-center gap-1.5 cursor-pointer group/copy"
                        title="Nhấp để copy PO / Tham chiếu"
                      >
                        <span className="px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-tag-po-bg text-tag-po-text">
                          {item.ref_kind === 'po' ? `PO ${item.ref_value}` : item.ref_value}
                        </span>
                        {isPoCopied ? (
                          <Check className="w-3.5 h-3.5 text-dot-mold shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-80 transition-opacity text-subtle shrink-0" />
                        )}
                      </div>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  {/* 1. Ngày xuất Bảng */}
                  <td className="py-2.5 px-3 font-mono text-[12px] whitespace-nowrap border-r border-[var(--border)] tabular-nums">
                    {isBoardLegacy ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-track text-muted-text text-[11px] font-sans font-medium"
                        title="Bảng đã xuất trước đó (hồ sơ cũ)"
                      >
                        <History className="w-3 h-3 text-subtle shrink-0" />
                        <span>Hồ sơ cũ</span>
                      </span>
                    ) : boardDate ? (
                      <span className="inline-flex items-center gap-1.5 text-tag-board-text font-medium">
                        <Calendar className="w-3 h-3 opacity-70 shrink-0" />
                        <span>{formatDate(boardDate)}</span>
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  {/* 2. Ngày xuất Khuôn */}
                  <td className="py-2.5 px-3 font-mono text-[12px] whitespace-nowrap border-r border-[var(--border)] tabular-nums">
                    {moldDate ? (
                      <span className="inline-flex items-center gap-1.5 text-dot-mold font-medium">
                        <Calendar className="w-3 h-3 opacity-70 shrink-0" />
                        <span>{formatDate(moldDate)}</span>
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  {/* 3. Ngày xuất PO */}
                  <td className="py-2.5 px-3 font-mono text-[12px] whitespace-nowrap border-r border-[var(--border)] tabular-nums">
                    {poDate ? (
                      <span className="inline-flex items-center gap-1.5 text-tag-po-text font-medium">
                        <Calendar className="w-3 h-3 opacity-70 shrink-0" />
                        <span>{formatDate(poDate)}</span>
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>

                  {/* Tên đầy đủ (File) — cắt gọn 1 dòng không đẩy tràn cột Thao tác */}
                  <td className="py-2.5 px-3 border-r border-[var(--border)] font-mono text-[12.5px] max-w-[260px] xl:max-w-[360px]">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div
                        onClick={() => onRevealInFolder?.(item)}
                        className="flex items-center gap-1.5 min-w-0 cursor-pointer group/file flex-1"
                        title={`${item.full_name} — Nhấp để mở thư mục`}
                      >
                        {item.subfolder ? (
                          <span className="px-1.5 py-0.5 rounded-[6px] text-[10.5px] font-mono bg-tag-po-bg text-tag-po-text shrink-0 inline-flex items-center gap-1">
                            <FolderOpen className="w-3 h-3 shrink-0" />
                            <span>{item.subfolder}</span>
                          </span>
                        ) : (
                          <FolderOpen className="w-3.5 h-3.5 text-subtle shrink-0" />
                        )}
                        <span className="truncate font-medium text-text group-hover/file:text-primary group-hover/file:underline">
                          {item.full_name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.full_name, `name-${item.id}`);
                        }}
                        className="shrink-0 w-6 h-6 rounded-[6px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
                        title="Sao chép tên file này"
                      >
                        {isNameCopied ? (
                          <Check className="w-3.5 h-3.5 text-dot-mold" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Thao tác */}
                  {(isAdmin || onRevealInFolder) && (
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1">
                        {onRevealInFolder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRevealInFolder(item);
                            }}
                            className="h-7 px-2.5 rounded-[8px] text-[12px] font-medium bg-surface border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-track text-text inline-flex items-center gap-1.5 transition-colors"
                            title={`Mở vị trí trong Cây Thư Mục (${item.subfolder ? `thư mục ${item.subfolder}` : `ngày ${formatDate(item.exported_at)}`})`}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-dot-po shrink-0" />
                            <span>Mở</span>
                          </button>
                        )}
                        {isAdmin && onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
                            title="Sửa dòng xuất"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-subtle hover:text-pdf-text hover:bg-pdf-bg transition-colors"
                            title="Xóa dòng xuất"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
      <div className="py-2.5 px-4 bg-track border-t border-[var(--border)] flex items-center justify-between text-[12px] font-mono text-muted-text select-none">
        <span>
          Tổng cộng: <strong className="text-text">{items.length}</strong> dòng xuất khuôn bảng
        </span>
        <span className="hidden sm:inline font-sans text-subtle">
          Mẹo: Nhấp vào bất kỳ ô mã hoặc tên file nào để copy nhanh
        </span>
      </div>
    </div>
  );
};
