import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z, ZodError, ZodIssue } from 'zod'; // <-- Dodano ZodIssue
import {UserEntity, UserRecord} from '../records/user.record';
import { ValidationError } from '../utils/errors';
import { comparePassword, hashPassword } from '../utils/password';
import { authenticateUser } from '../middleware/auth.middleware';
import { deleteJwtCookie } from '../utils/tokens';

export const userRouter = Router();

const registerSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email.'),
    fullName: z.string().min(2, 'Imię musi mieć min. 2 znaki.').max(255),
    password: z.string().min(6, 'Hasło musi mieć min. 6 znaków.'),
});

const passwordChangeSchema = z.object({
    oldPassword: z.string().min(1, 'Stare hasło jest wymagane.'),
    newPassword: z.string().min(6, 'Nowe hasło musi mieć min. 6 znaków.'),
});

/**
 * REJESTRACJA NOWEGO UŻYTKOWNIKA
 * POST /user
 */
userRouter.post('/', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        if (await UserRecord.find(data.email)) {
            throw new ValidationError('Podany adres email jest już zajęty.');
        }

        const pwd_hash = await hashPassword(data.password);

        const user = new UserRecord({
            id: uuid(),
            email: data.email,
            full_name: data.fullName,
            pwd_hash: pwd_hash,
            system_role: 'USER',
        } as UserEntity);
        await user.save();

        res.status(201).json({
            ok: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
            },
        });

    } catch (err) {
        if (err instanceof ZodError) {
            const messages = err.issues.map((e: ZodIssue) => e.message).join(' \n');
            throw new ValidationError(messages);
        }
        throw err;
    }
});

/**
 * ZMIANA HASŁA PRZEZ UŻYTKOWNIKA
 * PATCH /user/password
 */
userRouter.patch('/password', authenticateUser, async (req, res) => {
    try {
        const user = req.user as UserRecord;
        const data = passwordChangeSchema.parse(req.body);

        const isOldPasswordValid = await comparePassword(data.oldPassword, user.pwd_hash);
        if (!isOldPasswordValid) {
            throw new ValidationError('Podane stare hasło jest nieprawidłowe.');
        }

        const newHash = await hashPassword(data.newPassword);
        await user.updatePassword(newHash);

        deleteJwtCookie(res);

        res.status(200).json({
            ok: true,
            message: 'Hasło zostało zmienione. Zaloguj się ponownie.',
        });

    } catch (err) {
        if (err instanceof ZodError) {
            const messages = err.issues.map((e: ZodIssue) => e.message).join(' \n');
            throw new ValidationError(messages);
        }
        throw err;
    }
});

/**
 * GET /api/users/search?email=...
 * Wyszukuje użytkowników po emailu
 */
userRouter.get('/search', authenticateUser, async (req, res) => {
    const emailQuery = req.query.email as string;
    const user = req.user as UserRecord;

    if (!emailQuery || emailQuery.length < 2) {
        throw new ValidationError('Wymagane są co najmniej 2 znaki do wyszukiwania.');
    }

    const users = await UserRecord.searchByEmail(emailQuery, user.id);

    res.json({
        ok: true,
        data: users,
    });
});
