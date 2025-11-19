export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'USER' | 'ADMIN';
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
}


export interface Module {
    id: string;
    name: string;
    description: string | null;
    project_id: string;
    // ...
}

export type ProjectRole = 'PROJECT_MANAGER' | 'DEVELOPER' | 'STAKEHOLDER';

export interface ProjectMember {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    project_role: ProjectRole;
}

export interface UserSearchResult {
    id: string;
    email: string;
    full_name: string;
}

export interface KanbanColumn {
    id: string;
    name: string;
    module_id: string;
    order_index: number;
    is_done_column: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string | null;
    module_id: string;
    column_id: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    task_order_index: number;
    // ...
}
