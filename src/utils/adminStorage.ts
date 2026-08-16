import { ScheduleEvent, BranchLocation, MonthBarConfig, DayBarConfig, SpecialStatusDetails, AllStudioSettings, StudioInfo, FacilitatorProfile, BranchItem, ServiceItem, ContactInfo } from '../types';
import { getEventsForMonth, getCalendarMapForMonth, FACILITATOR_BEEVER, BRANCH_INFO } from '../data/scheduleData';

const EVENTS_STORAGE_KEY_PREFIX = 'mmm_schedule_events_';
const BARS_STORAGE_KEY_PREFIX = 'mmm_schedule_bars_';
const ADMIN_AUTH_KEY = 'mmm_admin_session_auth';
const ADMIN_CREDENTIALS_KEY = 'mmm_admin_credentials_config';
const STUDIO_SETTINGS_KEY = 'mmm_studio_settings_v1';

export const DEFAULT_STUDIO_SETTINGS: AllStudioSettings = {
  studio: {
    id: 'default',
    studioNameTh: 'Me.My.Mind Mindfulness Studio',
    studioNameEn: 'Me.My.Mind Mindfulness Studio',
    taglineTh: 'Your Daily Rituals of Self-Love',
    taglineEn: 'Your Daily Rituals of Self-Love',
    sayHiMessageTh: 'สวัสดีค่ะ 👋\n\nเช็คตารางครูบี เลือกวันที่ต้องการ\n แล้วทักแชทมาจองได้เลยค่ะ 💬',
    sayHiMessageEn: 'Hello there 👋\n\nCheck Kru Beever’s schedule, pick your preferred date\nand chat with us to book your session! 💬',
    logoUrl: '',
    defaultLanguage: 'th',
    currency: 'THB',
    timeFormat: '24h'
  },
  facilitator: {
    id: 'default',
    nameTh: 'Kru Beever (ครูบีเวอร์)',
    nameEn: 'Kru Beever (Supapit)',
    titleTh: 'ผู้ก่อตั้ง & ผู้เชี่ยวชาญการบำบัด Somatic Alchemy',
    titleEn: 'Founder & Lead Somatic Alchemist',
    photoUrl: '',
    bioShortTh: 'ผู้บำบัดคลื่นเสียงและศาสตร์นวดหน้ายกกระชับกล้ามเนื้อใบหน้า ประสบการณ์กว่า 10 ปี มุ่งเน้นการคืนความสมดุลให้ระบบประสาทและร่างกาย',
    bioShortEn: 'Certified Sound Healing Practitioner, Advanced Facial Massage Ritualist, and Kundalini Yoga guide at Me.My.Mind Mindfulness Studio. Dedicated to nervous system restoration and mindful body connection.',
    bioLongTh: 'เชี่ยวชาญด้าน Sound Alchemy, Facial Reflexology, Lymphatic Drainage และการผ่อนคลายกล้ามเนื้อสะสมความเครียดเพื่อการฟื้นฟูระบบประสาทองค์รวม',
    bioLongEn: 'Dedicated to somatic alignment, nervous system recalibration, and conscious inner stillness.',
    certifications: [
      'Certified Sound Healing Alchemist (Nepal & UK Academy)',
      'Advanced Thai & Oriental Facial Acupressure Therapist',
      'KRI Certified Kundalini Yoga Teacher',
      'Usui Reiki Master Level 3'
    ],
    lineOa: '@me.my.mind.mindful',
    email: 'me.my.mind.facialmassage@gmail.com',
    phone: '081-xxx-xxxx',
    instagram: '@me.my.mind.mindful'
  },
  branches: [
    {
      id: 'branch-nakhonsawan',
      branchKey: 'Nakhonsawan',
      nameTh: 'สาขาหลักนครสวรรค์',
      nameEn: 'Nakhonsawan Main Sanctuary',
      taglineTh: 'สวนสงบและสตูดิโอหลักแห่งการฟื้นฟู',
      taglineEn: 'Headquarters Sanctuary & Garden Studio',
      addressTh: '88/4 ถนนสวรรค์วิถี ปากน้ำโพ เมือง นครสวรรค์ 60000',
      addressEn: '88/4 Sawan Vithi Road, Pak Nam Pho, Mueang, Nakhon Sawan 60000',
      landmarkTh: 'Sanctuary Garden ใกล้ Paradise Park',
      landmarkEn: 'Sanctuary Garden near Paradise Park',
      dotColor: '#FFFFFF',
      pillBg: '#FDFBF7',
      textColor: '#2B2B2B',
      photoUrl: '',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'branch-ratchathewi',
      branchKey: 'Ratchathewi',
      nameTh: 'สาขาราชเทวี กรุงเทพฯ',
      nameEn: 'Bangkok City Loft (Ratchathewi)',
      taglineTh: 'สตูดิโอกลางเมือง & เวิร์กช็อปสุดสัปดาห์',
      taglineEn: 'Bangkok City Loft & Weekend Workshop Space',
      addressTh: 'อาคารพญาไทพลาซ่า ชั้น 5 ถนนพญาไท ราชเทวี กรุงเทพฯ 10400',
      addressEn: 'Phayathai Plaza Building, 5th Floor, Phayathai Rd, Ratchathewi, Bangkok 10400',
      landmarkTh: 'BTS ราชเทวี ทางออก 2 มีทางเชื่อมตรงเข้าตึก',
      landmarkEn: 'BTS Ratchathewi (Direct Skywalk Exit 2)',
      dotColor: '#F8C8D7',
      pillBg: '#F9D7E1',
      textColor: '#8E2849',
      photoUrl: '',
      isActive: true,
      displayOrder: 2
    },
    {
      id: 'branch-ontour',
      branchKey: 'On-Tour',
      nameTh: 'ทัวร์ต่างจังหวัด / Private Retreats',
      nameEn: 'On-Tour & Private Retreats',
      taglineTh: 'รีทรีตธรรมชาติ & ไพรเวตองค์กรทั่วประเทศ',
      taglineEn: 'Private Retreats & Corporate Mindfulness Immersions',
      addressTh: 'จัดนอกสถานที่ทั่วประเทศ (เชียงใหม่, ภูเก็ต, หัวหิน & องค์กร)',
      addressEn: 'On-location Across Thailand (Chiang Mai, Phuket, Hua Hin & Corporate)',
      landmarkTh: 'สถานที่ธรรมชาติและรีสอร์ทที่คัดสรรพิเศษ',
      landmarkEn: 'Bespoke On-Site Venues & Nature Resorts',
      dotColor: '#A67863',
      pillBg: '#A67863',
      textColor: '#FFFFFF',
      photoUrl: '',
      isActive: true,
      displayOrder: 3
    }
  ],
  services: [
    {
      id: 'srv-1',
      nameTh: 'Sound Healing & Sound Baths',
      nameEn: 'Tibetan & Quartz Sound Bath',
      category: 'Sound Healing / Sound Baths',
      descriptionTh: 'การบำบัดด้วยคลื่นเสียงขันทิเบตและคริสตัลโบวล์ คืนความสงบให้สมองและคลายระบบประสาท',
      descriptionEn: 'Acoustic vibrational sound therapy balancing parasympathetic nervous system.',
      basePrice: 950,
      durationMinutes: 90,
      photoUrl: '',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'srv-2',
      nameTh: 'Self-Love Facial Massage Ritual',
      nameEn: 'Mindful Facial Acupressure',
      category: 'Facial Massage Rituals',
      descriptionTh: 'ศาสตร์การนวดหน้าสลายพังผืด กดจุดสะท้อน ลดอาการกัดฟัน คลายกล้ามเนื้อใบหน้า',
      descriptionEn: 'Lymphatic drainage, cranial acupressure, and TMJ tension release ritual.',
      basePrice: 1350,
      durationMinutes: 90,
      photoUrl: '',
      isActive: true,
      displayOrder: 2
    },
    {
      id: 'srv-3',
      nameTh: 'Guasha Master Training',
      nameEn: 'Gua Sha Practitioner Workshop',
      category: 'Workshops & Training',
      descriptionTh: 'หลักสูตรอบรมกัวซาใบหน้ามืออาชีพและเทคนิคกดจุดทางกายวิภาคศาสตร์',
      descriptionEn: 'Comprehensive practitioner training in Bian Stone Gua Sha & anatomy.',
      basePrice: 4900,
      durationMinutes: 360,
      photoUrl: '',
      isActive: true,
      displayOrder: 3
    },
    {
      id: 'srv-4',
      nameTh: 'Kundalini Yoga & Breathwork',
      nameEn: 'Kundalini Yoga & Pranayama',
      category: 'Kundalini Yoga',
      descriptionTh: 'โยคะปลุกพลังชีวิต ฝึกการหายใจคลายความเครียดสะสมและเสริมสมาธิลึก',
      descriptionEn: 'Dynamic breathwork kriyas and meditation for energy alignment.',
      basePrice: 850,
      durationMinutes: 75,
      photoUrl: '',
      isActive: true,
      displayOrder: 4
    },
    {
      id: 'srv-5',
      nameTh: 'Usui Reiki Healing & Crystals',
      nameEn: 'Reiki Energy Healing',
      category: 'Reiki',
      descriptionTh: 'การส่งผ่านพลังงานเรกิร่วมกับคริสตัลปรับสมดุลจักระ คืนความผ่อนคลายและหลับสบาย',
      descriptionEn: 'Gentle biofield balancing with hands-on Reiki and quartz frequencies.',
      basePrice: 1100,
      durationMinutes: 90,
      photoUrl: '',
      isActive: true,
      displayOrder: 5
    },
    {
      id: 'srv-6',
      nameTh: 'Corporate Mindfulness & On-Tour',
      nameEn: 'Corporate Wellness & Retreats',
      category: 'Corporate Workshops',
      descriptionTh: 'เวิร์กช็อปสำหรับองค์กรฟื้นฟูภาวะหมดไฟ ลดอาการออฟฟิศซินโดรม',
      descriptionEn: 'Tailored corporate burnout prevention and ergonomic mindfulness.',
      basePrice: 2200,
      durationMinutes: 120,
      photoUrl: '',
      isActive: true,
      displayOrder: 6
    }
  ],
  contact: {
    id: 'default',
    lineOa: '@me.my.mind.mindful',
    lineUrl: 'https://line.me/R/oaMessage/@me.my.mind.mindful',
    email: 'me.my.mind.facialmassage@gmail.com',
    phone: '081-xxx-xxxx',
    instagram: '@me.my.mind.mindful',
    facebook: 'Me.My.Mind Mindfulness Studio',
    website: 'me-my-mind.com'
  }
};

/**
 * Load Studio Settings from LocalStorage (with Default Fallback)
 */
export function loadStudioSettingsLocal(): AllStudioSettings {
  try {
    const raw = localStorage.getItem(STUDIO_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.studio && parsed.facilitator) {
        const studio = { ...DEFAULT_STUDIO_SETTINGS.studio, ...parsed.studio };

        return {
          ...DEFAULT_STUDIO_SETTINGS,
          ...parsed,
          studio,
          facilitator: { ...DEFAULT_STUDIO_SETTINGS.facilitator, ...parsed.facilitator },
          branches: Array.isArray(parsed.branches) && parsed.branches.length > 0 ? parsed.branches : DEFAULT_STUDIO_SETTINGS.branches,
          services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : DEFAULT_STUDIO_SETTINGS.services,
          contact: { ...DEFAULT_STUDIO_SETTINGS.contact, ...parsed.contact }
        };
      }
    }
  } catch (err) {
    console.error('Failed to load studio settings from local storage:', err);
  }
  return DEFAULT_STUDIO_SETTINGS;
}

/**
 * Save Studio Settings to LocalStorage & Dispatch event
 */
export function saveStudioSettingsLocal(settings: AllStudioSettings): void {
  try {
    localStorage.setItem(STUDIO_SETTINGS_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: settings }));
    }
  } catch (err) {
    console.error('Failed to save studio settings locally:', err);
  }
}


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

export const BRANCH_FILTER_STORAGE_KEY = 'mmm_selected_branch_filter';

export function getStoredBranchFilter(): BranchLocation | 'All' {
  try {
    const val = localStorage.getItem(BRANCH_FILTER_STORAGE_KEY);
    if (val === 'Nakhonsawan' || val === 'Ratchathewi' || val === 'On-Tour' || val === 'All') {
      return val;
    }
  } catch {
    // ignore
  }
  return 'All';
}

export function saveStoredBranchFilter(branch: BranchLocation | 'All'): void {
  try {
    localStorage.setItem(BRANCH_FILTER_STORAGE_KEY, branch);
  } catch {
    // ignore
  }
}

// Reset entire schedule database across ALL months (Start Fresh)
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
      const now = new Date();
      const currentY = now.getFullYear();
      
      // Explicitly set all 12 months of current year to empty arrays so fallbacks won't re-seed
      for (let m = 0; m < 12; m++) {
        localStorage.setItem(getEventsKey(currentY, m), JSON.stringify([]));
        
        // Reset bars to default Nakhonsawan
        const emptyBars: Record<number, DayBarConfig> = {};
        const daysCount = new Date(currentY, m + 1, 0).getDate();
        for (let d = 1; d <= daysCount; d++) {
          emptyBars[d] = {
            dayNum: d,
            branch: 'Nakhonsawan',
            isPinkPill: false,
            isBrownPill: false
          };
        }
        localStorage.setItem(getBarsKey(currentY, m), JSON.stringify(emptyBars));
      }
      
      // Default to Nakhonsawan branch ONLY
      saveStoredBranchFilter('Nakhonsawan');

      // Dispatch global events for live reactive update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mmm_reset_start_fresh', {
          detail: { resetType: 'all_data', defaultBranch: 'Nakhonsawan' }
        }));
        window.dispatchEvent(new CustomEvent('mmm_events_updated', {
          detail: { year: currentY, month: now.getMonth(), events: [] }
        }));
      }
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
