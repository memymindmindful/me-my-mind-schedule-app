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
  MessageCircle
} from 'lucide-react';
import { ScheduleEvent, BookingSubmission } from '../types';
import { BRANCH_INFO } from '../data/scheduleData';
import { Language, TRANSLATIONS } from '../utils/translations';
import { getEventBookingMessage, openLineWithMessage } from '../utils/lineMessages';
import { BookingForm, BookingFormData } from './BookingForm';

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

  // Toggle state between event details view and booking form view
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Booking form state
  const [bookingData, setBookingData] = useState<BookingFormData>({
    clientName: '',
    clientPhone: '',
    clientLineId: '',
    guestCount: 1,
    specialNotes: '',
    language: lang
  });

  const [copiedLink, setCopiedLink] = useState(false);

  const displayName = lang === 'en' && event.englishName ? event.englishName : event.name;
  const branchName = lang === 'th' ? branchData.nameTh : branchData.name;

  const isEventFree = Boolean(event.isFree || event.priceThb === 0);
  const priceDisplayStr = isEventFree 
    ? (lang === 'th' ? 'ฟรี (FREE)' : 'Free')
    : `฿${event.priceThb.toLocaleString()} THB`;

  const handleShare = () => {
    const text = `✨ ${displayName} - Me.My.Mind Mindfulness Studio\n📅 ${event.dateDisplay} (${event.startTime} - ${event.endTime})\n📍 ${event.locationDetails}\nExchange: ${priceDisplayStr}\nFacilitator: ${event.facilitator.name}\nLINE Booking: @me.my.mind.mindful`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  /**
   * Action when user clicks "Send to LINE" inside the booking form
   */
  const handleSendBookingToLine = () => {
    // 1. Compile message with event & user details
    const message = getEventBookingMessage(
      lang,
      event,
      bookingData.guestCount,
      bookingData.specialNotes,
      bookingData.clientName,
      bookingData.clientPhone,
      bookingData.clientLineId
    );

    // 2. Open LINE Official Account
    openLineWithMessage(message);

    // 3. Register booking state locally
    onConfirmBooking({
      eventId: event.id,
      eventName: displayName,
      clientName: bookingData.clientName.trim(),
      clientLineId: bookingData.clientLineId?.trim() || 'Via Web Booking',
      clientPhone: bookingData.clientPhone.trim() || 'N/A',
      guestsCount: bookingData.guestCount,
      specialNotes: bookingData.specialNotes,
      dateDisplay: event.dateDisplay,
      timeDisplay: event.timeDisplay,
      branch: event.branch,
      totalPriceThb: isEventFree ? 0 : event.priceThb * bookingData.guestCount
    });

    if (onShowToast) {
      onShowToast(lang === 'th'
        ? `💬 กำลังเปิด LINE Chat พร้อมข้อมูลการจองของคุณ...`
        : `💬 Opening LINE Chat with your booking summary...`
      );
    }

    // Reset & close
    setShowBookingForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-[#F0E4E8] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Event Poster Banner */}
        <div className="relative w-full h-40 sm:h-44 bg-gradient-to-tr from-[#241A20] to-[#4A2D3A] overflow-hidden flex-shrink-0">
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
            <h2 className="text-[18px] sm:text-[20px] font-bold text-white leading-tight font-sans drop-shadow-md">
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
          {showBookingForm ? (
            /* STEP 3 & 4: BOOKING FORM VIEW */
            <BookingForm
              event={event}
              bookingData={bookingData}
              onBookingDataChange={setBookingData}
              onSendToLine={handleSendBookingToLine}
              onCancel={() => setShowBookingForm(false)}
              lang={lang}
            />
          ) : (
            /* STEP 1 & 2: EVENT DETAILS VIEW */
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
                  <span className={`font-bold whitespace-nowrap ${isEventFree ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200' : 'text-[#E84D84]'}`}>
                    {priceDisplayStr}
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
          )}
        </div>

        {/* Modal Bottom Actions: Single Clear BOOK NOW Button & Share */}
        {!showBookingForm && (
          <div className="p-3.5 sm:p-4 bg-[#FAF7F5] border-t border-[#F0E4E8] flex items-center justify-between gap-2 sm:gap-3">
            {/* Share / Copy Details */}
            <button
              type="button"
              onClick={handleShare}
              className="p-3 px-3.5 rounded-2xl border border-[#E0D7D0] bg-white hover:bg-black/5 text-[#555] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
              title="Share event details"
            >
              <Share2 className="w-4 h-4 text-[#E84D84]" />
              <span className="hidden xs:inline">{copiedLink ? t.copied : t.share}</span>
            </button>

            {/* SINGLE Primary "BOOK NOW" Button -> Opens Booking Form */}
            <button
              id="modal-primary-book-now-btn"
              type="button"
              onClick={() => setShowBookingForm(true)}
              disabled={isFullyBooked}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#E84D84] hover:bg-[#D43D73] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {isFullyBooked 
                  ? t.fullyBooked 
                  : (lang === 'th' ? '💬 จองเลย (BOOK NOW)' : '💬 BOOK NOW')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
