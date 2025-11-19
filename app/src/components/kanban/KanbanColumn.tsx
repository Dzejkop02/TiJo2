import { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {KanbanColumn, Task} from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Trash2, GripVertical, Plus, X, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { toast } from 'sonner';

interface Props {
    column: KanbanColumn;
    tasks: Task[];
    onUpdateColumn: (id: string, name: string) => void;
    onDeleteColumn: (id: string) => void;
    onAddTask: (columnId: string, title: string) => Promise<void>; // Zmieniona sygnatura!
    onDeleteTask: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export default function KanbanColumnItem({
                                             column, tasks, onUpdateColumn, onDeleteColumn, onAddTask, onDeleteTask, onUpdateTask
                                         }: Props) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [colName, setColName] = useState(column.name);

    // Stan dodawania nowego zadania
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isSavingTask, setIsSavingTask] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: { type: 'Column', column }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSaveColName = () => {
        if (colName.trim() !== '') onUpdateColumn(column.id, colName);
        else setColName(column.name);
        setIsEditingName(false);
    };

    const handleCreateTask = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newTaskTitle.trim() === '') {
            setIsAddingTask(false);
            return;
        }

        setIsSavingTask(true);
        try {
            await onAddTask(column.id, newTaskTitle);
            setNewTaskTitle('');
            // Nie zamykamy isAddingTask, żeby można było dodać kolejne zadanie jedno po drugim
            // Jeśli wolisz zamknąć, odkomentuj poniższą linię:
            // setIsAddingTask(false);

            // Skupiamy input z powrotem (mały hack, bo React czasem gubi focus po submit)
            const input = document.getElementById(`new-task-input-${column.id}`);
            if (input) input.focus();

        } catch (error) {
            toast.error('Nie udało się dodać zadania');
        } finally {
            setIsSavingTask(false);
        }
    };

    const tasksIds = useMemo(() => tasks.map(t => t.id), [tasks]);

    return (
        <div ref={setNodeRef} style={style} className="h-full flex flex-col">
            <Card className="w-72 h-full max-h-full flex flex-col bg-muted/30 border-muted-foreground/20 shadow-sm">
                {/* Nagłówek */}
                <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 border-b bg-background/50 rounded-t-lg flex-shrink-0">
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                            <GripVertical className="h-4 w-4" />
                        </div>
                        {isEditingName ? (
                            <Input
                                value={colName}
                                onChange={(e) => setColName(e.target.value)}
                                onBlur={handleSaveColName}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveColName()}
                                autoFocus
                                className="h-7 text-sm px-2"
                            />
                        ) : (
                            <div className="flex items-center gap-2 overflow-hidden">
                                <h3 onClick={() => setIsEditingName(true)} className="font-semibold text-sm truncate cursor-text px-1 hover:bg-background/80 rounded">
                                    {column.name}
                                </h3>
                                <span className="text-xs text-muted-foreground font-normal">({tasks.length})</span>
                            </div>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setIsEditingName(true)}>Zmień nazwę</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Usuń
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                {/* Ciało kolumny (Lista Zadań) */}
                <CardContent className="flex-1 p-2 overflow-y-auto min-h-[50px] scrollbar-thin">
                    <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onDelete={onDeleteTask}
                                onUpdate={onUpdateTask}
                            />
                        ))}
                    </SortableContext>
                </CardContent>

                {/* Stopka: Dodaj zadanie */}
                <CardFooter className="p-2 border-t flex-shrink-0 flex-col gap-2">
                    {isAddingTask ? (
                        <form onSubmit={handleCreateTask} className="w-full space-y-2">
                            <Input
                                id={`new-task-input-${column.id}`}
                                placeholder="Wpisz nazwę zadania..."
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                autoFocus
                                disabled={isSavingTask}
                                className="bg-background"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsAddingTask(false);
                                        setNewTaskTitle('');
                                    }
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <Button type="submit" size="sm" disabled={!newTaskTitle.trim() || isSavingTask}>
                                    {isSavingTask ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Dodaj'}
                                </Button>
                                <Button type="button" size="icon" variant="ghost" onClick={() => setIsAddingTask(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-background/50" onClick={() => setIsAddingTask(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Dodaj zadanie
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
