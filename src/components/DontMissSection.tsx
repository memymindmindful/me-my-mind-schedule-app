import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ScheduleEvent } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';

interface DontMissSectionProps {
  events: ScheduleEvent[];
  onOpenEventDetail: (event: ScheduleEvent) => void;
  onOpenBookNow: () => void;
  searchQuery: string;
  lang: Language;
}

const ITEMS_PER_PAGE = 4;

export const DontMissSection: React.FC<DontMissSectionProps> = ({
  events,
  onOpenEventDetail,
  onOpenBookNow,
  searchQuery,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [currentPage, setCurrentPage] = useState(0);

  // Filter & prioritize important events for Don't Miss:
  // Sort with featured/special star first, then by date
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.isSpecialStar && !b.isSpecialStar) return -1;
      if (!a.isSpecialStar && b.isSpecialStar) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.dateStr.localeCompare(b.dateStr);
    });
  }, [events]);

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / ITEMS_PER_PAGE));

  // Reset to page 0 if filter or events length changes
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [sortedEvents.length, totalPages, currentPage]);

  const paginatedEvents = sortedEvents.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full pt-6 sm:pt-7 pb-1 select-none">
      {/* Title & Icons Row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <h3 className="text-[22px] sm:text-[24px] font-black text-[#E84D84] uppercase tracking-wide leading-none font-sans flex items-center gap-1.5">
            <span>{t.dontMissTitle}</span>
          </h3>
          <p className="text-[14px] sm:text-[15px] font-medium text-[#4A4A4A] mt-1 font-sans">
            {t.dontMissSubtitle}
          </p>
        </div>

        {/* Calendar & Alarm Clock Icons aligned with Date & Time columns */}
        <div className="flex items-center gap-4 pb-1 pr-1 flex-shrink-0">
          {/* Calendar Search Icon */}
          <div className="w-12 flex justify-end text-[#E84D84]" title={lang === 'th' ? 'วันที่จัดกิจกรรม' : 'Event Date (DD.MM)'}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#E84D84" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="11" cy="15" r="2" />
              <line x1="13" y1="17" x2="15" y2="19" />
            </svg>
          </div>

          {/* Alarm Clock Icon */}
          <div className="w-12 flex justify-end text-[#E84D84]" title={lang === 'th' ? 'เวลาเริ่มกิจกรรม' : 'Event Time'}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#E84D84" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="13" r="8" />
              <polyline points="12 9 12 13 15 14" />
              <line x1="5" y1="3" x2="2" y2="6" />
              <line x1="19" y1="3" x2="22" y2="6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="min-h-[195px] flex flex-col justify-start space-y-2.5">
        {paginatedEvents.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#777] bg-[#FAF7F5] rounded-2xl border border-dashed border-[#E5DFD7]">
            {t.noEventsFound} {searchQuery ? `"${searchQuery}"` : ''}
          </div>
        ) : (
          paginatedEvents.map((event) => {
            const displayName = lang === 'en' && event.englishName ? event.englishName : event.name;

            return (
              <div
                key={event.id}
                onClick={() => onOpenEventDetail(event)}
                className="group flex items-center justify-between py-1 px-1.5 -mx-1.5 cursor-pointer hover:bg-black/[0.03] active:bg-black/[0.06] rounded-xl transition-all duration-150"
              >
                {/* Event Name */}
                <div className="flex-1 pr-3 min-w-0">
                  <span className="text-[13.5px] sm:text-[14px] font-normal text-[#222] tracking-tight group-hover:text-[#E84D84] transition-colors line-clamp-1">
                    {displayName}
                  </span>
                </div>

                {/* Date & Time Columns aligned under the icons */}
                <div className="flex items-center gap-4 flex-shrink-0 text-right font-sans pr-1">
                  {/* Date (04.04, 18.04, etc.) */}
                  <span className="text-[13px] sm:text-[14px] text-[#333] font-mono tracking-tight w-12 text-right">
                    {event.dateDisplay}
                  </span>

                  {/* Time (9 am, 1 pm, 10 am, 7 pm) */}
                  <span className="text-[13px] sm:text-[14px] text-[#333] font-mono tracking-tight w-12 text-right">
                    {event.timeDisplay}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination / Carousel Dots Indicator (Interactive with slide buttons) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 pb-1">
          {/* Previous Page Arrow */}
          <button
            onClick={handlePrevPage}
            className="p-1 text-[#888] hover:text-[#E84D84] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Interactive Pagination Dots (....) */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`transition-all duration-200 cursor-pointer ${
                  currentPage === idx
                    ? 'w-6 h-2 rounded-full bg-[#E84D84]'
                    : 'w-2 h-2 rounded-full bg-[#E5DFD7] hover:bg-[#D5CDC5]'
                }`}
                title={`Page ${idx + 1} of ${totalPages}`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Page Arrow */}
          <button
            onClick={handleNextPage}
            className="p-1 text-[#888] hover:text-[#E84D84] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Single page dot placeholder if only 1 page */}
      {totalPages <= 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 pb-1">
          <span className="w-2 h-2 rounded-full bg-[#E84D84]" />
        </div>
      )}

      {/* Primary BOOK NOW Action Button */}
      <div className="pt-2 text-center">
        <button
          id="book-now-main-btn"
          onClick={onOpenBookNow}
          className="text-[16px] sm:text-[17px] font-bold text-[#E84D84] tracking-wider uppercase hover:opacity-80 active:scale-98 transition-all py-2 px-6 rounded-full hover:bg-[#E84D84]/5 cursor-pointer font-sans"
        >
          {t.bookNowBtn}
        </button>
      </div>
    </div>
  );
};
