import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { TaskRecord } from '../records/task.record';
import { ModuleRecord } from '../records/module.record';
import { ProjectMemberRecord } from '../records/member.record';
import { ProjectRecord } from '../records/project.record';
import { UserRecord } from '../records/user.record';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { TaskEntity } from '../types/task.types';
import { ProjectMemberEntity, ProjectRole } from '../types/member.types';

export const taskRouter = Router();
taskRouter.use(authenticateUser);

async function checkAccess(user: UserRecord, moduleId: string) {
    const module = await ModuleRecord.findById(moduleId);
    if (!module) throw new ValidationError('Moduł nie istnieje.');

    const isMember = await ProjectMemberRecord.isMember(module.project_id, user.id);
    if (!isMember) throw new UnauthorizedError('Brak dostępu do tego modułu.');
    return module;
}

/**
 * @swagger
 * /api/modules/{moduleId}/tasks:
 *   get:
 *     summary: Pobierz zadania dla modułu
 *     tags: [Tasks]
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
 *         description: Lista zadań
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
taskRouter.get('/modules/:moduleId/tasks', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;
    await checkAccess(user, moduleId);

    const tasks = await TaskRecord.findAllByModuleId(moduleId);
    res.json({ ok: true, data: tasks });
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Utwórz nowe zadanie
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - moduleId
 *               - columnId
 *             properties:
 *               title:
 *                 type: string
 *               moduleId:
 *                 type: string
 *                 format: uuid
 *               columnId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Utworzono zadanie
 */
taskRouter.post('/tasks', async (req, res) => {
    const user = req.user as UserRecord;
    const { title, moduleId, columnId } = req.body;

    const module = await ModuleRecord.findById(moduleId);
    if (!module) {
        throw new ValidationError('Moduł nie istnieje.');
    }

    let memberRecord = await ProjectMemberRecord.findByProjectAndUser(module.project_id, user.id);

    if (!memberRecord) {
        const project = await ProjectRecord.findById(module.project_id);

        if (project && project.owner_id === user.id) {
            memberRecord = new ProjectMemberRecord({
                project_id: project.id,
                user_id: user.id,
                project_role: 'PROJECT_MANAGER',
            } as ProjectMemberEntity);

            await memberRecord.save();
            console.log(`Auto-added owner ${user.email} to project members.`);
        } else {
            throw new UnauthorizedError('Nie jesteś członkiem tego projektu, nie możesz tworzyć zadań.');
        }
    }

    const task = new TaskRecord({
        title,
        module_id: moduleId,
        column_id: columnId,
        reporter_id: memberRecord.id,
        priority: 'MEDIUM',
        task_order_index: 0,
    } as TaskEntity);

    await task.save();
    res.json({ ok: true, data: task });
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Usuwanie zadania
 *     tags: [Tasks]
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
 *         description: Usunięto zadanie
 */
taskRouter.delete('/tasks/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;

    const task = await TaskRecord.findById(id);
    if (!task) throw new ValidationError('Zadanie nie istnieje');
    await checkAccess(user, task.module_id);

    await task.delete();
    res.json({ ok: true, message: 'Usunięto zadanie' });
});

/**
 * @swagger
 * /api/tasks/reorder:
 *   patch:
 *     summary: Aktualizuj pozycje zadań (Drag & Drop)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moduleId
 *               - updates
 *             properties:
 *               moduleId:
 *                 type: string
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     columnId:
 *                       type: string
 *                     orderIndex:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Zaktualizowano pozycje
 */
taskRouter.patch('/tasks/reorder', async (req, res) => {
    const user = req.user as UserRecord;
    const { updates, moduleId } = req.body;

    if (!updates || !moduleId) throw new ValidationError('Brak danych');
    await checkAccess(user, moduleId);

    await TaskRecord.updatePositions(updates);
    res.json({ ok: true, message: 'Zaktualizowano pozycje' });
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Aktualizacja zadania (tytuł, opis, priorytet)
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: Zaktualizowano zadanie
 */
taskRouter.put('/tasks/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;
    const { title, description, priority } = req.body;

    const task = await TaskRecord.findById(id);
    if (!task) throw new ValidationError('Zadanie nie istnieje');

    await checkAccess(user, task.module_id);

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;

    await task.save();
    res.json({ ok: true, data: task });
});
