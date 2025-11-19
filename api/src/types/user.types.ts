export interface UserEntity {
    id: string;
    email: string;
    full_name: string;
    pwd_hash: string;
    system_role: 'USER' | 'ADMIN';
    created_at?: Date;
    updated_at?: Date;
}
