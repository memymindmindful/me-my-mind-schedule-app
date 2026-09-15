import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PrivateSchedulePeriodWithDetails, PrivateSchedulePeriod, SlotTemplate, PrivateScheduleBooking } from '../types';
import { apiFetchCurrentPrivateSchedule } from '../utils/apiClient';
import { Calendar, Globe, RotateCcw, Clock, Sparkles, MessageCircle, Share2, Check, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

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

/**
 * UTC-safe step to previous date within the period
 */
function getPrevDateInPeriod(currentDateStr: string, period: PrivateSchedulePeriod): string {
  if (!currentDateStr || currentDateStr <= period.startDate) return period.startDate;
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  const prevStr = date.toISOString().split('T')[0];
  return prevStr < period.startDate ? period.startDate : prevStr;
}

/**
 * UTC-safe step to next date within the period
 */
function getNextDateInPeriod(currentDateStr: string, period: PrivateSchedulePeriod): string {
  if (!currentDateStr || currentDateStr >= period.endDate) return period.endDate;
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  const nextStr = date.toISOString().split('T')[0];
  return nextStr > period.endDate ? period.endDate : nextStr;
}

export const PrivateScheduleView: React.FC<PrivateScheduleViewProps> = () => {
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

  // Selected date for slot view (defaults to today if in range, or start date of period)
  const [selectedDate, setSelectedDate] = useState<string>('');

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

  // When schedule loads, initialize selectedDate
  useEffect(() => {
    if (scheduleData?.period) {
      setSelectedDate((prev) => {
        if (prev && prev >= scheduleData.period.startDate && prev <= scheduleData.period.endDate) {
          return prev;
        }
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (todayStr >= scheduleData.period.startDate && todayStr <= scheduleData.period.endDate) {
          return todayStr;
        }
        return scheduleData.period.startDate;
      });
    }
  }, [scheduleData]);

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

  // Summary statistics
  const stats = useMemo(() => {
    if (!scheduleData) return { total: 0, available: 0, booked: 0 };
    const total = scheduleData.bookings.length;
    const booked = scheduleData.bookings.filter(b => b.status === 'booked').length;
    const available = total - booked;
    return { total, available, booked };
  }, [scheduleData]);

  // Spanning calendar months for mini calendar
  const monthSpans = useMemo(() => {
    if (!scheduleData?.period?.startDate || !scheduleData?.period?.endDate) return [];
    const [sy, sm] = scheduleData.period.startDate.split('-').map(Number);
    const [ey, em] = scheduleData.period.endDate.split('-').map(Number);

    const list: {
      year: number;
      month: number;
      monthLabel: string;
      cells: { dateStr: string; dayNum: number }[];
    }[] = [];

    let curY = sy;
    let curM = sm;

    while (curY < ey || (curY === ey && curM <= em)) {
      const firstDayOfWeek = new Date(curY, curM - 1, 1).getDay();
      const daysInMonth = new Date(curY, curM, 0).getDate();
      const cells: { dateStr: string; dayNum: number }[] = [];

      // Empty padding cells for alignment before the 1st
      for (let p = 0; p < firstDayOfWeek; p++) {
        cells.push({ dateStr: '', dayNum: 0 });
      }

      // Days of the month
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${curY}-${String(curM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ dateStr, dayNum: d });
      }

      const monthName = lang === 'th' ? THAI_MONTHS_FULL[curM - 1] : ENGLISH_MONTHS_FULL[curM - 1];
      const yearDisplay = lang === 'th' ? curY + 543 : curY;
      const monthLabel = `${monthName} ${yearDisplay}`;

      list.push({ year: curY, month: curM, monthLabel, cells });

      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    return list;
  }, [scheduleData?.period?.startDate, scheduleData?.period?.endDate, lang]);

  // Slots for currently selected date
  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return bookingsByDate.get(selectedDate) || [];
  }, [bookingsByDate, selectedDate]);

  // Available slots count for currently selected date
  const selectedDateAvailableCount = useMemo(() => {
    return selectedDateSlots.filter(s => s.booking.status === 'available').length;
  }, [selectedDateSlots]);

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

  // Description for current period
  const periodDescription = scheduleData?.period
    ? (lang === 'th'
        ? scheduleData.period.description
        : (scheduleData.period.descriptionEn || scheduleData.period.description))
    : '';

  return (
    <div className="min-h-screen bg-[#F0EEEA] text-[#2B2B2B] flex flex-col items-center justify-start sm:py-6 sm:px-4 p-0 font-sans selection:bg-[#E84D84]/20 selection:text-[#E84D84]">
      {/* Main Single-Column Mobile Container */}
      <main className="w-full flex justify-center items-start">
        <div className="w-full max-w-[440px] sm:my-2">
          <div className="w-full bg-[#FAF9F6] text-[#2B2B2B] flex flex-col justify-between overflow-hidden sm:rounded-[36px] sm:border sm:border-[#E5DFD7] sm:shadow-[0_20px_50px_rgba(0,0,0,0.12)] min-h-screen sm:min-h-[844px]">
            
            {/* 1. Header Bar */}
            <header className="p-4 sm:p-5 flex items-center justify-between border-b border-[#EBE6DF] bg-white sticky top-0 z-30 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FAF0F3] border border-[#F3D5E0] flex items-center justify-center text-[#E84D84] font-bold text-xs">
                  ✨
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-[#1E1E1E]">
                    Me.My.Mind
                  </h1>
                  <p className="text-[11px] text-[#777]">
                    {lang === 'th' ? 'ตารางคิว Private พิเศษ' : 'Special Private Schedule'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Language Toggle & Share */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleLang}
                  className="px-2.5 py-1.5 rounded-full border border-[#E5DFD7] hover:border-[#E84D84] bg-[#FAF8F5] text-xs font-semibold text-[#444] flex items-center gap-1 transition-all cursor-pointer"
                  title="Switch Language"
                >
                  <Globe className="w-3.5 h-3.5 text-[#E84D84]" />
                  <span>{lang === 'th' ? 'TH' : 'EN'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="p-1.5 rounded-full border border-[#E5DFD7] hover:border-[#E84D84] bg-[#FAF8F5] text-[#444] transition-all cursor-pointer"
                  title={lang === 'th' ? 'แชร์หน้านี้' : 'Share schedule'}
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-[#059669]" />
                  ) : (
                    <Share2 className="w-4 h-4 text-[#555]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => loadSchedule(true)}
                  disabled={isRefreshing || loading}
                  className="p-1.5 rounded-full border border-[#E5DFD7] hover:border-[#E84D84] bg-[#FAF8F5] text-[#444] transition-all cursor-pointer disabled:opacity-50"
                  title={lang === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh'}
                >
                  <RotateCcw className={`w-4 h-4 text-[#555] ${isRefreshing ? 'animate-spin text-[#E84D84]' : ''}`} />
                </button>
              </div>
            </header>

            {/* 2. Main Content Area */}
            <div className="p-4 sm:p-5 flex-1 space-y-4">
              {loading ? (
                /* Loading State */
                <div className="py-24 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-[#E84D84] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#777]">
                    {lang === 'th' ? 'กำลังโหลดข้อมูลรอบเวลา...' : 'Loading schedule...'}
                  </p>
                </div>
              ) : !hasActivePeriod || !scheduleData ? (
                /* No Active Period State */
                <div className="rounded-3xl bg-white border border-[#EBE6DF] p-8 text-center space-y-3 my-6 shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-[#FAF0F3] border border-[#F3D5E0] text-[#E84D84] flex items-center justify-center text-xl mx-auto mb-2">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#1E1E1E]">
                    {lang === 'th' ? 'ยังไม่มีรอบตารางคิวในขณะนี้' : 'No Active Booking Period'}
                  </h3>
                  <p className="text-xs text-[#777] leading-relaxed max-w-xs mx-auto">
                    {lang === 'th'
                      ? 'ยังไม่มีการเปิดรับจองรอบพิเศษในเวลานี้ กรุณาติดตามการอัปเดต หรือสอบถามผ่านทาง LINE Official'
                      : 'There are currently no active private booking slots open. Please follow updates or contact us via LINE.'}
                  </p>
                  <a
                    href="https://line.me/R/ti/p/@me.my.mind.mindful"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#06C755] hover:bg-[#05B34C] text-white text-xs font-bold transition-all mt-2 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{lang === 'th' ? 'สอบถามทาง LINE' : 'Contact via LINE'}</span>
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

                        {/* Additional Details / Description if present */}
                        {periodDescription && (
                          <p className="text-xs text-[#666] mt-2 leading-relaxed bg-white/70 rounded-xl p-2.5 border border-[#F3D5E0]">
                            {periodDescription}
                          </p>
                        )}
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

                  {/* Mini Calendar Date Picker */}
                  <div className="rounded-3xl bg-white border border-[#EBE6DF] p-4 shadow-xs space-y-3">
                    {monthSpans.map((mSpan, mIdx) => (
                      <div key={`${mSpan.year}-${mSpan.month}`} className={mIdx > 0 ? 'pt-3 border-t border-[#F2ECE4]' : ''}>
                        {monthSpans.length > 1 && (
                          <div className="text-xs font-bold text-[#1E1E1E] text-center mb-2">
                            {mSpan.monthLabel}
                          </div>
                        )}
                        <div className="grid grid-cols-7 text-center mb-1.5">
                          {(lang === 'th' ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']).map(d => (
                            <span key={d} className="text-[10px] font-bold text-[#999]">{d}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1.5 text-center">
                          {mSpan.cells.map((cell, idx) => {
                            if (!cell.dateStr) return <div key={idx} />; // empty padding cell for month alignment
                            const isInPeriod = cell.dateStr >= scheduleData.period.startDate && cell.dateStr <= scheduleData.period.endDate;
                            const isPeriodStart = cell.dateStr === scheduleData.period.startDate;
                            const isPeriodEnd = cell.dateStr === scheduleData.period.endDate;

                            // Shape: rounded on the outer edge(s) where the ribbon begins/ends, flat where it continues to a neighboring day
                            const ribbonShapeClass = isInPeriod
                              ? (isPeriodStart && isPeriodEnd)
                                ? 'rounded-full'        // period is only 1 day long — full circle, no ribbon needed
                                : isPeriodStart
                                  ? 'rounded-l-full'    // first day — rounded on the left, flat on the right (continues into next day)
                                  : isPeriodEnd
                                    ? 'rounded-r-full'  // last day — rounded on the right, flat on the left
                                    : ''                // middle day — no rounding at all, flows seamlessly between neighbors
                              : 'rounded-full';

                            const daySlots = bookingsByDate.get(cell.dateStr) || [];
                            const isFullyBooked = isInPeriod && daySlots.length > 0 && daySlots.every(s => s.booking.status === 'booked');
                            const isSelected = cell.dateStr === selectedDate;

                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={!isInPeriod}
                                onClick={() => isInPeriod && setSelectedDate(cell.dateStr)}
                                className={`relative aspect-square flex items-center justify-center text-xs font-semibold transition-all ${ribbonShapeClass} ${
                                  !isInPeriod
                                    ? 'text-[#D5CEC7] cursor-default' // muted/faded — outside the period range
                                    : isSelected
                                      ? 'bg-[#E84D84] text-white shadow-md z-10' // selected day: solid pink, sits on top
                                      : 'bg-[#FCE3EB] text-[#333] hover:bg-[#F8C8D7] cursor-pointer' // in-period, not selected: light pink ribbon background
                                }`}
                                title={isInPeriod ? `${cell.dateStr} ${isFullyBooked ? (lang === 'th' ? '(เต็ม)' : '(Fully booked)') : ''}` : undefined}
                              >
                                {cell.dayNum}
                                {isFullyBooked && (
                                  <span className="absolute inset-0 rounded-full ring-2 ring-[#D92D4B] pointer-events-none z-20" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Legend for the red ring */}
                    <div className="flex items-center justify-center gap-1.5 pt-2.5 border-t border-[#F2ECE4]">
                      <span className="w-3.5 h-3.5 rounded-full ring-2 ring-[#D92D4B] flex-shrink-0" />
                      <span className="text-[10px] text-[#888]">
                        {lang === 'th' ? '= คิวเต็มทุกรอบ' : '= Fully booked all slots'}
                      </span>
                    </div>
                  </div>

                  {/* Selected Day Navigation Header */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(getPrevDateInPeriod(selectedDate, scheduleData.period))}
                      disabled={!selectedDate || selectedDate <= scheduleData.period.startDate}
                      className="p-2 rounded-full disabled:opacity-30 hover:bg-[#FAF0F3] transition-colors cursor-pointer disabled:cursor-default"
                      title={lang === 'th' ? 'วันก่อนหน้า' : 'Previous day'}
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#1E1E1E]" />
                    </button>
                    
                    <h3 className="text-sm sm:text-base font-bold text-[#1E1E1E] text-center">
                      {formatDateCard(selectedDate, lang).dayName}
                      <span className="font-normal text-[#666] ml-1.5">
                        {formatDateCard(selectedDate, lang).formattedDate}
                      </span>
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSelectedDate(getNextDateInPeriod(selectedDate, scheduleData.period))}
                      disabled={!selectedDate || selectedDate >= scheduleData.period.endDate}
                      className="p-2 rounded-full disabled:opacity-30 hover:bg-[#FAF0F3] transition-colors cursor-pointer disabled:cursor-default"
                      title={lang === 'th' ? 'วันถัดไป' : 'Next day'}
                      aria-label="Next day"
                    >
                      <ChevronRight className="w-5 h-5 text-[#1E1E1E]" />
                    </button>
                  </div>

                  {/* Just ONE day's slot card */}
                  <section className="rounded-3xl bg-white border border-[#EBE6DF] p-3.5 sm:p-4 shadow-xs">
                    {/* Header row inside card */}
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#F2ECE4]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#FAF0F3] border border-[#F3D5E0] flex items-center justify-center text-[#E84D84] font-bold text-xs">
                          📅
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#1E1E1E]">
                            {selectedDateSlots.length} {lang === 'th' ? 'รอบเวลาในวันนี้' : 'slots today'}
                          </h4>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        selectedDateAvailableCount > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {lang === 'th'
                          ? (selectedDateAvailableCount > 0 ? `ว่าง ${selectedDateAvailableCount} คิว` : 'เต็มทุกรอบ')
                          : (selectedDateAvailableCount > 0 ? `${selectedDateAvailableCount} Available` : 'Fully Booked')}
                      </span>
                    </div>

                    {/* Slots list */}
                    <div className="space-y-2.5">
                      {selectedDateSlots.length === 0 ? (
                        <p className="text-xs text-[#888] text-center py-6">
                          {lang === 'th' ? 'ไม่มีรอบเวลาในวันนี้' : 'No slots scheduled for this day'}
                        </p>
                      ) : (
                        selectedDateSlots.map(({ slot, booking }) => {
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
                                    onClick={() => handleBookSlot(scheduleData.period, selectedDate, slot, lang)}
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
                        })
                      )}
                    </div>
                  </section>
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
