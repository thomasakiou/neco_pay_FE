import { Parameter, CreateParameterDTO, UpdateParameterDTO } from '../types/parameter';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';

const API_URL = ''; // Proxy handles the base URL

export async function getParameters(skip: number = 0, limit: number = 100): Promise<Parameter[]> {
    const response = await fetch(`${API_URL}/parameters/?skip=${skip}&limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch parameters');
    }
    return response.json();
}

export async function createParameter(data: CreateParameterDTO): Promise<Parameter> {
    const response = await fetch(`${API_URL}/parameters/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to create parameter');
    }
    return response.json();
}

export async function updateParameter(id: number, data: UpdateParameterDTO): Promise<Parameter> {
    const response = await fetch(`${API_URL}/parameters/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to update parameter');
    }
    return response.json();
}

export async function deleteParameter(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/parameters/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete parameter');
    }
}

export async function uploadParameters(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/parameters/upload`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to upload parameters');
    }
}
