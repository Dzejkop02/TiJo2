import { useState } from 'react';
import type {Module} from '@/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deleteModule, updateModule } from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface ModuleLaneProps {
    module: Module;
    onModuleDeleted: (moduleId: string) => void;
    onModuleUpdated: (updatedModule: Module) => void;
}

export default function ModuleLane({ module, onModuleDeleted, onModuleUpdated }: ModuleLaneProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(module.name);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRename = async () => {
        if (newName.trim().length === 0 || newName === module.name) {
            setIsRenaming(false);
            return;
        }
        setIsSaving(true);
        try {
            const updatedModule = await updateModule(module.id, { name: newName });
            toast.success('Zmieniono nazwę modułu');
            onModuleUpdated(updatedModule);
        } catch (error) {
            toast.error('Błąd zmiany nazwy', { description: (error as Error).message });
        } finally {
            setIsSaving(false);
            setIsRenaming(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteModule(module.id);
            toast.success(`Moduł "${module.name}" usunięty.`);
            onModuleDeleted(module.id);
        } catch (error) {
            toast.error('Błąd usuwania modułu', { description: (error as Error).message });
        }
    };

    return (
        <div className="w-72 min-w-[288px] bg-card rounded-lg shadow-md flex flex-col h-full max-h-full">
            <div className="flex items-center justify-between p-2 h-12 border-b">
                {isRenaming ? (
                    <Input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="h-8"
                        disabled={isSaving}
                    />
                ) : (
                    <h3
                        className="font-semibold text-sm p-1 cursor-pointer"
                        onClick={() => setIsRenaming(true)}
                    >
                        {module.name}
                    </h3>
                )}

                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setIsRenaming(true)}>Zmień nazwę</DropdownMenuItem>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        onSelect={e => e.preventDefault()}
                                        className="text-destructive"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Usuń listę
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno usunąć listę "{module.name}"?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Ta akcja usunie moduł oraz wszystkie kolumny i zadania w nim zawarte. Tej akcji nie można cofnąć.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive hover:bg-destructive/90"
                                            disabled={isDeleting}
                                        >
                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isDeleting ? 'Usuwanie...' : 'Usuń'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <div className="flex-1 p-2 overflow-y-auto">
                <p className="text-xs text-muted-foreground p-4 text-center">
                    (Tutaj pojawią się kolumny Kanban i zadania)
                </p>
            </div>

            <div className="p-2 border-t">
                <Button variant="ghost" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" /> Dodaj zadanie
                </Button>
            </div>
        </div>
    );
}
