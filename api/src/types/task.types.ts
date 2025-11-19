export interface TaskEntity {
    id: string;
    title: string;
    description?: string | null;
    module_id: string;
    column_id: string;
    assignee_id?: string | null;
    reporter_id: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    task_order_index: number;
    due_date?: Date | null;
    created_at?: Date;
    updated_at?: Date;
}
