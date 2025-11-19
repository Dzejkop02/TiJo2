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

taskRouter.get('/modules/:moduleId/tasks', async (req, res) => {
    const user = req.user as UserRecord;
    const { moduleId } = req.params;
    await checkAccess(user, moduleId);

    const tasks = await TaskRecord.findAllByModuleId(moduleId);
    res.json({ ok: true, data: tasks });
});

/**
 * POST /api/tasks
 * Tworzy nowe zadanie.
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

taskRouter.delete('/tasks/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;

    const task = await TaskRecord.findById(id);
    if (!task) throw new ValidationError('Zadanie nie istnieje');
    await checkAccess(user, task.module_id);

    await task.delete();
    res.json({ ok: true, message: 'Usunięto zadanie' });
});

taskRouter.patch('/tasks/reorder', async (req, res) => {
    const user = req.user as UserRecord;
    const { updates, moduleId } = req.body;

    if (!updates || !moduleId) throw new ValidationError('Brak danych');
    await checkAccess(user, moduleId);

    await TaskRecord.updatePositions(updates);
    res.json({ ok: true, message: 'Zaktualizowano pozycje' });
});

/**
 * PUT /api/tasks/:id
 * Aktualizuje tytuł, opis lub priorytet zadania.
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
