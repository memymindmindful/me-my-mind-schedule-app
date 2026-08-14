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
 * Generate LINE pre-filled message for Event-Specific BOOK NOW (with user details)
 */
export function getEventBookingMessage(
  lang: Language,
  event: ScheduleEvent,
  guestsCount: number = 1,
  specialNotes?: string,
  clientName?: string,
  clientPhone?: string,
  clientLineId?: string
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
  const isFree = Boolean(event.isFree || event.priceThb === 0);
  const priceDisplayTh = isFree ? 'ฟรี (ไม่มีค่าใช้จ่าย / FREE)' : `฿${event.priceThb.toLocaleString()} THB`;
  const priceDisplayEn = isFree ? 'Free (No charge)' : `฿${event.priceThb.toLocaleString()} THB`;

  const nameTh = clientName?.trim() ? clientName.trim() : '-';
  const nameEn = clientName?.trim() ? clientName.trim() : '-';
  const phoneTh = clientPhone?.trim() ? clientPhone.trim() : '-';
  const phoneEn = clientPhone?.trim() ? clientPhone.trim() : '-';
  const lineIdTh = clientLineId?.trim() ? clientLineId.trim() : '-';
  const lineIdEn = clientLineId?.trim() ? clientLineId.trim() : '-';

  if (lang === 'th') {
    let msg = `สวัสดีครับ/ค่ะ Kru Beever 🙏\n\nฉันอยากจองคลาสต่อไปนี้:\n\n✨ ${eventName}\n📅 ${dateFormattedTh} (${dayOfWeekTh})\n⏰ ${event.startTime} - ${event.endTime}\n💰 ${priceDisplayTh}\n📍 ${event.locationDetails || branchName}\n👥 Available: ${event.bookedCount}/${event.capacity}\n\n`;
    
    if (clientName?.trim() || clientPhone?.trim()) {
      msg += `👤 ชื่อผู้จอง: ${nameTh}\n📱 เบอร์โทรศัพท์: ${phoneTh}\n💬 LINE ID: ${lineIdTh}\n👥 จำนวนคน: ${guestsCount} คน\n📝 หมายเหตุ: ${notesTextTh}\n\n`;
    } else {
      msg += `👥 อยากจองให้ฉัน ${guestsCount} คน\n📝 หมายเหตุ: ${notesTextTh}\n\n`;
    }

    msg += `ช่วยยืนยันการจองให้ฉันได้ไหมครับ/ค่ะ 🙏`;
    return msg;
  }

  let msg = `Hello Kru Beever 🙏\n\nI'd like to book the following class:\n\n✨ ${eventName}\n📅 ${dateFormattedEn} (${dayOfWeekEn})\n⏰ ${event.startTime} - ${event.endTime}\n💰 ${priceDisplayEn}\n📍 ${event.locationDetails || branchName}\n👥 Available: ${event.bookedCount}/${event.capacity}\n\n`;

  if (clientName?.trim() || clientPhone?.trim()) {
    msg += `👤 Name: ${nameEn}\n📱 Phone: ${phoneEn}\n💬 LINE ID: ${lineIdEn}\n👥 Guests: ${guestsCount} people\n📝 Special notes: ${notesTextEn}\n\n`;
  } else {
    msg += `👥 I'd like to book for ${guestsCount} people\n📝 Special notes: ${notesTextEn}\n\n`;
  }

  msg += `Can you please confirm my booking? 🙏`;
  return msg;
}

/**
 * Helper to open LINE Official Account with EMPTY message (for generic booking inquiry where user types own details)
 */
export function openLineWithEmptyMessage(): boolean {
  // Direct LINE OA link without text parameter
  const lineUrl = `https://line.me/R/ti/p/@me.my.mind.mindful`;

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

/**
 * Helper to open LINE Official Account with pre-filled message (for event-specific booking)
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
