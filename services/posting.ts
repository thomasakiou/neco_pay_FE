import { Posting, CreatePostingDTO, UpdatePostingDTO, GeneratePaymentDTO } from '../types/posting';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';

const API_URL = ''; // Proxy handles the base URL

export async function getPostings(skip: number = 0, limit: number = 100000, batchName?: string): Promise<Posting[]> {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (batchName) params.set('batch_name', batchName);
    const response = await fetch(`${API_URL}/postings/?${params}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch postings');
    }
    return response.json();
}

export async function createPosting(data: CreatePostingDTO): Promise<Posting> {
    const response = await fetch(`${API_URL}/postings/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to create posting');
    }
    return response.json();
}

export async function updatePosting(id: number, data: UpdatePostingDTO): Promise<Posting> {
    const response = await fetch(`${API_URL}/postings/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to update posting');
    }
    return response.json();
}

export async function deletePosting(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/postings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete posting');
    }
}

export async function uploadPostings(file: File, batchName: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/postings/upload?batch_name=${encodeURIComponent(batchName)}`, {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to upload postings');
    }
}

export async function getPostingBatches(): Promise<string[]> {
    const response = await fetch(`${API_URL}/postings/batches`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch batches');
    return response.json();
}

export async function generatePayments(data: GeneratePaymentDTO): Promise<void> {
    const params = new URLSearchParams({
        payment_title: data.payment_title,
        numb_of_nights: data.numb_of_nights.toString(),
        local_runs: data.local_runs.toString(),
    });

    const response = await fetch(`${API_URL}/postings/generate?${params}`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to generate payments');
    }
}
