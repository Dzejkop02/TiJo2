import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z, ZodError, ZodIssue } from 'zod';
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
 * @swagger
 * /api/users:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Utworzono użytkownika
 *       400:
 *         description: Błąd walidacji lub email zajęty
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
 * @swagger
 * /api/users/password:
 *   patch:
 *     summary: Zmiana hasła
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Hasło zmienione pomyślnie
 *       400:
 *         description: Stare hasło nieprawidłowe
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
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Wyszukiwanie użytkowników po emailu
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Fragment adresu email (min. 2 znaki)
 *     responses:
 *       200:
 *         description: Lista znalezionych użytkowników
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
