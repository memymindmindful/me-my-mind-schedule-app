import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Video } from 'lucide-react';
import { BranchLocation, ScheduleEvent, DayCalendarInfo, DayBarConfig } from '../types';
import { getDefaultMonthBars } from '../utils/adminStorage';
import { Language, TRANSLATIONS } from '../utils/translations';
import { parseTimeToMinutes } from '../utils/timeUtils';

interface CalendarMonthViewProps {
  currentYear: number;
  currentMonth: number; // 0-indexed
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedBranch: BranchLocation | 'All';
  onToggleBranchFilter: (branch: BranchLocation) => void;
  selectedDateStr: string | null;
  onSelectDate: (dateStr: string, events: ScheduleEvent[], dayInfo?: DayCalendarInfo) => void;
  onOpenEventDetail: (event: ScheduleEvent) => void;
  allEvents: ScheduleEvent[];
  monthBarsMap?: Record<number, DayBarConfig>;
  lang: Language;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  selectedBranch,
  onToggleBranchFilter,
  selectedDateStr,
  onSelectDate,
  onOpenEventDetail,
  allEvents,
  monthBarsMap: incomingMonthBars,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [hoveredDay, setHoveredDay] = useState<DayCalendarInfo | null>(null);

  const currentMonthName = t.monthNames[currentMonth];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Dynamic Bar Tabs from API or initial defaults
  const monthBarsMap: Record<number, DayBarConfig> = useMemo(() => {
    if (incomingMonthBars !== undefined && incomingMonthBars !== null) {
      return incomingMonthBars;
    }
    return getDefaultMonthBars(currentYear, currentMonth);
  }, [incomingMonthBars, currentYear, currentMonth]);

  // Weekday abbreviations based on language
  const weekdays = t.weekdays;

  // Generate calendar days for current month
  const calendarDays: DayCalendarInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = weekdays[dateObj.getDay()];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isSunday = dateObj.getDay() === 0;

    const dayBar = monthBarsMap[d];

    // Events on this date (sorted chronologically by start time)
    const dayEvents = allEvents
      .filter(e => e.dateStr === dateStr)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    // Default branch is Nakhonsawan unless specified otherwise
    const branch: BranchLocation = dayBar?.branch || dayEvents[0]?.branch || 'Nakhonsawan';

    // Fully booked condition: manual day override OR (has events and all events are full)
    const dayBarFullyBooked = dayBar?.specialStatus?.type === 'fully_booked';
    const allEventsFullyBooked = dayEvents.length > 0 && dayEvents.every(
      e => e.status === 'fully_booked' || (e.capacity > 0 && e.bookedCount >= e.capacity)
    );
    const isDayFullyBooked = dayBarFullyBooked || allEventsFullyBooked;

    calendarDays.push({
      dayNum: d,
      dateStr,
      dayOfWeek,
      dayIndex: dateObj.getDay(),
      isWeekend,
      branch,
      specialStatus: dayBar?.specialStatus,
      hasEvent: dayEvents.length > 0 || !!dayBar?.isPinkPill || !!dayBar?.isBrownPill,
      hasSpecialStar: !!dayBar?.hasSpecialStar || dayEvents.some(e => e.isSpecialStar),
      hasOnlineEvent: dayEvents.some(e => e.branch === 'Online'),
      hasFullyBooked: isDayFullyBooked,
      isPinkPill: dayBar?.isPinkPill ?? (branch === 'Ratchathewi' && dayEvents.length > 0),
      isBrownPill: dayBar?.isBrownPill ?? (branch === 'On-Tour'),
      isSundayPink: isSunday,
      events: dayEvents
    });
  }

  // Connected pill classes for active month
  const getPillConnectionClass = (d: number, day?: DayCalendarInfo) => {
    // Check special status styling first
    if (day?.specialStatus) {
      if (day.specialStatus.type === 'closed') {
        return 'rounded-full bg-[#1E1E1E] text-white font-medium shadow-xs';
      }
      if (day.specialStatus.type === 'big_cleaning') {
        return 'rounded-full bg-[#BAE6FD] text-[#0369A1] font-semibold border border-[#7DD3FC] shadow-xs';
      }
    }

    const dayBar = monthBarsMap[d];
    const prevBar = monthBarsMap[d - 1];
    const nextBar = monthBarsMap[d + 1];

    // Check Brown pill (On-Tour)
    if (day?.isBrownPill || dayBar?.isBrownPill) {
      const isConnectedPrev = prevBar?.isBrownPill;
      const isConnectedNext = nextBar?.isBrownPill;

      if (!isConnectedPrev && !isConnectedNext) {
        return 'rounded-full bg-[#9E674F] text-white font-medium';
      }
      if (!isConnectedPrev && isConnectedNext) {
        return 'rounded-l-full bg-[#9E674F] text-white font-medium';
      }
      if (isConnectedPrev && isConnectedNext) {
        return 'bg-[#9E674F] text-white font-medium';
      }
      if (isConnectedPrev && !isConnectedNext) {
        return 'rounded-r-full bg-[#9E674F] text-white font-medium';
      }
      return 'rounded-full bg-[#9E674F] text-white font-medium';
    }

    // Check Pink pill (Ratchathewi or Nakhonsawan highlighted)
    if (day?.isPinkPill || dayBar?.isPinkPill) {
      const isConnectedPrev = prevBar?.isPinkPill && (prevBar.branch === dayBar?.branch || !prevBar.branch);
      const isConnectedNext = nextBar?.isPinkPill && (nextBar.branch === dayBar?.branch || !nextBar.branch);

      if (!isConnectedPrev && !isConnectedNext) {
        return 'rounded-full bg-[#FCE3EB] text-[#2B2B2B] font-medium';
      }
      if (!isConnectedPrev && isConnectedNext) {
        return 'rounded-l-full bg-[#FCE3EB] text-[#2B2B2B] font-medium';
      }
      if (isConnectedPrev && isConnectedNext) {
        return 'bg-[#FCE3EB] text-[#2B2B2B] font-medium';
      }
      if (isConnectedPrev && !isConnectedNext) {
        return 'rounded-r-full bg-[#FCE3EB] text-[#2B2B2B] font-medium';
      }
      return 'rounded-full bg-[#FCE3EB] text-[#2B2B2B] font-medium';
    }

    return '';
  };

  // Get localized location name
  const getLocationName = (branch?: BranchLocation, dayNum?: number) => {
    const dayBar = dayNum ? monthBarsMap[dayNum] : undefined;
    if (branch === 'Online') {
      return lang === 'th' ? 'ออนไลน์ (Zoom / Live)' : 'Online Session';
    }
    if (branch === 'On-Tour' || dayBar?.isBrownPill) {
      const city = dayBar?.tourCity || (lang === 'th' ? 'เชียงใหม่' : 'Chiang Mai');
      return lang === 'th' ? `ออนทัวร์ ${city}` : `On-Tour ${city}`;
    }
    if (branch === 'Ratchathewi' || dayBar?.branch === 'Ratchathewi') {
      return lang === 'th' ? 'ราชเทวี (กรุงเทพฯ)' : 'Ratchathewi (Bangkok)';
    }
    // Default to Nakhonsawan
    return lang === 'th' ? 'นครสวรรค์ (สาขาหลัก)' : 'Nakhonsawan Main';
  };

  // Get description for residency tooltip
  const getLocationDesc = (branch?: BranchLocation) => {
    if (branch === 'Online') return lang === 'th' ? 'กิจกรรมออนไลน์ผ่าน Zoom' : 'Virtual session via Zoom';
    if (branch === 'Ratchathewi') return t.residencyDescRatchathewi;
    if (branch === 'On-Tour') return t.residencyDescOnTour;
    return t.residencyDescNakhonsawan;
  };

  const handleDayClick = (day: DayCalendarInfo) => {
    onSelectDate(day.dateStr, day.events, day);
  };

  return (
    <div className="w-full select-none relative">
      {/* Month & Branch Legend Header */}
      <div className="flex items-start justify-between mb-4 pt-1">
        {/* Year & Month display (matching Figma mockup) */}
        <div>
          <div className="text-[17px] font-bold text-[#1E1E1E] leading-none mb-1 tracking-tight flex items-center gap-1.5">
            <span>{lang === 'th' ? `${currentYear}` : currentYear}</span>
            <div className="flex items-center gap-0.5 ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <button 
                onClick={onPrevMonth}
                className="p-1 hover:bg-black/5 rounded-full cursor-pointer transition-colors"
                title={lang === 'th' ? 'เดือนก่อนหน้า' : 'Previous Month'}
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#555]" />
              </button>
              <button 
                onClick={onNextMonth}
                className="p-1 hover:bg-black/5 rounded-full cursor-pointer transition-colors"
                title={lang === 'th' ? 'เดือนถัดไป' : 'Next Month'}
                aria-label="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#555]" />
              </button>
            </div>
          </div>
          <h2 className="text-[34px] sm:text-[42px] font-extrabold text-[#E84D84] leading-none tracking-tight font-sans">
            {currentMonthName}
          </h2>
        </div>

        {/* Branch Filter Legend (matching Figma mockup with bilingual names) */}
        <div className="flex flex-col items-start gap-1 pt-0.5 text-[12px] sm:text-[13px] text-[#2B2B2B]">
          {/* Nakhonsawan */}
          <button
            onClick={() => onToggleBranchFilter('Nakhonsawan')}
            className={`flex items-center gap-2 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              selectedBranch === 'Nakhonsawan' 
                ? 'bg-[#E84D84]/15 font-bold ring-1 ring-[#E84D84]/40 text-[#E84D84]' 
                : 'hover:opacity-80 text-[#333333]'
            }`}
            title={lang === 'th' ? 'กรองเฉพาะสาขานครสวรรค์' : 'Filter by Nakhonsawan Main Sanctuary'}
          >
            <span className="w-3.5 h-3.5 rounded-full border border-[#D5CEC7] bg-[#FFFFFF] inline-flex items-center justify-center shadow-2xs flex-shrink-0">
              {selectedBranch === 'Nakhonsawan' && <Check className="w-2.5 h-2.5 text-[#E84D84] stroke-[3]" />}
            </span>
            <span className="leading-none">
              {t.nakhonsawan}
            </span>
          </button>

          {/* Ratchathewi */}
          <button
            onClick={() => onToggleBranchFilter('Ratchathewi')}
            className={`flex items-center gap-2 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              selectedBranch === 'Ratchathewi' 
                ? 'bg-[#E84D84]/15 font-bold ring-1 ring-[#E84D84]/40 text-[#E84D84]' 
                : 'hover:opacity-80 text-[#333333]'
            }`}
            title={lang === 'th' ? 'กรองเฉพาะสาขาราชเทวี' : 'Filter by Ratchathewi Bangkok Branch'}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#F7C2D2] inline-flex items-center justify-center shadow-2xs flex-shrink-0">
              {selectedBranch === 'Ratchathewi' && <Check className="w-2.5 h-2.5 text-[#E84D84] stroke-[3]" />}
            </span>
            <span className="leading-none">
              {t.ratchathewi}
            </span>
          </button>

          {/* On-Tour */}
          <button
            onClick={() => onToggleBranchFilter('On-Tour')}
            className={`flex items-center gap-2 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              selectedBranch === 'On-Tour' 
                ? 'bg-[#9E674F]/15 font-bold ring-1 ring-[#9E674F]/40 text-[#9E674F]' 
                : 'hover:opacity-80 text-[#333333]'
            }`}
            title={lang === 'th' ? 'กรองเฉพาะ On-Tour' : 'Filter by On-Tour Retreats'}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#9E674F] inline-flex items-center justify-center shadow-2xs flex-shrink-0">
              {selectedBranch === 'On-Tour' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </span>
            <span className="leading-none">
              {t.onTour}
            </span>
          </button>

          {/* Online */}
          <button
            onClick={() => onToggleBranchFilter('Online')}
            className={`flex items-center gap-2 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
              selectedBranch === 'Online' 
                ? 'bg-[#E9E0F5] font-bold ring-1 ring-[#8A6FAE]/40 text-[#5D4488]' 
                : 'hover:opacity-80 text-[#333333]'
            }`}
            title={lang === 'th' ? 'กรองเฉพาะกิจกรรมออนไลน์' : 'Filter by Online events'}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-[#8A6FAE] inline-flex items-center justify-center shadow-2xs flex-shrink-0">
              {selectedBranch === 'Online' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </span>
            <span className="leading-none">
              {t.online}
            </span>
          </button>

          {/* Fully Booked Indicator */}
          <div 
            className="flex items-center gap-2 px-2 py-0.5 rounded-full text-[#333333]"
            title={lang === 'th' ? 'มีกิจกรรมที่เต็มแล้วในวันนี้' : 'Has fully booked event(s)'}
          >
            <span className="w-3.5 h-3.5 rounded-full ring-2 ring-[#D92D4B] ring-offset-1 bg-white inline-flex items-center justify-center shadow-2xs flex-shrink-0" />
            <span className="leading-none text-[#D92D4B] font-medium">
              {t.fullyBooked}
            </span>
          </div>
        </div>

      </div>

      {/* Weekday Strip (Su Mo Tu We Th Fr Sa / อา จ อ พ พฤ ศ ส in rounded cream container) */}
      <div className="bg-[#EFE9E2] rounded-xl py-2.5 px-1 mb-2.5 grid grid-cols-7 text-center">
        {weekdays.map((w, idx) => (
          <span
            key={idx}
            className={`text-[13px] sm:text-[14px] font-semibold tracking-tight ${
              idx === 0 ? 'text-[#E84D84]' : 'text-[#1E1E1E]'
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      {/* 7-Day Month Grid */}
      <div className="relative grid grid-cols-7 gap-y-1.5 text-center font-sans text-[15px] font-normal text-[#1E1E1E]">
        {/* Leading empty days */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-10 w-full" />
        ))}

        {/* Month Day Cells */}
        {calendarDays.map((day) => {
          const pillClass = getPillConnectionClass(day.dayNum, day);
          const isSelected = selectedDateStr === day.dateStr;
          
          // Check if day is today
          const now = new Date();
          const isToday = now.getFullYear() === currentYear && now.getMonth() === currentMonth && now.getDate() === day.dayNum;

          // Check branch filter dimming
          const isBranchFilteredOut = selectedBranch !== 'All' && day.branch && day.branch !== selectedBranch;
          const locName = getLocationName(day.branch, day.dayNum);

          return (
            <div
              key={day.dayNum}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => handleDayClick(day)}
              className={`relative h-10 flex items-center justify-center cursor-pointer transition-all duration-150 group ${pillClass} ${
                isBranchFilteredOut ? 'opacity-30' : 'opacity-100'
              } ${isSelected ? `ring-2 ring-[#E84D84] ring-offset-1 z-20 font-bold shadow-xs ${!pillClass ? 'rounded-full' : ''}` : ''}`}
            >
              {/* Fully Booked Always-Circular Ring Overlay */}
              {day.hasFullyBooked && (
                <div 
                  className="absolute inset-[3px] rounded-full ring-2 ring-[#D92D4B] pointer-events-none z-[15]"
                  title={lang === 'th' ? 'เต็มแล้ว' : 'Fully Booked'}
                />
              )}
              {/* Special Today Circle Indicator */}
              {isToday && (
                <>
                  <div 
                    className="absolute inset-0.5 rounded-full border-2 border-[#1E1E1E] pointer-events-none z-20 flex items-center justify-center shadow-xs ring-2 ring-[#E84D84]/40"
                    title={t.today}
                  />
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0 bg-[#1E1E1E] text-[8px] font-bold text-white rounded-full leading-tight z-30 uppercase tracking-tighter shadow-xs">
                    TODAY
                  </span>
                </>
              )}

              {/* Day Number */}
              <span
                className={`z-10 transition-transform ${
                  isToday ? 'font-black' : ''
                } ${
                  day.isSundayPink && !pillClass.includes('text-white') && !pillClass.includes('bg-[#1E1E1E]')
                    ? 'text-[#F080A2] font-semibold'
                    : ''
                }`}
              >
                {day.dayNum}
              </span>

              {/* Day Cell Badges (Special Event Star & Online Video Badge) */}
              {(day.hasSpecialStar || day.hasOnlineEvent) && (
                <div className="absolute -top-1.5 -right-0.5 z-20 flex flex-col items-center gap-0.5 pointer-events-none">
                  {day.hasSpecialStar && (
                    <div 
                      className="transform rotate-6 scale-105"
                      title={lang === 'th' ? 'กิจกรรมไฮไลท์ประจำเดือน' : 'Special Featured Event'}
                    >
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        className="animate-in fade-in zoom-in duration-300 drop-shadow-[0_2px_4px_rgba(217,130,0,0.45)]"
                      >
                        <defs>
                          <linearGradient id={`goldGrad-${day.dayNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF275" />
                            <stop offset="50%" stopColor="#FDB827" />
                            <stop offset="100%" stopColor="#EA8F00" />
                          </linearGradient>
                        </defs>
                        {/* Classic 5-point Star Geometry */}
                        <path
                          d="M12 2.5l2.75 5.85 6.45.68-4.8 4.38 1.35 6.34L12 16.5l-5.75 3.25 1.35-6.34-4.8-4.38 6.45-.68L12 2.5z"
                          fill={`url(#goldGrad-${day.dayNum})`}
                          stroke="#C97500"
                          strokeWidth="0.8"
                          strokeLinejoin="round"
                        />
                        {/* Subtle Inner Star Highlight */}
                        <path
                          d="M12 4.5l1.6 3.6 4 .4-3 2.7.9 4-3.5-2V4.5z"
                          fill="#FFFFFF"
                          opacity="0.35"
                        />
                      </svg>
                    </div>
                  )}

                  {day.hasOnlineEvent && (
                    <div title={lang === 'th' ? 'มีกิจกรรมออนไลน์' : 'Has an online event'}>
                      <div className="w-4 h-4 rounded-full bg-[#8A6FAE] flex items-center justify-center shadow-xs border border-white">
                        <Video className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Events indicator dot if on non-pill day */}
              {day.events.length > 0 && !day.hasSpecialStar && !day.hasOnlineEvent && !pillClass && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E84D84]" />
              )}

              {/* Hover Pop-up Tooltip for ALL Days (Nakhonsawan default, residency pills, & special status) */}
              {hoveredDay?.dayNum === day.dayNum && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in zoom-in-90 duration-150 max-w-[85vw] sm:max-w-xs">
                  <div className="px-2.5 py-1.5 rounded-2xl bg-[#1E1E1E] text-white text-[11px] font-medium shadow-xl flex flex-wrap items-center justify-center gap-1 border border-white/10 text-center">
                    {isToday && (
                      <span className="bg-[#E84D84] text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold flex-shrink-0">
                        {t.today}
                      </span>
                    )}
                    {day.specialStatus ? (
                      <>
                        <span 
                          className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: day.specialStatus.badgeBg }}
                        />
                        <span className="font-bold">{lang === 'th' ? day.specialStatus.labelTh : day.specialStatus.labelEn}</span>
                        {(lang === 'th' ? day.specialStatus.subTh : day.specialStatus.subEn) && (
                          <span className="text-stone-300 text-[10px]">
                            • {lang === 'th' ? day.specialStatus.subTh : day.specialStatus.subEn}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span 
                          className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                          style={{ 
                            backgroundColor: day.branch === 'Online' ? '#8A6FAE' : day.branch === 'On-Tour' ? '#D4A373' : day.branch === 'Ratchathewi' ? '#F7C2D2' : '#FFFFFF' 
                          }}
                        />
                        <span>{locName}</span>
                        {day.events.length > 0 && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold flex-shrink-0 ${
                            day.hasFullyBooked ? 'bg-[#D92D4B] text-white' : 'bg-[#E84D84] text-white'
                          }`}>
                            {day.hasFullyBooked ? t.fullyBooked : `${day.events.length} ${lang === 'th' ? 'คลาส' : 'event'}`}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {/* Tooltip triangle indicator */}
                  <div className="w-2 h-2 bg-[#1E1E1E] rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
