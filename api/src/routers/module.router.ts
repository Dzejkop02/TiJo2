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
 * POST /api/modules
 * Tworzy nowy moduł (listę "Asana-style").
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
 * GET /api/modules/:moduleId
 * Pobiera jeden moduł.
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
 * PUT /api/modules/:moduleId
 * Aktualizuje moduł (np. zmienia nazwę).
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
 * DELETE /api/modules/:moduleId
 * Usuwa moduł.
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
