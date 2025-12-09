import { State, StateCreate, StateUpdate } from '../types/state';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';

const API_URL = ''; // Proxy handles the base URL

export async function getStates(skip: number = 0, limit: number = 100): Promise<State[]> {
    const response = await fetch(`${API_URL}/states/?skip=${skip}&limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch states');
    }
    return response.json();
}

export async function createState(data: StateCreate): Promise<State> {
    const response = await fetch(`${API_URL}/states/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to create state');
    }
    return response.json();
}

export async function updateState(id: number, data: StateUpdate): Promise<State> {
    const response = await fetch(`${API_URL}/states/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to update state');
    }
    return response.json();
}

export async function deleteState(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/states/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete state');
    }
}

export async function deleteAllStates(): Promise<void> {
    const response = await fetch(`${API_URL}/states/delete-all`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete all states');
    }
}

export async function uploadStates(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/states/upload`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to upload states');
    }
}
