import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Project } from '@/types';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    return (
        <Link to={`/projects/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                        {/* Proste obcięcie opisu */}
                        {project.description
                            ? project.description.substring(0, 100) + (project.description.length > 100 ? '...' : '')
                            : 'Brak opisu'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Utworzono: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}
