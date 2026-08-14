import { ScheduleEvent } from '../types';

const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('mmm_jwt_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('mmm_jwt_token', token);
    } else {
      localStorage.removeItem('mmm_jwt_token');
    }
  } catch {
    // Ignore
  }
}

/**
 * Fetch events for month from backend API with fallback
 */
export async function apiFetchMonthEvents(year: number, month: number): Promise<ScheduleEvent[] | null> {
  try {
    // month in API is 1-12
    const res = await fetch(`${API_BASE}/events/month/${year}/${month + 1}`);
    if (!res.ok) return null;
    const json: ApiResponse<ScheduleEvent[]> = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('Backend API not reachable, using local storage:', err);
    return null;
  }
}

/**
 * Admin Login via Backend API
 */
export async function apiAdminLogin(username: string, password: string): Promise<{ token: string; user: any } | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (json.success && json.data?.token) {
      setAuthToken(json.data.token);
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('API Login error:', err);
    return null;
  }
}

/**
 * Admin Create Event via Backend API
 */
export async function apiCreateEvent(eventData: Partial<ScheduleEvent>, photoFile?: File): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  
  Object.entries(eventData).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (typeof val === 'object') {
        formData.append(key, JSON.stringify(val));
      } else {
        formData.append(key, String(val));
      }
    }
  });

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const res = await fetch(`${API_BASE}/admin/events`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  return res.json();
}

/**
 * Admin Update Event via Backend API
 */
export async function apiUpdateEvent(id: string, eventData: Partial<ScheduleEvent>, photoFile?: File): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  
  Object.entries(eventData).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (typeof val === 'object') {
        formData.append(key, JSON.stringify(val));
      } else {
        formData.append(key, String(val));
      }
    }
  });

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const res = await fetch(`${API_BASE}/admin/events/${id}`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  return res.json();
}

/**
 * Admin Delete Event via Backend API
 */
export async function apiDeleteEvent(id: string): Promise<any> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/events/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}
