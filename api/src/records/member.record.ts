import { pool } from '../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ProjectMemberEntity, ProjectMemberDetails, ProjectRole } from '../types/member.types';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';

type MemberRecordResults = ProjectMemberEntity & RowDataPacket;
type MemberDetailsResults = ProjectMemberDetails & RowDataPacket;

export class ProjectMemberRecord implements ProjectMemberEntity {
    public id: string;
    public project_id: string;
    public user_id: string;
    public project_role: ProjectRole;
    public created_at: Date;

    constructor(obj: ProjectMemberEntity) {
        if (!obj.project_id || !obj.user_id || !obj.project_role) {
            throw new ValidationError('ID projektu, ID użytkownika i rola są wymagane.');
        }
        this.id = obj.id ?? uuid();
        this.project_id = obj.project_id;
        this.user_id = obj.user_id;
        this.project_role = obj.project_role;
        this.created_at = obj.created_at ?? new Date();
    }

    /**
     * Zapisuje członkostwo w bazie.
     */
    async save(): Promise<void> {
        await pool.query<ResultSetHeader>(
            "INSERT INTO `project_members` (`id`, `project_id`, `user_id`, `project_role`) VALUES (?, ?, ?, ?)",
            [this.id, this.project_id, this.user_id, this.project_role]
        );
    }

    /**
     * Sprawdza, czy użytkownik jest już członkiem projektu.
     */
    static async findByProjectAndUser(projectId: string, userId: string): Promise<ProjectMemberRecord | null> {
        const [rows] = await pool.query<MemberRecordResults[]>(
            "SELECT * FROM `project_members` WHERE `project_id` = ? AND `user_id` = ?",
            [projectId, userId]
        );
        return rows.length > 0 ? new ProjectMemberRecord(rows[0]) : null;
    }

    /**
     * Zwraca listę wszystkich członków projektu wraz z ich danymi.
     */
    static async listByProject(projectId: string): Promise<ProjectMemberDetails[]> {
        const [rows] = await pool.query<MemberDetailsResults[]>(
            "SELECT pm.id, pm.user_id, pm.project_role, u.full_name, u.email " +
            "FROM `project_members` pm " +
            "JOIN `users` u ON pm.user_id = u.id " +
            "WHERE pm.project_id = ?",
            [projectId]
        );
        return rows;
    }

    /**
     * Usuwa członkostwo z projektu na podstawie ID użytkownika.
     */
    static async delete(projectId: string, userId: string): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "DELETE FROM `project_members` WHERE `project_id` = ? AND `user_id` = ?",
            [projectId, userId]
        );
        if (result.affectedRows === 0) {
            throw new Error('Nie udało się usunąć członka projektu.');
        }
    }

    /**
     * Sprawdza, czy dany użytkownik jest członkiem (lub właścicielem) projektu.
     */
    static async isMember(projectId: string, userId: string): Promise<boolean> {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT p.id FROM `projects` p " +
            "LEFT JOIN `project_members` pm ON p.id = pm.project_id " +
            "WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)",
            [projectId, userId, userId]
        );
        return rows.length > 0;
    }
}
