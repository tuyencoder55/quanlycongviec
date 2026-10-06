import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragStartEvent,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { useKanban } from './hooks/use-kanban';
import { KanbanColumn } from './components/kanban-column';
import { KanbanCard } from './components/kanban-card';
import { TaskDialog } from './components/task-dialog';
import { ArchiveDialog } from './components/archive-dialog';
import type { KanbanTask, TaskFormData } from './types';
import { useAuth } from '../../hooks/use-auth';
import { Plus, RefreshCw, Archive, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface KanbanBoardProps {
  externalSearch?: string;
}

type FilterMode = 'all' | 'urgent' | 'with_po' | 'due';

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ externalSearch = '' }) => {
  const {
    columns,
    archivedTasks,
    isLoading,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    restoreTask,
    archiveAllDone,
  } = useKanban();
  const { isAdmin } = useAuth();

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<string>('');

  // Cấu hình Sensors cho dnd-kit: Hỗ trợ cả chuột trên PC và chạm cảm ứng trên điện thoại
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!isAdmin) return;
    const taskId = event.active.id as string;
    for (const col of columns) {
      const found = col.tasks.find((t) => t.id === taskId);
      if (found) {
        setActiveTask(found);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    if (!isAdmin) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    let destColumnId = '';
    let newIndex = 0;

    const droppedOnColumn = columns.find((c) => c.id === overId);
    if (droppedOnColumn) {
      destColumnId = droppedOnColumn.id;
      newIndex = droppedOnColumn.tasks.length;
    } else {
      for (const col of columns) {
        const idx = col.tasks.findIndex((t) => t.id === overId);
        if (idx !== -1) {
          destColumnId = col.id;
          newIndex = idx;
          break;
        }
      }
    }

    if (destColumnId) {
      await moveTask(activeId, destColumnId, newIndex);
    }
  };

  const handleOpenAdd = (colId?: string) => {
    if (!isAdmin) return;
    setSelectedTask(null);
    setDefaultColumnId(colId || columns[0]?.id || '');
    setIsDialogOpen(true);
  };

  const handleCardClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = async (formData: TaskFormData, taskId?: string) => {
    if (taskId) {
      await updateTask({ id: taskId, updates: formData });
    } else {
      await createTask(formData);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  // Lọc thẻ theo từ khóa tìm kiếm và segmented control tab
  const queryTerm = externalSearch.trim().toLowerCase();
  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => {
      // 1. Tìm kiếm theo từ khóa
      if (queryTerm) {
        const matchTitle = t.title.toLowerCase().includes(queryTerm);
        const matchBoard = t.board_code && t.board_code.toLowerCase().includes(queryTerm);
        const matchMold = t.mold_code && t.mold_code.toLowerCase().includes(queryTerm);
        const matchRef = t.ref_value && t.ref_value.toLowerCase().includes(queryTerm);
        if (!matchTitle && !matchBoard && !matchMold && !matchRef) return false;
      }

      // 2. Lọc theo chế độ Segmented filter
      if (filterMode === 'urgent') {
        return t.priority === 'urgent' || t.priority === 'high';
      }
      if (filterMode === 'with_po') {
        return Boolean(t.ref_value);
      }
      if (filterMode === 'due') {
        return Boolean(t.due_date);
      }
      return true;
    }),
  }));

  const totalActiveTasks = columns.reduce((acc, c) => acc + c.tasks.length, 0);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Thanh công cụ phụ phong cách Linear: Tối giản, tập trung vào thao tác cá nhân */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 px-0.5">
        {/* Bộ lọc phân đoạn nhanh (Segmented Control) */}
        <div className="flex items-center gap-1 bg-card/60 p-1 rounded-lg border border-border/60 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              filterMode === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Tất cả ({totalActiveTasks})
          </button>
          <button
            onClick={() => setFilterMode('urgent')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              filterMode === 'urgent'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Gấp / Ưu tiên
          </button>
          <button
            onClick={() => setFilterMode('with_po')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              filterMode === 'with_po'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Đơn có PO
          </button>
          <button
            onClick={() => setFilterMode('due')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              filterMode === 'due'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Có hạn chót
          </button>
        </div>

        {/* Cụm công cụ bên phải */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Nút mở nhanh Kho lưu trữ */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveOpen(true)}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground border-border/60 rounded-lg bg-card/40"
            title="Xem kho lưu trữ các việc đã hoàn thành"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lưu trữ</span>
            {archivedTasks.length > 0 && (
              <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.2 rounded-full border border-border/50 text-foreground">
                {archivedTasks.length}
              </span>
            )}
          </Button>

          {/* Nút Làm mới */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
            title="Tải lại bảng"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Nút Thêm việc */}
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => handleOpenAdd()}
              className="h-8 gap-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs px-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm thẻ</span>
            </Button>
          )}
        </div>
      </div>

      {/* Khu vực các cột kéo thả Kanban - Chiếm trọn không gian */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3.5 h-full items-start">
            {filteredColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onCardClick={handleCardClick}
                onAddTaskClick={handleOpenAdd}
                isAdmin={isAdmin}
                onOpenArchive={() => setIsArchiveOpen(true)}
                archivedCount={archivedTasks.length}
                onArchiveAllDone={archiveAllDone}
              />
            ))}
          </div>

          {/* Hiệu ứng kéo thẻ bay theo con trỏ chuột */}
          <DragOverlay>
            {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Hộp thoại tạo / sửa thẻ chi tiết */}
      <TaskDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        columns={columns}
        initialTask={selectedTask}
        defaultColumnId={defaultColumnId}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isAdmin={isAdmin}
      />

      {/* Hộp thoại Quản lý kho việc đã lưu trữ */}
      <ArchiveDialog
        isOpen={isArchiveOpen}
        onOpenChange={setIsArchiveOpen}
        archivedTasks={archivedTasks}
        onRestore={restoreTask}
        onSelectTask={handleCardClick}
        isAdmin={isAdmin}
      />
    </div>
  );
};
