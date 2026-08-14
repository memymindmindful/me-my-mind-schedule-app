import React from 'react';
import { X, MessageCircle, AlertCircle, Sparkles, Calendar, MapPin, Users, Check } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { openLineWithEmptyMessage } from '../utils/lineMessages';

interface BookingInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onShowToast?: (message: string) => void;
}

export const BookingInstructionsModal: React.FC<BookingInstructionsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onShowToast
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const handleGoToLine = () => {
    // Open EMPTY LINE chat (no pre-filled text so user types own details)
    openLineWithEmptyMessage();

    if (onShowToast) {
      onShowToast(lang === 'th'
        ? '💬 กำลังเปิด LINE Chat (@me.my.mind.mindful)...'
        : '💬 Opening LINE Chat (@me.my.mind.mindful)...'
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-[#F0E4E8] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-b from-[#FDF2F5] to-[#FFFFFF] border-b border-[#F5E6EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] flex items-center justify-center text-[#E84D84]">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E84D84] font-sans tracking-tight">
                {t.bookingInstructionsTitle}
              </h3>
              <p className="text-[11px] text-[#777]">
                {t.bookingInstructionsSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#777] hover:text-[#E84D84] hover:bg-[#E84D84]/10 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-[#2B2B2B]">
          {/* Notice Banner (1 Day Advance Booking Warning) */}
          <div className="p-3.5 rounded-2xl bg-[#FFF6F0] border border-[#FFE0D0] flex items-start gap-2.5 text-[#9E4A28]">
            <AlertCircle className="w-4 h-4 text-[#D9653B] flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] font-medium leading-relaxed">
              {t.bookingAdvanceNotice}
            </p>
          </div>

          {/* Instructions List */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#1E1E1E]">
              {t.whatToIncludeTitle}
            </h4>
            <div className="space-y-2 bg-[#FAF7F5] p-3.5 rounded-2xl border border-[#EFE8E1]">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#E84D84] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#222] block">
                    {lang === 'th' ? '1. โปรแกรม / คลาส' : '1. Class / Program'}
                  </span>
                  <span className="text-[11px] text-[#666]">
                    {t.includeItemProgram}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#F0EAE3]">
                <Calendar className="w-4 h-4 text-[#E84D84] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#222] block">
                    {lang === 'th' ? '2. วันที่และเวลา' : '2. Date & Time'}
                  </span>
                  <span className="text-[11px] text-[#666]">
                    {t.includeItemDateTime}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#F0EAE3]">
                <MapPin className="w-4 h-4 text-[#E84D84] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#222] block">
                    {lang === 'th' ? '3. สาขาสตูดิโอ' : '3. Branch Location'}
                  </span>
                  <span className="text-[11px] text-[#666]">
                    {t.includeItemBranch}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#F0EAE3]">
                <Users className="w-4 h-4 text-[#E84D84] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#222] block">
                    {lang === 'th' ? '4. จำนวนผู้เข้าร่วม' : '4. Number of Guests'}
                  </span>
                  <span className="text-[11px] text-[#666]">
                    {t.includeItemGuests}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Example Message Preview */}
          <div className="p-3.5 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] space-y-1">
            <span className="text-[11px] font-bold text-[#E84D84] block">
              {t.exampleMessageTitle}
            </span>
            <p className="text-[11px] text-[#555] italic bg-white/70 p-2.5 rounded-xl border border-[#F4CDD8] leading-relaxed">
              "{t.exampleMessageBody}"
            </p>
          </div>
        </div>

        {/* Action Buttons: [ ยกเลิก ] [ 💬 ไปที่ LINE ] */}
        <div className="p-4 bg-[#FAF7F5] border-t border-[#F0E4E8] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-[#E0D7D0] bg-white hover:bg-black/5 text-[#555] text-xs font-semibold cursor-pointer transition-colors"
          >
            {t.cancelBtn}
          </button>
          <button
            id="modal-instructions-line-btn"
            type="button"
            onClick={handleGoToLine}
            className="px-5 py-2.5 rounded-2xl bg-[#E84D84] hover:bg-[#D43D73] active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.goToLineBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
