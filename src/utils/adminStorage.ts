import { ScheduleEvent, BranchLocation, MonthBarConfig, DayBarConfig, SpecialStatusDetails } from '../types';
import { getEventsForMonth, getCalendarMapForMonth } from '../data/scheduleData';

const EVENTS_STORAGE_KEY_PREFIX = 'mmm_schedule_events_';
const BARS_STORAGE_KEY_PREFIX = 'mmm_schedule_bars_';
const ADMIN_AUTH_KEY = 'mmm_admin_session_auth';
const ADMIN_CREDENTIALS_KEY = 'mmm_admin_credentials_config';

export interface AdminCredentials {
  username: string;
  passcode: string;
  updatedAt?: string;
}

const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  username: 'admin',
  passcode: '1234'
};

// Get Admin Credentials
export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.username === 'string' && typeof parsed.passcode === 'string') {
        return {
          username: parsed.username.trim() || DEFAULT_ADMIN_CREDENTIALS.username,
          passcode: parsed.passcode.trim() || DEFAULT_ADMIN_CREDENTIALS.passcode,
          updatedAt: parsed.updatedAt
        };
      }
    }
  } catch (err) {
    console.error('Failed to load admin credentials:', err);
  }
  return DEFAULT_ADMIN_CREDENTIALS;
}

// Update Admin Credentials
export function saveAdminCredentials(creds: AdminCredentials): boolean {
  try {
    const cleanCreds: AdminCredentials = {
      username: (creds.username || '').trim() || DEFAULT_ADMIN_CREDENTIALS.username,
      passcode: (creds.passcode || '').trim() || DEFAULT_ADMIN_CREDENTIALS.passcode,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(cleanCreds));
    return true;
  } catch (err) {
    console.error('Failed to save admin credentials:', err);
    return false;
  }
}

// Validate Login Credentials (supports custom creds or master fallback)
export function validateAdminLogin(inputUser: string, inputPass: string): boolean {
  const current = getAdminCredentials();
  const u = inputUser.trim().toLowerCase();
  const p = inputPass.trim();

  // Match custom user & pass
  if (u === current.username.toLowerCase() && p === current.passcode) {
    return true;
  }

  // Master fallbacks for convenience
  if ((u === 'admin' || u === '') && (p === 'admin' || p === '1234' || p === 'mindful2026' || p === 'beever')) {
    return true;
  }

  return false;
}

// Helper for storage key
function getEventsKey(year: number, month: number): string {
  return `${EVENTS_STORAGE_KEY_PREFIX}${year}_${month}`;
}

function getBarsKey(year: number, month: number): string {
  return `${BARS_STORAGE_KEY_PREFIX}${year}_${month}`;
}

// Load Events for specific month
export function loadMonthEvents(year: number, month: number): ScheduleEvent[] {
  try {
    const raw = localStorage.getItem(getEventsKey(year, month));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load events from storage:', err);
  }
  // Fallback to default generated events
  const defaultEvents = getEventsForMonth(year, month);
  saveMonthEvents(year, month, defaultEvents);
  return defaultEvents;
}

// Save Events for specific month
export function saveMonthEvents(year: number, month: number, events: ScheduleEvent[]): void {
  try {
    localStorage.setItem(getEventsKey(year, month), JSON.stringify(events));
    // Trigger global storage update event for live reactive sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mmm_events_updated', { detail: { year, month, events } }));
    }
  } catch (err) {
    console.error('Failed to save events to storage:', err);
  }
}

// Load Bar Tabs & Day Status for specific month
export function loadMonthBars(year: number, month: number): Record<number, DayBarConfig> {
  try {
    const raw = localStorage.getItem(getBarsKey(year, month));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load bar configs:', err);
  }

  // Generate initial default bar config from scheduleData
  const initialMap = getCalendarMapForMonth(year, month);
  const defaultBars: Record<number, DayBarConfig> = {};

  Object.entries(initialMap).forEach(([dayStr, data]) => {
    const d = Number(dayStr);
    let pillPos: 'single' | 'start' | 'middle' | 'end' | undefined = undefined;

    if (d === 1 || d === 13 || d === 20 || d === 27) pillPos = 'start';
    else if (d === 4 || d === 16 || d === 23 || d === 30) pillPos = 'end';
    else if (d === 25) pillPos = 'single';
    else if ((d >= 2 && d <= 3) || (d >= 14 && d <= 15) || (d >= 21 && d <= 22) || (d >= 28 && d <= 29)) pillPos = 'middle';

    defaultBars[d] = {
      dayNum: d,
      branch: data.branch,
      tourCity: data.tourLocation ? data.tourLocation.replace(' (Chiang Mai)', '').replace('ออนทัวร์ ', '') : undefined,
      isPinkPill: data.isPinkPill,
      isBrownPill: data.isBrownPill,
      pillPosition: pillPos,
      hasSpecialStar: data.hasSpecialStar,
      specialStatus: data.specialStatus
    };
  });

  saveMonthBars(year, month, defaultBars);
  return defaultBars;
}

// Save Bar Tabs & Day Status for specific month
export function saveMonthBars(year: number, month: number, bars: Record<number, DayBarConfig>): void {
  try {
    localStorage.setItem(getBarsKey(year, month), JSON.stringify(bars));
  } catch (err) {
    console.error('Failed to save bars to storage:', err);
  }
}

// Reset events for a specific month (empty or default template)
export function resetMonthEvents(year: number, month: number, resetToEmpty: boolean = true): ScheduleEvent[] {
  try {
    if (resetToEmpty) {
      localStorage.setItem(getEventsKey(year, month), JSON.stringify([]));
      return [];
    } else {
      localStorage.removeItem(getEventsKey(year, month));
      return loadMonthEvents(year, month);
    }
  } catch (err) {
    console.error('Failed to reset month events:', err);
    return [];
  }
}

// Reset bar configs for a specific month
export function resetMonthBars(year: number, month: number, resetToEmpty: boolean = true): Record<number, DayBarConfig> {
  try {
    if (resetToEmpty) {
      const emptyBars: Record<number, DayBarConfig> = {};
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        emptyBars[d] = {
          dayNum: d,
          branch: 'Nakhonsawan',
          isPinkPill: false,
          isBrownPill: false
        };
      }
      localStorage.setItem(getBarsKey(year, month), JSON.stringify(emptyBars));
      return emptyBars;
    } else {
      localStorage.removeItem(getBarsKey(year, month));
      return loadMonthBars(year, month);
    }
  } catch (err) {
    console.error('Failed to reset month bars:', err);
    return {};
  }
}

// Reset entire schedule database across ALL months
export function resetAllData(resetToEmpty: boolean = true): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(EVENTS_STORAGE_KEY_PREFIX) || key.startsWith(BARS_STORAGE_KEY_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    if (resetToEmpty) {
      // Set current active month key to empty array so fallback won't repopulate demo data
      const now = new Date();
      localStorage.setItem(getEventsKey(now.getFullYear(), now.getMonth()), JSON.stringify([]));
    }
  } catch (err) {
    console.error('Failed to reset all data:', err);
  }
}

// Auth Helper
export function checkAdminAuth(): boolean {
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'authenticated_true';
  } catch {
    return false;
  }
}

export function setAdminAuth(isAuth: boolean): void {
  try {
    if (isAuth) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'authenticated_true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch {
    // Ignore
  }
}
