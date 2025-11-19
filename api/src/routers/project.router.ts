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
 * GET /api/projects
 * Zwraca listę projektów dla zalogowanego użytkownika.
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
 * POST /api/projects
 * Tworzy nowy projekt.
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
 * GET /api/projects/:id
 * Zwraca szczegóły jednego projektu ORAZ jego moduły.
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
 * PUT /api/projects/:id
 * Aktualizuje projekt (nazwa, opis).
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
 * DELETE /api/projects/:id
 * Usuwa projekt.
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
 * GET /api/projects/:id/members
 * Zwraca listę członków danego projektu.
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
 * POST /api/projects/:id/members
 * Dodaje nowego członka do projektu.
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
 * DELETE /api/projects/:id/members/:userId
 * Usuwa członka z projektu.
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
