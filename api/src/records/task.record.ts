import { pool } from '../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { TaskEntity } from '../types/task.types';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';

type TaskRecordResults = TaskEntity & RowDataPacket;

export class TaskRecord implements TaskEntity {
    public id: string;
    public title: string;
    public description: string | null;
    public module_id: string;
    public column_id: string;
    public assignee_id: string | null;
    public reporter_id: string;
    public priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    public task_order_index: number;
    public due_date: Date | null;
    public created_at: Date;
    public updated_at: Date;

    constructor(obj: TaskEntity) {
        if (!obj.title || obj.title.length < 1) {
            throw new ValidationError('Tytuł zadania jest wymagany.');
        }

        this.id = obj.id ?? uuid();
        this.title = obj.title;
        this.description = obj.description ?? null;
        this.module_id = obj.module_id;
        this.column_id = obj.column_id;
        this.assignee_id = obj.assignee_id ?? null;
        this.reporter_id = obj.reporter_id;
        this.priority = obj.priority ?? 'MEDIUM';
        this.task_order_index = obj.task_order_index ?? 0;
        this.due_date = obj.due_date ?? null;
        this.created_at = obj.created_at ?? new Date();
        this.updated_at = obj.updated_at ?? new Date();
    }

    static async findAllByModuleId(moduleId: string): Promise<TaskRecord[]> {
        const [rows] = await pool.query<TaskRecordResults[]>(
            "SELECT * FROM `tasks` WHERE `module_id` = ? ORDER BY `task_order_index` ASC",
            [moduleId]
        );
        return rows.map(row => new TaskRecord(row));
    }

    static async findById(id: string): Promise<TaskRecord | null> {
        const [rows] = await pool.query<TaskRecordResults[]>(
            "SELECT * FROM `tasks` WHERE `id` = ?",
            [id]
        );
        return rows.length > 0 ? new TaskRecord(rows[0]) : null;
    }

    async save(): Promise<void> {
        const [existing] = await pool.query<TaskRecordResults[]>(
            "SELECT `id` FROM `tasks` WHERE `id` = ?",
            [this.id]
        );

        if (existing.length > 0) {
            await pool.query(
                "UPDATE `tasks` SET `title` = ?, `description` = ?, `column_id` = ?, `priority` = ?, `task_order_index` = ? WHERE `id` = ?",
                [this.title, this.description, this.column_id, this.priority, this.task_order_index, this.id]
            );
        } else {
            if (this.task_order_index === 0) {
                const [max] = await pool.query<RowDataPacket[]>(
                    "SELECT MAX(`task_order_index`) as maxIndex FROM `tasks` WHERE `column_id` = ?",
                    [this.column_id]
                );
                this.task_order_index = (max[0].maxIndex ?? -1) + 1;
            }

            await pool.query(
                "INSERT INTO `tasks` (`id`, `title`, `description`, `module_id`, `column_id`, `reporter_id`, `priority`, `task_order_index`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [this.id, this.title, this.description, this.module_id, this.column_id, this.reporter_id, this.priority, this.task_order_index]
            );
        }
    }

    async delete(): Promise<void> {
        await pool.query("DELETE FROM `tasks` WHERE `id` = ?", [this.id]);
    }

    /**
     * Aktualizuje pozycje zadań (batch update).
     * Używane przy przeciąganiu (DND).
     */
    static async updatePositions(updates: { id: string; columnId: string; orderIndex: number }[]): Promise<void> {
        for (const update of updates) {
            await pool.query(
                "UPDATE `tasks` SET `column_id` = ?, `task_order_index` = ? WHERE `id` = ?",
                [update.columnId, update.orderIndex, update.id]
            );
        }
    }
}
