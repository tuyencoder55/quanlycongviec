import React, { useState } from 'react';
import type { ExportItem } from '../types';
import { formatDate } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';
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
} from 'lucide-react';

interface ExportTableProps {
  items: ExportItem[];
  isAdmin: boolean;
  onEdit?: (item: ExportItem) => void;
  onDelete?: (id: string) => void;
}

type SortField = 'exported_at' | 'board_code' | 'mold_code' | 'ref_value' | 'type';
type SortOrder = 'asc' | 'desc';

export const ExportTable: React.FC<ExportTableProps> = ({
  items,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('exported_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
  const sortedItems = [...items].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortField === 'exported_at') {
      valA = new Date(valA).getTime().toString();
      valB = new Date(valB).getTime().toString();
    }
    const cmp = valA.localeCompare(valB);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Kiểu hiển thị theo loại xuất
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'board':
        return (
          <Badge variant="indigo" className="gap-1 font-mono text-[10px] px-2 py-0.5">
            <Layers className="w-3 h-3" />
            <span>Bảng</span>
          </Badge>
        );
      case 'mold':
        return (
          <Badge variant="emerald" className="gap-1 font-mono text-[10px] px-2 py-0.5">
            <Box className="w-3 h-3" />
            <span>Khuôn</span>
          </Badge>
        );
      case 'po':
        return (
          <Badge variant="amber" className="gap-1 font-mono text-[10px] px-2 py-0.5">
            <Hash className="w-3 h-3" />
            <span>PO</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/30">
        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-foreground">Không có dữ liệu xuất nào</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Không tìm thấy dòng xuất xưởng nào phù hợp với bộ lọc tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header Bảng tính Google Sheets */}
          <thead>
            <tr className="border-b border-border/80 bg-secondary/70 text-muted-foreground font-mono select-none">
              <th className="py-2.5 px-3 w-12 text-center border-r border-border/50 font-semibold">
                #
              </th>

              <th
                onClick={() => handleSort('exported_at')}
                className="py-2.5 px-3 w-28 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ngày xuất</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('type')}
                className="py-2.5 px-3 w-24 border-r border-border/50 font-semibold hover:text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Loại</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
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

              <th className="py-2.5 px-3 min-w-[280px] border-r border-border/50 font-semibold">
                Tên đầy đủ (Tên file gốc)
              </th>

              <th className="py-2.5 px-3 w-44 border-r border-border/50 font-semibold">
                Ghi chú
              </th>

              {isAdmin && (
                <th className="py-2.5 px-3 w-20 text-center font-semibold">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>

          {/* Dữ liệu các dòng Bảng tính */}
          <tbody className="divide-y divide-border/50 font-mono">
            {sortedItems.map((item, index) => {
              const isNameCopied = copiedId === `name-${item.id}`;
              const isBoardCopied = copiedId === `board-${item.id}`;
              const isMoldCopied = copiedId === `mold-${item.id}`;
              const isPoCopied = copiedId === `po-${item.id}`;

              return (
                <tr
                  key={item.id}
                  className="group hover:bg-accent/40 transition-colors font-sans"
                >
                  {/* STT */}
                  <td className="py-2 px-3 text-center text-muted-foreground/70 font-mono text-[11px] border-r border-border/40 bg-secondary/15">
                    {index + 1}
                  </td>

                  {/* Ngày xuất */}
                  <td className="py-2 px-3 font-mono text-[11px] text-foreground/90 whitespace-nowrap border-r border-border/40">
                    {formatDate(item.exported_at)}
                  </td>

                  {/* Loại xuất */}
                  <td className="py-2 px-3 border-r border-border/40 whitespace-nowrap">
                    {getTypeBadge(item.type)}
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

                  {/* Tên đầy đủ (File) */}
                  <td className="py-2 px-3 border-r border-border/40 font-mono text-[11px] text-foreground/80">
                    <div
                      onClick={() => copyToClipboard(item.full_name, `name-${item.id}`)}
                      className="flex items-center justify-between gap-2 cursor-pointer hover:text-foreground group/name"
                      title="Nhấp để copy toàn bộ tên file"
                    >
                      <span className="truncate">{item.full_name}</span>
                      <button
                        type="button"
                        className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        {isNameCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-40 group-hover/name:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Ghi chú */}
                  <td className="py-2 px-3 border-r border-border/40 text-muted-foreground text-xs truncate max-w-[180px]">
                    {item.note || <span className="text-muted-foreground/30">-</span>}
                  </td>

                  {/* Thao tác (Chỉ Admin) */}
                  {isAdmin && (
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {onEdit && (
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
                        {onDelete && (
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
        <span>Tổng cộng: <strong className="text-foreground">{items.length}</strong> dòng xuất</span>
        <span>Mẹo: Nhấp đúp vào bất kỳ ô mã nào để copy nhanh</span>
      </div>
    </div>
  );
};
