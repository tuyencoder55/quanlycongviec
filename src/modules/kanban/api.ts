import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { TaskRow, ColumnRow, Database } from '../../types/database';
import type { KanbanColumn, KanbanTask, TaskFormData } from './types';
import { parseTaskTitle } from './utils/parser';

// Dữ liệu mẫu dự phòng khi chưa chạy migration trên Supabase
const FALLBACK_COLUMNS: ColumnRow[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    title: 'Cần làm',
    position: 1000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    title: 'Đang làm',
    position: 2000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    title: 'Xong',
    position: 3000,
    created_at: new Date().toISOString(),
  },
];

// Dữ liệu task mẫu ban đầu (để trống khi kết nối database thật)
const FALLBACK_TASKS: KanbanTask[] = [];

let localTasksStore: KanbanTask[] = [...FALLBACK_TASKS];

// Kiểm tra xem task đã hoàn thành quá 7 ngày chưa
export function isTaskOlderThan7Days(task: KanbanTask): boolean {
  if (!task.done) return false;
  const time = new Date(task.updated_at || task.created_at).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - time > sevenDaysMs;
}

export interface KanbanBoardData {
  columns: KanbanColumn[];
  archivedTasks: KanbanTask[];
  autoArchivedCount: number;
}

export async function fetchKanbanBoardData(): Promise<KanbanBoardData> {
  if (!isSupabaseConfigured) {
    return assembleBoardData(FALLBACK_COLUMNS, localTasksStore);
  }

  try {
    const [colsRes, tasksRes] = await Promise.all([
      supabase.from('columns').select('*').order('position', { ascending: true }),
      supabase.from('tasks').select('*').order('position', { ascending: true }),
    ]);

    if (colsRes.error || !colsRes.data || colsRes.data.length === 0) {
      console.warn('Chưa có bảng columns trên Supabase, dùng dữ liệu dự phòng:', colsRes.error?.message);
      return assembleBoardData(FALLBACK_COLUMNS, localTasksStore);
    }

    const columns: ColumnRow[] = colsRes.data as unknown as ColumnRow[];
    const tasks: KanbanTask[] = ((tasksRes.data || []) as unknown) as KanbanTask[];

    return assembleBoardData(columns, tasks);
  } catch (err) {
    console.error('Lỗi khi tải bảng Kanban từ Supabase:', err);
    return assembleBoardData(FALLBACK_COLUMNS, localTasksStore);
  }
}

function assembleBoardData(columns: ColumnRow[], tasks: KanbanTask[]): KanbanBoardData {
  const activeTasks: KanbanTask[] = [];
  const archivedTasks: KanbanTask[] = [];
  let autoArchivedCount = 0;

  for (const t of tasks) {
    const isOldDone = isTaskOlderThan7Days(t);
    if (t.archived || isOldDone) {
      archivedTasks.push(t);
      if (isOldDone && !t.archived) {
        autoArchivedCount++;
      }
    } else {
      activeTasks.push(t);
    }
  }

  const cols: KanbanColumn[] = columns.map((col) => ({
    ...col,
    tasks: activeTasks
      .filter((t) => t.column_id === col.id)
      .sort((a, b) => a.position - b.position),
  }));

  // Sắp xếp kho lưu trữ: task mới nhất lên đầu
  archivedTasks.sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  );

  return {
    columns: cols,
    archivedTasks,
    autoArchivedCount,
  };
}

export async function createTaskApi(formData: TaskFormData, position: number): Promise<KanbanTask> {
  const parsed = parseTaskTitle(formData.title);

  const insertPayload: Database['public']['Tables']['tasks']['Insert'] = {
    column_id: formData.column_id,
    title: formData.title,
    description: formData.description || null,
    due_date: formData.due_date || null,
    priority: formData.priority,
    labels: formData.labels || [],
    position,
    done: false,
    archived: false,
    board_code: parsed.board_code,
    mold_code: parsed.mold_code,
    ref_kind: parsed.ref_kind,
    ref_value: parsed.ref_value,
  };

  const createLocalFallback = (): KanbanTask => ({
    id: 'local-' + Date.now(),
    column_id: formData.column_id,
    title: formData.title,
    description: formData.description || null,
    due_date: formData.due_date || null,
    priority: formData.priority,
    labels: formData.labels || [],
    position,
    done: false,
    archived: false,
    board_code: parsed.board_code,
    mold_code: parsed.mold_code,
    ref_kind: parsed.ref_kind,
    ref_value: parsed.ref_value,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (!isSupabaseConfigured) {
    const created = createLocalFallback();
    localTasksStore = [created, ...localTasksStore];
    return created;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tasks') as any)
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) {
    console.warn('Lỗi tạo task trên Supabase (lưu dự phòng):', error?.message);
    const fallback = createLocalFallback();
    localTasksStore = [fallback, ...localTasksStore];
    return fallback;
  }

  return data as KanbanTask;
}

export async function updateTaskApi(id: string, updates: Partial<TaskRow>): Promise<void> {
  if (updates.title) {
    const parsed = parseTaskTitle(updates.title);
    updates.board_code = parsed.board_code;
    updates.mold_code = parsed.mold_code;
    updates.ref_kind = parsed.ref_kind;
    updates.ref_value = parsed.ref_value;
  }

  localTasksStore = localTasksStore.map((t) => (t.id === id ? { ...t, ...updates } : t));

  if (!isSupabaseConfigured) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any).update(updates).eq('id', id);
  if (error) {
    console.error('Lỗi cập nhật task trên Supabase:', error);
  }
}

export async function deleteTaskApi(id: string): Promise<void> {
  localTasksStore = localTasksStore.filter((t) => t.id !== id);

  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    console.error('Lỗi xóa task trên Supabase:', error);
  }
}

export async function updateTaskPositionApi(
  taskId: string,
  newColumnId: string,
  newPosition: number,
  isDone?: boolean
): Promise<void> {
  const updates: Partial<TaskRow> = {
    column_id: newColumnId,
    position: newPosition,
  };
  if (typeof isDone === 'boolean') {
    updates.done = isDone;
  }

  localTasksStore = localTasksStore.map((t) => (t.id === taskId ? { ...t, ...updates } : t));

  if (!isSupabaseConfigured) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any).update(updates).eq('id', taskId);
  if (error) {
    console.error('Lỗi cập nhật vị trí task trên Supabase:', error);
  }
}

// Lưu trữ (Archive) 1 task
export async function setTaskArchivedApi(taskId: string, archived: boolean): Promise<void> {
  const updates: Partial<TaskRow> = {
    archived,
    updated_at: new Date().toISOString(),
  };

  localTasksStore = localTasksStore.map((t) => (t.id === taskId ? { ...t, ...updates } : t));

  if (!isSupabaseConfigured) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any).update(updates).eq('id', taskId);
  if (error) {
    console.error('Lỗi lưu trữ task trên Supabase:', error);
  }
}

// Lưu trữ toàn bộ các task đã xong hiện tại trên cột Xong
export async function archiveAllDoneTasksApi(taskIds: string[]): Promise<void> {
  const now = new Date().toISOString();
  localTasksStore = localTasksStore.map((t) =>
    taskIds.includes(t.id) ? { ...t, archived: true, updated_at: now } : t
  );

  if (!isSupabaseConfigured) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any)
    .update({ archived: true, updated_at: now })
    .in('id', taskIds);
  if (error) {
    console.error('Lỗi lưu trữ hàng loạt trên Supabase:', error);
  }
}

// Xóa vĩnh viễn các task hoàn thành / lưu trữ khỏi Database Supabase để giải phóng dung lượng
export async function clearAllArchivedTasksApi(targetIds?: string[]): Promise<void> {
  if (targetIds && targetIds.length > 0) {
    localTasksStore = localTasksStore.filter((t) => !targetIds.includes(t.id));
  } else {
    localTasksStore = localTasksStore.filter((t) => !t.archived && !isTaskOlderThan7Days(t));
  }

  if (!isSupabaseConfigured) return;

  if (targetIds && targetIds.length > 0) {
    const { error } = await supabase.from('tasks').delete().in('id', targetIds);
    if (error) console.error('Lỗi xóa task trên Supabase:', error);
  } else {
    const { error } = await supabase.from('tasks').delete().eq('archived', true);
    if (error) console.error('Lỗi dọn sạch kho lưu trữ trên Supabase:', error);
  }
}

