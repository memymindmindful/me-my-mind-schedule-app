import { ScheduleEvent } from '../types';
import { Language } from './translations';
import { BRANCH_INFO } from '../data/scheduleData';

/**
 * Generate LINE pre-filled message for Button 1: Generic BOOK NOW (from Main Page)
 */
export function getGenericBookingMessage(lang: Language): string {
  if (lang === 'th') {
    return `สวัสดีครับ/ค่ะ Kru Beever 🙏

ฉันสนใจจองคลาสของ Me.My.Mind Mindfulness Studio

กรุณาแจ้ง:
✨ โปรแกรมที่ต้องการทำ:
📅 วันและเวลาที่สะดวก:
🏢 สาขา:
👥 จำนวนคน:

ขอบคุณครับ/ค่ะ 🙏`;
  }

  return `Hello Kru Beever 🙏

I'm interested in booking classes at Me.My.Mind Mindfulness Studio

Details Below:
✨ Interested program:
📅 Preferred date and time:
🏢 Branch location:
👥 Number of people:

Thank you 🙏`;
}

/**
 * Generate LINE pre-filled message for Button 2: Event-Specific BOOK NOW (inside Event Modal)
 */
export function getEventBookingMessage(
  lang: Language,
  event: ScheduleEvent,
  guestsCount: number = 1,
  specialNotes?: string
): string {
  const branchData = BRANCH_INFO[event.branch];
  const branchName = lang === 'th' ? branchData?.nameTh || event.branch : branchData?.name || event.branch;
  const eventName = lang === 'en' && event.englishName ? event.englishName : event.name;

  // Format date display (e.g., "04 เมษายน 2026" or "April 04, 2026")
  const dateObj = new Date(event.dateStr);
  const dayOfWeekIndex = !isNaN(dateObj.getTime()) ? dateObj.getDay() : 0;
  
  const thWeekdays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const enWeekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const thMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let dateFormattedTh = event.dateDisplay;
  let dateFormattedEn = event.dateDisplay;
  const dayOfWeekTh = thWeekdays[dayOfWeekIndex];
  const dayOfWeekEn = enWeekdays[dayOfWeekIndex];

  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthTh = thMonths[dateObj.getMonth()];
    const monthEn = enMonths[dateObj.getMonth()];
    const yearTh = dateObj.getFullYear();
    const yearEn = dateObj.getFullYear();
    
    dateFormattedTh = `${day} ${monthTh} ${yearTh}`;
    dateFormattedEn = `${monthEn} ${day}, ${yearEn}`;
  }

  const notesTextTh = specialNotes?.trim() ? specialNotes.trim() : '-';
  const notesTextEn = specialNotes?.trim() ? specialNotes.trim() : '-';
  const priceFormatted = event.priceThb.toLocaleString();

  if (lang === 'th') {
    return `สวัสดีครับ/ค่ะ Kru Beever 🙏

ฉันอยากจองคลาสต่อไปนี้:

✨ ${eventName}
📅 ${dateFormattedTh} (${dayOfWeekTh})
⏰ ${event.startTime} - ${event.endTime}
💰 ฿${priceFormatted} THB
📍 ${event.locationDetails || branchName}
👥 Available: ${event.bookedCount}/${event.capacity}

อยากจองให้ฉัน ${guestsCount} คน
หมายเหตุ: ${notesTextTh}

ช่วยยืนยันการจองให้ฉันได้ไหมครับ/ค่ะ 🙏`;
  }

  return `Hello Kru Beever 🙏

I'd like to book the following class:

✨ ${eventName}
📅 ${dateFormattedEn} (${dayOfWeekEn})
⏰ ${event.startTime} - ${event.endTime}
💰 ฿${priceFormatted} THB
📍 ${event.locationDetails || branchName}
👥 Available: ${event.bookedCount}/${event.capacity}

I'd like to book for ${guestsCount} people
Special notes: ${notesTextEn}

Can you please confirm my booking? 🙏`;
}

/**
 * Helper to open LINE Official Account with pre-filled message
 */
export function openLineWithMessage(message: string): boolean {
  const encodedMsg = encodeURIComponent(message);
  const lineUrl = `https://line.me/R/oaMessage/@me.my.mind.mindful/?text=${encodedMsg}`;

  try {
    const newWindow = window.open(lineUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = lineUrl;
    }
    return true;
  } catch {
    window.location.href = lineUrl;
    return true;
  }
}
