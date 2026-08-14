export type OfferingCategory = 
  | 'Sound Healing / Sound Baths'
  | 'Kundalini Yoga'
  | 'Facial Massage Rituals'
  | 'Reiki'
  | 'Workshops & Training'
  | 'Corporate Workshops';

export type BranchLocation = 'Nakhonsawan' | 'Ratchathewi' | 'On-Tour';

export interface Facilitator {
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  certifications: string[];
}

export interface ScheduleEvent {
  id: string;
  name: string; // e.g. "เขียน ปล่อย ใจ Sound Bath"
  englishName?: string;
  subtitle?: string;
  category: OfferingCategory;
  branch: BranchLocation;
  locationDetails: string;
  dateStr: string; // '2026-04-04' (YYYY-MM-DD)
  dateDisplay: string; // '04.04' (DD.MM)
  timeDisplay: string; // '9 am' or '1 pm' or '10 am'
  startTime: string; // '09:00 AM'
  endTime: string; // '10:30 AM'
  durationMinutes: number;
  facilitator: Facilitator;
  priceThb: number;
  capacity: number;
  bookedCount: number;
  level: string;
  sensoryNotes: string[];
  description: string;
  benefits: string[];
  preparationTips: string[];
  posterUrl?: string; // High-res poster banner URL for the modal
  posterTag?: string; // Optional aesthetic tag on poster
  isSpecialStar?: boolean; // Star icon on calendar date
  isFeatured?: boolean;
  adminNote?: string; // Short note/badge for the event (e.g. 'รอบพิเศษ', 'โปรโมชั่น 2 แถม 1')
  status: 'available' | 'almost_full' | 'fully_booked';
}

export type SpecialDayStatus = 'closed' | 'big_cleaning' | 'custom_note';

export interface SpecialStatusDetails {
  type: SpecialDayStatus;
  labelTh: string;
  labelEn: string;
  subTh?: string;
  subEn?: string;
  badgeBg: string;
  badgeText: string;
}

export interface DayCalendarInfo {
  dayNum: number;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: string; // Su, Mo, Tu, We, Th, Fr, Sa
  dayIndex: number; // 0..6
  isWeekend: boolean;
  branch?: BranchLocation;
  specialStatus?: SpecialStatusDetails;
  hasEvent: boolean;
  hasSpecialStar: boolean;
  isPinkPill?: boolean;
  isBrownPill?: boolean;
  isSundayPink?: boolean;
  events: ScheduleEvent[];
}

export interface BookingSubmission {
  eventId: string;
  eventName: string;
  clientName: string;
  clientLineId: string;
  clientPhone: string;
  clientEmail?: string;
  guestsCount: number;
  specialNotes?: string;
  dateDisplay: string;
  timeDisplay: string;
  branch: BranchLocation;
  totalPriceThb: number;
}

export interface DayBarConfig {
  dayNum: number; // 1..31
  branch?: BranchLocation;
  tourCity?: string; // e.g. 'เชียงใหม่', 'ขอนแก่น', 'ภูเก็ต'
  isPinkPill?: boolean;
  isBrownPill?: boolean;
  pillPosition?: 'single' | 'start' | 'middle' | 'end'; // for connected appearance
  hasSpecialStar?: boolean;
  specialStatus?: SpecialStatusDetails;
}

export interface MonthBarConfig {
  year: number;
  month: number; // 0-indexed
  days: Record<number, DayBarConfig>;
}
