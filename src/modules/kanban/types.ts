import type { TaskRow, ColumnRow, PriorityLevel, RefKind } from '../../types/database';

export interface KanbanTask extends TaskRow {}

export interface KanbanColumn extends ColumnRow {
  tasks: KanbanTask[];
}

export interface ParsedCodeResult {
  board_code: string | null;
  mold_code: string | null;
  ref_kind: RefKind | null;
  ref_value: string | null;
  raw: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  column_id: string;
  priority: PriorityLevel;
  due_date?: string;
  labels: string[];
  board_code?: string | null;
  mold_code?: string | null;
  ref_kind?: RefKind | null;
  ref_value?: string | null;
}
