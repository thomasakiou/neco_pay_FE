import { getStoredToken } from './auth';

export function getAuthHeaders(): HeadersInit {
    const token = getStoredToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export function getAuthHeadersForFormData(): HeadersInit {
    const token = getStoredToken();
    const headers: HeadersInit = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}
