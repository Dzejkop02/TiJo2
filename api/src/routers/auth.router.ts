import {Router} from 'express';
import {z, ZodError} from 'zod';
import {UserRecord} from '../records/user.record';
import {ValidationError, UnauthorizedError} from '../utils/errors';
import {comparePassword} from '../utils/password';
import {createToken, deleteJwtCookie, generateToken} from '../utils/tokens';
import {authenticateUser} from '../middleware/auth.middleware';
import {TokenRecord} from '../records/token.record';

export const authRouter = Router();

const loginSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email.'),
    password: z.string().min(1, 'Hasło jest wymagane.'),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 default: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 default: password123
 *     responses:
 *       200:
 *         description: Zalogowano pomyślnie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Błąd walidacji
 */

authRouter.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = await UserRecord.find(data.email);
        if (!user) {
            throw new ValidationError('Nieprawidłowy email lub hasło.');
        }

        const isPasswordValid = await comparePassword(data.password, user.pwd_hash);
        if (!isPasswordValid) {
            throw new ValidationError('Nieprawidłowy email lub hasło.');
        }

        const personalTokenId = await generateToken(user);

        const {accessToken, expiresIn} = createToken(personalTokenId);

        res.cookie('jwt', accessToken, {
            secure: false,
            domain: 'localhost',
            httpOnly: true,
            maxAge: expiresIn * 1000,
        });

        res.json({
            ok: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.system_role,
            },
        });

    } catch (err) {
        if (err instanceof ZodError) {
            throw new ValidationError('Nieprawidłowe dane logowania.');
        }
        throw err;
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Wylogowanie użytkownika
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wylogowano pomyślnie
 */

authRouter.get('/logout', authenticateUser, async (req, res) => {
    try {
        const tokenId = req.tokenId as string;

        const token = await TokenRecord.findById(tokenId);
        if (token) {
            await token.delete();
        }

        deleteJwtCookie(res);
        res.status(200).json({ok: true, message: 'Wylogowano pomyślnie.'});
    } catch (error) {
        deleteJwtCookie(res);
        throw error;
    }
});

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     summary: Sprawdzenie sesji
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Zwraca dane użytkownika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Brak autoryzacji
 */

authRouter.get("/check", authenticateUser, async (req, res) => {
    const user = req.user as UserRecord;

    res.status(200).json({
        ok: true,
        data: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.system_role,
        },
    });
});
