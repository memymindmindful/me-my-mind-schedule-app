import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Share2, 
  Sparkles, 
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { ScheduleEvent, BookingSubmission } from '../types';
import { BRANCH_INFO } from '../data/scheduleData';
import { Language, TRANSLATIONS } from '../utils/translations';
import { getEventBookingMessage, openLineWithMessage } from '../utils/lineMessages';

interface EventDetailModalProps {
  event: ScheduleEvent | null;
  onClose: () => void;
  onConfirmBooking: (booking: BookingSubmission) => void;
  lang: Language;
  onShowToast?: (message: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onConfirmBooking,
  lang,
  onShowToast
}) => {
  if (!event) return null;

  const t = TRANSLATIONS[lang];
  const branchData = BRANCH_INFO[event.branch];
  const spotsLeft = Math.max(0, event.capacity - event.bookedCount);
  const isFullyBooked = spotsLeft === 0 || event.status === 'fully_booked';

  // Booking form state
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientLineId, setClientLineId] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const displayName = lang === 'en' && event.englishName ? event.englishName : event.name;
  const branchName = lang === 'th' ? branchData.nameTh : branchData.name;

  const handleShare = () => {
    const text = `✨ ${displayName} - Me.My.Mind Mindfulness Studio\n📅 ${event.dateDisplay} (${event.startTime} - ${event.endTime})\n📍 ${event.locationDetails}\nExchange: ฿${event.priceThb.toLocaleString()} THB\nFacilitator: ${event.facilitator.name}\nLINE Booking: @me.my.mind.mindful`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  /**
   * Handle Button 2: Direct LINE Booking with pre-filled message for this event
   */
  const handleOpenBookNowWithEventDetails = () => {
    const message = getEventBookingMessage(lang, event, guestsCount, specialNotes);
    openLineWithMessage(message);
    
    if (onShowToast) {
      onShowToast(lang === 'th'
        ? `💬 กำลังเปิด LINE Chat พร้อมข้อมูลคลาส "${displayName}"...`
        : `💬 Opening LINE Chat with pre-filled details for "${displayName}"...`
      );
    }
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    onConfirmBooking({
      eventId: event.id,
      eventName: displayName,
      clientName: clientName.trim(),
      clientLineId: clientLineId.trim() || 'Via Web Booking',
      clientPhone: clientPhone.trim() || 'N/A',
      guestsCount,
      specialNotes,
      dateDisplay: event.dateDisplay,
      timeDisplay: event.timeDisplay,
      branch: event.branch,
      totalPriceThb: event.priceThb * guestsCount
    });

    // Also trigger pre-filled LINE message with user's inputted details
    handleOpenBookNowWithEventDetails();

    setIsBookingMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-[#F0E4E8] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Event Poster Banner */}
        <div className="relative w-full h-44 sm:h-48 bg-gradient-to-tr from-[#241A20] to-[#4A2D3A] overflow-hidden flex-shrink-0">
          {event.posterUrl ? (
            <img 
              src={event.posterUrl} 
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 brightness-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E84D84]/20 via-[#FAF0F3] to-[#F5E6EB]">
              <Sparkles className="w-10 h-10 text-[#E84D84]/40 animate-pulse" />
            </div>
          )}

          {/* Gradient protection overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />

          {/* Close button on poster */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md border border-white/20 z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Poster Top Badges */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
            <span 
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md backdrop-blur-md"
              style={{
                backgroundColor: event.branch === 'On-Tour' ? '#9E674F' : '#E84D84'
              }}
            >
              <MapPin className="w-3 h-3" />
              <span>{branchName}</span>
            </span>

            {event.isSpecialStar && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4DC] text-[#8C5D00] shadow-md border border-[#FDE1A6]">
                <Sparkles className="w-2.5 h-2.5 text-[#FDB827]" />
                <span>{t.specialEventBadge}</span>
              </span>
            )}
          </div>

          {/* Poster Bottom Info / Tag */}
          <div className="absolute bottom-3 left-4 right-4 z-10">
            {event.posterTag && (
              <span className="inline-block px-2 py-0.5 mb-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-white/20 text-white/90 backdrop-blur-sm border border-white/20">
                {event.posterTag}
              </span>
            )}
            <h2 className="text-[19px] sm:text-[21px] font-bold text-white leading-tight font-sans drop-shadow-md">
              {displayName}
            </h2>
          </div>
        </div>

        {/* Modal Sub-Header (Subtitle & Event ID) */}
        {event.subtitle && (
          <div className="px-5 py-2.5 bg-[#FAF7F5] border-b border-[#F2ECE6] flex items-center justify-between text-xs">
            <p className="text-[#555] font-medium truncate pr-2">
              {event.subtitle}
            </p>
            <span className="text-[10px] text-[#999] font-mono whitespace-nowrap">
              {event.dateDisplay}
            </span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-sm font-sans text-[#2B2B2B]">
          {!isBookingMode ? (
            <>
              {/* Date, Time, Venue Pills */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF7F5] rounded-2xl border border-[#EFE8E1]">
                <div className="flex items-center gap-2 text-xs">
                  <div className="p-1.5 rounded-lg bg-[#FFFFFF] text-[#E84D84] border border-[#F5E6EB] shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#888] uppercase block leading-none">{lang === 'th' ? 'วันที่' : 'Date'}</span>
                    <span className="font-semibold text-[#1E1E1E] text-xs">
                      {event.dateDisplay} ({event.dateStr})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="p-1.5 rounded-lg bg-[#FFFFFF] text-[#E84D84] border border-[#F5E6EB] shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#888] uppercase block leading-none">{lang === 'th' ? 'เวลา' : 'Time'}</span>
                    <span className="font-semibold text-[#1E1E1E] text-xs">
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 pt-1 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
                  <span className="text-[#666] flex items-center gap-1 truncate pr-2">
                    <MapPin className="w-3.5 h-3.5 text-[#E84D84] flex-shrink-0" />
                    <span className="truncate">{event.locationDetails}</span>
                  </span>
                  <span className="font-bold text-[#E84D84] whitespace-nowrap">
                    ฿{event.priceThb.toLocaleString()} THB
                  </span>
                </div>
              </div>

              {/* Status & Availability Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FDF5F8] border border-[#F8DFE7] text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E84D84]" />
                  <span className="font-medium">
                    {t.spotsLeft}: <strong>{spotsLeft}</strong> / {event.capacity} {t.spotsTotal}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {event.adminNote && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF0F3] text-[#E84D84] border border-[#F8DDE5]">
                      {event.adminNote}
                    </span>
                  )}
                  {isFullyBooked ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE5E8] text-[#D92D4B]">
                      {t.fullyBooked}
                    </span>
                  ) : spotsLeft <= 3 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF2E0] text-[#B86200]">
                      {t.almostFull}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#1E8A54]">
                      {t.available}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  {t.aboutRitual}
                </h4>
                <p className="text-[13px] text-[#444] leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Facilitator Info */}
              <div className="p-3 rounded-2xl bg-[#FAF7F5] border border-[#EFE8E1] flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E84D84] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                  KB
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-[#1E1E1E]">
                    {event.facilitator.name}
                  </h4>
                  <span className="text-[11px] text-[#E84D84] font-medium block">
                    {event.facilitator.role}
                  </span>
                  <p className="text-[11px] text-[#666] mt-0.5 leading-snug">
                    {event.facilitator.bio}
                  </p>
                </div>
              </div>

              {/* Sensory elements & tools */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  {t.sensoryNotes}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {event.sensoryNotes.map((note, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-[#FAF0F3] text-[#A6355C] border border-[#F8DDE5] font-medium"
                    >
                      • {note}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#888]">
                  {t.keyBenefits}
                </h4>
                <ul className="space-y-1 text-xs text-[#444]">
                  {event.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E84D84] flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            /* Booking Form View */
            <form onSubmit={handleSubmitBooking} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 bg-[#FAF0F3] rounded-2xl border border-[#F8DDE5]">
                <h4 className="font-bold text-sm text-[#E84D84]">{displayName}</h4>
                <div className="text-xs text-[#666] mt-1 flex items-center justify-between">
                  <span>{event.dateDisplay} • {event.timeDisplay}</span>
                  <span className="font-bold text-[#1E1E1E]">฿{(event.priceThb * guestsCount).toLocaleString()} THB</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#444] mb-1">
                    {t.yourName}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={lang === 'th' ? 'เช่น คุณสุภาพร ว.' : 'e.g. Supaporn V.'}
                    className="w-full p-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#444] mb-1">
                      {t.lineId}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientLineId}
                      onChange={(e) => setClientLineId(e.target.value)}
                      placeholder="@yourlineid"
                      className="w-full p-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#444] mb-1">
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="081-xxx-xxxx"
                      className="w-full p-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444] mb-1">
                    {t.guestCount}
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] outline-none text-xs bg-white"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>
                        {n} {t.guestCountUnit} (฿{(event.priceThb * n).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444] mb-1">
                    {t.specialNotes}
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={t.specialNotesPlaceholder}
                    className="w-full p-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] outline-none text-xs resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingMode(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDD] font-semibold text-xs text-[#555] hover:bg-black/5 cursor-pointer"
                >
                  {t.back}
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-[#E84D84] hover:bg-[#D43D73] font-bold text-xs text-white shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'th' ? '💬 ยืนยัน & ส่งข้อมูลไป LINE' : '💬 Confirm & Send to LINE'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Actions: Dual Booking Options (Direct LINE Booking or Detailed Form) */}
        {!isBookingMode && (
          <div className="p-3.5 sm:p-4 bg-[#FAF7F5] border-t border-[#F0E4E8] flex items-center justify-between gap-2 sm:gap-3">
            {/* Share / Copy Details */}
            <button
              onClick={handleShare}
              className="p-2.5 px-3 rounded-xl border border-[#E0D7D0] bg-white hover:bg-black/5 text-[#555] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
              title="Share event details"
            >
              <Share2 className="w-4 h-4 text-[#E84D84]" />
              <span className="hidden xs:inline">{copiedLink ? t.copied : t.share}</span>
            </button>

            {/* Quick Button 2: Direct LINE pre-filled booking */}
            <button
              id="modal-quick-line-btn"
              onClick={handleOpenBookNowWithEventDetails}
              disabled={isFullyBooked}
              className="flex-1 py-2.5 px-3 sm:px-4 rounded-xl bg-[#E84D84] hover:bg-[#D43D73] active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {isFullyBooked 
                  ? t.fullyBooked 
                  : lang === 'th' 
                    ? '📱 BOOK NOW (Pre-filled)' 
                    : '📱 BOOK NOW (Pre-filled)'}
              </span>
            </button>

            {/* Optional Detailed Form Button */}
            <button
              id="modal-custom-form-btn"
              onClick={() => setIsBookingMode(true)}
              disabled={isFullyBooked}
              className="p-2.5 px-3 rounded-xl border border-[#E84D84]/40 bg-[#FAF0F3] hover:bg-[#FCE8EF] text-[#E84D84] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title={lang === 'th' ? 'กรอกข้อมูลสำรองที่นั่ง' : 'Fill reservation form'}
            >
              <span>{lang === 'th' ? 'กรอกฟอร์ม' : 'Form'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
