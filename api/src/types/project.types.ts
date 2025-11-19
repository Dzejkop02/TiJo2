export interface ProjectEntity {
    id: string;
    name: string;
    description?: string | null;
    owner_id: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ModuleEntity {
    id?: string;
    name: string;
    description?: string | null;
    project_id: string;
    start_date?: Date | null;
    end_date?: Date | null;
    created_at?: Date;
    updated_at?: Date;
}
