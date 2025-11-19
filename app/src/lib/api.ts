import { API_URL } from '../config';
import type {Project, Module, UserSearchResult, ProjectMember, ProjectRole, KanbanColumn, Task} from '@/types';

const authErrorEvent = new Event('auth-error');

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include',
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
        window.dispatchEvent(authErrorEvent);
        throw new Error('Sesja wygasła. Proszę zalogować się ponownie.');
    }

    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Wystąpił błąd serwera.');
    }

    return data;
}

/**
 * Pobiera listę projektów użytkownika.
 */
export async function getProjects(): Promise<Project[]> {
    const response = await apiFetch('/projects');
    return response.data;
}

/**
 * Pobiera jeden projekt i jego moduły.
 */
export async function getProjectDetails(id: string): Promise<{ project: Project; modules: Module[] }> {
    const response = await apiFetch(`/projects/${id}`);
    return response.data;
}

/**
 * Tworzy nowy projekt.
 */
export async function createProject(data: { name: string; description?: string }): Promise<Project> {
    const response = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.data;
}

/**
 * Aktualizuje projekt (nazwa, opis).
 */
export async function updateProject(id: string, data: { name: string; description?: string | null }): Promise<Project> {
    const response = await apiFetch(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return response.data;
}

/**
 * Usuwa projekt.
 */
export async function deleteProject(id: string): Promise<{ ok: boolean; message: string }> {
    const response = await apiFetch(`/projects/${id}`, {
        method: 'DELETE',
    });
    return response;
}

/**
 * Wyszukuje użytkowników po emailu.
 */
export async function searchUsers(email: string): Promise<UserSearchResult[]> {
    const response = await apiFetch(`/users/search?email=${encodeURIComponent(email)}`);
    return response.data;
}

/**
 * Pobiera listę członków projektu.
 */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiFetch(`/projects/${projectId}/members`);
    return response.data;
}

/**
 * Dodaje użytkownika do projektu.
 */
export async function addProjectMember(projectId: string, userId: string, role: ProjectRole): Promise<{ ok: boolean }> {
    return apiFetch(`/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
    });
}

/**
 * Usuwa użytkownika z projektu.
 */
export async function removeProjectMember(projectId: string, userId: string): Promise<{ ok: boolean }> {
    return apiFetch(`/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
    });
}

// Moduły
/**
 * Tworzy nowy moduł (listę).
 */
export async function createModule(data: { name: string; projectId: string }): Promise<Module> {
    const response = await apiFetch('/modules', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.data;
}

/**
 * Aktualizuje moduł (zmienia nazwę).
 */
export async function updateModule(moduleId: string, data: { name: string; description?: string | null }): Promise<Module> {
    const response = await apiFetch(`/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return response.data;
}

/**
 * Usuwa moduł.
 */
export async function deleteModule(moduleId: string): Promise<{ ok: boolean }> {
    return apiFetch(`/modules/${moduleId}`, {
        method: 'DELETE',
    });
}

/**
 * Pobiera szczegóły jednego modułu.
 */
export async function getModule(moduleId: string): Promise<Module> {
    const response = await apiFetch(`/modules/${moduleId}`);
    return response.data;
}

// === KOLUMNY KANBAN ===

export async function getColumns(moduleId: string): Promise<KanbanColumn[]> {
    const response = await apiFetch(`/modules/${moduleId}/columns`);
    return response.data;
}

export async function createColumn(moduleId: string, name: string): Promise<KanbanColumn> {
    const response = await apiFetch(`/modules/${moduleId}/columns`, {
        method: 'POST',
        body: JSON.stringify({ name })
    });
    return response.data;
}

export async function updateColumn(columnId: string, name: string): Promise<KanbanColumn> {
    const response = await apiFetch(`/columns/${columnId}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
    });
    return response.data;
}

export async function deleteColumn(columnId: string): Promise<{ ok: boolean }> {
    return apiFetch(`/columns/${columnId}`, {
        method: 'DELETE'
    });
}

export async function reorderColumns(moduleId: string, columns: { id: string; orderIndex: number }[]): Promise<void> {
    await apiFetch(`/modules/${moduleId}/columns/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ columns })
    });
}

// === ZADANIA ===

export async function getTasks(moduleId: string): Promise<Task[]> {
    const response = await apiFetch(`/modules/${moduleId}/tasks`);
    return response.data;
}

export async function createTask(data: { title: string; moduleId: string; columnId: string }): Promise<Task> {
    const response = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response.data;
}

export async function deleteTask(taskId: string): Promise<{ ok: boolean }> {
    return apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
}

export async function reorderTasks(moduleId: string, updates: { id: string; columnId: string; orderIndex: number }[]): Promise<void> {
    await apiFetch('/tasks/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ moduleId, updates })
    });
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
    return response.data;
}
