import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectDetails, updateProject, deleteProject } from '@/lib/api';
import type {Project} from '@/types';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import MemberManager from '../components/projects/MemberManager';
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

export default function ProjectSettingsPage() {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Stany formularza
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) {
            toast.error('Brak ID projektu w adresie URL');
            return;
        }

        const fetchProject = async () => {
            try {
                const data = await getProjectDetails(id);
                setProject(data.project);
                setName(data.project.name);
                setDescription(data.project.description || '');
            } catch (error) {
                if (!(error as Error).message.includes('Sesja wygasła')) {
                    toast.error('Nie można załadować projektu', {
                        description: (error as Error).message,
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!id || !project) return;
        setIsSaving(true);

        try {
            const updatedProject = await updateProject(id, { name, description });
            setProject(updatedProject);
            setName(updatedProject.name);
            setDescription(updatedProject.description || '');
            toast.success('Projekt został zaktualizowany.');
        } catch (error) {
            toast.error('Błąd aktualizacji', {
                description: (error as Error).message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);

        try {
            await deleteProject(id);
            toast.success('Projekt został usunięty.');
            navigate('/');
        } catch (error) {
            toast.error('Błąd podczas usuwania projektu', {
                description: (error as Error).message,
            });
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mt-12" />;
    }

    if (!project) {
        return <div>Nie znaleziono projektu.</div>;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <form onSubmit={handleUpdate}>
                    <CardHeader>
                        <CardTitle>Ustawienia Ogólne</CardTitle>
                        <CardDescription>Zmień nazwę i opis swojego projektu.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nazwa projektu</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Opis projektu</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Opcjonalny opis..."
                                disabled={isSaving}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zapisz zmiany
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <MemberManager project={project} />

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Strefa Niebezpieczna</CardTitle>
                    <CardDescription>
                        Te akcje są nieodwracalne. Upewnij się, że wiesz, co robisz.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                    <p className="text-sm">Usuń ten projekt i wszystkie jego dane.</p>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Usuń projekt
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Czy na pewno chcesz usunąć ten projekt?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta akcja jest nieodwracalna. Spowoduje to trwałe usunięcie projektu
                                    <strong>{project.name}</strong> oraz wszystkich powiązanych modułów i zadań.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Tak, usuń projekt
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </CardFooter>
            </Card>
        </div>
    );
}
