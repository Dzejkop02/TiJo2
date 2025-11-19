import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectDetails, createModule } from '@/lib/api';
import type {Project, Module} from '@/types';
import { Loader2, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ModuleListItem from '../components/modules/ModuleListItem';
import { Input } from '@/components/ui/input';

export default function ProjectDetailPage() {
    const [project, setProject] = useState<Project | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newModuleName, setNewModuleName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                const data = await getProjectDetails(id);
                setProject(data.project);
                setModules(data.modules);
            } catch (error) {
                if (!(error as Error).message.includes('Sesja wygasła')) {
                    toast.error('Błąd pobierania projektu');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || newModuleName.trim() === '') return;

        setIsCreating(true);
        try {
            const newModule = await createModule({ name: newModuleName, projectId: project.id });
            setModules([...modules, newModule]);
            setNewModuleName('');
            toast.success('Dodano nowy moduł');
        } catch (error) {
            toast.error('Błąd tworzenia modułu');
        } finally {
            setIsCreating(false);
        }
    };

    const handleModuleUpdated = (updated: Module) => {
        setModules(prev => prev.map(m => m.id === updated.id ? updated : m));
    };

    const handleModuleDeleted = (id: string) => {
        setModules(prev => prev.filter(m => m.id !== id));
    };

    if (isLoading) {
        return <div className="flex justify-center pt-20"><Loader2 className="animate-spin" /></div>;
    }

    if (!project) return <div>Nie znaleziono projektu</div>;

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-start mb-8 px-1">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              Projekt
            </span>
                    </div>
                    <p className="text-muted-foreground">{project.description}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link to={`/projects/${project.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" /> Ustawienia
                    </Link>
                </Button>
            </div>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                {/* Nagłówek Tabeli */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <h2 className="font-semibold text-lg">Moduły / Etapy</h2>
                    <span className="text-sm text-muted-foreground">{modules.length} modułów</span>
                </div>

                <div className="divide-y">
                    {modules.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            Brak modułów. Dodaj pierwszy poniżej.
                        </div>
                    )}
                    {modules.map(module => (
                        <ModuleListItem
                            key={module.id}
                            module={module}
                            onModuleUpdated={handleModuleUpdated}
                            onModuleDeleted={handleModuleDeleted}
                        />
                    ))}
                </div>

                <div className="p-3 bg-muted/10 border-t">
                    <form onSubmit={handleCreateModule} className="flex gap-2">
                        <Input
                            placeholder="+ Dodaj nowy moduł..."
                            className="bg-background border-dashed focus:border-solid"
                            value={newModuleName}
                            onChange={(e) => setNewModuleName(e.target.value)}
                            disabled={isCreating}
                        />
                        <Button type="submit" disabled={isCreating || !newModuleName.trim()}>
                            {isCreating ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
                            {isCreating ? '' : 'Dodaj'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
