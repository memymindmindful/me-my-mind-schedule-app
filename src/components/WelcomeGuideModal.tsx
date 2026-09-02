import React from 'react';
import { X, Calendar, Video } from 'lucide-react';
import type { StudioInfo } from '../types';
import type { Language } from '../utils/translations';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  guide?: Partial<StudioInfo>;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
  guide
}) => {
  if (!isOpen) return null;

  const t = (th?: string, en?: string) => (lang === 'th' ? th : en) || '';

  // Fallbacks if not provided
  const introTh = guide?.welcomeGuideIntroTh ?? 'Me.My.Mind Mindfulness Studio ยินดีให้บริการค่ะ\n\nสามารถใช้ปฏิทินนี้เพื่อเช็คดูเบื้องต้นว่า ในวันที่คุณต้องการจอง:';
  const introEn = guide?.welcomeGuideIntroEn ?? "Welcome to Me.My.Mind Mindfulness Studio!\n\nYou can use this calendar to check, for the date you'd like to book:";
  const item1Th = guide?.welcomeGuideItem1Th ?? 'ครูบีอยู่จังหวัดไหน?';
  const item1En = guide?.welcomeGuideItem1En ?? 'Which branch/location Kru Bee is at';
  const item2Th = guide?.welcomeGuideItem2Th ?? 'เปิดหรือปิดร้าน?';
  const item2En = guide?.welcomeGuideItem2En ?? 'Whether the studio is open or closed';
  const item3Th = guide?.welcomeGuideItem3Th ?? 'มีกิจกรรมแบบกลุ่มให้เข้าร่วมไหม ออนไลน์ หรือ ออนไซต์?';
  const item3En = guide?.welcomeGuideItem3En ?? "Whether there's a group activity to join — online or on-site";
  const item4Th = guide?.welcomeGuideItem4Th ?? 'คิววันนั้นเต็มหรือยัง?';
  const item4En = guide?.welcomeGuideItem4En ?? "Whether that day's queue is already full";
  const outroTh = guide?.welcomeGuideOutroTh ?? 'ปฏิทินนี้ใช้ดูกิจกรรมกลุ่มเป็นหลักค่ะ บีไม่ได้อัพเดททุกการจองเคส Private ไว้ในนี้ เพื่อให้ดูสบายตา\n\nสำหรับลูกค้า Private เมื่อพอทราบวันที่อยู่สาขานั้นคร่าว ๆ แล้ว ทักแชทมาสอบถามคิวได้อีกทีใน Line นะคะ\n\nรักและเคารพ\nครูบีเว่อร์';
  const outroEn = guide?.welcomeGuideOutroEn ?? "This calendar mainly shows group activities. Bee doesn't list every Private booking here, to keep it easy to read.\n\nFor Private bookings — once you have a rough idea of the date/branch, please message us on LINE to check availability.\n\nWith love and respect,\nKru Beever";

  return (
    <div
      id="welcome-guide-backdrop"
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="welcome-guide-modal"
        className="bg-white rounded-[28px] sm:rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-[#E5DFD7] flex flex-col"
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-[13px] sm:text-[13.5px] leading-relaxed text-[#3A3A3A] flex-1">
          {/* Intro */}
          <p className="whitespace-pre-line text-[#2B2B2B] font-medium leading-relaxed">
            {t(introTh, introEn)}
          </p>

          {/* Icon Guide Items Container */}
          <div className="bg-[#FAF9F6] rounded-2xl p-3.5 space-y-3.5 border border-[#EFE9E2]">
            {/* Item 1: Branch Locations (3 Real colored circles: Nakhonsawan, Ratchathewi, On-Tour) */}
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                {/* Nakhonsawan - White with border */}
                <span
                  className="w-3.5 h-3.5 rounded-full bg-white border border-[#D5CEC7] shadow-2xs inline-block"
                  title="นครสวรรค์ / Nakhonsawan"
                />
                {/* Ratchathewi - Pink */}
                <span
                  className="w-3.5 h-3.5 rounded-full bg-[#FCE3EB] shadow-2xs inline-block"
                  title="ราชเทวี / Ratchathewi"
                />
                {/* On-Tour - Brown */}
                <span
                  className="w-3.5 h-3.5 rounded-full bg-[#9E674F] shadow-2xs inline-block"
                  title="ออนทัวร์ / On-Tour"
                />
              </div>
              <p className="flex-1 font-normal text-[#333]">
                {t(item1Th, item1En)}
              </p>
            </div>

            {/* Item 2: Open/Closed (2 Real colors: Closed dark, Big Cleaning sky blue) */}
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                {/* Closed - #1E1E1E */}
                <span
                  className="w-3.5 h-3.5 rounded-full bg-[#1E1E1E] shadow-2xs inline-block"
                  title="ปิดร้าน / Closed"
                />
                {/* Big Cleaning - Sky blue */}
                <span
                  className="w-3.5 h-3.5 rounded-full bg-[#BAE6FD] border border-[#7DD3FC] shadow-2xs inline-block"
                  title="Big Cleaning"
                />
              </div>
              <p className="flex-1 font-normal text-[#333]">
                {t(item2Th, item2En)}
              </p>
            </div>

            {/* Item 3: Special Featured Star & Online Video Badge */}
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                {/* EXACT Special Star SVG from CalendarMonthView.tsx */}
                <div className="w-5 h-5 flex items-center justify-center transform rotate-6 scale-105" title="Special Event Star">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    className="drop-shadow-[0_2px_4px_rgba(217,130,0,0.45)]"
                  >
                    <defs>
                      <linearGradient id="goldGrad-welcome-guide" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF275" />
                        <stop offset="50%" stopColor="#FDB827" />
                        <stop offset="100%" stopColor="#EA8F00" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 2.5l2.75 5.85 6.45.68-4.8 4.38 1.35 6.34L12 16.5l-5.75 3.25 1.35-6.34-4.8-4.38 6.45-.68L12 2.5z"
                      fill="url(#goldGrad-welcome-guide)"
                      stroke="#C97500"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 4.5l1.6 3.6 4 .4-3 2.7.9 4-3.5-2V4.5z"
                      fill="#FFFFFF"
                      opacity="0.35"
                    />
                  </svg>
                </div>

                {/* Online Video Icon in #8A6FAE rounded badge */}
                <div
                  className="w-4 h-4 rounded-full bg-[#8A6FAE] flex items-center justify-center shadow-xs border border-white"
                  title="Online Event"
                >
                  <Video className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <p className="flex-1 font-normal text-[#333]">
                {t(item3Th, item3En)}
              </p>
            </div>

            {/* Item 4: Fully Booked Ring */}
            <div className="flex items-start gap-3">
              <div className="flex items-center pt-0.5 shrink-0">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-[#D92D4B] ring-offset-1 bg-white inline-block shadow-2xs"
                  title="เต็มแล้ว / Fully Booked"
                />
              </div>
              <p className="flex-1 font-normal text-[#333]">
                {t(item4Th, item4En)}
              </p>
            </div>
          </div>

          {/* Outro */}
          <p className="whitespace-pre-line pt-2 text-[#555] text-[12.5px] leading-relaxed">
            {t(outroTh, outroEn)}
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
