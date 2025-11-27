import * as request from 'supertest';
import {app} from '../src';
import {pool} from '../src/utils/db';
import {NextFunction, Request, Response} from 'express';

// Mock Bazy Danych
jest.mock('../src/utils/db', () => ({
    pool: {
        query: jest.fn(),
        getConnection: jest.fn().mockResolvedValue({
            release: jest.fn(),
        }),
    },
}));

// Stałe - UUID v4
const USER_ID = 'd164720e-224b-4a9e-b232-c6030362564e';
const PROJECT_ID = 'b3c74810-8234-4978-9d18-68291127886e';
const MODULE_ID = 'c4d85921-9345-4a89-ae29-793a2238997f';
const TASK_ID = 'e5e96a32-0456-4b9a-bf3a-8a4b3349aa80';
const MEMBER_ID = 'f6f07b43-1567-4c0b-cf4b-9b5c4450bb91';
const COLUMN_ID = '07a18c54-2678-4d1c-8g5c-ac6d5561cc02';

const MOCK_USER = {
    id: USER_ID,
    email: 'test@example.com',
    full_name: 'Jakub Testowy',
    pwd_hash: 'hash',
    system_role: 'USER'
};

// Mock Middleware Autoryzacji
jest.mock('../src/middleware/auth.middleware', () => ({
    authenticateUser: (req: Request, res: Response, next: NextFunction) => {
        // Symulacja braku autoryzacji
        if (req.headers['x-force-unauth']) {
            res.status(401).json({message: 'Unauthorized'});
            return;
        }

        // Zalogowany użytkownik
        (req as any).user = MOCK_USER;
        next();
    }
}));

describe('Integration Tests - API Endpoints', () => {

    afterEach(() => {
        jest.clearAllMocks();
        (pool.query as jest.Mock).mockReset();
    });

    // === Users ===

    test('1. POST /api/users - Should register a new user successfully', async () => {
        // Arrange
        const newUser = {email: 'new@example.com', fullName: 'New User', password: 'password123'};

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[], undefined])
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]);

        // Act
        const res = await request.agent(app).post('/api/users').send(newUser);

        // Assert
        expect(res.status).toBe(201);
        expect(res.body.ok).toBe(true);
    });

    test('2. POST /api/users - Should fail if email is already taken', async () => {
        // Arrange
        const existingUser = {email: 'taken@ex.com', fullName: 'User', password: 'p'};

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{id: '1', email: 'taken@ex.com'}], undefined]);

        // Act
        const res = await request.agent(app).post('/api/users').send(existingUser);

        // Assert
        expect(res.status).toBe(400);
    });

    // === Projects ===

    test('3. GET /api/projects - Should return 401 if forced unauth', async () => {
        // Arrange & Act
        const res = await request.agent(app)
            .get('/api/projects')
            .set('x-force-unauth', 'true');

        // Assert
        expect(res.status).toBe(401);
    });

    test('4. GET /api/projects - Should return projects list for logged user', async () => {
        // Arrange
        const fakeProjects = [{id: PROJECT_ID, name: 'Project A', owner_id: USER_ID}];
        (pool.query as jest.Mock).mockResolvedValueOnce([fakeProjects, undefined]); // DB: Get Projects

        // Act
        const res = await request.agent(app).get('/api/projects');

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    test('5. POST /api/projects - Should create a new project', async () => {
        // Arrange
        const newProject = {name: 'My New Project', description: 'Desc'};

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[], undefined]) // Check ID (save)
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]) // Insert Project
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]); // Insert Member (Owner)

        // Act
        const res = await request.agent(app).post('/api/projects').send(newProject);

        // Assert
        expect(res.status).toBe(201);
    });

    test('6. GET /api/projects/:id - Should return project details', async () => {
        // Arrange
        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{
                id: PROJECT_ID,
                owner_id: USER_ID,
                name: 'Project 1'
            }], undefined]) // Find Project
            .mockResolvedValueOnce([[{id: PROJECT_ID}], undefined]) // Check Access (isMember)
            .mockResolvedValueOnce([[], undefined]); // Get Modules

        // Act
        const res = await request.agent(app).get(`/api/projects/${PROJECT_ID}`);

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.data.project.id).toBe(PROJECT_ID);
    });

    // === Modules ===

    test('7. POST /api/modules - Should create a module', async () => {
        // Arrange
        const newModule = {name: 'Backlog', projectId: PROJECT_ID};

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{id: PROJECT_ID}], undefined]) // Check Access (isMember)
            .mockResolvedValueOnce([[], undefined]) // Check Module ID (save)
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]); // Insert Module

        // Act
        const res = await request.agent(app).post('/api/modules').send(newModule);

        // Assert
        expect(res.status).toBe(201);
    });

    test('8. DELETE /api/modules/:id - Should delete a module', async () => {
        // Arrange
        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{
                id: MODULE_ID,
                project_id: PROJECT_ID,
                name: 'M1'
            }], undefined]) // Find Module
            .mockResolvedValueOnce([[{id: PROJECT_ID}], undefined]) // Check Access (isMember)
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]); // Delete Module

        // Act
        const res = await request.agent(app).delete(`/api/modules/${MODULE_ID}`);

        // Assert
        expect(res.status).toBe(200);
    });

    // === Tasks ===

    test('9. GET /api/modules/:id/tasks - Should return tasks list', async () => {
        // Arrange
        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{
                id: MODULE_ID,
                project_id: PROJECT_ID,
                name: 'M1'
            }], undefined]) // Find Module
            .mockResolvedValueOnce([[{id: PROJECT_ID}], undefined]) // Check Access
            .mockResolvedValueOnce([[{id: TASK_ID, title: 'Task 1'}], undefined]); // Find Tasks

        // Act
        const res = await request.agent(app).get(`/api/modules/${MODULE_ID}/tasks`);

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.data[0].title).toBe('Task 1');
    });

    test('10. POST /api/tasks - Should create a task', async () => {
        // Arrange
        const newTask = {title: 'New Task', moduleId: MODULE_ID, columnId: COLUMN_ID};

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{
                id: MODULE_ID,
                project_id: PROJECT_ID,
                name: 'M1'
            }], undefined]) // Find Module
            .mockResolvedValueOnce([[{
                id: MEMBER_ID,
                project_id: PROJECT_ID,
                user_id: USER_ID,
                project_role: 'DEVELOPER'
            }], undefined]) // Find Member
            .mockResolvedValueOnce([[], undefined]) // Check Task ID (save)
            .mockResolvedValueOnce([[{maxIndex: 0}], undefined]) // Check Max Index (save)
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]); // Insert Task

        // Act
        const res = await request.agent(app).post('/api/tasks').send(newTask);

        // Assert
        expect(res.status).toBe(200);
    });

    test('11. PUT /api/tasks/:id - Should update task', async () => {
        // Arrange
        const updateData = {title: 'Updated Task', priority: 'HIGH'};

        (pool.query as jest.Mock)
            .mockResolvedValueOnce([[{
                id: TASK_ID,
                module_id: MODULE_ID,
                title: 'Old',
                column_id: COLUMN_ID,
                reporter_id: MEMBER_ID,
                task_order_index: 0,
                priority: 'MEDIUM'
            }], undefined]) // DB: Find Task
            .mockResolvedValueOnce([[{
                id: MODULE_ID,
                project_id: PROJECT_ID,
                name: 'M1'
            }], undefined]) // Find Module (checkAccess)
            .mockResolvedValueOnce([[{id: PROJECT_ID}], undefined]) // Check Access
            .mockResolvedValueOnce([[{id: TASK_ID}], undefined]) //Check Task ID (save - update)
            .mockResolvedValueOnce([{affectedRows: 1}, undefined]); // Update Task

        // Act
        const res = await request.agent(app).put(`/api/tasks/${TASK_ID}`).send(updateData);

        // Assert
        expect(res.status).toBe(200);
    });
});
