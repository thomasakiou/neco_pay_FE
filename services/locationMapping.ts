import { LocationMapping, SaveLocationMappingDTO } from '../types/locationMapping';
import { getAuthHeaders } from './apiHelpers';

const API_URL = '';

async function parseResponse<T>(response: Response, action: string): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        throw new Error(
            `${action}: expected a JSON response from /location-mappings/. Check that the backend is running and restart the frontend dev server after proxy changes.`
        );
    }
    const body = await response.json();
    if (!response.ok) {
        throw new Error(typeof body.detail === 'string' ? body.detail : action);
    }
    return body as T;
}

export async function getLocationMappings(): Promise<LocationMapping[]> {
    const response = await fetch(`${API_URL}/location-mappings/`, {
        headers: getAuthHeaders(),
    });
    return parseResponse<LocationMapping[]>(response, 'Failed to fetch location mappings');
}

export async function saveLocationMapping(data: SaveLocationMappingDTO): Promise<LocationMapping> {
    const response = await fetch(`${API_URL}/location-mappings/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    return parseResponse<LocationMapping>(response, 'Failed to save location mapping');
}

export async function deleteLocationMapping(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/location-mappings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete location mapping');
        }
        throw new Error('Failed to delete location mapping: backend returned a non-JSON response.');
    }
}
