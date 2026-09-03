import React from 'react';
import { X, Calendar } from 'lucide-react';
import type { StudioInfo } from '../types';
import type { Language } from '../utils/translations';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  guide?: Partial<StudioInfo>;
}

export const defaultWelcomeGuideMessageTh = `Me.My.Mind Mindfulness Studio ยินดีต้อนรับค่ะ 🤍

ก่อนจองคิว ลองเช็คปฏิทินนี้ดูก่อนได้เลยค่ะ ว่าในวันที่สนใจ:

① ครูบีอยู่สาขาไหน
   ⚪ ขาว = นครสวรรค์  🩷 ชมพูอ่อน = ราชเทวี  🤎 น้ำตาล = ออนทัวร์  💜 ม่วง = ออนไลน์

② วันนั้นเปิดหรือปิดร้าน
   ⚫ สีดำ = ปิดร้าน  🔵 สีฟ้า = วันทำความสะอาดใหญ่ (Big Cleaning)

③ มีกิจกรรมกลุ่มแบบไหนบ้าง
   ⭐ ดาว = กิจกรรมไฮไลท์ประจำเดือน  🎥 กล้อง = กิจกรรมออนไลน์

④ คิววันนั้นเต็มหรือยัง
   🔴 วงกลมขอบแดง = เต็มแล้วนะคะ

ปฏิทินนี้โชว์แค่กิจกรรมกลุ่มเป็นหลักค่ะ ส่วนคิว Private บีไม่ได้ลงไว้ในนี้ทุกเคส เพื่อให้หน้าจอดูสบายตา ไม่รกเกินไป

พอทราบคร่าว ๆ แล้วว่าวันนั้นครูบีอยู่สาขาไหน ทักแชทมาถามคิว Private เพิ่มเติมได้เลยทาง LINE นะคะ 💬

รักและเคารพ
ครูบีเว่อร์ 🤍`;

export const defaultWelcomeGuideMessageEn = `Welcome to Me.My.Mind Mindfulness Studio 🤍

Before you book, feel free to browse this calendar to see, for your preferred date:

① Which branch Kru Bee will be at
   ⚪ White = Nakhonsawan  🩷 Pink = Ratchathewi  🤎 Brown = On-Tour  💜 Purple = Online

② Whether the studio is open or closed that day
   ⚫ Black = Closed  🔵 Blue = Big Cleaning day

③ What kind of group session is on offer
   ⭐ Star = Monthly featured event  🎥 Camera = Online session

④ Whether the day is already fully booked
   🔴 Red-ringed circle = Fully booked

This calendar focuses on group sessions — Private bookings aren't all listed here, simply to keep things clean and easy to read.

Once you've narrowed down which branch and date work for you, simply message us on LINE and we'll be happy to confirm availability for your Private session. 💬

With love and respect,
Kru Beever 🤍`;

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
  guide
}) => {
  if (!isOpen) return null;

  const t = (th?: string, en?: string) => (lang === 'th' ? th : en) || '';

  const message = lang === 'th'
    ? (guide?.welcomeGuideMessageTh || defaultWelcomeGuideMessageTh)
    : (guide?.welcomeGuideMessageEn || defaultWelcomeGuideMessageEn);

  return (
    <div
      id="welcome-guide-backdrop"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="welcome-guide-modal"
        className="bg-white rounded-[28px] sm:rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-[#E5DFD7] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs flex items-center justify-between px-5 py-4 border-b border-[#F0EEEA] rounded-t-[28px] sm:rounded-t-3xl z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FAF0F3] flex items-center justify-center text-[#E84D84]">
              <Calendar className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-bold text-[#2B2B2B]">
              {t('วิธีใช้ปฏิทิน', 'How to Use This Calendar')}
            </h3>
          </div>
          <button
            id="welcome-guide-close-x-btn"
            onClick={onClose}
            className="p-1.5 text-[#999] hover:text-[#333] hover:bg-[#F0EEEA]/60 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Displays message with whitespace-pre-line */}
        <div className="p-5 sm:p-6 text-[13px] sm:text-[13.5px] leading-relaxed text-[#3A3A3A] flex-1">
          <p className="whitespace-pre-line text-[#2B2B2B]">
            {message}
          </p>
        </div>

        {/* Footer Action Button */}
        <div className="p-5 pt-0">
          <button
            id="welcome-guide-got-it-btn"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-full bg-[#E84D84] text-white font-bold text-sm shadow-md hover:bg-[#D43D73] active:scale-[0.99] transition-all cursor-pointer text-center"
          >
            {t('เข้าใจแล้ว', 'Got it')}
          </button>
        </div>
      </div>
    </div>
  );
};
