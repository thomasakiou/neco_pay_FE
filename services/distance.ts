import { Distance, CreateDistanceDTO, UpdateDistanceDTO } from '../types/distance';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';

const API_URL = ''; // Proxy handles the base URL

export async function getDistances(skip: number = 0, limit: number = 100): Promise<Distance[]> {
    const response = await fetch(`${API_URL}/distances/?skip=${skip}&limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch distances');
    }
    return response.json();
}

export async function createDistance(data: CreateDistanceDTO): Promise<Distance> {
    const response = await fetch(`${API_URL}/distances/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to create distance');
    }
    return response.json();
}

export async function updateDistance(id: number, data: UpdateDistanceDTO): Promise<Distance> {
    const response = await fetch(`${API_URL}/distances/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to update distance');
    }
    return response.json();
}

export async function deleteDistance(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/distances/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete distance');
    }
}

export async function uploadDistances(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/distances/upload`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to upload distances');
    }
}
