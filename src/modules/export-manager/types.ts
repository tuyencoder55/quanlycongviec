import type { ExportRow, ExportType, RefKind } from '../../types/database';

export interface ExportItem extends ExportRow {}

export interface ExportFormData {
  type: ExportType;
  board_code: string;
  mold_code?: string;
  ref_kind?: RefKind;
  ref_value?: string;
  full_name: string;
  exported_at: string;
  note?: string;
}

export type ExportTypeFilter = 'all' | 'board' | 'mold' | 'po';
export type ExportDateFilter = 'all' | 'today' | '7days' | 'month';

export interface ExportStats {
  total: number;
  boardCount: number;
  moldCount: number;
  poCount: number;
}
