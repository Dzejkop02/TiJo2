import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getModule } from '@/lib/api';
import type {Module} from '@/types';
import { Loader2, ArrowLeft, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import KanbanBoard from '@/components/kanban/KanbanBoard';

export default function ModuleKanbanPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [module, setModule] = useState<Module | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!moduleId) return;
        const fetchModule = async () => {
            try {
                const data = await getModule(moduleId);
                setModule(data);
            } catch (error) {
                if (!(error as Error).message.includes('Sesja wygasła')) {
                    toast.error('Błąd pobierania modułu');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchModule();
    }, [moduleId]);

    if (isLoading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin" /></div>;
    if (!module) return <div>Moduł nie istnieje.</div>;

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b flex-shrink-0 px-4">
                <Button asChild variant="ghost" size="icon">
                    <Link to={`/projects/${module.project_id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Columns className="text-blue-600 h-6 w-6" />
                        {module.name}
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard moduleId={module.id} />
            </div>
        </div>
    );
}
