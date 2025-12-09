import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { ModuleRecord } from '../records/module.record';
import { UserRecord } from '../records/user.record';
import { ProjectMemberRecord } from '../records/member.record';
import { z, ZodError, ZodIssue } from 'zod';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { ModuleEntity } from '../types/project.types';

export const moduleRouter = Router();
moduleRouter.use(authenticateUser);

const createModuleSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana').max(255),
    projectId: z.string().uuid('Wymagane ID projektu'),
});

const updateModuleSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana').max(255),
    description: z.string().max(1000).optional().nullable(),
});

/**
 * @swagger
 * /api/modules:
 *   post:
 *     summary: Utwórz nowy moduł w projekcie
 *     tags: [Modules]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Utworzono moduł
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 */
moduleRouter.post('/', async (req, res) => {
    try {
        const user = req.user as UserRecord;
        const data = createModuleSchema.parse(req.body);

        const isMember = await ProjectMemberRecord.isMember(data.projectId, user.id);
        if (!isMember) {
            throw new UnauthorizedError('Brak dostępu do tego projektu.');
        }

        const module = new ModuleRecord({
            name: data.name,
            project_id: data.projectId,
        } as ModuleEntity);

        await module.save();
        res.status(201).json({ ok: true, data: module });

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
 * /api/modules/{moduleId}:
 *   get:
 *     summary: Pobierz moduł
 *     tags: [Modules]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dane modułu
 */
moduleRouter.get('/:moduleId', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;

    const module = await ModuleRecord.findById(moduleId);
    if (!module) {
        throw new ValidationError('Nie znaleziono modułu.');
    }

    const isMember = await ProjectMemberRecord.isMember(module.project_id, user.id);
    if (!isMember) {
        throw new UnauthorizedError('Brak dostępu do tego modułu.');
    }

    res.json({ ok: true, data: module });
});

/**
 * @swagger
 * /api/modules/{moduleId}:
 *   put:
 *     summary: Aktualizacja modułu
 *     tags: [Modules]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zaktualizowano moduł
 */
moduleRouter.put('/:moduleId', async (req, res) => {
    try {
        const user = req.user as UserRecord;
        const { moduleId } = req.params;
        const data = updateModuleSchema.parse(req.body);

        const module = await ModuleRecord.findById(moduleId);
        if (!module) {
            throw new ValidationError('Nie znaleziono modułu.');
        }

        const isMember = await ProjectMemberRecord.isMember(module.project_id, user.id);
        if (!isMember) {
            throw new UnauthorizedError('Brak uprawnień do edycji tego modułu.');
        }

        module.name = data.name;
        module.description = data.description || null;
        await module.save();

        res.json({ ok: true, data: module });

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
 * /api/modules/{moduleId}:
 *   delete:
 *     summary: Usuwanie modułu
 *     tags: [Modules]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Moduł usunięty
 */
moduleRouter.delete('/:moduleId', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;

    const module = await ModuleRecord.findById(moduleId);
    if (!module) {
        throw new ValidationError('Nie znaleziono modułu.');
    }

    const isMember = await ProjectMemberRecord.isMember(module.project_id, user.id);
    if (!isMember) {
        throw new UnauthorizedError('Brak uprawnień do usunięcia tego modułu.');
    }

    await module.delete();
    res.json({ ok: true, message: 'Moduł usunięty.' });
});
