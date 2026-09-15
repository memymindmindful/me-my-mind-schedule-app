import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PrivateSchedulePeriodWithDetails, PrivateSchedulePeriod, SlotTemplate, PrivateScheduleBooking } from '../types';
import { apiFetchCurrentPrivateSchedule } from '../utils/apiClient';
import { Calendar, Globe, RotateCcw, Clock, Sparkles, MessageCircle, Share2, Check, CheckCircle2 } from 'lucide-react';

interface PrivateScheduleViewProps {
  onBackToCalendar?: () => void;
}

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];
const ENGLISH_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const ENGLISH_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date for LINE inquiry message in Thai: e.g. "19 กันยายน 2569"
 */
function formatDateThai(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = THAI_MONTHS_FULL[m - 1];
  const thaiYear = y + 543;
  return `${d} ${monthName} ${thaiYear}`;
}

/**
 * Format date for LINE inquiry message in English: e.g. "19 September 2026"
 */
function formatDateEnglish(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = ENGLISH_MONTHS_FULL[m - 1];
  return `${d} ${monthName} ${y}`;
}

/**
 * Card header date format: e.g. "วันศุกร์ 19 ก.ย. 2569" or "Friday, 19 Sep 2026"
 */
function formatDateCard(dateStr: string, lang: 'th' | 'en'): { dayName: string; formattedDate: string } {
  if (!dateStr) return { dayName: '', formattedDate: '' };
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);

  if (lang === 'th') {
    const dayName = THAI_DAYS[dateObj.getDay()];
    const monthShort = THAI_MONTHS_SHORT[m - 1];
    const thaiYear = y + 543;
    return {
      dayName,
      formattedDate: `${d} ${monthShort} ${thaiYear}`
    };
  } else {
    const dayName = ENGLISH_DAYS[dateObj.getDay()];
    const monthShort = ENGLISH_MONTHS_SHORT[m - 1];
    return {
      dayName,
      formattedDate: `${d} ${monthShort} ${y}`
    };
  }
}

/**
 * Date range formatting for header badge
 */
function formatPeriodRange(startDate: string, endDate: string, lang: 'th' | 'en'): string {
  if (!startDate || !endDate) return '';
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  if (lang === 'th') {
    const sMonth = THAI_MONTHS_SHORT[sm - 1];
    const eMonth = THAI_MONTHS_SHORT[em - 1];
    const thaiYear = ey + 543;

    if (startDate === endDate) {
      return `${sd} ${sMonth} ${thaiYear}`;
    }
    if (sm === em && sy === ey) {
      return `${sd} - ${ed} ${eMonth} ${thaiYear}`;
    }
    return `${sd} ${sMonth} - ${ed} ${eMonth} ${thaiYear}`;
  } else {
    const sMonth = ENGLISH_MONTHS_SHORT[sm - 1];
    const eMonth = ENGLISH_MONTHS_SHORT[em - 1];

    if (startDate === endDate) {
      return `${sd} ${sMonth} ${ey}`;
    }
    if (sm === em && sy === ey) {
      return `${sd} - ${ed} ${eMonth} ${ey}`;
    }
    return `${sd} ${sMonth} - ${ed} ${eMonth} ${ey}`;
  }
}

export const PrivateScheduleView: React.FC<PrivateScheduleViewProps> = ({ onBackToCalendar }) => {
  // Read initial language preference from localStorage or default to Thai
  const [lang, setLang] = useState<'th' | 'en'>(() => {
    try {
      const saved = localStorage.getItem('mmm_lang') || localStorage.getItem('me_my_mind_lang');
      return saved === 'en' ? 'en' : 'th';
    } catch {
      return 'th';
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [scheduleData, setScheduleData] = useState<PrivateSchedulePeriodWithDetails | null>(null);
  const [hasActivePeriod, setHasActivePeriod] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleLang = () => {
    const newLang = lang === 'th' ? 'en' : 'th';
    setLang(newLang);
    try {
      localStorage.setItem('mmm_lang', newLang);
      localStorage.setItem('me_my_mind_lang', newLang);
    } catch {
      // ignore
    }
  };

  const loadSchedule = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiFetchCurrentPrivateSchedule();
      if (res && res.active && res.data) {
        setHasActivePeriod(true);
        setScheduleData(res.data);
      } else {
        setHasActivePeriod(false);
        setScheduleData(null);
      }
    } catch (err) {
      console.error('[PrivateScheduleView] Failed to load private schedule:', err);
      setHasActivePeriod(false);
      setScheduleData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    if (!scheduleData) return new Map<string, { slot: SlotTemplate; booking: PrivateScheduleBooking }[]>();

    const slotMap = new Map<string, SlotTemplate>();
    scheduleData.slots.forEach(s => slotMap.set(s.id, s));

    const map = new Map<string, { slot: SlotTemplate; booking: PrivateScheduleBooking }[]>();
    scheduleData.bookings.forEach(b => {
      const slot = slotMap.get(b.slotTemplateId);
      if (!slot) return;
      if (!map.has(b.date)) {
        map.set(b.date, []);
      }
      map.get(b.date)!.push({ slot, booking: b });
    });

    // Sort slots within each date by displayOrder, then startTime
    map.forEach((list) => {
      list.sort((a, b) => {
        if (a.slot.displayOrder !== b.slot.displayOrder) {
          return a.slot.displayOrder - b.slot.displayOrder;
        }
        return a.slot.startTime.localeCompare(b.slot.startTime);
      });
    });

    return map;
  }, [scheduleData]);

  // Sorted dates list
  const sortedDates = useMemo(() => {
    return Array.from(bookingsByDate.keys()).sort();
  }, [bookingsByDate]);

  // Summary statistics
  const stats = useMemo(() => {
    if (!scheduleData) return { total: 0, available: 0, booked: 0 };
    const total = scheduleData.bookings.length;
    const booked = scheduleData.bookings.filter(b => b.status === 'booked').length;
    const available = total - booked;
    return { total, available, booked };
  }, [scheduleData]);

  /**
   * Bilingual booking handler as specified
   */
  const handleBookSlot = (period: PrivateSchedulePeriod, date: string, slot: SlotTemplate, currentLang: 'th' | 'en') => {
    const displayTitle = currentLang === 'en' ? (period.titleEn || period.title) : period.title;

    const message = currentLang === 'th'
      ? `สวัสดีครับ/ค่ะ Kru Beever 🙏

ฉันสนใจจองคิว Private ที่:
📌 ${displayTitle}
📅 ${formatDateThai(date)}
⏰ ${slot.startTime} - ${slot.endTime}

ช่วยยืนยันการจองให้ฉันได้ไหมครับ/ค่ะ 🙏`
      : `Hi Kru Beever 🙏

I'm interested in booking a Private slot at:
📌 ${displayTitle}
📅 ${formatDateEnglish(date)}
⏰ ${slot.startTime} - ${slot.endTime}

Could you please confirm this booking for me? 🙏`;

    const encodedMsg = encodeURIComponent(message);
    const lineUrl = `https://line.me/R/oaMessage/@me.my.mind.mindful/?${encodedMsg}`;
    window.open(lineUrl, '_blank');
  };

  const handleShareLink = () => {
    const currentTitle = scheduleData?.period
      ? (lang === 'en' ? (scheduleData.period.titleEn || scheduleData.period.title) : scheduleData.period.title)
      : 'Me.My.Mind';

    if (navigator.share) {
      navigator.share({
        title: lang === 'th' ? `ตารางคิว Private - ${currentTitle}` : `Private Booking Schedule - ${currentTitle}`,
        url: window.location.href
      }).catch(() => {
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast(lang === 'th' ? 'คัดลอกลิงก์ตารางคิวเรียบร้อยแล้ว' : 'Schedule link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Display title for current period
  const periodDisplayTitle = scheduleData?.period
    ? (lang === 'en' ? (scheduleData.period.titleEn || scheduleData.period.title) : scheduleData.period.title)
    : '';

  return (
    <div className="min-h-screen bg-[#F0EEEA] text-[#2B2B2B] flex flex-col items-center justify-start sm:py-6 sm:px-4 p-0 font-sans selection:bg-[#E84D84]/20 selection:text-[#E84D84]">
      {/* Main Single-Column Mobile Container */}
      <main className="w-full flex justify-center items-start">
        <div className="w-full max-w-[440px] sm:my-2">
          <div className="w-full bg-[#FAF9F6] text-[#2B2B2B] flex flex-col justify-between overflow-hidden sm:rounded-[36px] sm:border sm:border-[#E5DFD7] sm:shadow-[0_20px_50px_rgba(0,0,0,0.12)] min-h-screen sm:min-h-[844px]">
            
            {/* 1. Sticky Navigation Header */}
            <header className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-[#EBE6DF] bg-[#FAF9F6]/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shadow-2xs">
              {/* Left: Studio Branding & Title */}
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#E84D84]">
                  Me.My.Mind
                </span>
                <h1 className="text-sm sm:text-base font-extrabold text-[#1E1E1E] leading-tight">
                  {lang === 'th' ? 'ตารางคิว Private' : 'Private Booking Schedule'}
                </h1>
              </div>

              {/* Right Controls: TH/EN Toggle, Refresh, Share */}
              <div className="flex items-center gap-1.5">
                {/* Language Toggle Pill [TH | EN] matching CalendarHeader.tsx */}
                <button
                  id="private-schedule-lang-toggle-btn"
                  onClick={handleToggleLang}
                  className="flex items-center gap-1 py-1 px-2.5 rounded-full border border-[#E84D84]/30 bg-[#FAF0F3] hover:bg-[#FCE6EC] text-[#E84D84] text-[11px] font-bold transition-all cursor-pointer shadow-2xs min-h-[36px]"
                  title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
                  aria-label="Toggle Language"
                >
                  <Globe className="w-3 h-3 text-[#E84D84]" />
                  <span className={lang === 'th' ? 'font-extrabold text-[#E84D84]' : 'opacity-60 text-[#777]'}>TH</span>
                  <span className="opacity-40">/</span>
                  <span className={lang === 'en' ? 'font-extrabold text-[#E84D84]' : 'opacity-60 text-[#777]'}>EN</span>
                </button>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => loadSchedule(true)}
                  disabled={isRefreshing || loading}
                  className="w-9 h-9 rounded-full bg-white border border-[#E5DFD7] hover:border-[#E84D84]/40 flex items-center justify-center text-[#555] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  title={lang === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh data'}
                  aria-label="Refresh"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E84D84]' : ''}`} />
                </button>

                {/* Share Link Button */}
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="w-9 h-9 rounded-full bg-white border border-[#E5DFD7] hover:border-[#E84D84]/40 flex items-center justify-center text-[#555] transition-colors cursor-pointer shadow-2xs"
                  title={lang === 'th' ? 'แชร์ลิงก์' : 'Share link'}
                  aria-label="Share"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </header>

            {/* 2. Content Area */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-4">
              {loading ? (
                /* Fast perceived loading state */
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-[#E84D84] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[#777] font-medium">
                    {lang === 'th' ? 'กำลังโหลดตารางคิว...' : 'Loading schedule...'}
                  </p>
                </div>
              ) : !hasActivePeriod || !scheduleData ? (
                /* Empty State: No active period */
                <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#FAF0F3] border border-[#F5D2DF] flex items-center justify-center text-[#E84D84] mb-4 shadow-sm">
                    <Calendar className="w-8 h-8" />
                  </div>
                  
                  <h2 className="text-base font-bold text-[#1E1E1E] mb-2">
                    {lang === 'th' ? 'ยังไม่มีรอบตอนนี้ค่ะ' : 'No active schedule right now'}
                  </h2>
                  
                  <p className="text-xs text-[#666] leading-relaxed max-w-xs mb-6">
                    {lang === 'th'
                      ? 'ท่านสามารถสอบถามคิวพิเศษ หรือนัดหมายล่วงหน้ากับ Kru Beever ได้โดยตรงผ่าน LINE Official Account ค่ะ 🙏'
                      : 'You can directly inquire about special private slots or advance bookings with Kru Beever via LINE Official Account. 🙏'}
                  </p>

                  <a
                    href="https://line.me/R/ti/p/@me.my.mind.mindful"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full max-w-xs py-3.5 px-5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all min-h-[44px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{lang === 'th' ? 'ติดต่อสอบถามผ่าน LINE OA' : 'Chat via LINE OA'}</span>
                  </a>
                </div>
              ) : (
                /* Active Period Content */
                <>
                  {/* Active Period Header Card */}
                  <div className="rounded-3xl bg-gradient-to-br from-white to-[#FAF0F3] border border-[#F3D5E0] p-4 shadow-xs relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div className="min-w-0 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E84D84] text-white text-[10px] font-bold mb-2 shadow-2xs">
                          <Sparkles className="w-3 h-3" />
                          <span>{lang === 'th' ? 'เปิดรับจองรอบพิเศษ' : 'Special Private Visit'}</span>
                        </div>
                        
                        <h2 className="text-base sm:text-lg font-bold text-[#1E1E1E] leading-snug break-words">
                          {periodDisplayTitle}
                        </h2>
                        
                        <p className="text-xs text-[#E84D84] font-semibold mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatPeriodRange(scheduleData.period.startDate, scheduleData.period.endDate, lang)}</span>
                        </p>
                      </div>

                      {/* Mini Slot Stats Pill */}
                      <div className="text-right shrink-0 bg-white/80 rounded-2xl p-2.5 border border-[#F3D5E0] shadow-2xs">
                        <span className="text-[10px] text-[#777] block font-medium">
                          {lang === 'th' ? 'คิวว่างคงเหลือ' : 'Available Slots'}
                        </span>
                        <div className="text-base font-extrabold text-[#059669] mt-0.5">
                          {stats.available} <span className="text-[11px] font-normal text-[#666]">/ {stats.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Legend & Help */}
                    <div className="mt-3 pt-3 border-t border-[#F0E4E8] flex items-center justify-between text-[11px] text-[#666]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                          <span className="font-semibold text-[#059669]">
                            {lang === 'th' ? `ว่าง (${stats.available})` : `Available (${stats.available})`}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                          <span className="text-[#888]">
                            {lang === 'th' ? `จองแล้ว (${stats.booked})` : `Booked (${stats.booked})`}
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#888]">
                        {lang === 'th' ? 'แตะปุ่มเพื่อจองผ่าน LINE' : 'Tap to book via LINE'}
                      </span>
                    </div>
                  </div>

                  {/* Day-by-Day List */}
                  <div className="space-y-4">
                    {sortedDates.map((dateStr) => {
                      const slotsForDate = bookingsByDate.get(dateStr) || [];
                      const availableCount = slotsForDate.filter(s => s.booking.status === 'available').length;
                      const { dayName, formattedDate } = formatDateCard(dateStr, lang);

                      return (
                        <section key={dateStr} className="rounded-3xl bg-white border border-[#EBE6DF] p-3.5 sm:p-4 shadow-xs">
                          {/* Date Header */}
                          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#F2ECE4]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-[#FAF0F3] border border-[#F3D5E0] flex items-center justify-center text-[#E84D84] font-bold text-xs">
                                📅
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                                  {dayName}
                                  <span className="font-normal text-[#666] ml-1.5">{formattedDate}</span>
                                </h3>
                              </div>
                            </div>

                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              availableCount > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {lang === 'th'
                                ? (availableCount > 0 ? `ว่าง ${availableCount} คิว` : 'เต็มทุกรอบ')
                                : (availableCount > 0 ? `${availableCount} Available` : 'Fully Booked')}
                            </span>
                          </div>

                          {/* Slots inside Date */}
                          <div className="space-y-2.5">
                            {slotsForDate.map(({ slot, booking }) => {
                              const isAvailable = booking.status === 'available';

                              return (
                                <div
                                  key={booking.id}
                                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                    isAvailable
                                      ? 'bg-[#FAF8F5] border-[#E8DFD5] hover:border-[#E84D84]/40'
                                      : 'bg-[#F9F9F9] border-[#EEEEEE] opacity-60'
                                  }`}
                                >
                                  {/* Slot Time & Status Badge */}
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                      isAvailable ? 'bg-white border border-[#E5DFD7] text-[#1E1E1E]' : 'bg-[#EEEEEE] text-[#999]'
                                    }`}>
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                                        {slot.startTime} - {slot.endTime}
                                      </div>
                                      
                                      {/* Status Pill Badge */}
                                      <div className="mt-1">
                                        {isAvailable ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                            <span>{lang === 'th' ? 'ว่าง' : 'Available'}</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                                            <span>{lang === 'th' ? 'จองแล้ว' : 'Booked'}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Button: 44px height for thumb-friendly tapping */}
                                  <div>
                                    {isAvailable ? (
                                      <button
                                        type="button"
                                        onClick={() => handleBookSlot(scheduleData.period, dateStr, slot, lang)}
                                        className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-full bg-[#E84D84] hover:bg-[#D43D73] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                                        title={lang === 'th' ? 'จองรอบนี้ทาง LINE' : 'Book this slot via LINE'}
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{lang === 'th' ? '💬 จองรอบนี้' : '💬 Book this slot'}</span>
                                      </button>
                                    ) : (
                                      <span className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#EFEFEF] text-[#888] text-[11px] font-medium inline-flex items-center justify-center shrink-0">
                                        {lang === 'th' ? 'จองแล้ว' : 'Booked'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* 3. Bottom Footer */}
            <footer className="p-4 border-t border-[#EBE6DF] bg-white text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs">
                <a
                  href="https://line.me/R/ti/p/@me.my.mind.mindful"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#06C755] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>LINE: @me.my.mind.mindful</span>
                </a>
              </div>
              <p className="text-[11px] text-[#888]">
                {lang === 'th'
                  ? 'กรุณารอรับการยืนยันการจองจาก Kru Beever ทาง LINE Official Account'
                  : 'Please await confirmation from Kru Beever via LINE Official Account'}
              </p>
              {onBackToCalendar && (
                <button
                  type="button"
                  onClick={onBackToCalendar}
                  className="text-[11px] text-[#777] hover:text-[#E84D84] underline cursor-pointer mt-1"
                >
                  {lang === 'th' ? 'กลับไปดูปฏิทินหลัก' : 'Back to main calendar'}
                </button>
              )}
            </footer>

          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1E1E1E] text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#E84D84]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
