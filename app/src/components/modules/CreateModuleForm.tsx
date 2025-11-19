import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, X, Loader2 } from 'lucide-react';
import { createModule } from '@/lib/api';
import { toast } from 'sonner';
import type {Module} from '@/types';

interface CreateModuleFormProps {
    projectId: string;
    onModuleCreated: (newModule: Module) => void;
}

export default function CreateModuleForm({ projectId, onModuleCreated }: CreateModuleFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (name.trim().length === 0) return;
        setIsLoading(true);

        try {
            const newModule = await createModule({ name, projectId });
            toast.success(`Utworzono listę "${newModule.name}"`);
            onModuleCreated(newModule);
            setName('');
            setIsEditing(false);
        } catch (error) {
            toast.error('Błąd tworzenia listy', { description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isEditing) {
        return (
            <Button
                variant="ghost"
                className="w-72 min-w-[288px] h-10 justify-start"
                onClick={() => setIsEditing(true)}
            >
                <Plus className="mr-2 h-4 w-4" /> Dodaj kolejną listę
            </Button>
        );
    }

    return (
        <Card className="w-72 min-w-[288px] p-2 space-y-2">
            <form onSubmit={handleSubmit}>
                <Input
                    autoFocus
                    placeholder="Wprowadź nazwę listy..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                />
                <div className="flex items-center gap-2 mt-2">
                    <Button type="submit" disabled={isLoading || name.trim().length === 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Dodaj listę
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Card>
    );
}
