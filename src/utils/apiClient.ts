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

/**
 * Fetch all studio settings (Public & Admin)
 */
export async function apiFetchStudioSettings(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch studio settings from server:', err);
    return null;
  }
}

/**
 * Save Studio Settings (Branding & General)
 */
export async function apiSaveStudioSettings(settingsData: any, logoFile?: File): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();

  Object.entries(settingsData).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
    }
  });

  if (logoFile) {
    formData.append('logo', logoFile);
  }

  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  return res.json();
}

/**
 * Save Facilitator Profile
 */
export async function apiSaveFacilitator(facData: any, photoFile?: File): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();

  Object.entries(facData).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
    }
  });

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const res = await fetch(`${API_BASE}/admin/facilitator`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  return res.json();
}

/**
 * Save Branch (Create or Update)
 */
export async function apiSaveBranch(branchData: any, photoFile?: File, id?: string): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();

  Object.entries(branchData).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
    }
  });

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const url = id ? `${API_BASE}/admin/branches/${id}` : `${API_BASE}/admin/branches`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  return res.json();
}

/**
 * Delete Branch
 */
export async function apiDeleteBranch(id: string): Promise<any> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/branches/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

/**
 * Save Service (Create or Update)
 */
export async function apiSaveService(serviceData: any, photoFile?: File, id?: string): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();

  Object.entries(serviceData).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
    }
  });

  if (photoFile) {
    formData.append('photo', photoFile);
  }

  const url = id ? `${API_BASE}/admin/services/${id}` : `${API_BASE}/admin/services`;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  return res.json();
}

/**
 * Delete Service
 */
export async function apiDeleteService(id: string): Promise<any> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/admin/services/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

/**
 * Reset data on server
 */
export async function apiResetData(resetType: 'all_data' | 'month_events' | 'month_bars', year?: number, month?: number): Promise<any> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/reset-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ resetType, year, month })
    });
    return res.json();
  } catch (err) {
    console.warn('apiResetData failed:', err);
    return { success: false, error: err };
  }
}


