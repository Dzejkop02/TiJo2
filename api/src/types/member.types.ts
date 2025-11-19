export const ProjectRole = {
    ProjectManager: 'PROJECT_MANAGER',
    Developer: 'DEVELOPER',
    Stakeholder: 'STAKEHOLDER',
} as const;

export type ProjectRole = typeof ProjectRole[keyof typeof ProjectRole];

export interface ProjectMemberEntity {
    id: string;
    project_id: string;
    user_id: string;
    project_role: ProjectRole;
    created_at?: Date;
}

export interface ProjectMemberDetails {
    id: string; // ID członkostwa (z project_members)
    user_id: string;
    full_name: string;
    email: string;
    project_role: ProjectRole;
}
