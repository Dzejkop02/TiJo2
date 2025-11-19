import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getProjects } from '../../lib/api';
import type { Project } from '@/types';
import ProjectCard from '../projects/ProjectCard';
import { Loader2 } from 'lucide-react';
import CreateProjectDialog from '../projects/CreateProjectDialog';

export default function ProjectDashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            if (!(error as Error).message.includes('Sesja wygasła')) {
                console.error(error);
                toast.error('Nie można załadować projektów', {
                    description: (error as Error).message,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    /**
     * Funkcja callbacku dodająca nowy projekt do listy bez przeładowania strony.
     */
    const handleProjectCreated = (newProject: Project) => {
        setProjects(prevProjects => [newProject, ...prevProjects]);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Twoje Projekty</h1>
                <CreateProjectDialog onProjectCreated={handleProjectCreated} />
            </div>

            {projects.length === 0 ? (
                <p>Nie masz jeszcze żadnych projektów. Stwórz swój pierwszy!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
}
