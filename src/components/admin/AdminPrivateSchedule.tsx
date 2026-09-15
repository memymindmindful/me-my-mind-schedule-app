import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PrivateSchedulePeriodWithDetails,
  PrivateSchedulePeriod,
  SlotTemplate,
  PrivateScheduleBooking
} from '../../types';
import {
  apiFetchCurrentPrivateSchedule,
  apiFetchAllPrivateSchedulePeriods,
  apiCreatePrivateSchedulePeriod,
  apiTogglePrivateScheduleBooking,
  apiDeletePrivateSchedulePeriod
} from '../../utils/apiClient';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  History,
  Grid,
  Check
} from 'lucide-react';

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];
const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function formatDateThaiShort(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = THAI_DAYS[dateObj.getDay()];
  const monthName = THAI_MONTHS_SHORT[m - 1];
  return `${dayName} ${d} ${monthName}`;
}

function formatDateThaiFull(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = THAI_DAYS[dateObj.getDay()];
  const monthName = THAI_MONTHS_FULL[m - 1];
  const thaiYear = y + 543;
  return `${dayName}ที่ ${d} ${monthName} ${thaiYear}`;
}

function formatPeriodRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const sMonth = THAI_MONTHS_SHORT[sm - 1];
  const eMonth = THAI_MONTHS_SHORT[em - 1];
  const thaiYear = ey + 543;

  if (startDate === endDate) {
    return `${sd} ${sMonth} ${thaiYear}`;
  }
  if (sm === em && sy === ey) {
    return `${sd} - ${ed} ${eMonth} ${thaiYear}`;
  }
  return `${sd} ${sMonth} - ${ed} ${eMonth} ${thaiYear}`;
}

interface NewSlotInput {
  id: string;
  startTime: string;
  endTime: string;
}

const DEFAULT_SLOTS: NewSlotInput[] = [
  { id: '1', startTime: '10:00', endTime: '11:30' },
  { id: '2', startTime: '13:30', endTime: '15:00' },
  { id: '3', startTime: '16:30', endTime: '18:00' },
  { id: '4', startTime: '19:00', endTime: '20:30' }
];

export const AdminPrivateSchedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentPeriodData, setCurrentPeriodData] = useState<PrivateSchedulePeriodWithDetails | null>(null);
  const [allPeriods, setAllPeriods] = useState<PrivateSchedulePeriod[]>([]);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [togglingSlotId, setTogglingSlotId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for creating a new period
  const [formTitle, setFormTitle] = useState<string>('สาขาราชเทวี');
  const [formTitleEn, setFormTitleEn] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDescriptionEn, setFormDescriptionEn] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [formEndDate, setFormEndDate] = useState<string>(() => {
    const end = new Date();
    end.setDate(end.getDate() + 6);
    return end.toISOString().split('T')[0];
  });
  const [formSlots, setFormSlots] = useState<NewSlotInput[]>(DEFAULT_SLOTS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load current period
  const loadCurrentPeriod = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiFetchCurrentPrivateSchedule();
      if (res && res.active && res.data) {
        setCurrentPeriodData(res.data);
      } else {
        setCurrentPeriodData(null);
      }
    } catch (err) {
      console.error('Error loading current private schedule:', err);
      setCurrentPeriodData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load all periods for history
  const loadAllPeriods = useCallback(async () => {
    try {
      const res = await apiFetchAllPrivateSchedulePeriods();
      if (res.success && Array.isArray(res.data)) {
        setAllPeriods(res.data);
      }
    } catch (err) {
      console.error('Error loading all periods:', err);
    }
  }, []);

  useEffect(() => {
    loadCurrentPeriod();
    loadAllPeriods();
  }, [loadCurrentPeriod, loadAllPeriods]);

  // Group current bookings by date
  const bookingsByDate = useMemo(() => {
    if (!currentPeriodData) return new Map<string, { slot: SlotTemplate; booking: PrivateScheduleBooking }[]>();

    const slotMap = new Map<string, SlotTemplate>();
    currentPeriodData.slots.forEach(s => slotMap.set(s.id, s));

    const map = new Map<string, { slot: SlotTemplate; booking: PrivateScheduleBooking }[]>();
    currentPeriodData.bookings.forEach(b => {
      const slot = slotMap.get(b.slotTemplateId);
      if (!slot) return;
      if (!map.has(b.date)) {
        map.set(b.date, []);
      }
      map.get(b.date)!.push({ slot, booking: b });
    });

    map.forEach(list => {
      list.sort((a, b) => {
        if (a.slot.displayOrder !== b.slot.displayOrder) {
          return a.slot.displayOrder - b.slot.displayOrder;
        }
        return a.slot.startTime.localeCompare(b.slot.startTime);
      });
    });

    return map;
  }, [currentPeriodData]);

  const sortedDates = useMemo(() => {
    return Array.from(bookingsByDate.keys()).sort();
  }, [bookingsByDate]);

  // Sorted slot templates for matrix columns
  const sortedSlotTemplates = useMemo(() => {
    if (!currentPeriodData) return [];
    return [...currentPeriodData.slots].sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [currentPeriodData]);

  // Stats
  const currentStats = useMemo(() => {
    if (!currentPeriodData) return { total: 0, available: 0, booked: 0 };
    const total = currentPeriodData.bookings.length;
    const booked = currentPeriodData.bookings.filter(b => b.status === 'booked').length;
    const available = total - booked;
    return { total, available, booked };
  }, [currentPeriodData]);

  // Toggle booking slot status
  const handleToggleBooking = async (booking: PrivateScheduleBooking) => {
    if (togglingSlotId) return; // prevent double click
    const nextStatus = booking.status === 'booked' ? 'available' : 'booked';
    setTogglingSlotId(booking.id);

    // Optimistic UI update
    if (currentPeriodData) {
      setCurrentPeriodData({
        ...currentPeriodData,
        bookings: currentPeriodData.bookings.map(b =>
          b.id === booking.id ? { ...b, status: nextStatus } : b
        )
      });
    }

    try {
      const res = await apiTogglePrivateScheduleBooking(booking.id, nextStatus);
      if (!res.success) {
        // revert on failure
        showToast('อัปเดตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        loadCurrentPeriod(true);
      } else {
        showToast(nextStatus === 'booked' ? 'เปลี่ยนสถานะเป็น: จองแล้ว' : 'เปลี่ยนสถานะเป็น: ว่าง');
      }
    } catch (err) {
      console.error('Toggle booking error:', err);
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      loadCurrentPeriod(true);
    } finally {
      setTogglingSlotId(null);
    }
  };

  // Add slot to form
  const handleAddSlot = () => {
    const newId = String(Date.now());
    setFormSlots([...formSlots, { id: newId, startTime: '10:00', endTime: '11:30' }]);
  };

  // Remove slot from form
  const handleRemoveSlot = (id: string) => {
    if (formSlots.length <= 1) {
      showToast('ต้องมีอย่างน้อย 1 Slot เวลา');
      return;
    }
    setFormSlots(formSlots.filter(s => s.id !== id));
  };

  // Update slot time in form
  const handleUpdateSlotTime = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setFormSlots(formSlots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Submit new period
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('กรุณาระบุชื่อรอบ / กิจกรรม');
      return;
    }
    if (!formStartDate || !formEndDate) {
      showToast('กรุณาระบุวันที่เริ่มต้นและสิ้นสุด');
      return;
    }
    if (formStartDate > formEndDate) {
      showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น');
      return;
    }
    if (formSlots.length === 0) {
      showToast('กรุณาเพิ่ม Slot เวลาอย่างน้อย 1 รายการ');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiCreatePrivateSchedulePeriod({
        title: formTitle.trim(),
        titleEn: formTitleEn.trim() || undefined,
        description: formDescription.trim() || undefined,
        descriptionEn: formDescriptionEn.trim() || undefined,
        startDate: formStartDate,
        endDate: formEndDate,
        slots: formSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
      });

      if (res.success) {
        showToast('สร้างตารางคิว Private สำเร็จ');
        setFormDescription('');
        setFormDescriptionEn('');
        setShowCreateForm(false);
        await loadCurrentPeriod(true);
        await loadAllPeriods();
      } else {
        showToast(res.error || 'สร้างตารางไม่สำเร็จ');
      }
    } catch (err: any) {
      console.error('Create period error:', err);
      showToast(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete period
  const handleDeletePeriod = async (periodId: string, periodTitle: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรอบ "${periodTitle}"?\n(ข้อมูลคิวการจองทั้งหมดในรอบนี้จะถูกลบ)`)) {
      return;
    }

    try {
      const res = await apiDeletePrivateSchedulePeriod(periodId);
      if (res.success) {
        showToast('ลบรอบสำเร็จ');
        await loadCurrentPeriod(true);
        await loadAllPeriods();
      } else {
        showToast(res.error || 'ลบไม่สำเร็จ');
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Copy customer view URL
  const handleCopyClientUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=private-schedule`;
    navigator.clipboard.writeText(url);
    showToast('คัดลอกลิงก์หน้าลูกค้าแล้ว');
  };

  // Open customer view
  const handleOpenClientUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=private-schedule`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E5DFD7] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0F3] text-[#E84D84] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Private Schedule</span>
          </div>
          <h2 className="text-xl font-bold text-[#1E1E1E]">
            จัดการตารางคิว Private (Special Private)
          </h2>
          <p className="text-xs text-[#777] mt-1">
            สร้างรอบตารางคิวรายช่วงวัน และคลิกสลับสถานะ ว่าง / จองแล้ว ได้ทันที
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyClientUrl}
            className="px-3.5 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD7] hover:border-[#E84D84] text-[#333] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="คัดลอกลิงก์หน้าลูกค้า"
          >
            <Copy className="w-3.5 h-3.5 text-[#E84D84]" />
            <span>คัดลอกลิงก์ลูกค้า</span>
          </button>

          <button
            type="button"
            onClick={handleOpenClientUrl}
            className="px-3.5 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD7] hover:border-[#E84D84] text-[#333] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="เปิดดูหน้าลูกค้าในแท็บใหม่"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#E84D84]" />
            <span>ดูหน้าลูกค้า</span>
          </button>

          <button
            type="button"
            onClick={() => loadCurrentPeriod(true)}
            disabled={isRefreshing || loading}
            className="p-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD7] hover:bg-[#FAF0F3] text-[#555] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#E84D84]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Current vs History */}
      <div className="flex items-center gap-2 border-b border-[#E5DFD7] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'current'
              ? 'bg-[#E84D84] text-white shadow-xs'
              : 'bg-white border border-[#E5DFD7] text-[#666] hover:text-[#1E1E1E]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>รอบปัจจุบัน (Current / Active)</span>
          {currentPeriodData && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            loadAllPeriods();
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#E84D84] text-white shadow-xs'
              : 'bg-white border border-[#E5DFD7] text-[#666] hover:text-[#1E1E1E]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>ประวัติรอบทั้งหมด ({allPeriods.length})</span>
        </button>
      </div>

      {/* TAB 1: CURRENT / ACTIVE PERIOD */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* If form is open OR no active period */}
          {showCreateForm || (!loading && !currentPeriodData) ? (
            <div className="bg-white p-6 rounded-3xl border border-[#E84D84]/40 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F2ECE4]">
                <div>
                  <h3 className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#E84D84]" />
                    <span>สร้างรอบตารางคิว Private ใหม่</span>
                  </h3>
                  <p className="text-xs text-[#777] mt-0.5">
                    กำหนดชื่อรอบ วันที่ และ Slot เวลา ระบบจะสร้างตารางคิวให้โดยอัตโนมัติ
                  </p>
                </div>
                {currentPeriodData && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-xs text-[#888] hover:text-[#1E1E1E] underline cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>

              <form onSubmit={handleCreatePeriod} className="space-y-5">
                {/* 1. Title / Location / Activity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] mb-1">
                      ชื่อรอบ / กิจกรรม (ไทย) <span className="text-[#E84D84]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="เช่น สาขาราชเทวี, เชียงใหม่ (ออนทัวร์), Workshop สมาธิพิเศษ"
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                      required
                    />
                    <span className="text-[11px] text-[#888] mt-1 block">
                      ระบุสถานที่ หรือชื่อกิจกรรม ได้อย่างอิสระ
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] mb-1">
                      English Name (optional)
                    </label>
                    <input
                      type="text"
                      value={formTitleEn}
                      onChange={(e) => setFormTitleEn(e.target.value)}
                      placeholder="e.g. Ratchathewi Branch, Chiang Mai On-Tour"
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                    />
                    <span className="text-[11px] text-[#888] mt-1 block">
                      หากเว้นว่างไว้ ในโหมดภาษาอังกฤษจะแสดงชื่อไทยแทน
                    </span>
                  </div>
                </div>

                {/* 1.5 Additional Details / Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1E1E1E]">
                      รายละเอียดเพิ่มเติม (ไม่บังคับ)
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      placeholder="เช่น มีกิจกรรมพิเศษ Sound Bath ในรอบนี้ด้วย, จองได้ทั้งกิจกรรมกลุ่มและ 1-on-1"
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all resize-none"
                    />
                    <span className="text-[11px] text-[#888] block">
                      ข้อความรายละเอียดเพิ่มเติมเกี่ยวกับรอบนี้ จะแสดงในหน้าลูกค้า
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1E1E1E]">
                      Additional Details (English, optional)
                    </label>
                    <textarea
                      value={formDescriptionEn}
                      onChange={(e) => setFormDescriptionEn(e.target.value)}
                      rows={3}
                      placeholder="e.g. Special Sound Bath sessions available this visit, 1-on-1 bookings welcome"
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all resize-none"
                    />
                    <span className="text-[11px] text-[#888] block">
                      หากเว้นว่างไว้ ในโหมดภาษาอังกฤษจะแสดงข้อความภาษาไทยแทน
                    </span>
                  </div>
                </div>

                {/* 2. Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] mb-1">
                      วันที่เริ่มต้น (Start Date) <span className="text-[#E84D84]">*</span>
                    </label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E1E1E] mb-1">
                      วันที่สิ้นสุด (End Date) <span className="text-[#E84D84]">*</span>
                    </label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 3. Slot Templates Builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#1E1E1E] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#E84D84]" />
                      <span>ช่วงเวลาประจำวัน (Slot Templates)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="px-3 py-1 rounded-xl bg-[#FAF0F3] text-[#E84D84] hover:bg-[#E84D84] hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม Slot</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formSlots.map((slot, idx) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-2 p-2.5 bg-[#FAF8F5] border border-[#E5DFD7] rounded-2xl"
                      >
                        <span className="w-6 h-6 rounded-lg bg-white border border-[#E5DFD7] flex items-center justify-center text-[11px] font-bold text-[#666] shrink-0">
                          {idx + 1}
                        </span>

                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleUpdateSlotTime(slot.id, 'startTime', e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-[#E5DFD7] bg-white text-xs font-medium focus:outline-none focus:border-[#E84D84]"
                            required
                          />
                          <span className="text-xs text-[#888]">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleUpdateSlotTime(slot.id, 'endTime', e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-[#E5DFD7] bg-white text-xs font-medium focus:outline-none focus:border-[#E84D84]"
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="p-1.5 rounded-xl hover:bg-[#FEF2F2] text-[#999] hover:text-[#DC2626] transition-colors cursor-pointer"
                          title="ลบ Slot นี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#888] mt-1.5 block">
                    * ทุกวันในช่วงวันที่เลือก จะมี Slot เวลาเหล่านี้ถูกสร้างขึ้นเพื่อให้สลับสถานะ
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 rounded-2xl bg-[#E84D84] hover:bg-[#d63d74] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังสร้างตารางคิว...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>ยืนยันสร้างตารางคิว Private</span>
                      </>
                    )}
                  </button>

                  {currentPeriodData && (
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="py-3 px-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD7] text-[#555] text-xs font-semibold hover:bg-[#F2ECE4] transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : null}

          {/* ACTIVE PERIOD OVERVIEW & INTERACTIVE MATRIX GRID */}
          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5DFD7] text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#E84D84] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#777]">กำลังโหลดข้อมูลรอบปัจจุบัน...</p>
            </div>
          ) : currentPeriodData ? (
            <div className="space-y-6">
              {/* Period Card Banner */}
              <div className="bg-white p-5 rounded-3xl border border-[#E5DFD7] shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span>รอบที่กำลังเปิดรับจอง (Active Period)</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1E1E1E]">
                      {currentPeriodData.period.title}
                    </h3>
                    <p className="text-xs text-[#E84D84] font-semibold mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatPeriodRange(currentPeriodData.period.startDate, currentPeriodData.period.endDate)}</span>
                    </p>
                    {currentPeriodData.period.description && (
                      <p className="text-xs text-[#666] mt-2 max-w-xl bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5DFD7] leading-relaxed">
                        {currentPeriodData.period.description}
                      </p>
                    )}
                  </div>

                  {/* Stats Counter & Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#FAF8F5] px-3.5 py-2 rounded-2xl border border-[#E5DFD7]">
                      <div className="text-center px-2">
                        <span className="text-[10px] text-[#777] block">ว่าง</span>
                        <span className="text-sm font-extrabold text-[#059669]">
                          {currentStats.available}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-[#E5DFD7]" />
                      <div className="text-center px-2">
                        <span className="text-[10px] text-[#777] block">จองแล้ว</span>
                        <span className="text-sm font-extrabold text-[#DC2626]">
                          {currentStats.booked}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-[#E5DFD7]" />
                      <div className="text-center px-2">
                        <span className="text-[10px] text-[#777] block">ทั้งหมด</span>
                        <span className="text-sm font-bold text-[#1E1E1E]">
                          {currentStats.total}
                        </span>
                      </div>
                    </div>

                    {!showCreateForm && (
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(true)}
                        className="px-3 py-2 rounded-2xl bg-[#FAF0F3] hover:bg-[#E84D84] hover:text-white text-[#E84D84] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="สร้างรอบใหม่เพิ่มเติม"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">สร้างรอบใหม่</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeletePeriod(currentPeriodData.period.id, currentPeriodData.period.title)}
                      className="p-2 rounded-2xl bg-[#FEF2F2] hover:bg-[#DC2626] hover:text-white text-[#DC2626] transition-all cursor-pointer"
                      title="ลบรอบนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Matrix Grid: Interactive Slot Toggle */}
              <div className="bg-white rounded-3xl border border-[#E5DFD7] p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#F2ECE4]">
                  <div>
                    <h4 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-[#E84D84]" />
                      <span>ตารางจัดการสถานะคิว (คลิกปุ่มเพื่อสลับสถานะทันที)</span>
                    </h4>
                    <p className="text-[11px] text-[#777] mt-0.5">
                      คลิกที่ปุ่มเพื่อเปลี่ยนสถานะระหว่าง 🟢 ว่าง (Available) และ 🔴 จองแล้ว (Booked)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-medium text-[#059669]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span>ว่าง = เปิดรับจอง</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#DC2626]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <span>จองแล้ว = ปิดรับจอง</span>
                    </span>
                  </div>
                </div>

                {/* Matrix View (Responsive table/cards) */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#EBE6DF]">
                        <th className="py-2.5 px-3 text-left text-xs font-bold text-[#555] bg-[#FAF8F5] rounded-l-xl w-36">
                          วันที่
                        </th>
                        {sortedSlotTemplates.map(slot => (
                          <th
                            key={slot.id}
                            className="py-2.5 px-2 text-center text-xs font-bold text-[#555] bg-[#FAF8F5]"
                          >
                            <span className="block text-[11px]">{slot.startTime} - {slot.endTime}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2ECE4]">
                      {sortedDates.map(dateStr => {
                        const slotsForDate = bookingsByDate.get(dateStr) || [];
                        const slotBookingMap = new Map<string, PrivateScheduleBooking>();
                        slotsForDate.forEach(s => slotBookingMap.set(s.slot.id, s.booking));

                        return (
                          <tr key={dateStr} className="hover:bg-[#FAF8F5]/60 transition-colors">
                            {/* Date Label */}
                            <td className="py-3 px-3 text-xs font-bold text-[#1E1E1E] whitespace-nowrap">
                              <div>{formatDateThaiShort(dateStr)}</div>
                              <span className="text-[10px] font-normal text-[#888]">{dateStr}</span>
                            </td>

                            {/* Slot Cells */}
                            {sortedSlotTemplates.map(slot => {
                              const booking = slotBookingMap.get(slot.id);
                              if (!booking) {
                                return (
                                  <td key={slot.id} className="py-3 px-2 text-center text-xs text-[#AAA]">
                                    -
                                  </td>
                                );
                              }

                              const isBooked = booking.status === 'booked';
                              const isUpdating = togglingSlotId === booking.id;

                              return (
                                <td key={slot.id} className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBooking(booking)}
                                    disabled={isUpdating}
                                    className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-2xs ${
                                      isBooked
                                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2]'
                                        : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] hover:bg-[#D1FAE5]'
                                    } ${isUpdating ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}`}
                                    title={`คลิกเพื่อเปลี่ยนเป็น ${isBooked ? 'ว่าง' : 'จองแล้ว'}`}
                                  >
                                    {isUpdating ? (
                                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : isBooked ? (
                                      <>
                                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>จองแล้ว</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>ว่าง</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-[#E5DFD7] text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FAF0F3] border border-[#F5D2DF] flex items-center justify-center text-[#E84D84] mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#1E1E1E]">
                ยังไม่มีรอบตารางคิว Private ที่เปิดใช้งาน
              </h3>
              <p className="text-xs text-[#777] max-w-sm mx-auto">
                กดปุ่มด้านล่างเพื่อสร้างรอบแรก กำหนดสถานที่/กิจกรรม วันที่ และเวลาที่เปิดรับจอง
              </p>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="py-2.5 px-6 rounded-2xl bg-[#E84D84] hover:bg-[#d63d74] text-white text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ สร้างรอบตารางคิว Private</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORY OF ALL PERIODS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E5DFD7] shadow-xs">
            <h3 className="text-sm font-bold text-[#1E1E1E] flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-[#E84D84]" />
              <span>ประวัติรอบตารางคิวทั้งหมด ({allPeriods.length})</span>
            </h3>
            <p className="text-xs text-[#777]">
              รายการรอบตารางคิวทั้งหมดที่เคยสร้างไว้ในระบบ ทั้งรอบที่กำลังเปิดรับจองและรอบในอดีต
            </p>
          </div>

          {allPeriods.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-[#E5DFD7] text-center text-xs text-[#888]">
              ยังไม่มีประวัติรอบตารางคิว
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPeriods.map((p) => {
                const isCurrentActive = currentPeriodData?.period.id === p.id;
                const total = p.totalBookingsCount || 0;
                const booked = p.bookedCount || 0;
                const available = total - booked;

                return (
                  <div
                    key={p.id}
                    className={`bg-white p-5 rounded-3xl border transition-all ${
                      isCurrentActive
                        ? 'border-[#E84D84] shadow-xs ring-1 ring-[#E84D84]/20'
                        : 'border-[#E5DFD7] hover:border-[#D0C8BE]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {isCurrentActive && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF0F3] text-[#E84D84] text-[10px] font-bold mb-1.5">
                            รอบปัจจุบัน (Active)
                          </span>
                        )}
                        <h4 className="text-base font-bold text-[#1E1E1E]">
                          {p.title}
                        </h4>
                        {p.titleEn && (
                          <p className="text-xs text-[#777] italic">
                            {p.titleEn}
                          </p>
                        )}
                        <p className="text-xs text-[#666] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#E84D84]" />
                          <span>{formatPeriodRange(p.startDate, p.endDate)}</span>
                        </p>
                        {p.description && (
                          <p className="text-xs text-[#777] mt-1.5 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(p.id, p.title)}
                        className="p-2 rounded-xl text-[#999] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        title="ลบรอบนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F2ECE4] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-[#059669] font-medium">
                          ว่าง: <b>{available}</b>
                        </span>
                        <span className="text-[#DC2626] font-medium">
                          จองแล้ว: <b>{booked}</b>
                        </span>
                        <span className="text-[#888]">
                          รวม: {total} คิว
                        </span>
                      </div>

                      {p.totalSlotsCount && (
                        <span className="text-[11px] text-[#777]">
                          {p.totalSlotsCount} slots/วัน
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1E1E1E] text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#E84D84]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
