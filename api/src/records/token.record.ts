import { pool } from '../utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { UserRecord, UserEntity } from './user.record';

interface TokenEntity {
    id: string;
    user_id: string;
    created_at?: Date;
}

type TokenEntityFromDB = TokenEntity & RowDataPacket;

export class TokenRecord implements TokenEntity {
    public id: string;
    public user_id: string;
    public created_at: Date;

    constructor(obj: TokenEntity) {
        this.id = obj.id;
        this.user_id = obj.user_id;
        this.created_at = obj.created_at ?? new Date();
    }

    /**
     * Znajduje token po jego ID.
     */
    static async findById(id: string): Promise<TokenRecord | null> {
        const [rows] = await pool.query<TokenEntityFromDB[]>(
            "SELECT * FROM `refresh_tokens` WHERE `id` = ?",
            [id]
        );
        const token = rows[0];
        return token ? new TokenRecord(token) : null;
    }

    /**
     * Znajduje użytkownika powiązanego z danym ID tokenu.
     */
    static async findUserByTokenId(id: string): Promise<UserRecord | null> {
        const [rows] = await pool.query<UserEntity[] & RowDataPacket[]>(
            "SELECT users.* FROM `users` " +
            "JOIN `refresh_tokens` ON `users`.`id` = `refresh_tokens`.`user_id` " +
            "WHERE `refresh_tokens`.`id` = ?",
            [id]
        );

        const user = rows[0];
        return user ? new UserRecord(user) : null;
    }

    /**
     * Zapisuje nowy token w bazie.
     */
    async save(): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO `refresh_tokens` (`id`, `user_id`) VALUES (?, ?)",
            [this.id, this.user_id]
        );
        if (result.affectedRows < 1) {
            throw new Error('Błąd podczas zapisywania tokenu.');
        }
    }

    /**
     * Usuwa token z bazy (wylogowanie)
     */
    async delete(): Promise<void> {
        const [result] = await pool.query<ResultSetHeader>(
            "DELETE FROM `refresh_tokens` WHERE `id` = ?",
            [this.id]
        );
        if (result.affectedRows < 1) {
            throw new Error('Błąd podczas usuwania tokenu.');
        }
    }
}
