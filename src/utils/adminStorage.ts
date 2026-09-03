import { BranchLocation, AllStudioSettings, DayBarConfig } from '../types';
import { getAuthToken, setAuthToken } from './apiClient';
import { getCalendarMapForMonth } from '../data/scheduleData';

export const BRANCH_FILTER_STORAGE_KEY = 'mmm_selected_branch_filter';
const ADMIN_AUTH_KEY = 'mmm_admin_session_auth';

export const DEFAULT_STUDIO_SETTINGS: AllStudioSettings = {
  studio: {
    id: 'default',
    studioNameTh: 'Me.My.Mind Mindfulness Studio',
    studioNameEn: 'Me.My.Mind Mindfulness Studio',
    taglineTh: 'Your Daily Rituals of Self-Love',
    taglineEn: 'Your Daily Rituals of Self-Love',
    sayHiMessageTh: 'สวัสดีค่ะ 👋\n\nเช็คตารางครูบี เลือกวันที่ต้องการ\n แล้วทักแชทมาจองได้เลยค่ะ 💬',
    sayHiMessageEn: 'Hello there 👋\n\nCheck Kru Beever’s schedule, pick your preferred date\nand chat with us to book your session! 💬',
    welcomeGuideMessageTh: `Me.My.Mind Mindfulness Studio ยินดีต้อนรับค่ะ 🤍

ก่อนจองคิว ลองเช็คปฏิทินนี้ดูก่อนได้เลยค่ะ ว่าในวันที่สนใจ:

① ครูบีอยู่สาขาไหน
   ⚪ ขาว = นครสวรรค์  🩷 ชมพูอ่อน = ราชเทวี  🤎 น้ำตาล = ออนทัวร์  💜 ม่วง = ออนไลน์

② วันนั้นเปิดหรือปิดร้าน
   ⚫ สีดำ = ปิดร้าน  🔵 สีฟ้า = วันทำความสะอาดใหญ่ (Big Cleaning)

③ มีกิจกรรมกลุ่มแบบไหนบ้าง
   ⭐ ดาว = กิจกรรมไฮไลท์ประจำเดือน  🎥 กล้อง = กิจกรรมออนไลน์

④ คิววันนั้นเต็มหรือยัง
   🔴 วงกลมขอบแดง = เต็มแล้วนะคะ

ปฏิทินนี้โชว์แค่กิจกรรมกลุ่มเป็นหลักค่ะ ส่วนคิว Private บีไม่ได้ลงไว้ในนี้ทุกเคส เพื่อให้หน้าจอดูสบายตา ไม่รกเกินไป

พอทราบคร่าว ๆ แล้วว่าวันนั้นครูบีอยู่สาขาไหน ทักแชทมาถามคิว Private เพิ่มเติมได้เลยทาง LINE นะคะ 💬

รักและเคารพ
ครูบีเว่อร์ 🤍`,
    welcomeGuideMessageEn: `Welcome to Me.My.Mind Mindfulness Studio 🤍

Before you book, feel free to browse this calendar to see, for your preferred date:

① Which branch Kru Bee will be at
   ⚪ White = Nakhonsawan  🩷 Pink = Ratchathewi  🤎 Brown = On-Tour  💜 Purple = Online

② Whether the studio is open or closed that day
   ⚫ Black = Closed  🔵 Blue = Big Cleaning day

③ What kind of group session is on offer
   ⭐ Star = Monthly featured event  🎥 Camera = Online session

④ Whether the day is already fully booked
   🔴 Red-ringed circle = Fully booked

This calendar focuses on group sessions — Private bookings aren't all listed here, simply to keep things clean and easy to read.

Once you've narrowed down which branch and date work for you, simply message us on LINE and we'll be happy to confirm availability for your Private session. 💬

With love and respect,
Kru Beever 🤍`,
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
    instagram: '@me.my.mind.mindful',
    isActive: true,
    displayOrder: 1
  },
  facilitators: [
    {
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
      instagram: '@me.my.mind.mindful',
      isActive: true,
      displayOrder: 1
    }
  ],
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
    },
    {
      id: 'branch-online',
      branchKey: 'Online',
      nameTh: 'ออนไลน์ (Zoom / Live)',
      nameEn: 'Online Virtual Sessions',
      taglineTh: 'เซสชันออนไลน์ผ่าน Zoom & การทำสมาธิทางไกล',
      taglineEn: 'Virtual Live Sessions & Remote Meditations',
      addressTh: 'เข้าร่วมผ่าน Zoom / Google Meet (ลิงก์ส่งให้หลังยืนยันการจอง)',
      addressEn: 'Live via Zoom / Google Meet link provided upon booking',
      landmarkTh: 'ออนไลน์จากที่บ้าน / ทุกที่ที่คุณสะดวก',
      landmarkEn: 'Join from home or anywhere comfortable',
      dotColor: '#8A6FAE',
      pillBg: '#E9E0F5',
      textColor: '#5D4488',
      photoUrl: '',
      isActive: true,
      displayOrder: 4
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
 * Generate default fallback bar map for initial display before API response
 */
export function getDefaultMonthBars(year: number, month: number): Record<number, DayBarConfig> {
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

  return defaultBars;
}

/**
 * Branch Filter preference (Device/Browser specific UI state)
 */
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

/**
 * Admin Session Auth Check (JWT-backed)
 */
export function checkAdminAuth(): boolean {
  try {
    const token = getAuthToken();
    const sessionAuth = localStorage.getItem(ADMIN_AUTH_KEY);
    return Boolean(token || sessionAuth === 'authenticated_true');
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
      setAuthToken(null);
    }
  } catch {
    // Ignore
  }
}
