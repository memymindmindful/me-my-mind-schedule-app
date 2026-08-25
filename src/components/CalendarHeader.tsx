import React from 'react';
import { ChevronLeft, MoreHorizontal, Search, X, Globe, RefreshCw } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations';

interface CalendarHeaderProps {
  onBack: () => void;
  onOptionsClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lang: Language;
  onToggleLang: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onBack,
  onOptionsClick,
  searchQuery,
  onSearchChange,
  lang,
  onToggleLang,
  onRefresh,
  isRefreshing = false
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="w-full space-y-3 select-none">
      {/* Top Bar: Back, Title, Refresh, Language Toggle, Options */}
      <div className="flex items-center justify-between pt-1">
        {/* Back Button (<) */}
        <button
          id="header-back-btn"
          onClick={onBack}
          className="p-1 -ml-2 text-[#E84D84] hover:bg-[#E84D84]/10 rounded-full transition-colors cursor-pointer"
          title={lang === 'th' ? 'กลับไปที่ LINE' : 'Back to LINE'}
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Title: Me.My.Mind Schedule in coral/hot pink */}
        <h1 className="text-[19px] sm:text-[22px] font-semibold text-[#E84D84] tracking-tight font-sans text-center flex-1 truncate px-1">
          {t.appTitle}
        </h1>

        {/* Right Controls: Refresh Button, Language Switcher & Options Button */}
        <div className="flex items-center gap-1.5">
          {/* Refresh Button */}
          <button
            id="header-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-[#E84D84] hover:bg-[#E84D84]/10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            title={lang === 'th' ? 'รีเฟรชข้อมูลล่าสุด' : 'Refresh latest data'}
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isRefreshing ? 'animate-spin text-[#E84D84]' : ''}`} />
          </button>

          {/* Language Toggle Pill [TH | EN] */}
          <button
            id="header-lang-toggle-btn"
            onClick={onToggleLang}
            className="flex items-center gap-1 py-1 px-2.5 rounded-full border border-[#E84D84]/30 bg-[#FAF0F3] hover:bg-[#FCE6EC] text-[#E84D84] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            title={lang === 'th' ? 'เปลี่ยนเป็นภาษาอังกฤษ (Switch to English)' : 'Switch to Thai (เปลี่ยนเป็นภาษาไทย)'}
            aria-label="Toggle Language"
          >
            <Globe className="w-3 h-3 text-[#E84D84]" />
            <span className={lang === 'th' ? 'font-extrabold text-[#E84D84]' : 'opacity-60 text-[#777]'}>TH</span>
            <span className="opacity-40">/</span>
            <span className={lang === 'en' ? 'font-extrabold text-[#E84D84]' : 'opacity-60 text-[#777]'}>EN</span>
          </button>

          {/* Options Button (...) in pink circle */}
          <button
            id="header-options-btn"
            onClick={onOptionsClick}
            className="w-7 h-7 rounded-full border border-[#E84D84] text-[#E84D84] flex items-center justify-center hover:bg-[#E84D84]/10 transition-colors cursor-pointer"
            title={lang === 'th' ? 'เมนูและข้อมูลสตูดิโอ' : 'Studio & Branch Options'}
            aria-label="Options"
          >
            <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Search Input Bar (rounded soft pink/cream pill with search icon) */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#F080A2]">
          <Search className="w-4 h-4 stroke-[2]" />
        </div>

        <input
          id="event-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-[#FAF0F3] hover:bg-[#FCE6EC] focus:bg-[#FFFFFF] text-[#2B2B2B] placeholder-[#B59AA2] text-[14px] rounded-full pl-10 pr-9 py-2.5 outline-none border border-transparent focus:border-[#E84D84]/40 transition-all font-sans"
        />

        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-3 flex items-center text-[#B59AA2] hover:text-[#E84D84] cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
