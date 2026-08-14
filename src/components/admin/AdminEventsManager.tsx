import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Sparkles, 
  Check, 
  X,
  Search,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  RotateCcw,
  Tag,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { ScheduleEvent, OfferingCategory, BranchLocation } from '../../types';
import { loadMonthEvents, saveMonthEvents, resetMonthEvents } from '../../utils/adminStorage';
import { TRANSLATIONS } from '../../utils/translations';
import { FACILITATOR_BEEVER } from '../../data/scheduleData';

interface AdminEventsManagerProps {
  currentYear: number;
  currentMonth: number;
  onDataChanged: () => void;
}

const DEFAULT_EVENT_FORM: Partial<ScheduleEvent> = {
  name: '',
  englishName: '',
  subtitle: '',
  category: 'Sound Healing / Sound Baths',
  branch: 'Ratchathewi',
  locationDetails: 'สาขาราชเทวี (ชั้น 5 อาคารพญาไทพลาซ่า ติด BTS พญาไท)',
  timeDisplay: '9 am',
  startTime: '09:00 AM',
  endTime: '10:30 AM',
  durationMinutes: 90,
  priceThb: 950,
  capacity: 12,
  bookedCount: 0,
  level: 'All Levels',
  description: '',
  benefits: ['คืนสมดุลให้ร่างกายและจิตใจ', 'ผ่อนคลายกล้ามเนื้อและระบบประสาท', 'คลายความตึงเครียดสะสม'],
  sensoryNotes: ['Tibetan Singing Bowls', 'Organic Herbal Tea', 'Essential Oil Mist'],
  preparationTips: ['สวมใส่ชุดหลวมสบาย ไม่รัดแน่น'],
  isSpecialStar: false,
  isFeatured: true,
  adminNote: '',
  status: 'available'
};

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({
  currentYear,
  currentMonth,
  onDataChanged
}) => {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthStr = String(currentMonth + 1).padStart(2, '0');
  const monthName = TRANSLATIONS.th.monthNames[currentMonth];

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ScheduleEvent>>(DEFAULT_EVENT_FORM);
  const [formDayNum, setFormDayNum] = useState<number>(4);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    const loaded = loadMonthEvents(currentYear, currentMonth);
    setEvents(loaded);
  }, [currentYear, currentMonth]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open modal for NEW event
  const handleOpenCreateModal = (day = 1) => {
    setEditingEventId(null);
    setFormDayNum(day);
    setFormData({
      ...DEFAULT_EVENT_FORM,
      dateStr: `${currentYear}-${monthStr}-${String(day).padStart(2, '0')}`,
      dateDisplay: `${String(day).padStart(2, '0')}.${monthStr}`
    });
    setIsEditingModalOpen(true);
  };

  // Open modal for EDIT event
  const handleOpenEditModal = (evt: ScheduleEvent) => {
    setEditingEventId(evt.id);
    const day = Number(evt.dateStr.split('-')[2]) || 1;
    setFormDayNum(day);
    setFormData({ ...evt });
    setIsEditingModalOpen(true);
  };

  // Quick toggle Fully Booked from card
  const handleQuickToggleFullyBooked = (evt: ScheduleEvent) => {
    const isCurrentlyFull = evt.status === 'fully_booked' || evt.bookedCount >= evt.capacity;
    const newStatus = isCurrentlyFull ? 'available' : 'fully_booked';
    const newBookedCount = isCurrentlyFull ? Math.max(0, evt.capacity - 4) : evt.capacity;

    const updated = events.map(e => {
      if (e.id === evt.id) {
        return {
          ...e,
          status: newStatus,
          bookedCount: newBookedCount
        };
      }
      return e;
    });

    setEvents(updated);
    saveMonthEvents(currentYear, currentMonth, updated);
    onDataChanged();
    showToast(isCurrentlyFull ? `ปลดล็อคที่นั่ง "${evt.name}" เป็นเปิดรับสมัครแล้ว` : `ปรับ "${evt.name}" เป็น Fully Booked (เต็มแล้ว)`);
  };

  // Quick update booked count (+ / -)
  const handleQuickUpdateBookedCount = (evt: ScheduleEvent, delta: number) => {
    const newCount = Math.max(0, Math.min(evt.capacity, (evt.bookedCount || 0) + delta));
    const newStatus = newCount >= evt.capacity ? 'fully_booked' : newCount >= evt.capacity - 2 ? 'almost_full' : 'available';

    const updated = events.map(e => {
      if (e.id === evt.id) {
        return {
          ...e,
          bookedCount: newCount,
          status: newStatus
        };
      }
      return e;
    });

    setEvents(updated);
    saveMonthEvents(currentYear, currentMonth, updated);
    onDataChanged();
  };

  // Duplicate Event
  const handleDuplicateEvent = (evt: ScheduleEvent) => {
    const targetDay = Math.min(daysInMonth, (Number(evt.dateStr.split('-')[2]) || 1) + 1);
    const targetDayStr = String(targetDay).padStart(2, '0');
    const newEvent: ScheduleEvent = {
      ...evt,
      id: `evt-${Date.now()}`,
      name: `${evt.name} (คัดลอก)`,
      dateStr: `${currentYear}-${monthStr}-${targetDayStr}`,
      dateDisplay: `${targetDayStr}.${monthStr}`,
      bookedCount: 0,
      status: 'available'
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    saveMonthEvents(currentYear, currentMonth, updated);
    onDataChanged();
    showToast(`คัดลอกอีเวนท์ "${evt.name}" ไปยังวันที่ ${targetDayStr}.${monthStr} เรียบร้อยแล้ว`);
  };

  // Delete Event
  const handleDeleteEvent = (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบอีเวนท์ "${name}" ใช่หรือไม่?`)) return;
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveMonthEvents(currentYear, currentMonth, updated);
    onDataChanged();
    showToast(`ลบอีเวนท์ "${name}" เรียบร้อยแล้ว`);
  };

  // Reset Month Events
  const handleResetMonth = (emptyOnly: boolean) => {
    const confirmMsg = emptyOnly 
      ? `ต้องการล้างข้อมูลอีเวนท์ทั้งหมดในเดือน ${monthName} ${currentYear} ให้เป็นตารางว่าง (0 อีเวนท์) เพื่อเตรียมใส่ข้อมูลจริงใช่หรือไม่?`
      : `ต้องการรีเซ็ตอีเวนท์ในเดือน ${monthName} กลับเป็นข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?`;
    
    if (!window.confirm(confirmMsg)) return;

    const resetResult = resetMonthEvents(currentYear, currentMonth, emptyOnly);
    setEvents(resetResult);
    onDataChanged();
    showToast(emptyOnly ? `ล้างข้อมูลอีเวนท์เดือน ${monthName} เรียบร้อยแล้ว (0 รายการ)` : `โหลดตัวอย่างอีเวนท์เดือน ${monthName} เรียบร้อยแล้ว`);
  };

  // Save Event from Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('กรุณากรอกชื่อกิจกรรม');
      return;
    }

    const dayStr = String(formDayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    const dateDisplay = `${dayStr}.${monthStr}`;

    const capacity = Number(formData.capacity) || 10;
    const bookedCount = Number(formData.bookedCount) || 0;
    const isFullyBooked = formData.status === 'fully_booked' || bookedCount >= capacity;
    const status = isFullyBooked ? 'fully_booked' : bookedCount >= capacity - 2 ? 'almost_full' : 'available';

    const completeEvent: ScheduleEvent = {
      id: editingEventId || `evt-${Date.now()}`,
      name: formData.name.trim(),
      englishName: formData.englishName?.trim() || formData.name.trim(),
      subtitle: formData.subtitle?.trim() || '',
      category: (formData.category as OfferingCategory) || 'Workshops & Training',
      branch: (formData.branch as BranchLocation) || 'Ratchathewi',
      locationDetails: formData.locationDetails?.trim() || '',
      dateStr,
      dateDisplay,
      timeDisplay: formData.timeDisplay?.trim() || '9 am',
      startTime: formData.startTime || '09:00 AM',
      endTime: formData.endTime || '10:30 AM',
      durationMinutes: Number(formData.durationMinutes) || 90,
      facilitator: formData.facilitator || FACILITATOR_BEEVER,
      priceThb: Number(formData.priceThb) || 0,
      capacity,
      bookedCount: isFullyBooked && bookedCount < capacity ? capacity : bookedCount,
      level: formData.level || 'All Levels',
      sensoryNotes: formData.sensoryNotes && formData.sensoryNotes.length > 0 
        ? formData.sensoryNotes 
        : ['Tibetan Sound Bath', 'Organic Hydrosol'],
      description: formData.description?.trim() || 'รายละเอียดคลาสและศาสตร์การดูแลบำบัด',
      benefits: formData.benefits && formData.benefits.length > 0 
        ? formData.benefits 
        : ['ผ่อนคลายลึก', 'คืนสมดุลพลังงาน'],
      preparationTips: formData.preparationTips && formData.preparationTips.length > 0 
        ? formData.preparationTips 
        : ['สวมชุดหลวมสบาย'],
      posterUrl: formData.posterUrl,
      posterTag: formData.posterTag,
      isSpecialStar: !!formData.isSpecialStar,
      isFeatured: formData.isFeatured !== false,
      adminNote: formData.adminNote?.trim() || '',
      status
    };

    let updated: ScheduleEvent[];
    if (editingEventId) {
      updated = events.map(e => e.id === editingEventId ? completeEvent : e);
      showToast(`อัปเดตอีเวนท์ "${completeEvent.name}" สำเร็จ!`);
    } else {
      updated = [completeEvent, ...events];
      showToast(`เพิ่มอีเวนท์ "${completeEvent.name}" เรียบร้อยแล้ว!`);
    }

    // Sort by date
    updated.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    setEvents(updated);
    saveMonthEvents(currentYear, currentMonth, updated);
    onDataChanged();
    setIsEditingModalOpen(false);
  };

  const filteredEvents = events.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || 
           e.englishName?.toLowerCase().includes(q) ||
           e.branch.toLowerCase().includes(q) ||
           e.adminNote?.toLowerCase().includes(q) ||
           e.dateDisplay.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5DFD7] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E84D84]" />
            <span>จัดการอีเวนท์พิเศษ & กิจกรรม (Events & Workshops)</span>
          </h2>
          <p className="text-xs text-[#777] mt-0.5">
            อัปเดตสถานะ Fully Booked, จำนวนผู้สมัคร, โน้ตย่อ และ Duplicate อีเวนท์ได้อิสระ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reset Month Events (Clear all to start fresh) */}
          <button
            type="button"
            onClick={() => handleResetMonth(true)}
            className="px-3 py-2 bg-[#FAF8F5] hover:bg-rose-50 text-[#666] hover:text-rose-600 border border-[#E5DFD7] hover:border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={`ล้างอีเวนท์เดือน ${monthName} ให้เป็นตารางว่าง เพื่อเตรียมลงข้อมูลจริง`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างอีเวนท์เดือนนี้ (ตารางว่าง)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal(1)}
            className="px-4 py-2 bg-[#E84D84] hover:bg-[#D43D73] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#E84D84]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มอีเวนท์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5DFD7] shadow-xs text-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่ออีเวนท์, วันที่, สาขา, โน้ต..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
          />
          <Search className="w-4 h-4 text-[#999] absolute left-3 top-2.5" />
        </div>

        <div className="text-[11px] text-[#777] flex items-center gap-3">
          <span>รวม <strong className="text-[#1E1E1E]">{events.length}</strong> กิจกรรมในเดือน {monthName}</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">
            เปิดรับ: {events.filter(e => e.status !== 'fully_booked' && e.bookedCount < e.capacity).length}
          </span>
          <span>•</span>
          <span className="text-rose-600 font-semibold">
            Fully Booked: {events.filter(e => e.status === 'fully_booked' || e.bookedCount >= e.capacity).length}
          </span>
        </div>
      </div>

      {/* Events Table / Card List */}
      <div className="bg-white rounded-3xl border border-[#E5DFD7] shadow-xs overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#777] space-y-3">
            <p className="text-sm font-semibold text-[#444]">ยังไม่มีรายการอีเวนท์ในเดือน {monthName} {currentYear}</p>
            <p className="text-[11px] text-[#888]">สามารถกดปุ่ม "เพิ่มอีเวนท์ใหม่" เพื่อเริ่มสร้างกิจกรรมจริง หรือโหลดตัวอย่างได้</p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreateModal(1)}
                className="px-4 py-2 bg-[#E84D84] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สร้างอีเวนท์แรกของเดือน</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetMonth(false)}
                className="px-3.5 py-2 bg-[#FAF8F5] text-[#666] border border-[#E5DFD7] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#888]" />
                <span>โหลดตัวอย่างอีเวนท์</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#EFE8E1]">
            {filteredEvents.map((evt) => {
              const isFull = evt.status === 'fully_booked' || evt.bookedCount >= evt.capacity;

              return (
                <div 
                  key={evt.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isFull ? 'bg-[#FCF9F9]/80' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  {/* Left: Date Badge & Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#E84D84] font-mono">{evt.dateDisplay}</span>
                      <span className="text-[10px] text-[#888] font-mono">{evt.timeDisplay}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-[#1E1E1E]">
                          {evt.name}
                        </h4>
                        
                        {/* Special Star */}
                        {evt.isSpecialStar && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF4D4] text-[#B27B00] border border-[#FEE180] text-[10px] font-bold flex items-center gap-1">
                            ★ ไฮไลท์
                          </span>
                        )}

                        {/* Branch Tag */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          evt.branch === 'Ratchathewi' 
                            ? 'bg-[#FCE3EB] text-[#A82B5A]' 
                            : evt.branch === 'On-Tour'
                            ? 'bg-[#9E674F] text-white'
                            : 'bg-[#EDE7E1] text-[#555]'
                        }`}>
                          {evt.branch === 'Ratchathewi' ? 'ราชเทวี' : evt.branch === 'On-Tour' ? 'ออนทัวร์' : 'นครสวรรค์'}
                        </span>

                        {/* Fully Booked Status Badge */}
                        {isFull ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                            <span>Fully Booked (เต็มแล้ว)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                            <span>เปิดรับสมัคร</span>
                          </span>
                        )}

                        {/* Short Admin Note */}
                        {evt.adminNote && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF0F3] text-[#A82B5A] border border-[#F8DDE5] text-[10px] font-medium flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{evt.adminNote}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#666] line-clamp-1">
                        {evt.englishName}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#888] pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#E84D84]" />
                          <span>{evt.startTime} - {evt.endTime} ({evt.durationMinutes} นาที)</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[#1E1E1E] font-semibold">
                          ฿{evt.priceThb.toLocaleString()}
                        </span>
                        <span>•</span>
                        
                        {/* Booked Count Interactive Control */}
                        <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E5DFD7]">
                          <span className="text-[#555]">ผู้สมัคร:</span>
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateBookedCount(evt, -1)}
                            className="w-4 h-4 rounded bg-white hover:bg-black/5 text-[#666] flex items-center justify-center font-bold text-xs border border-[#DDD] cursor-pointer"
                            title="ลดจำนวน 1 คน"
                          >
                            -
                          </button>
                          <span className="font-bold font-mono text-[#1E1E1E] px-1">
                            {evt.bookedCount} / {evt.capacity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateBookedCount(evt, 1)}
                            className="w-4 h-4 rounded bg-white hover:bg-black/5 text-[#666] flex items-center justify-center font-bold text-xs border border-[#DDD] cursor-pointer"
                            title="เพิ่มจำนวน 1 คน"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {/* Quick Toggle Fully Booked Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickToggleFullyBooked(evt)}
                      title={isFull ? 'เปลี่ยนเป็นเปิดรับสมัคร' : 'เปลี่ยนสถานะเป็นเต็มแล้ว (Fully Booked)'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isFull 
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                          : 'bg-[#FAF7F5] hover:bg-rose-50 text-[#555] hover:text-rose-700 border-[#E5DFD7] hover:border-rose-200'
                      }`}
                    >
                      {isFull ? <XCircle className="w-3.5 h-3.5 text-rose-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#888]" />}
                      <span>{isFull ? 'ปลดล็อค (ว่าง)' : 'เต็มแล้ว'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateEvent(evt)}
                      title="คัดลอกอีเวนท์นี้ (Duplicate)"
                      className="px-3 py-1.5 bg-[#FAF7F5] hover:bg-[#F2ECE4] border border-[#E5DFD7] text-[#444] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#E84D84]" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(evt)}
                      title="แก้ไขรายละเอียด"
                      className="px-3 py-1.5 bg-[#FAF0F3] hover:bg-[#FCE3EB] border border-[#F8DDE5] text-[#E84D84] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt.id, evt.name)}
                      title="ลบอีเวนท์"
                      className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-rose-500 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT / CREATE EVENT POPUP MODAL */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-[#E5DFD7] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8E1]">
              <div>
                <h3 className="font-bold text-base text-[#1E1E1E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E84D84]" />
                  <span>{editingEventId ? 'แก้ไขข้อมูลอีเวนท์' : 'สร้างอีเวนท์ใหม่ (Manual Fill)'}</span>
                </h3>
                <p className="text-xs text-[#777]">
                  กรอกข้อมูลรายละเอียดได้อิสระ ไม่ต้องกังวลเรื่องแบบฟอร์มซับซ้อน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 text-[#777] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Row 1: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">วันที่จัด (Day of Month)</label>
                  <select
                    value={formDayNum}
                    onChange={(e) => setFormDayNum(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                  >
                    {Array.from({ length: daysInMonth }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        วันที่ {idx + 1} {monthName} ({String(idx + 1).padStart(2, '0')}.{monthStr})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">เวลาสั้น (Don't Miss Display)</label>
                  <input
                    type="text"
                    value={formData.timeDisplay || ''}
                    onChange={(e) => setFormData({ ...formData, timeDisplay: e.target.value })}
                    placeholder="เช่น 9 am หรือ 1 pm"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">สาขาที่จัด</label>
                  <select
                    value={formData.branch || 'Ratchathewi'}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  >
                    <option value="Ratchathewi">สาขาราชเทวี (Ratchathewi)</option>
                    <option value="Nakhonsawan">สาขานครสวรรค์ (Nakhonsawan)</option>
                    <option value="On-Tour">ออนทัวร์ (On-Tour)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Event Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">ชื่อกิจกรรม (ภาษาไทย) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น เขียน ปล่อย ใจ Sound Bath"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">ชื่อกิจกรรม (English Title)</label>
                  <input
                    type="text"
                    value={formData.englishName || ''}
                    onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    placeholder="เช่น Reflective Journaling & Sound Bath"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
              </div>

              {/* Row 3: Subtitle / Tagline & Short Admin Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">คำบรรยายสั้น (Subtitle)</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="เช่น Acoustic vibrational release"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1 flex items-center justify-between">
                    <span>โน้ตย่อของกิจกรรม (Admin Note / Badge)</span>
                    <span className="text-[10px] text-[#888]">เช่น รอบพิเศษ, รับ 6 ท่าน</span>
                  </label>
                  <input
                    type="text"
                    value={formData.adminNote || ''}
                    onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })}
                    placeholder="กรอกโน้ตสั้น ๆ สำหรับแอดมินหรือแสดงป้ายกำกับ"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
              </div>

              {/* Row 4: Pricing, Capacity, Registered Count & Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EFE8E1]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">ราคา (THB)</label>
                  <input
                    type="number"
                    value={formData.priceThb ?? 950}
                    onChange={(e) => setFormData({ ...formData, priceThb: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">จำนวนที่นั่งทั้งหมด (Max)</label>
                  <input
                    type="number"
                    value={formData.capacity ?? 12}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">จำนวนผู้สมัครแล้ว (คน)</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.capacity || 99}
                    value={formData.bookedCount ?? 0}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      const isFull = count >= (formData.capacity || 10);
                      setFormData({ 
                        ...formData, 
                        bookedCount: count,
                        status: isFull ? 'fully_booked' : formData.status === 'fully_booked' ? 'available' : formData.status
                      });
                    }}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">สถานะการเปิดรับ</label>
                  <select
                    value={formData.status || 'available'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  >
                    <option value="available">🟢 เปิดรับสมัคร (Available)</option>
                    <option value="almost_full">🟡 ใกล้เต็ม (Almost Full)</option>
                    <option value="fully_booked">🔴 เต็มแล้ว (Fully Booked)</option>
                  </select>
                </div>
              </div>

              {/* Fully Booked Quick Checkbox */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF0F2] border border-[#F8DDE5]">
                <div>
                  <span className="font-bold text-xs text-rose-700 block flex items-center gap-1">
                    <span>⛔ กำหนดสถานะ Fully Booked (เต็มแล้ว)</span>
                  </span>
                  <span className="text-[11px] text-[#777]">
                    เมื่อเลือกสถานะนี้ ที่หน้าเว็บจะขึ้นป้ายสีแดงว่า "Fully Booked / เต็มแล้ว"
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.status === 'fully_booked' || (formData.bookedCount !== undefined && formData.capacity !== undefined && formData.bookedCount >= formData.capacity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        status: 'fully_booked',
                        bookedCount: formData.capacity || 12
                      });
                    } else {
                      setFormData({
                        ...formData,
                        status: 'available',
                        bookedCount: Math.max(0, (formData.capacity || 12) - 3)
                      });
                    }
                  }}
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Row 5: Start Time & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">เวลาเริ่ม</label>
                  <input
                    type="text"
                    value={formData.startTime || '09:00 AM'}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="text"
                    value={formData.endTime || '10:30 AM'}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
              </div>

              {/* Row 6: Location Details */}
              <div>
                <label className="block text-[11px] font-semibold text-[#555] mb-1">สถานที่จัดกิจกรรมอย่างละเอียด</label>
                <input
                  type="text"
                  value={formData.locationDetails || ''}
                  onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                  placeholder="เช่น สาขาราชเทวี (ชั้น 5 อาคารพญาไทพลาซ่า) หรือ เชียงใหม่ Eco-Pavilion"
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                />
              </div>

              {/* Row 7: Description */}
              <div>
                <label className="block text-[11px] font-semibold text-[#555] mb-1">รายละเอียดคลาส (Description)</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="อธิบายกิจกรรม ผลลัพธ์ที่จะได้รับ และบรรยากาศ..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                />
              </div>

              {/* Row 8: Special Star Highlight Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9EA] border border-[#FDE6B0]">
                <div>
                  <span className="font-bold text-xs text-[#996500] block flex items-center gap-1">
                    <span>★ กิจกรรมไฮไลท์ (Special Star)</span>
                  </span>
                  <span className="text-[11px] text-[#997A33]">แสดงดาวบนปฏิทิน และเป็นกิจกรรมแนะนำ</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!formData.isSpecialStar}
                  onChange={(e) => setFormData({ ...formData, isSpecialStar: e.target.checked })}
                  className="w-4 h-4 accent-[#FDB827] cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5DFD7] text-[#555] hover:bg-black/5 font-semibold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E84D84] hover:bg-[#D43D73] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#E84D84]/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูลอีเวนท์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1E1E1E] text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#E84D84]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
