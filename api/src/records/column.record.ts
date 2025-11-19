import { pool } from '../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { KanbanColumnEntity } from '../types/kanban.types';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';

type ColumnRecordResults = KanbanColumnEntity & RowDataPacket;

export class ColumnRecord implements KanbanColumnEntity {
    public id: string;
    public name: string;
    public module_id: string;
    public order_index: number;
    public is_done_column: boolean;
    public created_at: Date;

    constructor(obj: KanbanColumnEntity) {
        if (!obj.name || obj.name.length < 1 || obj.name.length > 100) {
            throw new ValidationError('Nazwa kolumny musi mieć od 1 do 100 znaków.');
        }

        this.id = obj.id ?? uuid();
        this.name = obj.name;
        this.module_id = obj.module_id;
        this.order_index = obj.order_index ?? 0;
        this.is_done_column = !!obj.is_done_column;
        this.created_at = obj.created_at ?? new Date();
    }

    static async findById(id: string): Promise<ColumnRecord | null> {
        const [rows] = await pool.query<ColumnRecordResults[]>(
            "SELECT * FROM `kanban_columns` WHERE `id` = ?",
            [id]
        );
        return rows.length > 0 ? new ColumnRecord(rows[0] as any) : null;
    }

    static async findAllByModuleId(moduleId: string): Promise<ColumnRecord[]> {
        const [rows] = await pool.query<ColumnRecordResults[]>(
            "SELECT * FROM `kanban_columns` WHERE `module_id` = ? ORDER BY `order_index` ASC",
            [moduleId]
        );
        return rows.map(row => new ColumnRecord(row as any));
    }

    /**
     * Zapisuje kolumnę (INSERT lub UPDATE).
     */
    async save(): Promise<void> {
        const [existing] = await pool.query<ColumnRecordResults[]>(
            "SELECT `id` FROM `kanban_columns` WHERE `id` = ?",
            [this.id]
        );

        if (existing.length > 0) {
            await pool.query(
                "UPDATE `kanban_columns` SET `name` = ?, `order_index` = ?, `is_done_column` = ? WHERE `id` = ?",
                [this.name, this.order_index, this.is_done_column, this.id]
            );
        } else {
            // order_index na koniec listy, jeśli nie podano
            if (this.order_index === 0) {
                const [max] = await pool.query<RowDataPacket[]>(
                    "SELECT MAX(`order_index`) as maxIndex FROM `kanban_columns` WHERE `module_id` = ?",
                    [this.module_id]
                );
                this.order_index = (max[0].maxIndex ?? -1) + 1;
            }

            await pool.query(
                "INSERT INTO `kanban_columns` (`id`, `name`, `module_id`, `order_index`, `is_done_column`) VALUES (?, ?, ?, ?, ?)",
                [this.id, this.name, this.module_id, this.order_index, this.is_done_column]
            );
        }
    }

    async delete(): Promise<void> {
        await pool.query("DELETE FROM `kanban_columns` WHERE `id` = ?", [this.id]);
    }

    /**
     * Aktualizuje kolejność wielu kolumn naraz.
     */
    static async updateOrder(columns: { id: string; orderIndex: number }[]): Promise<void> {
        for (const col of columns) {
            await pool.query(
                "UPDATE `kanban_columns` SET `order_index` = ? WHERE `id` = ?",
                [col.orderIndex, col.id]
            );
        }
    }
}
