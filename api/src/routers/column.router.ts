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
 * @swagger
 * /api/modules/{moduleId}/columns:
 *   get:
 *     summary: Pobierz kolumny Kanban dla modułu
 *     tags: [Kanban]
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
 *         description: Lista kolumn
 */
columnRouter.get('/modules/:moduleId/columns', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;
    await checkAccess(user, moduleId);

    const columns = await ColumnRecord.findAllByModuleId(moduleId);
    res.json({ ok: true, data: columns });
});

/**
 * @swagger
 * /api/modules/{moduleId}/columns:
 *   post:
 *     summary: Dodaj nową kolumnę
 *     tags: [Kanban]
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
 *     responses:
 *       200:
 *         description: Utworzona kolumna
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
 * @swagger
 * /api/columns/{id}:
 *   put:
 *     summary: Zmiana nazwy kolumny
 *     tags: [Kanban]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Zaktualizowano kolumnę
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
 * @swagger
 * /api/columns/{id}:
 *   delete:
 *     summary: Usuwanie kolumny
 *     tags: [Kanban]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kolumna usunięta
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
 * @swagger
 * /api/modules/{moduleId}/columns/reorder:
 *   patch:
 *     summary: Zmień kolejność kolumn
 *     tags: [Kanban]
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
 *             properties:
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orderIndex:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Kolejność zaktualizowana
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
