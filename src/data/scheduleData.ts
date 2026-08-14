import { ScheduleEvent, Facilitator, BranchLocation, SpecialStatusDetails, OfferingCategory } from '../types';

export const FACILITATOR_BEEVER: Facilitator = {
  name: 'Kru Beever (Supapit)',
  role: 'Founder & Lead Somatic Alchemist',
  bio: 'Certified Sound Healing Practitioner, Advanced Facial Massage Ritualist, and Kundalini Yoga guide at Me.My.Mind Mindfulness Studio. Dedicated to nervous system restoration and mindful body connection.',
  certifications: [
    'Certified Sound Healing Alchemist (Nepal & UK Academy)',
    'Advanced Thai & Oriental Facial Acupressure Therapist',
    'KRI Certified Kundalini Yoga Teacher',
    'Usui Reiki Master Level 3'
  ]
};

export const BRANCH_INFO: Record<BranchLocation, {
  name: string;
  nameTh: string;
  tagline: string;
  address: string;
  dotColor: string;
  pillBg: string;
  textColor: string;
  landmark: string;
}> = {
  'Nakhonsawan': {
    name: 'Nakhonsawan Main',
    nameTh: 'สาขาหลักนครสวรรค์',
    tagline: 'Headquarters Sanctuary & Garden Studio',
    address: '88/4 Sawan Vithi Road, Pak Nam Pho, Mueang, Nakhon Sawan 60000',
    dotColor: '#FFFFFF',
    pillBg: '#FDFBF7',
    textColor: '#2B2B2B',
    landmark: 'Sanctuary Garden near Paradise Park'
  },
  'Ratchathewi': {
    name: 'Ratchathewi Branch',
    nameTh: 'สาขาราชเทวี กรุงเทพฯ',
    tagline: 'Bangkok City Loft & Weekend Workshop Space',
    address: 'Phayathai Plaza Building, 5th Floor, Phayathai Rd, Ratchathewi, Bangkok 10400',
    dotColor: '#F8C8D7',
    pillBg: '#F9D7E1',
    textColor: '#8E2849',
    landmark: 'BTS Ratchathewi (Direct Skywalk Exit 2)'
  },
  'On-Tour': {
    name: 'On-Tour',
    nameTh: 'ทัวร์ต่างจังหวัด / Private',
    tagline: 'Private Retreats & Corporate Mindfulness Immersions',
    address: 'On-location Across Thailand (Chiang Mai, Phuket, Hua Hin & Corporate)',
    dotColor: '#A67863',
    pillBg: '#A67863',
    textColor: '#FFFFFF',
    landmark: 'Bespoke On-Site Venues & Nature Resorts'
  }
};

export interface EventTemplate {
  templateId: string;
  dayNum: number;
  name: string;
  englishName: string;
  subtitle: string;
  category: OfferingCategory;
  branch: BranchLocation;
  locationDetails: string;
  timeDisplay: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceThb: number;
  capacity: number;
  bookedCount: number;
  level: string;
  posterUrl?: string;
  posterTag?: string;
  sensoryNotes: string[];
  description: string;
  benefits: string[];
  preparationTips: string[];
  isSpecialStar: boolean;
  isFeatured: boolean;
  status: 'available' | 'almost_full' | 'fully_booked';
}

export const BASE_EVENT_TEMPLATES: EventTemplate[] = [
  {
    templateId: 'evt-01',
    dayNum: 4,
    name: 'เขียน ปล่อย ใจ Sound Bath',
    englishName: 'Reflective Journaling & Deep Tibetan Sound Bath',
    subtitle: 'Acoustic vibrational release with mindfulness journaling to unload mental fatigue',
    category: 'Sound Healing / Sound Baths',
    branch: 'Ratchathewi' as BranchLocation,
    locationDetails: 'Ratchathewi Branch (5th Fl, Phayathai Plaza)',
    timeDisplay: '9 am',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    durationMinutes: 90,
    priceThb: 950,
    capacity: 12,
    bookedCount: 9,
    level: 'All Levels',
    posterUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=900&q=80',
    posterTag: 'Acoustic & Sound Ritual',
    sensoryNotes: ['Tibetan Singing Bowls', 'Palo Santo Smoke Cleansing', 'Warm Oat Tea'],
    description: 'Immerse your senses in hand-hammered singing bowls and intuitive introspective journaling. Let gentle acoustic frequencies soothe the nervous system and release subconscious tension.',
    benefits: ['Subconscious stress release', 'Mental clarity and stillness', 'Balances parasympathetic nervous system'],
    preparationTips: ['Wear comfortable, relaxed clothing', 'A journal notebook and writing utensils provided'],
    isSpecialStar: true,
    isFeatured: true,
    status: 'available' as const
  },
  {
    templateId: 'evt-02',
    dayNum: 18,
    name: 'Self-Love Facial Massage',
    englishName: 'Mindful Facial Acupressure & Natural Lifting Ritual',
    subtitle: 'Gentle hands-on lymphatic drainage, cranial tension release, and botanical oils',
    category: 'Facial Massage Rituals',
    branch: 'Ratchathewi' as BranchLocation,
    locationDetails: 'Ratchathewi Branch (5th Fl, Phayathai Plaza)',
    timeDisplay: '1 pm',
    startTime: '01:00 PM',
    endTime: '02:30 PM',
    durationMinutes: 90,
    priceThb: 1350,
    capacity: 10,
    bookedCount: 7,
    level: 'All Levels',
    posterUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
    posterTag: 'Facial Sculpting Ritual',
    sensoryNotes: ['Organic Cold-Pressed Rosehip', 'Herbal Warm Compress', 'Acupressure Wands'],
    description: 'Learn the sacred ritual of self-facial sculpting. Kru Beever guides you step-by-step through releasing TMJ jaw tightness, lymphatic stagnation, and temple headaches.',
    benefits: ['Relieves jaw TMJ clenching', 'Boosts facial radiance & contouring', 'Deep cranial relaxation'],
    preparationTips: ['Arrive without heavy makeup (gentle cleansing wipes available)'],
    isSpecialStar: true,
    isFeatured: true,
    status: 'available' as const
  },
  {
    templateId: 'evt-03',
    dayNum: 26,
    name: 'Guasha Pro Training',
    englishName: 'Master Certification in Traditional Bian Stone Gua Sha',
    subtitle: 'Intensive masterclass on fascia release, meridian pathways, and therapeutic ergonomics',
    category: 'Workshops & Training',
    branch: 'Ratchathewi' as BranchLocation,
    locationDetails: 'Ratchathewi Branch (5th Fl, Phayathai Plaza)',
    timeDisplay: '10 am',
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    durationMinutes: 360,
    priceThb: 4900,
    capacity: 8,
    bookedCount: 7,
    level: 'All Levels / Practitioners',
    posterUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80',
    posterTag: 'Professional Training & Certificate',
    sensoryNotes: ['Handcrafted Bian Stones', 'Botanical Herbal Oils', 'Course Manual & Certificate'],
    description: 'Our flagship professional workshop. Master the anatomical precision of facial and neck Gua Sha, lymphatic drainage vectors, and tension releasing techniques.',
    benefits: ['Full practitioner certificate', 'Hands-on live practice supervision', 'Includes premium Bian Stone tool set'],
    preparationTips: ['Full day immersion; organic light lunch and herbal refreshments included'],
    isSpecialStar: true,
    isFeatured: true,
    status: 'almost_full' as const
  },
  {
    templateId: 'evt-07',
    dayNum: 1,
    name: 'Evening Full Moon Sound Alchemy',
    englishName: '432Hz Quartz Crystal Bowls & Ocean Drum Journey',
    subtitle: 'High vibrational lunar frequency sound bath in the sanctuary garden',
    category: 'Sound Healing / Sound Baths',
    branch: 'Ratchathewi' as BranchLocation,
    locationDetails: 'Ratchathewi Branch (5th Fl, Phayathai Plaza)',
    timeDisplay: '7 pm',
    startTime: '07:00 PM',
    endTime: '08:15 PM',
    durationMinutes: 75,
    priceThb: 950,
    capacity: 12,
    bookedCount: 10,
    level: 'All Levels',
    sensoryNotes: ['7-Chakra Quartz Bowls', 'Ocean Wave Drums', 'Chamomile Tea'],
    description: 'Immerse in pure sonic waves calibrated to 432Hz. Feel tension melt away as resonant frequencies gently recalibrate cellular vibrations.',
    benefits: ['Profound calm and anxiety reduction', 'Improves sleep cycle', 'Emotional balancing'],
    preparationTips: ['Eye pillows and warm organic blankets provided'],
    isSpecialStar: false,
    isFeatured: false,
    status: 'available' as const
  },
  {
    templateId: 'evt-11',
    dayNum: 3,
    name: 'Sound Bath & คลื่นเสียงผ่อนคลายลึก',
    englishName: 'Deep Relaxing Sound Bath & Somatic Unwinding',
    subtitle: 'Healing frequencies restoring nervous equilibrium after long work weeks',
    category: 'Sound Healing / Sound Baths',
    branch: 'Ratchathewi' as BranchLocation,
    locationDetails: 'Ratchathewi Branch (5th Fl, Phayathai Plaza)',
    timeDisplay: '6 pm',
    startTime: '06:00 PM',
    endTime: '07:30 PM',
    durationMinutes: 90,
    priceThb: 950,
    capacity: 10,
    bookedCount: 8,
    level: 'All Levels',
    sensoryNotes: ['Chime Alchemy', 'Essential Herbal Infusion', 'Organic Eye Pillow'],
    description: 'A soothing evening acoustic escape to melt away shoulder tension and racing thoughts before the weekend.',
    benefits: ['Deep restorative state', 'Reduces muscular tension', 'Clears digital fatigue'],
    preparationTips: ['Wear non-restrictive attire'],
    isSpecialStar: false,
    isFeatured: true,
    status: 'available' as const
  },
  {
    templateId: 'evt-08',
    dayNum: 14,
    name: 'Restorative Gua Sha & Sound Retreat',
    englishName: 'Signature Retreat: Cool Mist Facial & Tibetan Sound Retreat',
    subtitle: 'Nourishing holiday ritual escaping city heat with refreshing herbal mists and sound therapy',
    category: 'Facial Massage Rituals',
    branch: 'Nakhonsawan' as BranchLocation,
    locationDetails: 'Nakhonsawan Main Sanctuary',
    timeDisplay: '10 am',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    durationMinutes: 120,
    priceThb: 1500,
    capacity: 10,
    bookedCount: 6,
    level: 'All Levels',
    sensoryNotes: ['Organic Rose Water Mist', 'Chilled Jade Rollers', 'Handmade Lotus Flower Tea'],
    description: 'A special renewal ritual. Combine cooling jade facial massage with deeply grounding acoustic sound baths in our quiet garden sanctuary.',
    benefits: ['Cooling anti-inflammatory relief', 'Lymphatic detoxification', 'Mindfulness renewal'],
    preparationTips: ['Loose comfortable attire encouraged'],
    isSpecialStar: false,
    isFeatured: false,
    status: 'available' as const
  },
  {
    templateId: 'evt-12',
    dayNum: 15,
    name: 'นวดหน้ายกกระชับ & ปรับสมดุลผิว',
    englishName: 'Sacred Facial Sculpting & Lymphatic Ritual',
    subtitle: 'Holistic facial reflexology and meridian drainage with botanicals',
    category: 'Facial Massage Rituals',
    branch: 'Nakhonsawan' as BranchLocation,
    locationDetails: 'Nakhonsawan Main Sanctuary',
    timeDisplay: '1 pm',
    startTime: '01:00 PM',
    endTime: '02:30 PM',
    durationMinutes: 90,
    priceThb: 1350,
    capacity: 8,
    bookedCount: 5,
    level: 'All Levels',
    sensoryNotes: ['Organic Botanical Elixir', 'Jade Stone Accents', 'Warm Herbal Towels'],
    description: 'Gentle facial energy clearing combined with pressure point sculpting to revitalise dull skin and ease tension.',
    benefits: ['Natural lifting', 'Lymphatic detoxification', 'Glow & vitality'],
    preparationTips: ['Clean face or light skincare'],
    isSpecialStar: false,
    isFeatured: true,
    status: 'available' as const
  },
  {
    templateId: 'evt-09',
    dayNum: 21,
    name: 'Northern Tour: Chiang Mai Mountain Sound Bath',
    englishName: 'On-Tour: Teak Forest Mountain Sunrise Sound Immersion',
    subtitle: 'Open air sound resonance surrounded by teak forests in Mae Rim, Chiang Mai',
    category: 'Sound Healing / Sound Baths',
    branch: 'On-Tour' as BranchLocation,
    locationDetails: 'Mae Rim Valley Eco-Pavilion, Chiang Mai',
    timeDisplay: '8 am',
    startTime: '08:00 AM',
    endTime: '09:45 AM',
    durationMinutes: 105,
    priceThb: 1600,
    capacity: 16,
    bookedCount: 14,
    level: 'All Levels',
    sensoryNotes: ['Open Mountain Air', 'Handcrafted Nepalese Gongs', 'Wild Northern Herbal Infusion'],
    description: 'Our signature travel retreat event. Breathe fresh mountain air as resonant gong vibrations echo across the tranquil valley.',
    benefits: ['Deep nature connection', 'Nervous system reset', 'Profound peace and inspiration'],
    preparationTips: ['Morning mountain breeze can be brisk; light jacket recommended'],
    isSpecialStar: false,
    isFeatured: false,
    status: 'almost_full' as const
  },
  {
    templateId: 'evt-10',
    dayNum: 25,
    name: 'On-Tour: Corporate Executive Mindfulness & Breathwork',
    englishName: 'On-Tour: Executive Resilience, Acupressure & Sound Immersion',
    subtitle: 'Bespoke corporate mental resilience and postural tension release workshop',
    category: 'Corporate Workshops',
    branch: 'On-Tour' as BranchLocation,
    locationDetails: 'Selected Private Resort, Chiang Mai',
    timeDisplay: '2 pm',
    startTime: '02:00 PM',
    endTime: '04:30 PM',
    durationMinutes: 150,
    priceThb: 2200,
    capacity: 20,
    bookedCount: 20,
    level: 'Corporate / Teams',
    sensoryNotes: ['Ergonomic Acupressure Tools', 'Aromatherapy Citrus Blends', 'Sound Bath Finale'],
    description: 'A tailored workshop for executives and high-performance teams combating burnout, neck/shoulder stiffness, and decision fatigue.',
    benefits: ['Burnout recovery techniques', 'Desk tension release postures', 'Enhanced team clarity and empathy'],
    preparationTips: ['Comfortable smart casual attire'],
    isSpecialStar: false,
    isFeatured: false,
    status: 'fully_booked' as const
  },
  {
    templateId: 'evt-13',
    dayNum: 28,
    name: 'Reiki & คริสตัลบำบัดคืนพลังใจ',
    englishName: 'Usui Reiki & Crystal Energy Recalibration',
    subtitle: 'Gentle vibrational realignment for emotional grounding and peaceful sleep',
    category: 'Reiki',
    branch: 'Nakhonsawan' as BranchLocation,
    locationDetails: 'Nakhonsawan Main Sanctuary',
    timeDisplay: '5 pm',
    startTime: '05:00 PM',
    endTime: '06:30 PM',
    durationMinutes: 90,
    priceThb: 1100,
    capacity: 10,
    bookedCount: 6,
    level: 'All Levels',
    sensoryNotes: ['Clear Quartz & Rose Quartz', 'Frankincense Mist', 'Chakra Tuning Forks'],
    description: 'Align your subtle biofield with warm hands-on Reiki transmission and grounding chakra minerals.',
    benefits: ['Emotional release', 'Energetic replenishment', 'Inner tranquility'],
    preparationTips: ['Wear comfortable cotton clothes'],
    isSpecialStar: false,
    isFeatured: true,
    status: 'available' as const
  }
];

export function getEventsForMonth(year: number, month: number): ScheduleEvent[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');

  return BASE_EVENT_TEMPLATES
    .filter(t => t.dayNum <= daysInMonth)
    .map(t => {
      const dayStr = String(t.dayNum).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const dateDisplay = `${dayStr}.${monthStr}`;

      return {
        id: `${t.templateId}-${year}-${monthStr}`,
        name: t.name,
        englishName: t.englishName,
        subtitle: t.subtitle,
        category: t.category,
        branch: t.branch,
        locationDetails: t.locationDetails,
        dateStr,
        dateDisplay,
        timeDisplay: t.timeDisplay,
        startTime: t.startTime,
        endTime: t.endTime,
        durationMinutes: t.durationMinutes,
        facilitator: FACILITATOR_BEEVER,
        priceThb: t.priceThb,
        capacity: t.capacity,
        bookedCount: t.bookedCount,
        level: t.level,
        posterUrl: t.posterUrl,
        posterTag: t.posterTag,
        sensoryNotes: t.sensoryNotes,
        description: t.description,
        benefits: t.benefits,
        preparationTips: t.preparationTips,
        isSpecialStar: t.isSpecialStar,
        isFeatured: t.isFeatured,
        status: t.status
      };
    });
}

export function getCalendarMapForMonth(year: number, month: number): Record<number, {
  branch?: BranchLocation;
  isPinkPill?: boolean;
  isBrownPill?: boolean;
  isSundayPink?: boolean;
  hasSpecialStar?: boolean;
  specialStatus?: SpecialStatusDetails;
  tourLocation?: string;
  eventIds: string[];
}> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map: Record<number, {
    branch?: BranchLocation;
    isPinkPill?: boolean;
    isBrownPill?: boolean;
    isSundayPink?: boolean;
    hasSpecialStar?: boolean;
    specialStatus?: SpecialStatusDetails;
    tourLocation?: string;
    eventIds: string[];
  }> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const isSunday = dateObj.getDay() === 0;

    let branch: BranchLocation = 'Nakhonsawan';
    let isPinkPill = false;
    let isBrownPill = false;
    let hasSpecialStar = false;
    let tourLocation: string | undefined = undefined;
    let specialStatus: SpecialStatusDetails | undefined = undefined;

    if (d >= 1 && d <= 4) {
      branch = 'Ratchathewi';
      isPinkPill = true;
      if (d === 4) hasSpecialStar = true;
    } else if (d === 7) {
      specialStatus = { 
        type: 'big_cleaning', 
        labelTh: 'Big Cleaning', 
        labelEn: 'Big Cleaning', 
        subTh: 'ปิดทำความสะอาด & อบโอโซน', 
        subEn: 'Deep Clean & Space Purification',
        badgeBg: '#BAE6FD', 
        badgeText: '#0284C7' 
      };
    } else if (d === 8) {
      specialStatus = { 
        type: 'closed', 
        labelTh: 'ปิดร้าน', 
        labelEn: 'Studio Closed', 
        subTh: 'วันหยุดประจำสัปดาห์', 
        subEn: 'Weekly Off-Day',
        badgeBg: '#222222', 
        badgeText: '#FFFFFF' 
      };
    } else if (d >= 13 && d <= 16) {
      branch = 'Nakhonsawan';
      isPinkPill = true;
    } else if (d === 18) {
      branch = 'Ratchathewi';
      hasSpecialStar = true;
    } else if (d >= 20 && d <= 23) {
      branch = 'On-Tour';
      tourLocation = 'เชียงใหม่ (Chiang Mai)';
      isBrownPill = true;
    } else if (d === 25) {
      branch = 'On-Tour';
      tourLocation = 'เชียงใหม่ (Chiang Mai)';
      isBrownPill = true;
    } else if (d === 26) {
      branch = 'Ratchathewi';
      isPinkPill = true;
      hasSpecialStar = true;
    } else if (d >= 27 && d <= 30) {
      branch = 'Nakhonsawan';
      isPinkPill = true;
    }

    map[d] = {
      branch,
      isPinkPill,
      isBrownPill,
      isSundayPink: isSunday,
      hasSpecialStar,
      specialStatus,
      tourLocation,
      eventIds: []
    };
  }

  return map;
}

// Default export for initial or legacy access
const initialNow = new Date();
export const MOCK_SCHEDULE_EVENTS: ScheduleEvent[] = getEventsForMonth(initialNow.getFullYear(), initialNow.getMonth());
export const APRIL_2026_CALENDAR_MAP = getCalendarMapForMonth(2026, 3);
