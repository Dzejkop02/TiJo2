import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { ColumnRecord } from '../records/column.record';
import { ModuleRecord } from '../records/module.record';
import { ProjectMemberRecord } from '../records/member.record';
import { UserRecord } from '../records/user.record';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { z } from 'zod';
import { KanbanColumnEntity } from '../types/kanban.types';

export const columnRouter = Router();
columnRouter.use(authenticateUser);

async function checkAccess(user: UserRecord, moduleId: string) {
    const module = await ModuleRecord.findById(moduleId);
    if (!module) throw new ValidationError('Moduł nie istnieje.');

    const isMember = await ProjectMemberRecord.isMember(module.project_id, user.id);
    if (!isMember) throw new UnauthorizedError('Brak dostępu do tego modułu.');
    return module;
}

/**
 * GET /api/modules/:moduleId/columns
 * Pobiera kolumny dla modułu.
 */
columnRouter.get('/modules/:moduleId/columns', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;
    await checkAccess(user, moduleId);

    const columns = await ColumnRecord.findAllByModuleId(moduleId);
    res.json({ ok: true, data: columns });
});

/**
 * POST /api/modules/:moduleId/columns
 * Tworzy nową kolumnę.
 */
columnRouter.post('/modules/:moduleId/columns', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;
    const { name } = req.body;

    if (!name) throw new ValidationError('Nazwa kolumny jest wymagana.');
    await checkAccess(user, moduleId);

    const column = new ColumnRecord({
        name,
        module_id: moduleId,
        order_index: 0,
        is_done_column: false,
    } as KanbanColumnEntity);

    await column.save();
    res.json({ ok: true, data: column });
});

/**
 * PUT /api/columns/:id
 * Zmienia nazwę kolumny.
 */
columnRouter.put('/columns/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;
    const { name } = req.body;

    const column = await ColumnRecord.findById(id);
    if (!column) throw new ValidationError('Kolumna nie istnieje.');

    await checkAccess(user, column.module_id);

    column.name = name;
    await column.save();

    res.json({ ok: true, data: column });
});

/**
 * DELETE /api/columns/:id
 * Usuwa kolumnę.
 */
columnRouter.delete('/columns/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;

    const column = await ColumnRecord.findById(id);
    if (!column) throw new ValidationError('Kolumna nie istnieje.');

    await checkAccess(user, column.module_id);

    await column.delete();
    res.json({ ok: true, message: 'Kolumna usunięta.' });
});

/**
 * PATCH /api/modules/:moduleId/columns/reorder
 * Zmienia kolejność kolumn.
 * Body: { columns: [{ id: '...', orderIndex: 0 }, ...] }
 */
columnRouter.patch('/modules/:moduleId/columns/reorder', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;
    const { columns } = req.body;

    if (!Array.isArray(columns)) throw new ValidationError('Nieprawidłowe dane.');
    await checkAccess(user, moduleId);

    await ColumnRecord.updateOrder(columns);
    res.json({ ok: true, message: 'Kolejność zaktualizowana.' });
});
