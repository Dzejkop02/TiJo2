import { pool } from '../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ModuleEntity } from '../types/project.types';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';

type ModuleRecordResults = ModuleEntity & RowDataPacket;

export class ModuleRecord implements ModuleEntity {
    public id: string;
    public name: string;
    public description: string | null;
    public project_id: string;
    public start_date: Date | null;
    public end_date: Date | null;
    public created_at: Date;
    public updated_at: Date;

    constructor(obj: ModuleEntity) {
        if (!obj.name || obj.name.length < 1 || obj.name.length > 255) {
            throw new ValidationError('Nazwa modułu musi mieć od 1 do 255 znaków.');
        }
        if (!obj.project_id) {
            throw new ValidationError('ID projektu jest wymagane.');
        }

        this.id = obj.id ?? uuid();
        this.name = obj.name;
        this.description = obj.description ?? null;
        this.project_id = obj.project_id;
        this.start_date = obj.start_date ?? null;
        this.end_date = obj.end_date ?? null;
        this.created_at = obj.created_at ?? new Date();
        this.updated_at = obj.updated_at ?? new Date();
    }

    /**
     * Znajduje jeden moduł po jego ID.
     */
    static async findById(id: string): Promise<ModuleRecord | null> {
        const [rows] = await pool.query<ModuleRecordResults[]>(
            "SELECT * FROM `modules` WHERE `id` = ?",
            [id]
        );
        return rows.length > 0 ? new ModuleRecord(rows[0]) : null;
    }

    /**
     * Znajduje wszystkie moduły dla danego projektu.
     */
    static async findAllForProject(projectId: string): Promise<ModuleRecord[]> {
        const [rows] = await pool.query<ModuleRecordResults[]>(
            "SELECT * FROM `modules` WHERE `project_id` = ? ORDER BY `created_at` ASC",
            [projectId]
        );
        return rows.map(row => new ModuleRecord(row));
    }

    /**
     * Zapisuje moduł w bazie (INSERT lub UPDATE).
     */
    async save(): Promise<void> {
        const [existing] = await pool.query<ModuleRecordResults[]>(
            "SELECT `id` FROM `modules` WHERE `id` = ?",
            [this.id]
        );

        if (existing.length > 0) {
            // Aktualizacja
            await pool.query<ResultSetHeader>(
                "UPDATE `modules` SET `name` = ?, `description` = ? WHERE `id` = ?",
                [this.name, this.description, this.id]
            );
        } else {
            // Wstawienie nowego
            await pool.query<ResultSetHeader>(
                "INSERT INTO `modules` (`id`, `name`, `description`, `project_id`) VALUES (?, ?, ?, ?)",
                [this.id, this.name, this.description, this.project_id]
            );
        }
    }

    /**
     * Usuwa moduł z bazy.
     */
    async delete(): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "DELETE FROM `modules` WHERE `id` = ?",
            [this.id]
        );
        if (result.affectedRows === 0) {
            throw new Error('Nie udało się usunąć modułu.');
        }
    }
}
