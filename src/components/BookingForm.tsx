import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  MessageCircle, 
  Users, 
  FileText, 
  ArrowLeft, 
  Send, 
  Calendar, 
  Clock, 
  MapPin,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ScheduleEvent } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';
import { BRANCH_INFO } from '../data/scheduleData';

export interface BookingFormData {
  clientName: string;
  clientPhone: string;
  clientLineId?: string;
  guestCount: number;
  specialNotes: string;
  language: Language;
}

interface BookingFormProps {
  event: ScheduleEvent;
  bookingData: BookingFormData;
  onBookingDataChange: (data: BookingFormData) => void;
  onSendToLine: () => void;
  onCancel: () => void;
  lang: Language;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  event,
  bookingData,
  onBookingDataChange,
  onSendToLine,
  onCancel,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const branchData = BRANCH_INFO[event.branch];
  const branchName = lang === 'th' ? branchData?.nameTh || event.branch : branchData?.name || event.branch;
  const displayName = lang === 'en' && event.englishName ? event.englishName : event.name;

  const isEventFree = Boolean(event.isFree || event.priceThb === 0);
  const totalAmount = isEventFree ? 0 : event.priceThb * bookingData.guestCount;
  const spotsLeft = Math.max(0, event.capacity - event.bookedCount);
  const maxSelectableGuests = Math.min(Math.max(1, spotsLeft), 8);

  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.clientName.trim()) {
      setErrorMsg(lang === 'th' ? 'กรุณาระบุชื่อผู้จอง' : 'Please enter your name');
      return;
    }
    if (!bookingData.clientPhone.trim()) {
      setErrorMsg(lang === 'th' ? 'กรุณาระบุเบอร์โทรศัพท์สำหรับติดต่อ' : 'Please enter your phone number');
      return;
    }
    setErrorMsg(null);
    onSendToLine();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
      {/* Event Summary Pill */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF0F3] to-[#FDF5F8] border border-[#F8DDE5] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
            style={{ backgroundColor: event.branch === 'On-Tour' ? '#9E674F' : '#E84D84' }}
          >
            <MapPin className="w-2.5 h-2.5" />
            <span>{branchName}</span>
          </span>
          <span className="text-[10px] text-[#888] font-mono">
            {event.dateDisplay} ({event.startTime})
          </span>
        </div>

        <h4 className="font-bold text-sm text-[#1E1E1E] leading-tight">
          {displayName}
        </h4>

        <div className="flex items-center justify-between pt-1 border-t border-[#F3CDD8] text-xs">
          <span className="text-[#666] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#E84D84]" />
            <span>{bookingData.guestCount} {t.guestCountUnit}</span>
          </span>
          <span className="font-bold font-mono">
            {isEventFree ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {lang === 'th' ? 'ฟรี (FREE)' : 'FREE'}
              </span>
            ) : (
              <span className="text-[#E84D84]">
                ฿{totalAmount.toLocaleString()} THB
              </span>
            )}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-3">
        {/* Client Name */}
        <div>
          <label className="block text-xs font-bold text-[#444] mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#E84D84]" />
              <span>{lang === 'th' ? 'ชื่อผู้จอง' : 'Booking Name'}</span>
              <span className="text-rose-500">*</span>
            </span>
          </label>
          <input
            type="text"
            required
            value={bookingData.clientName}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            onChange={(e) => {
              setErrorMsg(null);
              onBookingDataChange({ ...bookingData, clientName: e.target.value });
            }}
            placeholder={lang === 'th' ? 'เช่น คุณสุภาพร ว.' : 'e.g. Supaporn V.'}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] focus:ring-2 focus:ring-[#E84D84]/15 outline-none text-xs bg-white text-[#1E1E1E] transition-all"
          />
        </div>

        {/* Phone Number & LINE ID in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-[#444] mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#E84D84]" />
              <span>{lang === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'}</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={bookingData.clientPhone}
              onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
              onChange={(e) => {
                setErrorMsg(null);
                onBookingDataChange({ ...bookingData, clientPhone: e.target.value });
              }}
              placeholder="081-xxx-xxxx"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] focus:ring-2 focus:ring-[#E84D84]/15 outline-none text-xs bg-white text-[#1E1E1E] transition-all"
            />
          </div>

          {/* LINE ID (Optional) */}
          <div>
            <label className="block text-xs font-bold text-[#444] mb-1 flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-[#06C755]" />
              <span>{lang === 'th' ? 'LINE ID (ถ้ามี)' : 'LINE ID (Optional)'}</span>
            </label>
            <input
              type="text"
              value={bookingData.clientLineId || ''}
              onChange={(e) => onBookingDataChange({ ...bookingData, clientLineId: e.target.value })}
              placeholder="@yourlineid"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] focus:ring-2 focus:ring-[#E84D84]/15 outline-none text-xs bg-white text-[#1E1E1E] transition-all"
            />
          </div>
        </div>

        {/* Number of Guests */}
        <div>
          <label className="block text-xs font-bold text-[#444] mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#E84D84]" />
              <span>{lang === 'th' ? 'จำนวนคน' : 'Number of Guests'}</span>
            </span>
            <span className="text-[11px] text-[#888]">
              {lang === 'th' ? `ว่าง ${spotsLeft} ที่นั่ง` : `${spotsLeft} seats left`}
            </span>
          </label>
          <select
            value={bookingData.guestCount}
            onChange={(e) => onBookingDataChange({ ...bookingData, guestCount: Number(e.target.value) })}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] focus:ring-2 focus:ring-[#E84D84]/15 outline-none text-xs bg-white text-[#1E1E1E] transition-all cursor-pointer font-sans"
          >
            {Array.from({ length: maxSelectableGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {t.guestCountUnit} {isEventFree ? (lang === 'th' ? '(ฟรี)' : '(Free)') : `— ฿${(event.priceThb * n).toLocaleString()} THB`}
              </option>
            ))}
          </select>
        </div>

        {/* Special Notes */}
        <div>
          <label className="block text-xs font-bold text-[#444] mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#888]" />
            <span>{lang === 'th' ? 'หมายเหตุพิเศษ (ถ้ามี)' : 'Special Notes (Optional)'}</span>
          </label>
          <textarea
            rows={2}
            value={bookingData.specialNotes}
            onChange={(e) => onBookingDataChange({ ...bookingData, specialNotes: e.target.value })}
            placeholder={lang === 'th' ? 'เช่น มีปัญหากระดูกสันหลัง, สตรีมีครรภ์, หรือข้อสอบถามเพิ่มเติม' : 'e.g. Health conditions, pregnancy, or special requests'}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E0D7D0] focus:border-[#E84D84] focus:ring-2 focus:ring-[#E84D84]/15 outline-none text-xs resize-none bg-white text-[#1E1E1E] transition-all"
          />
        </div>
      </div>

      {/* Info helper */}
      <div className="p-2.5 rounded-xl bg-[#FAF7F5] border border-[#EFE8E1] flex items-start gap-2 text-[11px] text-[#666]">
        <Sparkles className="w-3.5 h-3.5 text-[#E84D84] flex-shrink-0 mt-0.5" />
        <span>
          {lang === 'th' 
            ? 'เมื่อกดปุ่มด้านล่าง ระบบจะเปิด LINE Official ของสตูดิโอ พร้อมข้อความสรุปรายละเอียดการจองให้คุณส่งยืนยันได้ทันที'
            : 'Clicking below will open our LINE Official Account with your booking summary ready to send and confirm instantly.'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-2xl border border-[#DDD] hover:bg-black/5 font-bold text-xs text-[#555] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'th' ? 'ย้อนกลับ' : 'Back'}</span>
        </button>

        <button
          type="submit"
          className="flex-2 py-3 px-4 rounded-2xl bg-[#E84D84] hover:bg-[#D43D73] active:scale-[0.98] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{lang === 'th' ? '💬 ส่งไปที่ LINE' : '💬 Send to LINE'}</span>
        </button>
      </div>
    </form>
  );
};
