import { Payment } from '../types/payment';

const API_URL = ''; // Proxy handles the base URL

export async function getPayments(skip: number = 0, limit: number = 100000): Promise<Payment[]> {
    const response = await fetch(`${API_URL}/payments/?skip=${skip}&limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch payments');
    }
    return response.json();
}

export async function deletePayment(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/payments/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete payment');
    }
}

export async function deleteAllPayments(): Promise<void> {
    const response = await fetch(`${API_URL}/payments/`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete all payments');
    }
}
