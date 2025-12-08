import { Staff, CreateStaffDTO } from '../types/staff';

const API_URL = ''; // Use relative path to leverage Vite proxy

export async function getStaffList(skip: number = 0, limit: number = 100): Promise<Staff[]> {
    try {
        const response = await fetch(`${API_URL}/staff/?skip=${skip}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching staff: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch staff:", error);
        return [];
    }
}

export async function createStaff(staffData: CreateStaffDTO): Promise<Staff> {
    const response = await fetch(`${API_URL}/staff/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : `Error creating staff: ${response.statusText}`);
    }

    return response.json();
}

export async function updateStaff(id: number, staffData: CreateStaffDTO): Promise<Staff> {
    const response = await fetch(`${API_URL}/staff/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : `Error updating staff: ${response.statusText}`);
    }

    return response.json();
}

export async function uploadStaff(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/staff/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : `Error uploading staff: ${response.statusText}`);
    }
}

export async function resetPosted(): Promise<void> {
    const response = await fetch(`${API_URL}/staff/reset-posted`, {
        method: 'POST',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : `Error resetting posted status: ${response.statusText}`);
    }
}

export async function deleteStaff(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/staff/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : `Error deleting staff: ${response.statusText}`);
    }
}
