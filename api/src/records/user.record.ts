import { pool } from '../utils/db';
import { ValidationError } from '../utils/errors';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { UserEntity } from '../types/user.types';

export { UserEntity } from '../types/user.types';

type UserEntityFromDB = UserEntity & RowDataPacket;

export class UserRecord implements UserEntity {
    public id: string;
    public email: string;
    public full_name: string;
    public pwd_hash: string;
    public system_role: 'USER' | 'ADMIN';
    public created_at: Date;
    public updated_at: Date;

    constructor(obj: UserEntity) {
        if (!obj.email || !obj.email.includes('@') || obj.email.length > 255) {
            throw new ValidationError('Nieprawidłowy adres email.');
        }
        if (!obj.full_name || obj.full_name.length < 2 || obj.full_name.length > 255) {
            throw new ValidationError('Imię i nazwisko musi mieć od 2 do 255 znaków.');
        }
        if (!obj.pwd_hash) {
            throw new ValidationError('Brak hasha hasła.');
        }

        this.id = obj.id;
        this.email = obj.email;
        this.full_name = obj.full_name;
        this.pwd_hash = obj.pwd_hash;
        this.system_role = obj.system_role ?? 'USER';
        this.created_at = obj.created_at ?? new Date();
        this.updated_at = obj.updated_at ?? new Date();
    }

    static async find(email: string): Promise<UserRecord | null> {
        const [rows] = await pool.query<UserEntityFromDB[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        const user = rows[0];
        return user ? new UserRecord(user) : null;
    }

    static async findById(id: string): Promise<UserRecord | null> {
        const [rows] = await pool.query<UserEntityFromDB[]>("SELECT * FROM users WHERE id = ?", [id]);
        const user = rows[0];
        return user ? new UserRecord(user) : null;
    }

    /**
     * Wyszukuje użytkowników po fragmencie emaila
     * Zwraca uproszczone dane.
     */
    static async searchByEmail(emailQuery: string, excludeUserId: string): Promise<Partial<UserEntity>[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT `id`, `email`, `full_name` FROM `users` " +
            "WHERE `email` LIKE ? AND `id` != ? LIMIT 5",
            [`%${emailQuery}%`, excludeUserId]
        );
        return rows as Partial<UserEntity>[];
    }


    async save(): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO users (id, email, full_name, pwd_hash, system_role) VALUES (?, ?, ?, ?, ?)",
            [this.id, this.email, this.full_name, this.pwd_hash, this.system_role]
        );

        if (result.affectedRows < 1) {
            throw new Error('Błąd podczas dodawania nowego użytkownika.');
        }
    }

    async updatePassword(newPwdHash: string): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "UPDATE users SET pwd_hash = ? WHERE id = ?",
            [newPwdHash, this.id]
        );

        if (result.affectedRows < 1) {
            throw new Error('Błąd podczas aktualizacji hasła użytkownika.');
        }

        this.pwd_hash = newPwdHash;
    }
}
