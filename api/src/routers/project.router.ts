import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { ProjectRecord } from '../records/project.record';
import { ModuleRecord } from '../records/module.record';
import { UserRecord } from '../records/user.record';
import { z, ZodError } from 'zod';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { ZodIssue } from 'zod';
import {ProjectEntity} from "../types/project.types";
import { ProjectMemberRecord } from '../records/member.record';
import {ProjectMemberEntity, ProjectRole, ProjectRole as RoleEnum} from '../types/member.types';

export const projectRouter = Router();
projectRouter.use(authenticateUser);

const projectSchema = z.object({
    name: z.string().min(3, 'Nazwa musi mieć min. 3 znaki').max(255),
    description: z.string().max(1000, 'Opis jest za długi').optional(),
});

const addMemberSchema = z.object({
    userId: z.string().uuid('Nieprawidłowe ID użytkownika.'),
    role: z.nativeEnum(RoleEnum, { message: 'Nieprawidłowa rola.' }),
});

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Pobierz listę projektów użytkownika
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista projektów
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
 *                     $ref: '#/components/schemas/Project'
 */
projectRouter.get('/', async (req, res) => {
    const user = req.user as UserRecord;
    const projects = await ProjectRecord.findAllForUser(user.id);

    res.json({
        ok: true,
        data: projects,
    });
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Utwórz nowy projekt
 *     tags: [Projects]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utworzono projekt
 */
projectRouter.post('/', async (req, res) => {
    try {
        const user = req.user as UserRecord;
        const data = projectSchema.parse(req.body);

        const project = new ProjectRecord({
            ...data,
            description: data.description || null,
            owner_id: user.id,
        } as ProjectEntity);

        await project.save();

        // Automatyczne dodanie właściciela jako członka
        const ownerMember = new ProjectMemberRecord({
            project_id: project.id,
            user_id: user.id,
            project_role: 'PROJECT_MANAGER'
        } as ProjectMemberEntity);

        await ownerMember.save();

        res.status(201).json({
            ok: true,
            data: project,
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
 * /api/projects/{id}:
 *   get:
 *     summary: Pobierz szczegóły projektu i jego moduły
 *     tags: [Projects]
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
 *         description: Szczegóły projektu
 *       401:
 *         description: Brak dostępu
 */
projectRouter.get('/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;

    const project = await ProjectRecord.findById(id);

    if (!project) {
        throw new ValidationError('Nie znaleziono projektu.');
    }

    const isMember = await ProjectMemberRecord.isMember(id, user.id);
    if (!isMember) {
        throw new UnauthorizedError('Brak dostępu do tego projektu.');
    }

    const modules = await ModuleRecord.findAllForProject(id);

    res.json({
        ok: true,
        data: {
            project,
            modules,
        },
    });
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Aktualizacja projektu
 *     tags: [Projects]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zaktualizowano projekt
 *       401:
 *         description: Brak uprawnień (tylko właściciel)
 */
projectRouter.put('/:id', async (req, res) => {
    try {
        const user = req.user as UserRecord;
        const { id } = req.params;
        const data = projectSchema.parse(req.body);

        const project = await ProjectRecord.findById(id);

        if (!project) {
            throw new ValidationError('Nie znaleziono projektu.');
        }

        if (project.owner_id !== user.id) {
            throw new UnauthorizedError('Brak uprawnień do edycji tego projektu.');
        }

        project.name = data.name;
        project.description = data.description || null;
        await project.save();

        res.json({
            ok: true,
            data: project,
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
 * /api/projects/{id}:
 *   delete:
 *     summary: Usuwanie projektu
 *     tags: [Projects]
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
 *         description: Projekt usunięty
 *       401:
 *         description: Brak uprawnień
 */
projectRouter.delete('/:id', async (req, res) => {
    const user = req.user as UserRecord;
    const { id } = req.params;

    const project = await ProjectRecord.findById(id);

    if (!project) {
        throw new ValidationError('Nie znaleziono projektu.');
    }

    if (project.owner_id !== user.id) {
        throw new UnauthorizedError('Brak uprawnień do usunięcia tego projektu.');
    }

    await project.delete();

    res.json({
        ok: true,
        message: 'Projekt został usunięty.',
    });
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     summary: Pobierz listę członków projektu
 *     tags: [Projects]
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
 *         description: Lista członków
 */
projectRouter.get('/:id/members', async (req, res) => {
    const user = req.user as UserRecord;
    const { id: projectId } = req.params;

    const isMember = await ProjectMemberRecord.isMember(projectId, user.id);
    if (!isMember) {
        throw new UnauthorizedError('Brak dostępu do tego projektu.');
    }

    const members = await ProjectMemberRecord.listByProject(projectId);
    res.json({ ok: true, data: members });
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Dodaj członka do projektu
 *     tags: [Projects]
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
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [PROJECT_MANAGER, DEVELOPER, STAKEHOLDER]
 *     responses:
 *       201:
 *         description: Dodano członka
 */
projectRouter.post('/:id/members', async (req, res) => {
    try {
        const user = req.user as UserRecord;
        const { id: projectId } = req.params;
        const data = addMemberSchema.parse(req.body);

        const project = await ProjectRecord.findById(projectId);
        if (!project) {
            throw new ValidationError('Nie znaleziono projektu.');
        }

        if (project.owner_id !== user.id) {
            throw new UnauthorizedError('Brak uprawnień do dodawania członków.');
        }

        const userToAdd = await UserRecord.findById(data.userId);

        if (!userToAdd) {
            throw new ValidationError('Wybrany użytkownik nie istnieje.');
        }

        const isAlreadyMember = await ProjectMemberRecord.findByProjectAndUser(projectId, data.userId);
        if (isAlreadyMember) {
            throw new ValidationError('Ten użytkownik jest już członkiem projektu.');
        }

        const newMember = new ProjectMemberRecord({
            project_id: projectId,
            user_id: data.userId,
            project_role: data.role,
        } as ProjectMemberEntity);

        await newMember.save();

        res.status(201).json({ ok: true, message: 'Dodano członka.' });

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
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Usuń członka z projektu
 *     tags: [Projects]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usunięto członka
 */
projectRouter.delete('/:id/members/:userId', async (req, res) => {
    const user = req.user as UserRecord;
    const { id: projectId, userId: userToRemoveId } = req.params;

    const project = await ProjectRecord.findById(projectId);
    if (!project) {
        throw new ValidationError('Nie znaleziono projektu.');
    }

    if (project.owner_id !== user.id) {
        throw new UnauthorizedError('Brak uprawnień do usuwania członków.');
    }

    if (project.owner_id === userToRemoveId) {
        throw new ValidationError('Właściciel nie może zostać usunięty z projektu.');
    }

    await ProjectMemberRecord.delete(projectId, userToRemoveId);

    res.json({ ok: true, message: 'Usunięto członka.' });
});
