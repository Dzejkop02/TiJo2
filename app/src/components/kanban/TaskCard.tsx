import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {Task} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Props {
    task: Task;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
}

const PRIORITY_COLORS = {
    LOW: "bg-slate-200 text-slate-700 hover:bg-slate-300",
    MEDIUM: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    HIGH: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    CRITICAL: "bg-red-100 text-red-700 hover:bg-red-200",
};

export default function TaskCard({ task, onDelete, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: 'Task', task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSaveTitle = () => {
        if (editTitle.trim() === '') {
            setEditTitle(task.title);
        } else if (editTitle !== task.title) {
            onUpdate(task.id, { title: editTitle });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSaveTitle();
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-2 touch-none">
            <Card className="bg-background hover:border-primary/50 transition-colors shadow-sm group relative">
                <CardContent className="p-3 flex flex-col gap-2">

                    <div className="flex items-start gap-2">
                        <div
                            {...attributes}
                            {...listeners}
                            className="mt-1 text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing"
                        >
                            <GripVertical className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    className="h-7 text-sm px-1"
                                />
                            ) : (
                                <p
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm font-medium leading-snug break-words cursor-text hover:text-blue-600 transition-colors"
                                >
                                    {task.title}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pl-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Badge
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 h-5 cursor-pointer border-0 ${PRIORITY_COLORS[task.priority]}`}
                                >
                                    {task.priority}
                                </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Zmień priorytet</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(p => (
                                    <DropdownMenuItem
                                        key={p}
                                        onClick={() => onUpdate(task.id, { priority: p })}
                                        className="flex justify-between"
                                    >
                                        {p}
                                        {task.priority === p && <Check className="h-4 w-4 ml-2" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(task.id);
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
