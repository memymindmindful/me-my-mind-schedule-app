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
 * Fetch events for month from backend API
 */
export async function apiFetchMonthEvents(year: number, month: number): Promise<ScheduleEvent[] | null> {
  try {
    // month in API is 1-12
    const res = await fetch(`${API_BASE}/events/month/${year}/${month + 1}`);
    if (!res.ok) {
      console.warn(`[API] Failed to fetch events (${res.status}): ${res.statusText}`);
      return null;
    }
    const json: ApiResponse<ScheduleEvent[]> = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('Backend API not reachable:', err);
    return null;
  }
}

/**
 * Fetch calendar day bars/pills from backend API
 */
export async function apiFetchMonthBars(year: number, month: number): Promise<Record<number, any> | null> {
  try {
    const res = await fetch(`${API_BASE}/bars/${year}/${month + 1}`);
    if (!res.ok) {
      console.warn(`[API] Failed to fetch month bars (${res.status}): ${res.statusText}`);
      return null;
    }
    const json: ApiResponse<Record<number, any>> = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch month bars from server:', err);
    return null;
  }
}

/**
 * Helper to handle fetch responses and handle 401/403 token expiration
 */
async function handleResponse<T = any>(res: Response): Promise<ApiResponse<T>> {
  try {
    const json = await res.json();
    if (!res.ok) {
      if (
        res.status === 401 ||
        res.status === 403 ||
        json.code === 'INVALID_TOKEN' ||
        json.code === 'NO_TOKEN' ||
        json.code === 'UNAUTHORIZED' ||
        json.code === 'FORBIDDEN'
      ) {
        window.dispatchEvent(new CustomEvent('mmm_auth_expired', { detail: { error: json.error || 'Session expired' } }));
      }
      return {
        success: false,
        error: json.error || `Server error (${res.status})`,
        code: json.code || `HTTP_${res.status}`
      };
    }
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Network error (${res.status})`,
      code: 'NETWORK_ERROR'
    };
  }
}

/**
 * Save calendar day bars/pills to backend API
 */
export async function apiSaveMonthBars(year: number, month: number, bars: Record<number, any>): Promise<ApiResponse> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/bars/${year}/${month + 1}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ bars })
    });
    return handleResponse(res);
  } catch (err: any) {
    console.error('Failed to save month bars:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Verify Admin Password
 */
export async function apiVerifyAdminPassword(password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const json = await res.json();
    return Boolean(json.success && json.verified);
  } catch {
    return false;
  }
}

/**
 * Change Admin Password & Username
 */
export async function apiChangeAdminPassword(data: { username?: string; currentPassword?: string; newPassword?: string }): Promise<ApiResponse> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  } catch (err: any) {
    console.error('Failed to change password:', err);
    return { success: false, error: err.message || 'Connection failed' };
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
export async function apiCreateEvent(eventData: Partial<ScheduleEvent>, photoFile?: File): Promise<ApiResponse> {
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

  try {
    const res = await fetch(`${API_BASE}/admin/events`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error — could not connect to server' };
  }
}

/**
 * Admin Update Event via Backend API
 */
export async function apiUpdateEvent(id: string, eventData: Partial<ScheduleEvent>, photoFile?: File): Promise<ApiResponse> {
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

  try {
    const res = await fetch(`${API_BASE}/admin/events/${id}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error — could not connect to server' };
  }
}

/**
 * Admin Delete Event via Backend API
 */
export async function apiDeleteEvent(id: string): Promise<ApiResponse> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/events/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
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
export async function apiSaveStudioSettings(settingsData: any, logoFile?: File): Promise<ApiResponse> {
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

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Save Facilitator Profile
 */
export async function apiSaveFacilitator(facData: any, photoFile?: File): Promise<ApiResponse> {
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

  try {
    const res = await fetch(`${API_BASE}/admin/facilitator`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Save Branch (Create or Update)
 */
export async function apiSaveBranch(branchData: any, photoFile?: File, id?: string): Promise<ApiResponse> {
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

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Delete Branch
 */
export async function apiDeleteBranch(id: string): Promise<ApiResponse> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/branches/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Save Service (Create or Update)
 */
export async function apiSaveService(serviceData: any, photoFile?: File, id?: string): Promise<ApiResponse> {
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

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Delete Service
 */
export async function apiDeleteService(id: string): Promise<ApiResponse> {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/admin/services/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return handleResponse(res);
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Reset data on server
 */
export async function apiResetData(resetType: 'all_data' | 'month_events' | 'month_bars', year?: number, month?: number): Promise<ApiResponse> {
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
    return handleResponse(res);
  } catch (err: any) {
    console.warn('apiResetData failed:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}


