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
import { Plus, Search, RefreshCw, LayoutDashboard, Archive } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface KanbanBoardProps {
  externalSearch?: string;
}

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

  const [localSearch, setLocalSearch] = useState('');
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

  const handleOpenAdd = (columnId?: string) => {
    if (!isAdmin) return;
    setSelectedTask(null);
    setDefaultColumnId(columnId || columns[0]?.id || '');
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

  // Lọc thẻ theo từ khóa tìm kiếm
  const queryTerm = (externalSearch || localSearch).trim().toLowerCase();
  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((t) => {
      if (!queryTerm) return true;
      return (
        t.title.toLowerCase().includes(queryTerm) ||
        (t.board_code && t.board_code.toLowerCase().includes(queryTerm)) ||
        (t.mold_code && t.mold_code.toLowerCase().includes(queryTerm)) ||
        (t.ref_value && t.ref_value.toLowerCase().includes(queryTerm))
      );
    }),
  }));

  const totalActiveTasks = columns.reduce((acc, c) => acc + c.tasks.length, 0);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Thanh công cụ phụ của Bảng Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 p-3 rounded-2xl border border-border/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>Tiến độ sản xuất</span>
            <Badge variant="indigo" className="font-mono text-xs">
              {totalActiveTasks} thẻ việc
            </Badge>
          </div>

          {/* Ô lọc nhanh nội bộ */}
          <div className="relative hidden md:block w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Lọc mã bảng, khuôn..."
              className="w-full h-8 bg-background/60 border border-input rounded-lg pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Nút mở nhanh Kho lưu trữ */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveOpen(true)}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground border-border/80"
            title="Xem kho lưu trữ các việc đã hoàn thành"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kho lưu trữ</span>
            {archivedTasks.length > 0 && (
              <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.2 rounded-full border border-border">
                {archivedTasks.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          {isAdmin && (
            <Button
              variant="gradient"
              size="sm"
              onClick={() => handleOpenAdd()}
              className="h-8 gap-1.5 text-xs font-medium shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm việc mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Khu vực các cột kéo thả Kanban */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full items-start">
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

      {/* Dialog thêm / sửa thẻ */}
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

      {/* Dialog Kho lưu trữ các việc đã hoàn thành */}
      <ArchiveDialog
        isOpen={isArchiveOpen}
        onOpenChange={setIsArchiveOpen}
        archivedTasks={archivedTasks}
        onRestore={restoreTask}
        onDelete={handleDeleteTask}
        onSelectTask={handleCardClick}
        isAdmin={isAdmin}
      />
    </div>
  );
};
