import type { DashboardKPIs, ParkingZone, Violation, User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://smart-parking-backend-1p4n.onrender.com/api';

// Helper for fetch requests
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

// Authentication
export const authAPI = {
    login: async (email: string, password: string) => {
        return fetchAPI<{ token: string; user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    getCurrentUser: async () => {
        return fetchAPI<User>('/users/me');
    },
};

// Dashboard
export const dashboardAPI = {
    getKPIs: async () => {
        return fetchAPI<DashboardKPIs>('/dashboard/kpis');
    },

    getZonesLive: async () => {
        return fetchAPI<ParkingZone[]>('/dashboard/zones/live');
    },

    getActiveViolations: async () => {
        return fetchAPI<Violation[]>('/dashboard/violations/active');
    },
};

// Zones
export const zonesAPI = {
    getAll: async () => {
        return fetchAPI<ParkingZone[]>('/zones');
    },

    getById: async (id: string) => {
        return fetchAPI<ParkingZone>(`/zones/${id}`);
    },

    getOccupancy: async (id: string) => {
        return fetchAPI<{ current_count: number; reserved_count: number; last_updated: string }>(`/zones/${id}/occupancy`);
    },
};

// Violations
export const violationsAPI = {
    getAll: async (filters?: { status?: string; zone_id?: string }) => {
        const params = new URLSearchParams(filters as any);
        return fetchAPI<Violation[]>(`/violations?${params}`);
    },

    resolve: async (id: string, notes?: string) => {
        return fetchAPI<Violation>(`/violations/${id}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ notes }),
        });
    },
};

// Response Teams
export const responseAPI = {
    deploy: async (zoneId: string, violationId?: string, teamSize: number = 2) => {
        return fetchAPI('/response/deploy', {
            method: 'POST',
            body: JSON.stringify({ zone_id: zoneId, violation_id: violationId, team_size: teamSize }),
        });
    },
};
