import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import type {KanbanColumn, Task} from '@/types';
import { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns, getTasks, createTask, deleteTask, reorderTasks, updateTask } from '@/lib/api';
import { toast } from 'sonner';
import KanbanColumnItem from './KanbanColumn';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
    moduleId: string;
}

export default function KanbanBoard({ moduleId }: Props) {
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const [newColName, setNewColName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [colsData, tasksData] = await Promise.all([
                    getColumns(moduleId),
                    getTasks(moduleId)
                ]);
                setColumns(colsData);
                setTasks(tasksData);
            } catch (error) {
                toast.error('Błąd ładowania tablicy');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [moduleId]);

    // --- KOLUMNY ---
    const handleCreateColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColName.trim()) return;
        setIsCreating(true);
        try {
            const newCol = await createColumn(moduleId, newColName);
            setColumns([...columns, newCol]);
            setNewColName('');
            toast.success('Dodano kolumnę');
        } catch (error) { toast.error('Błąd'); }
        finally { setIsCreating(false); }
    };

    const handleUpdateColumn = async (id: string, name: string) => {
        setColumns(prev => prev.map(c => c.id === id ? { ...c, name } : c));
        updateColumn(id, name).catch(() => toast.error('Błąd'));
    };

    const handleDeleteColumn = async (id: string) => {
        if(!confirm('Usunąć kolumnę i zadania?')) return;
        setColumns(prev => prev.filter(c => c.id !== id));
        deleteColumn(id).catch(() => toast.error('Błąd'));
    };

    // --- ZADANIA ---
    const handleAddTask = async (columnId: string, title: string) => {
        const tempId = Math.random().toString();
        const optimisticTask: Task = {
            id: tempId, title, column_id: columnId, module_id: moduleId,
            priority: 'MEDIUM', task_order_index: 9999
        };
        setTasks(prev => [...prev, optimisticTask]);

        try {
            const newTask = await createTask({ title, moduleId, columnId });
            setTasks(prev => prev.map(t => t.id === tempId ? newTask : t));
        } catch (error) {
            setTasks(prev => prev.filter(t => t.id !== tempId));
            throw error;
        }
    };

    const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
        const oldTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        try {
            await updateTask(taskId, updates);
        } catch (error) {
            setTasks(oldTasks);
            toast.error('Błąd aktualizacji zadania');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if(!confirm('Usunąć zadanie?')) return;
        const oldTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== taskId));
        deleteTask(taskId).catch(() => {
            setTasks(oldTasks);
            toast.error('Błąd usuwania');
        });
    };

    // --- DND LOGIC ---
    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Column') {
            setActiveColumn(event.active.data.current.column);
        } else if (event.active.data.current?.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveTask) return;

        if (isActiveTask && isOverTask) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const overIndex = tasks.findIndex((t) => t.id === overId);
                if (tasks[activeIndex].column_id !== tasks[overIndex].column_id) {
                    tasks[activeIndex].column_id = tasks[overIndex].column_id;
                    return arrayMove(tasks, activeIndex, overIndex - 1);
                }
                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        if (isActiveTask && isOverColumn) {
            setTasks((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                if (tasks[activeIndex].column_id !== overId) {
                    tasks[activeIndex].column_id = overId as string;
                    return arrayMove(tasks, activeIndex, activeIndex);
                }
                return tasks;
            });
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (active.data.current?.type === 'Column') {
            if (activeId !== overId) {
                setColumns((cols) => {
                    const oldIndex = cols.findIndex(c => c.id === activeId);
                    const newIndex = cols.findIndex(c => c.id === overId);
                    const newCols = arrayMove(cols, oldIndex, newIndex);
                    const updates = newCols.map((col, i) => ({ id: col.id, orderIndex: i }));
                    reorderColumns(moduleId, updates);
                    return newCols;
                });
            }
        }

        if (active.data.current?.type === 'Task') {
            const currentTask = tasks.find(t => t.id === activeId);
            if (!currentTask) return;
            const targetColumnId = currentTask.column_id;
            const tasksInColumn = tasks.filter(t => t.column_id === targetColumnId);
            const updates = tasksInColumn.map((t, index) => ({
                id: t.id, columnId: targetColumnId, orderIndex: index
            }));
            reorderTasks(moduleId, updates).catch(() => toast.error('Błąd zapisu kolejności'));
        }
    };

    if (isLoading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden pb-4 px-4">
            <div className="flex h-full items-start gap-4 w-fit mx-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                        {columns.map((col) => (
                            <KanbanColumnItem
                                key={col.id}
                                column={col}
                                tasks={tasks.filter(t => t.column_id === col.id)}
                                onUpdateColumn={handleUpdateColumn}
                                onDeleteColumn={handleDeleteColumn}
                                onAddTask={handleAddTask}
                                onDeleteTask={handleDeleteTask}
                                onUpdateTask={handleUpdateTask}
                            />
                        ))}
                    </SortableContext>
                    {createPortal(
                        <DragOverlay>
                            {activeColumn && (
                                <KanbanColumnItem
                                    column={activeColumn}
                                    tasks={tasks.filter(t => t.column_id === activeColumn.id)}
                                    onUpdateColumn={() => {}} onDeleteColumn={() => {}} onAddTask={async () => {}} onDeleteTask={() => {}} onUpdateTask={() => {}}
                                />
                            )}
                            {activeTask && <TaskCard task={activeTask} onDelete={() => {}} onUpdate={() => {}} />}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>

                <div className="w-72 min-w-[18rem]">
                    <div className="bg-muted/30 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                        <form onSubmit={handleCreateColumn} className="flex flex-col gap-2">
                            <Input
                                placeholder="+ Nowa kolumna"
                                value={newColName}
                                onChange={e => setNewColName(e.target.value)}
                                className="bg-background"
                            />
                            <Button type="submit" size="sm" variant="secondary" disabled={isCreating || !newColName.trim()}>
                                {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Dodaj</>}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
