import { Bank, CreateBankDTO, UpdateBankDTO } from '../types/banks';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';

const API_URL = ''; // Proxy handles the base URL

export async function getBanks(skip: number = 0, limit: number = 100): Promise<Bank[]> {
    const response = await fetch(`${API_URL}/banks/?skip=${skip}&limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch banks');
    }
    return response.json();
}

export async function createBank(data: CreateBankDTO): Promise<Bank> {
    const response = await fetch(`${API_URL}/banks/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to create bank');
    }
    return response.json();
}

export async function updateBank(id: number, data: UpdateBankDTO): Promise<Bank> {
    const response = await fetch(`${API_URL}/banks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to update bank');
    }
    return response.json();
}

export async function deleteBank(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/banks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete bank');
    }
}

export async function uploadBanks(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/banks/upload`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to upload banks');
    }
}
