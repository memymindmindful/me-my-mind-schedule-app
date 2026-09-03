import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ScheduleEvent, BranchLocation, BookingSubmission, DayCalendarInfo, AllStudioSettings, DayBarConfig } from './types';
import { getStoredBranchFilter, saveStoredBranchFilter, DEFAULT_STUDIO_SETTINGS, getDefaultMonthBars } from './utils/adminStorage';
import { apiFetchMonthEvents, apiFetchMonthBars, apiFetchStudioSettings } from './utils/apiClient';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarMonthView } from './components/CalendarMonthView';
import { DontMissSection } from './components/DontMissSection';
import { EventDetailModal } from './components/EventDetailModal';
import { DayEventsListModal } from './components/DayEventsListModal';
import { BookingInstructionsModal } from './components/BookingInstructionsModal';
import { OptionsMenuModal } from './components/OptionsMenuModal';
import { WelcomeGuideModal } from './components/WelcomeGuideModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Language, TRANSLATIONS } from './utils/translations';
import { CheckCircle } from 'lucide-react';

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

  // Filter state for branch tabs (defaults to stored branch filter or 'All')
  const [selectedBranch, setSelectedBranch] = useState<BranchLocation | 'All'>(() => getStoredBranchFilter());

  // Search filter query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected date modal / filter
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Active event for detailed popup
  const [activeEventModal, setActiveEventModal] = useState<ScheduleEvent | null>(null);

  // Day events list popup when multiple events exist on the same day
  const [dayEventsListModal, setDayEventsListModal] = useState<{ dateStr: string; events: ScheduleEvent[] } | null>(null);

  // Generic booking instructions modal
  const [isBookingInstructionsOpen, setIsBookingInstructionsOpen] = useState<boolean>(false);

  // Options & Studio guide modal
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);

  // Welcome / Calendar Guide Modal state
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(false);

  const handleCloseWelcomeGuide = () => {
    setShowWelcomeGuide(false);
    try {
      localStorage.setItem('mmm_has_seen_welcome_guide', 'true');
    } catch (err) {
      console.warn('localStorage write error:', err);
    }
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Studio settings state (Branding, sayHiMessage, etc.)
  const [studioSettings, setStudioSettings] = useState<AllStudioSettings>(DEFAULT_STUDIO_SETTINGS);

  // Manual refresh loading state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dynamic monthly schedule data loaded exclusively from Database/API
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [monthBars, setMonthBars] = useState<Record<number, DayBarConfig>>(() => 
    getDefaultMonthBars(new Date().getFullYear(), new Date().getMonth())
  );

  // Reusable Calendar Data Refresh Function
  const refreshCalendarData = useCallback(async (showFeedback: boolean = false) => {
    if (showFeedback) setIsRefreshing(true);
    try {
      const [apiEvents, apiBars, apiSettings] = await Promise.all([
        apiFetchMonthEvents(currentYear, currentMonth),
        apiFetchMonthBars(currentYear, currentMonth),
        apiFetchStudioSettings()
      ]);

      if (apiEvents !== null) {
        setEvents(apiEvents);
      } else {
        console.warn('Could not load events from server. Displaying empty schedule.');
        setEvents([]);
      }

      if (apiBars !== null) {
        setMonthBars(apiBars);
      } else {
        console.warn('Could not load month bars from server. Using default view.');
        setMonthBars(getDefaultMonthBars(currentYear, currentMonth));
      }

      if (apiSettings && apiSettings.studio) {
        setStudioSettings(apiSettings);
      }

      if (showFeedback) {
        setToastMessage(lang === 'th' ? '🔄 อัปเดตข้อมูลล่าสุดแล้ว!' : '🔄 Refreshed with latest data!');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error('Failed to refresh calendar data:', err);
      if (showFeedback) {
        setToastMessage(lang === 'th' ? '❌ รีเฟรชไม่สำเร็จ กรุณาลองใหม่' : '❌ Refresh failed, please try again');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } finally {
      if (showFeedback) setIsRefreshing(false);
    }
  }, [currentYear, currentMonth, lang]);

  // Load Initial Studio Settings and listen for settings updates
  useEffect(() => {
    let isMounted = true;
    apiFetchStudioSettings().then((apiSettings) => {
      if (!isMounted) return;
      if (apiSettings && apiSettings.studio) {
        setStudioSettings(apiSettings);
      }
    }).catch((err) => {
      console.warn('Using default settings fallback:', err);
    }).finally(() => {
      if (!isMounted) return;
      try {
        const hasSeenGuide = localStorage.getItem('mmm_has_seen_welcome_guide');
        if (!hasSeenGuide) {
          setShowWelcomeGuide(true);
        }
      } catch (err) {
        console.warn('localStorage read error:', err);
      }
    });

    const handleSettingsUpdated = (evt: any) => {
      if (evt.detail) {
        setStudioSettings(evt.detail);
      }
    };

    window.addEventListener('mmm_settings_updated', handleSettingsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('mmm_settings_updated', handleSettingsUpdated);
    };
  }, []);

  // Reload data from API whenever current month or year changes
  useEffect(() => {
    refreshCalendarData(false);
  }, [currentYear, currentMonth, refreshCalendarData]);

  // Listen to live events dispatched during admin operations in same session
  useEffect(() => {
    const handleCustomUpdate = (evt: any) => {
      if (evt.detail?.year === currentYear && evt.detail?.month === currentMonth && Array.isArray(evt.detail?.events)) {
        setEvents(evt.detail.events);
      } else {
        apiFetchMonthEvents(currentYear, currentMonth).then((evts) => {
          if (evts !== null) setEvents(evts);
        });
      }
    };

    const handleBarsUpdate = (evt: any) => {
      if (evt.detail?.year === currentYear && evt.detail?.month === currentMonth && evt.detail?.bars) {
        setMonthBars(evt.detail.bars);
      } else {
        apiFetchMonthBars(currentYear, currentMonth).then((bars) => {
          if (bars !== null) setMonthBars(bars);
        });
      }
    };

    const handleStartFreshReset = (evt: any) => {
      const defaultBranch = evt.detail?.defaultBranch || 'Nakhonsawan';
      setSelectedBranch(defaultBranch);
      saveStoredBranchFilter(defaultBranch);
      setSearchQuery('');
      setSelectedDateStr(null);
      setActiveEventModal(null);
      setEvents([]);
      setMonthBars(getDefaultMonthBars(currentYear, currentMonth));
    };

    window.addEventListener('mmm_events_updated', handleCustomUpdate);
    window.addEventListener('mmm_bars_updated', handleBarsUpdate);
    window.addEventListener('mmm_reset_start_fresh', handleStartFreshReset);
    return () => {
      window.removeEventListener('mmm_events_updated', handleCustomUpdate);
      window.removeEventListener('mmm_bars_updated', handleBarsUpdate);
      window.removeEventListener('mmm_reset_start_fresh', handleStartFreshReset);
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

  // Filtered events based on search query and branch filter
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Branch match
      if (selectedBranch !== 'All' && evt.branch !== selectedBranch) {
        return false;
      }

      // 2. Search query match
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = (evt as any).title?.toLowerCase?.() || evt.name?.toLowerCase?.() || evt.englishName?.toLowerCase?.() || '';
        const matchSubtitle = evt.subtitle?.toLowerCase?.() || evt.subtitleEn?.toLowerCase?.() || '';
        const matchDesc = evt.description?.toLowerCase?.() || evt.descriptionEn?.toLowerCase?.() || '';
        const matchLocation = evt.locationDetails?.toLowerCase?.() || '';
        const matchInstructor = evt.facilitator?.name?.toLowerCase?.() || '';
        const matchCategory = evt.category?.toLowerCase?.() || '';
        if (
          !matchTitle.includes(q) &&
          !matchSubtitle.includes(q) &&
          !matchDesc.includes(q) &&
          !matchLocation.includes(q) &&
          !matchInstructor.includes(q) &&
          !matchCategory.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedBranch, searchQuery]);

  // Handle branch pill toggle
  const handleToggleBranchFilter = (branch: BranchLocation) => {
    setSelectedBranch((prev) => {
      const nextVal = prev === branch ? 'All' : branch;
      saveStoredBranchFilter(nextVal);
      return nextVal;
    });
    setSelectedDateStr(null);
  };


  // Handle date selection
  const handleSelectDate = (dateStr: string, events: ScheduleEvent[]) => {
    // If the day has no events, do nothing — don't touch selectedDateStr at all,
    // since there's no modal that will ever open to reset it later.
    if (!events || events.length === 0) {
      return;
    }

    // Set selected date for visual ring highlight on the calendar while modal is active
    setSelectedDateStr(dateStr);

    if (events.length === 1) {
      // Exactly one event — open its detail directly
      setActiveEventModal(events[0]);
    } else {
      // Multiple events on the same day — show the Day Event List popup
      setDayEventsListModal({ dateStr, events });
    }
  };

  // Handle selecting an event from the Day Event List popup
  const handleSelectEventFromDayList = (evt: ScheduleEvent) => {
    setDayEventsListModal(null);
    setActiveEventModal(evt);
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
   * CASE 1: Generic "BOOK NOW" from Main Calendar Page
   * Shows BookingInstructionsModal -> User reviews instructions -> Opens EMPTY LINE chat for user to type own message
   */
  const handleOpenBookNowGeneric = () => {
    setIsBookingInstructionsOpen(true);
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
              {/* 1. Header (Back, Title, Refresh, Language Switcher, Options, Search Bar) */}
              <CalendarHeader
                onBack={handleBackToLine}
                onOptionsClick={() => setIsOptionsMenuOpen(true)}
                onShowWelcomeGuide={() => setShowWelcomeGuide(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                lang={lang}
                onToggleLang={handleToggleLang}
                onRefresh={() => refreshCalendarData(true)}
                isRefreshing={isRefreshing}
              />

              {/* 2. Calendar Month & Grid View */}
              <CalendarMonthView
                currentYear={currentYear}
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                selectedBranch={selectedBranch}
                onToggleBranchFilter={handleToggleBranchFilter}
                selectedDateStr={selectedDateStr}
                onSelectDate={handleSelectDate}
                onOpenEventDetail={(evt) => setActiveEventModal(evt)}
                allEvents={filteredEvents}
                monthBarsMap={monthBars}
                lang={lang}
              />

              {/* 3. "DON'T MISS" Section & Main Page Generic BOOK NOW Action */}
              <DontMissSection
                events={filteredEvents}
                onOpenEventDetail={(evt) => setActiveEventModal(evt)}
                onOpenBookNow={handleOpenBookNowGeneric}
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

      {/* CASE 1: Generic Booking Instructions Modal (Opens EMPTY LINE chat) */}
      <BookingInstructionsModal
        isOpen={isBookingInstructionsOpen}
        onClose={() => setIsBookingInstructionsOpen(false)}
        lang={lang}
        onShowToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* CASE 2: Event Details & Booking Form Modal (Opens PRE-FILLED LINE chat) */}
      <EventDetailModal
        event={activeEventModal}
        onClose={() => {
          setActiveEventModal(null);
          setSelectedDateStr(null); // ⭐ Reset single-day filter so full calendar shows again
        }}
        onConfirmBooking={handleConfirmBooking}
        lang={lang}
        globalFacilitator={studioSettings?.facilitator}
        facilitators={studioSettings?.facilitators || (studioSettings?.facilitator ? [studioSettings.facilitator] : [])}
        onShowToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* CASE 3: Day Events List Modal when multiple events exist on the same day */}
      <DayEventsListModal
        dateStr={dayEventsListModal?.dateStr || null}
        events={dayEventsListModal?.events || []}
        lang={lang}
        onClose={() => {
          setDayEventsListModal(null);
          setSelectedDateStr(null);
        }}
        onSelectEvent={handleSelectEventFromDayList}
      />

      {/* Options Menu & Studio Guide Modal */}
      <OptionsMenuModal
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        onSelectMonth={(idx) => {
          setCurrentMonth(idx);
          setSelectedDateStr(null);
        }}
        currentMonth={currentMonth}
        settings={studioSettings}
        lang={lang}
        onToggleLang={handleToggleLang}
      />

      {/* Welcome & Calendar Guide Modal */}
      <WelcomeGuideModal
        isOpen={showWelcomeGuide}
        onClose={handleCloseWelcomeGuide}
        lang={lang}
        guide={studioSettings?.studio || {}}
      />
    </div>
  );
}
