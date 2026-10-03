import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchKanbanBoardData,
  createTaskApi,
  updateTaskApi,
  deleteTaskApi,
  updateTaskPositionApi,
  setTaskArchivedApi,
  archiveAllDoneTasksApi,
  clearAllArchivedTasksApi,
  type KanbanBoardData,
} from '../api';
import type { KanbanColumn, KanbanTask, TaskFormData } from '../types';
import type { TaskRow } from '../../../types/database';

export function useKanban() {
  const queryClient = useQueryClient();
  const queryKey = ['kanban-board'];

  const { data, isLoading, error, refetch } = useQuery<KanbanBoardData>({
    queryKey,
    queryFn: fetchKanbanBoardData,
    staleTime: 1000 * 60 * 2, // 2 phút
  });

  const columns: KanbanColumn[] = data?.columns || [];
  const archivedTasks: KanbanTask[] = data?.archivedTasks || [];
  const autoArchivedCount: number = data?.autoArchivedCount || 0;

  // 1. Tạo task mới
  const createMutation = useMutation({
    mutationFn: async (formData: TaskFormData) => {
      const targetCol = columns.find((c) => c.id === formData.column_id) || columns[0];
      const minPos = targetCol && targetCol.tasks.length > 0 ? targetCol.tasks[0].position : 1000;
      const newPos = minPos - 1000;
      return createTaskApi(formData, newPos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 2. Cập nhật thông tin task
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskRow> }) => {
      return updateTaskApi(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Xóa task
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteTaskApi(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 4. Lưu trữ (Archive) 1 task
  const archiveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return setTaskArchivedApi(taskId, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 5. Khôi phục (Restore) task từ kho lưu trữ về bảng Kanban
  const restoreTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return setTaskArchivedApi(taskId, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 6. Lưu trữ tất cả thẻ trên cột Xong
  const archiveAllDoneMutation = useMutation({
    mutationFn: async () => {
      const doneCol = columns.find((c) => c.title.toLowerCase().includes('xong'));
      if (!doneCol || doneCol.tasks.length === 0) return;
      const ids = doneCol.tasks.map((t) => t.id);
      return archiveAllDoneTasksApi(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 7. Kéo thả thẻ task (Optimistic Update phản hồi tức thì)
  const moveTask = async (
    taskId: string,
    destColumnId: string,
    newIndex: number
  ) => {
    const previousData = queryClient.getQueryData<KanbanBoardData>(queryKey);
    if (!previousData) return;

    let targetTask: KanbanTask | null = null;
    let sourceColId = '';

    for (const col of previousData.columns) {
      const found = col.tasks.find((t) => t.id === taskId);
      if (found) {
        targetTask = found;
        sourceColId = col.id;
        break;
      }
    }

    if (!targetTask) return;

    const destCol = previousData.columns.find((c) => c.id === destColumnId);
    if (!destCol) return;

    const isDone = destCol.title.toLowerCase().includes('xong');

    const destTasksWithoutTarget = destCol.tasks.filter((t) => t.id !== taskId);
    const updatedTarget: KanbanTask = {
      ...targetTask,
      column_id: destColumnId,
      done: isDone,
    };

    const newDestTasks = [...destTasksWithoutTarget];
    newDestTasks.splice(newIndex, 0, updatedTarget);

    let calculatedPos = 1000;
    if (newDestTasks.length === 1) {
      calculatedPos = 1000;
    } else if (newIndex === 0) {
      calculatedPos = (newDestTasks[1]?.position ?? 2000) - 1000;
    } else if (newIndex >= newDestTasks.length - 1) {
      calculatedPos = (newDestTasks[newIndex - 1]?.position ?? 0) + 1000;
    } else {
      const prevPos = newDestTasks[newIndex - 1]?.position ?? 0;
      const nextPos = newDestTasks[newIndex + 1]?.position ?? (prevPos + 2000);
      calculatedPos = (prevPos + nextPos) / 2;
    }

    updatedTarget.position = calculatedPos;

    const nextColumns = previousData.columns.map((col) => {
      if (col.id === sourceColId && sourceColId === destColumnId) {
        return {
          ...col,
          tasks: newDestTasks.map((t) => (t.id === taskId ? updatedTarget : t)),
        };
      }
      if (col.id === sourceColId) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        };
      }
      if (col.id === destColumnId) {
        return {
          ...col,
          tasks: newDestTasks.map((t) => (t.id === taskId ? updatedTarget : t)),
        };
      }
      return col;
    });

    queryClient.setQueryData<KanbanBoardData>(queryKey, {
      ...previousData,
      columns: nextColumns,
    });

    try {
      await updateTaskPositionApi(taskId, destColumnId, calculatedPos, isDone);
    } catch (err) {
      console.error('Lỗi khi di chuyển thẻ:', err);
      queryClient.setQueryData(queryKey, previousData);
    }
  };

  // 7. Xóa vĩnh viễn toàn bộ kho lưu trữ khỏi Supabase
  const clearAllArchivedMutation = useMutation({
    mutationFn: async (targetIds?: string[]) => {
      return clearAllArchivedTasksApi(targetIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    columns,
    archivedTasks,
    autoArchivedCount,
    isLoading,
    error,
    refetch,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    archiveTask: archiveTaskMutation.mutateAsync,
    restoreTask: restoreTaskMutation.mutateAsync,
    archiveAllDone: archiveAllDoneMutation.mutateAsync,
    clearAllArchived: clearAllArchivedMutation.mutateAsync,
    moveTask,
  };
}
