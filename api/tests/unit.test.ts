import { UserRecord } from '../src/records/user.record';
import { ProjectRecord } from '../src/records/project.record';
import { TaskRecord } from '../src/records/task.record';
import { ModuleRecord } from '../src/records/module.record';
import { ColumnRecord } from '../src/records/column.record';
import { ValidationError } from '../src/utils/errors';
import { createToken } from '../src/utils/tokens';
import { UserEntity } from '../src/types/user.types';
import { ProjectEntity, ModuleEntity } from '../src/types/project.types';
import { TaskEntity } from '../src/types/task.types';
import { KanbanColumnEntity } from '../src/types/kanban.types';

// MOCK BAZY DANYCH
jest.mock('../src/utils/db', () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
    }
}));

process.env.JWT_SECRET = 'test-secret';

describe('Unit Tests - Validation Logic', () => {

    // --- TESTY UserRecord ---

    test('1. UserRecord should create a valid user instance', () => {
        // Arrange
        const validUserData: UserEntity = {
            id: '123',
            email: 'test@example.com',
            full_name: 'Jakub Testowy',
            pwd_hash: 'hashedpassword',
            system_role: 'USER'
        };

        // Act
        const user = new UserRecord(validUserData);

        // Assert
        expect(user.email).toBe('test@example.com');
        expect(user.full_name).toBe('Jakub Testowy');
    });

    test('2. UserRecord should throw ValidationError on invalid email', () => {
        // Arrange
        const invalidUserData = {
            id: '123',
            email: 'invalid-email',
            full_name: 'Jakub Testowy',
            pwd_hash: 'hash',
            system_role: 'USER'
        } as UserEntity;

        // Act & Assert
        expect(() => new UserRecord(invalidUserData)).toThrow(ValidationError);
    });

    test('3. UserRecord should throw ValidationError when password hash is missing', () => {
        // Arrange
        const userDataWithoutHash = {
            id: '123',
            email: 'valid@email.com',
            full_name: 'Jakub Testowy',
            // pwd_hash: brak
            system_role: 'USER'
        } as UserEntity;

        // Act & Assert
        expect(() => new UserRecord(userDataWithoutHash)).toThrow(ValidationError);
    });

    // --- TESTY ProjectRecord ---

    test('4. ProjectRecord should throw error if name is too short', () => {
        // Arrange
        const shortNameProject = {
            name: 'Ab',
            owner_id: 'user1'
        } as ProjectEntity;

        // Act & Assert
        expect(() => new ProjectRecord(shortNameProject)).toThrow(ValidationError);
    });

    test('5. ProjectRecord should accept valid data', () => {
        // Arrange
        const validProject = {
            name: 'Valid Project Name',
            owner_id: 'user1',
            description: 'Optional description'
        } as ProjectEntity;

        // Act
        const project = new ProjectRecord(validProject);

        // Assert
        expect(project.id).toBeDefined();
        expect(project.name).toBe('Valid Project Name');
    });

    test('6. ProjectRecord should throw error if description is too long', () => {
        // Arrange
        const longDescProject = {
            name: 'Valid Name',
            owner_id: 'user1',
            description: 'a'.repeat(1001)
        } as ProjectEntity;

        // Act & Assert
        expect(() => new ProjectRecord(longDescProject)).toThrow(ValidationError);
    });

    // --- TESTY ModuleRecord ---

    test('7. ModuleRecord should require project_id', () => {
        // Arrange
        const moduleData = {
            name: 'Backend',
            // project_id: brak
        } as ModuleEntity;

        // Act & Assert
        expect(() => new ModuleRecord(moduleData)).toThrow(ValidationError);
    });

    // --- TESTY ColumnRecord ---

    test('8. ColumnRecord should require a name', () => {
        // Arrange
        const columnData = {
            name: '',
            module_id: 'mod1',
            order_index: 0,
            is_done_column: false
        } as KanbanColumnEntity;

        // Act & Assert
        expect(() => new ColumnRecord(columnData)).toThrow(ValidationError);
    });

    // --- TESTY TaskRecord ---

    test('9. TaskRecord should require a title', () => {
        // Arrange
        const taskData = {
            title: '',
            module_id: 'mod1',
            column_id: 'col1',
            reporter_id: 'user1',
            task_order_index: 0,
            priority: 'MEDIUM'
        } as TaskEntity;

        // Act & Assert
        expect(() => new TaskRecord(taskData)).toThrow(ValidationError);
    });

    test('10. TaskRecord should set default priority to MEDIUM if not provided', () => {
        // Arrange
        const taskData = {
            title: 'Task without priority',
            module_id: 'mod1',
            column_id: 'col1',
            reporter_id: 'user1',
            task_order_index: 0,
            // priority: brak
        } as TaskEntity;

        // Act
        const task = new TaskRecord(taskData);

        // Assert
        expect(task.priority).toBe('MEDIUM');
    });

    test('11. TaskRecord should generate UUID if id is not provided', () => {
        // Arrange
        const taskData = {
            title: 'Task ID Check',
            module_id: 'mod1',
            column_id: 'col1',
            reporter_id: 'user1',
            priority: 'LOW',
            task_order_index: 0
        } as TaskEntity;

        // Act
        const task = new TaskRecord(taskData);

        // Assert
        expect(task.id).toBeDefined();
        expect(typeof task.id).toBe('string');
        expect(task.id.length).toBeGreaterThan(0);
    });

    // --- TESTY UTILS (Tokeny) ---

    test('12. createToken should return an object with accessToken and expiresIn', () => {
        // Arrange
        const userId = 'user-123';

        // Act
        const tokenData = createToken(userId);

        // Assert
        expect(tokenData).toHaveProperty('accessToken');
        expect(tokenData).toHaveProperty('expiresIn');
        expect(typeof tokenData.accessToken).toBe('string');
        expect(tokenData.expiresIn).toBe(60 * 60 * 24); // 24h
    });

});
