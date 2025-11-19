export interface KanbanColumnEntity {
    id: string;
    name: string;
    module_id: string;
    order_index: number;
    is_done_column: boolean;
    created_at?: Date;
}
