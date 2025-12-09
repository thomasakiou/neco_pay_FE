const API_URL = '';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    username: string;
    role: string;
}

export interface AuthUser {
    username: string;
    role: string;
    token: string;
}

export async function login(username: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Invalid credentials');
    }

    const data: LoginResponse = await response.json();

    const user: AuthUser = {
        username: data.username,
        role: data.role,
        token: data.access_token,
    };

    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    return user;
}

export function logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

export function getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
}

export function getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

export function isAuthenticated(): boolean {
    return !!getStoredToken();
}
