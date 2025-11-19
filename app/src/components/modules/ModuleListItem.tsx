import { useState } from 'react';
import type {Module} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MoreHorizontal,
    Columns,
    Trash2,
    Calendar
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateModule, deleteModule } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ModuleListItemProps {
    module: Module;
    onModuleUpdated: (updated: Module) => void;
    onModuleDeleted: (id: string) => void;
}

export default function ModuleListItem({ module, onModuleUpdated, onModuleDeleted }: ModuleListItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(module.name);
    const [isLoading, setIsLoading] = useState(false);

    const handleRename = async () => {
        if (newName.trim() === '' || newName === module.name) {
            setIsEditing(false);
            return;
        }
        setIsLoading(true);
        try {
            const updated = await updateModule(module.id, { name: newName });
            onModuleUpdated(updated);
            toast.success('Zmieniono nazwę modułu');
        } catch (error) {
            toast.error('Błąd aktualizacji');
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteModule(module.id);
            onModuleDeleted(module.id);
            toast.success('Usunięto moduł');
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    return (
        <div className="group flex items-center justify-between p-3 bg-card border-b hover:bg-accent/10 transition-colors">

            <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Columns className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex-1">
                    {isEditing ? (
                        <Input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            disabled={isLoading}
                            className="h-8 max-w-sm"
                        />
                    ) : (
                        <div
                            onClick={() => setIsEditing(true)}
                            className="font-medium cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
                        >
                            {module.name}
                        </div>
                    )}
                    {module.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                            {module.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground mr-8">
                <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>-- / --</span>
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button asChild variant="secondary" size="sm" className="h-8">
                    <Link to={`/modules/${module.id}/board`}>
                        Otwórz tablicę
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            Zmień nazwę
                        </DropdownMenuItem>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Usuń moduł
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Usuniesz moduł "{module.name}" wraz ze wszystkimi zadaniami.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Usuń</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
