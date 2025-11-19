import { pool } from '../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ProjectEntity } from '../types/project.types';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';

type ProjectRecordResults = ProjectEntity & RowDataPacket;

export class ProjectRecord implements ProjectEntity {
    public id: string;
    public name: string;
    public description: string | null;
    public owner_id: string;
    public created_at: Date;
    public updated_at: Date;

    constructor(obj: ProjectEntity) {
        if (!obj.name || obj.name.length < 3 || obj.name.length > 255) {
            throw new ValidationError('Nazwa projektu musi mieć od 3 do 255 znaków.');
        }

        this.id = obj.id ?? uuid();
        this.name = obj.name;
        this.description = obj.description ?? null;
        this.owner_id = obj.owner_id;
        this.created_at = obj.created_at ?? new Date();
        this.updated_at = obj.updated_at ?? new Date();
    }

    /**
     * Zapisuje projekt w bazie danych (nowy lub zaktualizowany).
     */
    async save(): Promise<void> {
        const [existing] = await pool.query<ProjectRecordResults[]>(
            "SELECT `id` FROM `projects` WHERE `id` = ?",
            [this.id]
        );

        if (existing.length > 0) {
            // Aktualizacja
            await pool.query<ResultSetHeader>(
                "UPDATE `projects` SET `name` = ?, `description` = ? WHERE `id` = ?",
                [this.name, this.description, this.id]
            );
        } else {
            // Wstawienie nowego
            await pool.query<ResultSetHeader>(
                "INSERT INTO `projects` (`id`, `name`, `description`, `owner_id`) VALUES (?, ?, ?, ?)",
                [this.id, this.name, this.description, this.owner_id]
            );
        }
    }

    /**
     * Znajduje jeden projekt po ID.
     */
    static async findById(id: string): Promise<ProjectRecord | null> {
        const [rows] = await pool.query<ProjectRecordResults[]>(
            "SELECT * FROM `projects` WHERE `id` = ?",
            [id]
        );
        return rows.length > 0 ? new ProjectRecord(rows[0]) : null;
    }

    /**
     * Znajduje wszystkie projekty dla danego użytkownika
     */
    static async findAllForUser(userId: string): Promise<ProjectRecord[]> {
        const [rows] = await pool.query<ProjectRecordResults[]>(
            "SELECT DISTINCT p.* FROM `projects` p " +
            "LEFT JOIN `project_members` pm ON p.`id` = pm.`project_id` " +
            "WHERE p.`owner_id` = ? OR pm.`user_id` = ? " +
            "ORDER BY p.`created_at` DESC",
            [userId, userId]
        );
        return rows.map(row => new ProjectRecord(row));
    }

    /**
     * Usuwa projekt z bazy.
     */
    async delete(): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "DELETE FROM `projects` WHERE `id` = ?",
            [this.id]
        );

        if (result.affectedRows === 0) {
            throw new Error('Nie udało się usunąć projektu lub projekt nie istniał.');
        }
    }
}
