import React, { useState, useMemo, useEffect } from 'react';
import { 
  ScheduleEvent, 
  BranchLocation, 
  BookingSubmission,
  DayCalendarInfo
} from './types';
import { loadMonthEvents, loadMonthBars } from './utils/adminStorage';
import { apiFetchMonthEvents } from './utils/apiClient';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarMonthView } from './components/CalendarMonthView';
import { DontMissSection } from './components/DontMissSection';
import { EventDetailModal } from './components/EventDetailModal';
import { OptionsMenuModal } from './components/OptionsMenuModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Language, TRANSLATIONS } from './utils/translations';
import { getGenericBookingMessage, openLineWithMessage } from './utils/lineMessages';
import { CheckCircle, MessageCircle } from 'lucide-react';

export default function App() {
  // Check URL query param ?view=admin or #admin
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('view') === 'admin' || window.location.pathname.includes('/admin') || window.location.hash === '#admin';
    }
    return false;
  });

  // Listen to popstate or hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setIsAdminView(urlParams.get('view') === 'admin' || window.location.hash === '#admin' || window.location.pathname.includes('/admin'));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToAdmin = () => {
    setIsAdminView(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'admin');
      window.history.pushState({}, '', url.toString());
    } catch {
      window.location.hash = 'admin';
    }
  };

  const navigateToClient = () => {
    setIsAdminView(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.pushState({}, '', url.toString());
    } catch {
      window.location.hash = '';
    }
  };

  // Language state (Default to Thai as requested, or toggleable to English)
  const [lang, setLang] = useState<Language>('th');
  const t = TRANSLATIONS[lang];

  // Calendar month state (Default to current real-time month & year)
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed

  // Filter state for branch tabs
  const [selectedBranch, setSelectedBranch] = useState<BranchLocation | 'All'>('All');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected date modal / filter
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Active event for detailed popup
  const [activeEventModal, setActiveEventModal] = useState<ScheduleEvent | null>(null);

  // Options & Studio guide modal
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic monthly schedule data loaded from custom storage
  const [events, setEvents] = useState<ScheduleEvent[]>(() => 
    loadMonthEvents(new Date().getFullYear(), new Date().getMonth())
  );
  
  const [monthBars, setMonthBars] = useState<Record<string, DayCalendarInfo>>(() => 
    loadMonthBars(new Date().getFullYear(), new Date().getMonth())
  );

  // Reload data whenever current month or year changes
  useEffect(() => {
    let isMounted = true;
    const loadedBars = loadMonthBars(currentYear, currentMonth);
    setMonthBars(loadedBars);

    // Try backend API first, then local storage fallback
    apiFetchMonthEvents(currentYear, currentMonth).then((apiEvents) => {
      if (!isMounted) return;
      if (apiEvents && apiEvents.length > 0) {
        setEvents(apiEvents);
      } else {
        const localEvents = loadMonthEvents(currentYear, currentMonth);
        setEvents(localEvents);
      }
    }).catch(() => {
      if (!isMounted) return;
      setEvents(loadMonthEvents(currentYear, currentMonth));
    });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  // Listen to storage and custom events to sync changes live
  useEffect(() => {
    const handleStorage = () => {
      setEvents(loadMonthEvents(currentYear, currentMonth));
      setMonthBars(loadMonthBars(currentYear, currentMonth));
    };

    const handleCustomUpdate = (evt: any) => {
      if (evt.detail?.year === currentYear && evt.detail?.month === currentMonth && Array.isArray(evt.detail?.events)) {
        setEvents(evt.detail.events);
      } else {
        setEvents(loadMonthEvents(currentYear, currentMonth));
      }
      setMonthBars(loadMonthBars(currentYear, currentMonth));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('mmm_events_updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mmm_events_updated', handleCustomUpdate);
    };
  }, [currentYear, currentMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDateStr(null);
  };

  // Toggle Language Handler
  const handleToggleLang = () => {
    const nextLang = lang === 'th' ? 'en' : 'th';
    setLang(nextLang);
    setToastMessage(nextLang === 'en' ? 'Switched to English' : 'เปลี่ยนเป็นภาษาไทยเรียบร้อยแล้ว');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered events based on search query, branch filter, and selected date
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Branch match
      if (selectedBranch !== 'All' && evt.branch !== selectedBranch) {
        return false;
      }

      // 2. Search query match
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title?.toLowerCase?.() || evt.name?.toLowerCase?.() || '';
        const matchDesc = evt.description?.toLowerCase?.() || '';
        const matchLocation = evt.locationDetails?.toLowerCase?.() || '';
        const matchInstructor = evt.facilitator?.name?.toLowerCase?.() || '';
        const matchCategory = evt.category?.toLowerCase?.() || '';
        if (!matchTitle.includes(q) && !matchDesc.includes(q) && !matchLocation.includes(q) && !matchInstructor.includes(q) && !matchCategory.includes(q)) {
          return false;
        }
      }

      // 3. Selected single date match (if user clicked specific date)
      if (selectedDateStr) {
        return evt.dateStr === selectedDateStr;
      }

      return true;
    });
  }, [events, selectedBranch, searchQuery, selectedDateStr]);

  // Handle branch pill toggle
  const handleToggleBranchFilter = (branch: BranchLocation) => {
    setSelectedBranch((prev) => (prev === branch ? 'All' : branch));
  };

  // Handle Reset filter to Nakhonsawan only (default state without deleting data)
  const handleResetToNakhonsawan = () => {
    setSelectedBranch('Nakhonsawan');
    setSelectedDateStr(null);
    setSearchQuery('');
    setToastMessage(lang === 'th' ? '↺ รีเซ็ต: แสดงเฉพาะสาขานครสวรรค์' : '↺ Reset: Showing Nakhonsawan branch only');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle date selection
  const handleSelectDate = (dateStr: string, events: ScheduleEvent[]) => {
    setSelectedDateStr(dateStr);
    if (events.length > 0) {
      setActiveEventModal(events[0]);
    }
  };

  // Handle Confirmed Booking
  const handleConfirmBooking = (booking: BookingSubmission) => {
    setToastMessage(lang === 'th'
      ? `🎉 บันทึกการจองของคุณ ${booking.clientName} เรียบร้อยแล้ว (${booking.eventName})!`
      : `🎉 Reserved spot for ${booking.clientName} at ${booking.eventName} (${booking.dateDisplay})!`
    );
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Handle Back Button (LINE integration simulation)
  const handleBackToLine = () => {
    setSelectedBranch('All');
    setSearchQuery('');
    setSelectedDateStr(null);
    setToastMessage(lang === 'th'
      ? 'กลับไปยัง LINE Official Account (@me.my.mind.mindful)...'
      : 'Returning to LINE Official Account (@me.my.mind.mindful)...'
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  /**
   * Button 1: "BOOK NOW" from Main Page (Generic Booking with Pre-filled LINE Message)
   */
  const handleOpenBookNowGeneric = (currentLang: Language) => {
    const message = getGenericBookingMessage(currentLang);
    openLineWithMessage(message);
    
    setToastMessage(currentLang === 'th'
      ? '💬 กำลังเปิด LINE Chat พร้อมข้อความจองคลาส...'
      : '💬 Opening LINE Chat with pre-filled booking message...'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // If Admin View is active, render full Admin Portal
  if (isAdminView) {
    return <AdminDashboard onBackToClient={navigateToClient} />;
  }

  return (
    <div className="min-h-screen bg-[#F0EEEA] text-[#2B2B2B] flex flex-col items-center justify-start sm:py-6 sm:px-4 p-0 font-sans selection:bg-[#E84D84]/20 selection:text-[#E84D84]">
      {/* Main App Canvas */}
      <main className="w-full flex justify-center items-start">
        <div className="w-full max-w-[420px] sm:my-2">
          {/* Mobile Screen Container (Optimized for LINE WebView & Mobile Browsers) */}
          <div className="w-full bg-[#FAF9F6] text-[#2B2B2B] flex flex-col justify-between overflow-hidden sm:rounded-[36px] sm:border sm:border-[#E5DFD7] sm:shadow-[0_20px_50px_rgba(0,0,0,0.12)] min-h-screen sm:min-h-[844px]">
            {/* Inner Mobile Screen Content */}
            <div className="px-4 sm:px-6 pt-3 pb-6 flex-1 flex flex-col justify-between space-y-3">
              {/* 1. Header (Back, Title, Language Switcher, Options, Search Bar) */}
              <CalendarHeader
                onBack={handleBackToLine}
                onOptionsClick={() => setIsOptionsMenuOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                lang={lang}
                onToggleLang={handleToggleLang}
              />

              {/* 2. Calendar Month & Grid View */}
              <CalendarMonthView
                currentYear={currentYear}
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                selectedBranch={selectedBranch}
                onToggleBranchFilter={handleToggleBranchFilter}
                onResetToNakhonsawan={handleResetToNakhonsawan}
                selectedDateStr={selectedDateStr}
                onSelectDate={handleSelectDate}
                onOpenEventDetail={(evt) => setActiveEventModal(evt)}
                allEvents={filteredEvents}
                lang={lang}
              />

              {/* 3. "DON'T MISS" Section & Main Page BOOK NOW Action */}
              <DontMissSection
                events={filteredEvents}
                onOpenEventDetail={(evt) => setActiveEventModal(evt)}
                onOpenBookNow={() => handleOpenBookNowGeneric(lang)}
                searchQuery={searchQuery}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 px-5 py-3 rounded-2xl bg-[#1E1E1E] text-white text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[90vw]">
          <CheckCircle className="w-4 h-4 text-[#E84D84] flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Event Details & Booking Popup Modal */}
      <EventDetailModal
        event={activeEventModal}
        onClose={() => setActiveEventModal(null)}
        onConfirmBooking={handleConfirmBooking}
        lang={lang}
        onShowToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* Options Menu & Studio Guide Modal */}
      <OptionsMenuModal
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        onSelectMonth={(idx) => setCurrentMonth(idx)}
        currentMonth={currentMonth}
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenAdmin={navigateToAdmin}
      />
    </div>
  );
}
