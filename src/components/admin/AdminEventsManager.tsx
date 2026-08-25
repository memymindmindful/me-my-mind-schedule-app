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
  HelpCircle,
  Image as ImageIcon,
  UploadCloud,
  UserCheck,
  Layers,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { ScheduleEvent, OfferingCategory, BranchLocation, Facilitator, FacilitatorInfo } from '../../types';
import { apiCreateEvent, apiUpdateEvent, apiDeleteEvent, apiFetchMonthEvents, apiResetData, apiFetchStudioSettings } from '../../utils/apiClient';
import { TRANSLATIONS } from '../../utils/translations';

interface AdminEventsManagerProps {
  currentYear: number;
  currentMonth: number;
  onDataChanged: () => void;
  onMonthChange?: (year: number, month: number) => void;
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
  isFree: false,
  capacity: 12,
  bookedCount: 0,
  level: 'All Levels',
  description: '',
  posterUrl: '',
  useGlobalFacilitator: true,
  benefits: ['คืนสมดุลให้ร่างกายและจิตใจ', 'ผ่อนคลายกล้ามเนื้อและระบบประสาท', 'คลายความตึงเครียดสะสม'],
  sensoryNotes: ['Tibetan Singing Bowls', 'Organic Herbal Tea', 'Essential Oil Mist'],
  preparationTips: ['สวมใส่ชุดหลวมสบาย ไม่รัดแน่น'],
  isSpecialStar: false,
  isFeatured: true,
  adminNote: '',
  status: 'available'
};

const POPULAR_SENSORY_NOTES = [
  'Tibetan Singing Bowls',
  'Crystal Singing Bowls',
  'Organic Herbal Tea',
  'Essential Oil Mist',
  'Aromatherapy Hydrosol',
  'Somatic Breathwork',
  'Acoustic Gong Bath',
  'Tuning Forks (432Hz)',
  'Weighted Eye Pillow',
  'Reflective Journaling'
];

const POPULAR_BENEFITS = [
  'คืนสมดุลให้ร่างกายและจิตใจ',
  'ผ่อนคลายกล้ามเนื้อและระบบประสาท',
  'คลายความตึงเครียดสะสม',
  'ช่วยปรับคลื่นสมองให้นอนหลับลึกขึ้น',
  'ฟื้นฟูผิวหน้าและผ่อนคลายกล้ามเนื้อ',
  'เสริมสร้างสติและสมาธิในการทำงาน',
  'ปลดปล่อยอารมณ์และประจุความเครียด'
];

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({
  currentYear,
  currentMonth,
  onDataChanged,
  onMonthChange
}) => {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthStr = String(currentMonth + 1).padStart(2, '0');
  const monthName = TRANSLATIONS.th.monthNames[currentMonth];

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [globalFacilitator, setGlobalFacilitator] = useState<FacilitatorInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ScheduleEvent>>(DEFAULT_EVENT_FORM);
  const [formDayNum, setFormDayNum] = useState<number>(4);
  const [formMonthNum, setFormMonthNum] = useState<number>(currentMonth + 1); // 1-12
  const [formYearNum, setFormYearNum] = useState<number>(currentYear);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [toastState, setToastState] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Cross-Month Duplicate State
  const [duplicatingEvent, setDuplicatingEvent] = useState<ScheduleEvent | null>(null);
  const [duplicateTargetMonths, setDuplicateTargetMonths] = useState<{ year: number; month: number }[]>([]);
  const [isDuplicatingLoading, setIsDuplicatingLoading] = useState(false);

  // Tag inputs state
  const [newSensoryNoteInput, setNewSensoryNoteInput] = useState('');
  const [newBenefitInput, setNewBenefitInput] = useState('');
  const [newPrepTipInput, setNewPrepTipInput] = useState('');

  // Calculate days in currently selected form month/year
  const daysInFormMonth = new Date(formYearNum, formMonthNum, 0).getDate();

  const handleFormMonthChange = (newMonth: number) => {
    setFormMonthNum(newMonth);
    const maxDays = new Date(formYearNum, newMonth, 0).getDate();
    if (formDayNum > maxDays) {
      setFormDayNum(maxDays);
    }
  };

  const handleFormYearChange = (newYear: number) => {
    setFormYearNum(newYear);
    const maxDays = new Date(newYear, formMonthNum, 0).getDate();
    if (formDayNum > maxDays) {
      setFormDayNum(maxDays);
    }
  };

  // Load events and global facilitator profile
  const refreshEvents = async () => {
    try {
      const apiEvts = await apiFetchMonthEvents(currentYear, currentMonth);
      if (apiEvts !== null) {
        setEvents(apiEvts);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const res = await apiFetchStudioSettings();
      if (res?.facilitator) {
        setGlobalFacilitator(res.facilitator);
      }
    } catch (err) {
      console.warn('Could not load global settings in events manager:', err);
    }
  };

  useEffect(() => {
    refreshEvents();
    loadGlobalSettings();

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail?.facilitator) {
        setGlobalFacilitator(e.detail.facilitator);
      }
    };

    const handleAuthExpired = (e: any) => {
      showToast(e?.detail?.error || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง', 'error');
    };

    window.addEventListener('mmm_settings_updated', handleSettingsUpdated);
    window.addEventListener('mmm_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('mmm_settings_updated', handleSettingsUpdated);
      window.removeEventListener('mmm_auth_expired', handleAuthExpired);
    };
  }, [currentYear, currentMonth]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 3500);
  };

  // Tag handlers
  const handleAddSensoryNote = (noteText: string) => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const current = formData.sensoryNotes || [];
    if (!current.includes(trimmed)) {
      setFormData(prev => ({ ...prev, sensoryNotes: [...(prev.sensoryNotes || []), trimmed] }));
    }
    setNewSensoryNoteInput('');
  };

  const handleRemoveSensoryNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sensoryNotes: (prev.sensoryNotes || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddBenefit = (benefitText: string) => {
    const trimmed = benefitText.trim();
    if (!trimmed) return;
    const current = formData.benefits || [];
    if (!current.includes(trimmed)) {
      setFormData(prev => ({ ...prev, benefits: [...(prev.benefits || []), trimmed] }));
    }
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: (prev.benefits || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddPrepTip = (tipText: string) => {
    const trimmed = tipText.trim();
    if (!trimmed) return;
    const current = formData.preparationTips || [];
    if (!current.includes(trimmed)) {
      setFormData(prev => ({ ...prev, preparationTips: [...(prev.preparationTips || []), trimmed] }));
    }
    setNewPrepTipInput('');
  };

  const handleRemovePrepTip = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preparationTips: (prev.preparationTips || []).filter((_, i) => i !== index)
    }));
  };

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (file.size > maxSize) {
        alert('รูปภาพมีขนาดใหญ่เกิน 5MB กรุณาเลือกรูปภาพขนาดไม่เกิน 5MB');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert('รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ JPG, PNG, GIF หรือ WEBP');
        return;
      }

      setSelectedPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setFormData(prev => ({ ...prev, posterUrl: previewUrl }));
    }
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview('');
    setFormData(prev => ({ ...prev, posterUrl: '' }));
  };

  // Open modal for NEW event
  const handleOpenCreateModal = (day = 1) => {
    setEditingEventId(null);
    setSelectedPhoto(null);
    setPhotoPreview('');
    setFormDayNum(day);
    setFormMonthNum(currentMonth + 1);
    setFormYearNum(currentYear);
    setNewSensoryNoteInput('');
    setNewBenefitInput('');
    setNewPrepTipInput('');

    const defaultFacilitator: Facilitator = {
      name: globalFacilitator?.nameTh || globalFacilitator?.nameEn || 'Kru Beever (Supapit)',
      role: globalFacilitator?.titleTh || globalFacilitator?.titleEn || 'Founder & Lead Somatic Alchemist',
      bio: globalFacilitator?.bioShortTh || globalFacilitator?.bioLongTh || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.',
      avatarUrl: globalFacilitator?.photoUrl || '',
      certifications: globalFacilitator?.certifications || []
    };

    const targetMonthStr = String(currentMonth + 1).padStart(2, '0');
    setFormData({
      ...DEFAULT_EVENT_FORM,
      useGlobalFacilitator: true,
      facilitator: defaultFacilitator,
      sensoryNotes: ['Tibetan Singing Bowls', 'Organic Herbal Tea', 'Essential Oil Mist'],
      benefits: ['คืนสมดุลให้ร่างกายและจิตใจ', 'ผ่อนคลายกล้ามเนื้อและระบบประสาท', 'คลายความตึงเครียดสะสม'],
      preparationTips: ['สวมใส่ชุดหลวมสบาย ไม่รัดแน่น'],
      isFree: false,
      dateStr: `${currentYear}-${targetMonthStr}-${String(day).padStart(2, '0')}`,
      dateDisplay: `${String(day).padStart(2, '0')}.${targetMonthStr}`
    });
    setIsEditingModalOpen(true);
  };

  // Open modal for EDIT event
  const handleOpenEditModal = (evt: ScheduleEvent) => {
    setEditingEventId(evt.id);
    setSelectedPhoto(null);
    setPhotoPreview(evt.posterUrl || '');
    
    // Parse event's actual date (Year, Month, Day) from its dateStr
    const parts = (evt.dateStr || '').split('-');
    const evtYear = parts[0] ? Number(parts[0]) : currentYear;
    const evtMonth = parts[1] ? Number(parts[1]) : (currentMonth + 1);
    const evtDay = parts[2] ? Number(parts[2]) : 1;

    setFormYearNum(evtYear);
    setFormMonthNum(evtMonth);
    setFormDayNum(evtDay);
    setNewSensoryNoteInput('');
    setNewBenefitInput('');
    setNewPrepTipInput('');

    setFormData({ 
      ...evt,
      useGlobalFacilitator: evt.useGlobalFacilitator ?? true,
      sensoryNotes: Array.isArray(evt.sensoryNotes) ? evt.sensoryNotes : [],
      benefits: Array.isArray(evt.benefits) ? evt.benefits : [],
      preparationTips: Array.isArray(evt.preparationTips) ? evt.preparationTips : [],
      isFree: evt.isFree ?? (evt.priceThb === 0)
    });
    setIsEditingModalOpen(true);
  };

  // Quick toggle Fully Booked from card
  const handleQuickToggleFullyBooked = async (evt: ScheduleEvent) => {
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
    
    // Sync with backend API
    const res = await apiUpdateEvent(evt.id, { status: newStatus, bookedCount: newBookedCount });
    if (res && res.success) {
      window.dispatchEvent(new CustomEvent('mmm_events_updated', {
        detail: { year: currentYear, month: currentMonth, events: updated }
      }));
      onDataChanged();
      showToast(isCurrentlyFull ? `ปลดล็อคที่นั่ง "${evt.name}" เป็นเปิดรับสมัครแล้ว` : `ปรับ "${evt.name}" เป็น Fully Booked (เต็มแล้ว)`, 'success');
    } else {
      showToast(`❌ ปรับสถานะไม่สำเร็จ: ${res?.error || 'เกิดข้อผิดพลาด'}`, 'error');
      await refreshEvents();
    }
  };

  // Quick update booked count (+ / -)
  const handleQuickUpdateBookedCount = async (evt: ScheduleEvent, delta: number) => {
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

    // Sync with backend API
    const res = await apiUpdateEvent(evt.id, { bookedCount: newCount, status: newStatus });
    if (res && res.success) {
      window.dispatchEvent(new CustomEvent('mmm_events_updated', {
        detail: { year: currentYear, month: currentMonth, events: updated }
      }));
      onDataChanged();
    } else {
      showToast(`❌ อัปเดตจำนวนที่นั่งไม่สำเร็จ: ${res?.error || 'เกิดข้อผิดพลาด'}`, 'error');
      await refreshEvents();
    }
  };

  // Quick Same-Month Duplicate Event (To next day in current month)
  const handleDuplicateEvent = async (evt: ScheduleEvent) => {
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

    const res = await apiCreateEvent(newEvent);
    if (res && res.success) {
      await refreshEvents();
      window.dispatchEvent(new CustomEvent('mmm_events_updated', {
        detail: { year: currentYear, month: currentMonth }
      }));
      onDataChanged();
      showToast(`คัดลอกอีเวนท์ "${evt.name}" ไปยังวันที่ ${targetDayStr}.${monthStr} เรียบร้อยแล้ว`, 'success');
    } else {
      showToast(`❌ คัดลอกอีเวนท์ไม่สำเร็จ: ${res?.error || 'เกิดข้อผิดพลาด'}`, 'error');
    }
  };

  // Open Cross-Month Duplicate Modal
  const openDuplicateModal = (evt: ScheduleEvent) => {
    setDuplicatingEvent(evt);
    const parts = (evt.dateStr || '').split('-');
    const evtYear = parts[0] ? Number(parts[0]) : currentYear;
    const evtMonth = parts[1] ? Number(parts[1]) : (currentMonth + 1);
    const nextMonth = evtMonth === 12 ? 1 : evtMonth + 1;
    const nextYear = evtMonth === 12 ? evtYear + 1 : evtYear;
    setDuplicateTargetMonths([{ year: nextYear, month: nextMonth }]);
  };

  // Confirm Cross-Month Duplicate
  const handleConfirmDuplicateAcrossMonths = async () => {
    if (!duplicatingEvent || duplicateTargetMonths.length === 0) return;
    setIsDuplicatingLoading(true);

    const originalDay = Number((duplicatingEvent.dateStr || '').split('-')[2]) || 1;
    let successCount = 0;
    let failCount = 0;

    for (const target of duplicateTargetMonths) {
      const daysInTargetMonth = new Date(target.year, target.month, 0).getDate();
      const clampedDay = Math.min(originalDay, daysInTargetMonth);
      const dayStr = String(clampedDay).padStart(2, '0');
      const monthStrTarget = String(target.month).padStart(2, '0');

      const newEvent: ScheduleEvent = {
        ...duplicatingEvent,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        dateStr: `${target.year}-${monthStrTarget}-${dayStr}`,
        dateDisplay: `${dayStr}.${monthStrTarget}`,
        bookedCount: 0,
        status: 'available'
      };

      const res = await apiCreateEvent(newEvent);
      if (res && res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsDuplicatingLoading(false);
    setDuplicatingEvent(null);
    setDuplicateTargetMonths([]);
    await refreshEvents();
    window.dispatchEvent(new CustomEvent('mmm_events_updated', {
      detail: { year: currentYear, month: currentMonth }
    }));
    onDataChanged();

    if (failCount === 0) {
      showToast(`คัดลอกอีเวนท์ "${duplicatingEvent.name}" ไปยัง ${successCount} เดือนเป้าหมายเรียบร้อยแล้ว!`, 'success');
    } else {
      showToast(`คัดลอกสำเร็จ ${successCount} เดือน, ล้มเหลว ${failCount} เดือน`, 'error');
    }
  };

  // Delete Event (Persisted to backend)
  const handleDeleteEvent = async (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบอีเวนท์ "${name}" ใช่หรือไม่? ข้อมูลจะถูกลบออกจากฐานข้อมูลอย่างถาวร`)) return;
    
    try {
      const res = await apiDeleteEvent(id);
      if (res && res.success) {
        const updated = events.filter(e => e.id !== id);
        setEvents(updated);
        window.dispatchEvent(new CustomEvent('mmm_events_updated', {
          detail: { year: currentYear, month: currentMonth, events: updated }
        }));
        onDataChanged();
        showToast(`ลบอีเวนท์ "${name}" ออกจากระบบถาวรเรียบร้อยแล้ว`, 'success');
      } else {
        showToast(`❌ ลบไม่สำเร็จ: ${res?.error || 'เกิดข้อผิดพลาดในการลบ'}`, 'error');
      }
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถลบอีเวนท์ได้'}`, 'error');
    }
  };

  // Reset Month Events
  const handleResetMonth = async (emptyOnly: boolean) => {
    const confirmMsg = `ต้องการล้างข้อมูลอีเวนท์ทั้งหมดในเดือน ${monthName} ${currentYear} ให้เป็นตารางว่าง (0 อีเวนท์) เพื่อเตรียมใส่ข้อมูลจริงใช่หรือไม่?`;
    
    if (!window.confirm(confirmMsg)) return;

    const res = await apiResetData('month_events', currentYear, currentMonth);
    if (res && res.success) {
      setEvents([]);
      window.dispatchEvent(new CustomEvent('mmm_events_updated', {
        detail: { year: currentYear, month: currentMonth, events: [] }
      }));
      onDataChanged();
      showToast(`ล้างข้อมูลอีเวนท์เดือน ${monthName} เรียบร้อยแล้ว (0 รายการ)`, 'success');
    } else {
      showToast(`❌ รีเซ็ตไม่สำเร็จ: ${res?.error || 'เกิดข้อผิดพลาด'}`, 'error');
    }
  };

  // Save Event from Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('กรุณากรอกชื่อกิจกรรม', 'error');
      return;
    }

    const dayStr = String(formDayNum).padStart(2, '0');
    const monthStrForSave = String(formMonthNum).padStart(2, '0');
    const dateStr = `${formYearNum}-${monthStrForSave}-${dayStr}`;
    const dateDisplay = `${dayStr}.${monthStrForSave}`;

    const capacity = Number(formData.capacity) || 10;
    const bookedCount = Number(formData.bookedCount) || 0;
    const isFullyBooked = formData.status === 'fully_booked' || bookedCount >= capacity;
    const status = isFullyBooked ? 'fully_booked' : bookedCount >= capacity - 2 ? 'almost_full' : 'available';
    const isFree = Boolean(formData.isFree || Number(formData.priceThb) === 0);
    const priceThb = isFree ? 0 : (Number(formData.priceThb) || 0);

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
      useGlobalFacilitator: formData.useGlobalFacilitator !== false,
      facilitator: {
        name: formData.facilitator?.name?.trim() || (globalFacilitator?.nameTh || 'Kru Beever (Supapit)'),
        role: formData.facilitator?.role?.trim() || (globalFacilitator?.titleTh || 'Founder & Lead Somatic Alchemist'),
        bio: formData.facilitator?.bio?.trim() || (globalFacilitator?.bioShortTh || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.'),
        avatarUrl: formData.facilitator?.avatarUrl || globalFacilitator?.photoUrl || '',
        certifications: formData.facilitator?.certifications || globalFacilitator?.certifications || []
      },
      priceThb,
      isFree,
      capacity,
      bookedCount: isFullyBooked && bookedCount < capacity ? capacity : bookedCount,
      level: formData.level || 'All Levels',
      sensoryNotes: formData.sensoryNotes || [],
      description: formData.description?.trim() || 'รายละเอียดคลาสและศาสตร์การดูแลบำบัด',
      benefits: formData.benefits || [],
      preparationTips: formData.preparationTips || [],
      posterUrl: formData.posterUrl,
      posterTag: formData.posterTag,
      isSpecialStar: !!formData.isSpecialStar,
      isFeatured: formData.isFeatured !== false,
      adminNote: formData.adminNote?.trim() || '',
      status
    };

    try {
      let result;
      if (editingEventId) {
        result = await apiUpdateEvent(editingEventId, completeEvent, selectedPhoto || undefined);
      } else {
        result = await apiCreateEvent(completeEvent, selectedPhoto || undefined);
      }

      if (result && result.success) {
        const isDifferentMonth = formYearNum !== currentYear || (formMonthNum - 1) !== currentMonth;
        const targetMonthName = TRANSLATIONS.th.monthNames[formMonthNum - 1] || `เดือน ${formMonthNum}`;

        showToast(
          editingEventId 
            ? `อัปเดตอีเวนท์ "${completeEvent.name}" สำหรับวันที่ ${dayStr} ${targetMonthName} ${formYearNum} (${dateDisplay}) สำเร็จ!` 
            : `บันทึกอีเวนท์ "${completeEvent.name}" สำหรับวันที่ ${dayStr} ${targetMonthName} ${formYearNum} (${dateDisplay}) เรียบร้อยแล้ว!`,
          'success'
        );

        if (isDifferentMonth && onMonthChange) {
          onMonthChange(formYearNum, formMonthNum - 1);
        }

        await refreshEvents();
        window.dispatchEvent(new CustomEvent('mmm_events_updated', {
          detail: { year: formYearNum, month: formMonthNum - 1 }
        }));
        onDataChanged();
        setIsEditingModalOpen(false);
      } else {
        const errorMsg = result?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        showToast(`❌ บันทึกไม่สำเร็จ: ${errorMsg}`, 'error');
        if (result?.code === 'INVALID_TOKEN' || result?.code === 'NO_TOKEN' || result?.code === 'UNAUTHORIZED') {
          showToast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error');
        }
      }
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'}`, 'error');
    }
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
                  {/* Left: Photo / Date Badge & Details */}
                  <div className="flex items-start gap-3.5">
                    {evt.posterUrl ? (
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#E5DFD7] flex-shrink-0 shadow-2xs group">
                        <img 
                          src={evt.posterUrl} 
                          alt={evt.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-0.5">
                          <span className="text-[9px] font-bold text-white font-mono">{evt.dateDisplay}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                        <span className="text-xs font-bold text-[#E84D84] font-mono">{evt.dateDisplay}</span>
                        <span className="text-[10px] text-[#888] font-mono">{evt.timeDisplay}</span>
                      </div>
                    )}

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
                        {evt.isFree || evt.priceThb === 0 ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                            ฟรี (FREE)
                          </span>
                        ) : (
                          <span className="font-mono text-[#1E1E1E] font-semibold">
                            ฿{evt.priceThb.toLocaleString()}
                          </span>
                        )}
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

                    {/* Quick Same-Day Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateEvent(evt)}
                      title="คัดลอกอีเวนท์ไปยังวันถัดไป (ในเดือนเดียวกัน)"
                      className="px-2.5 py-1.5 bg-[#FAF7F5] hover:bg-[#F2ECE4] border border-[#E5DFD7] text-[#444] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#E84D84]" />
                      <span>Duplicate</span>
                    </button>

                    {/* Cross-Month Duplicate */}
                    <button
                      type="button"
                      onClick={() => openDuplicateModal(evt)}
                      title="คัดลอกอีเวนท์นี้ไปยังเดือนอื่น ๆ (Cross-Month Duplicate)"
                      className="px-2.5 py-1.5 bg-[#FFF7EB] hover:bg-[#FEEFD4] border border-[#FDE6B5] text-[#B27B00] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#E08A00]" />
                      <span>ข้ามเดือน</span>
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
              {/* Row 1: Date & Time & Branch */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-3">
                {/* 3-Column Date Selectors: Day, Month, Year */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-[#444] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E84D84]" />
                      <span>วันที่จัดกิจกรรม (Event Date) *</span>
                    </label>
                    <span className="text-[10px] text-[#888] font-mono">
                      {String(formDayNum).padStart(2, '0')}.{String(formMonthNum).padStart(2, '0')}.{formYearNum} (พ.ศ. {formYearNum + 543})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Day Selector */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#666] mb-1">วันที่ (Day)</label>
                      <select
                        value={formDayNum}
                        onChange={(e) => setFormDayNum(Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                      >
                        {Array.from({ length: daysInFormMonth }).map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            วันที่ {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month Selector */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#666] mb-1">เดือน (Month)</label>
                      <select
                        value={formMonthNum}
                        onChange={(e) => handleFormMonthChange(Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs font-semibold focus:outline-none focus:border-[#E84D84]"
                      >
                        {TRANSLATIONS.th.monthNames.map((name, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {idx + 1}. {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Selector */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#666] mb-1">ปี (Year)</label>
                      <select
                        value={formYearNum}
                        onChange={(e) => handleFormYearChange(Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                      >
                        {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                          <option key={y} value={y}>
                            {y} (พ.ศ. {y + 543})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Branch & Display Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#EFE8E1]">
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
              <div className="space-y-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EFE8E1]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-[#555]">ราคา (THB)</label>
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-emerald-700">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.isFree || (formData.priceThb === 0 && formData.isFree !== false))}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData({
                              ...formData,
                              isFree: isChecked,
                              priceThb: isChecked ? 0 : (formData.priceThb || 950)
                            });
                          }}
                          className="w-3 h-3 accent-emerald-600 rounded"
                        />
                        <span>ฟรี (FREE)</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={Boolean(formData.isFree)}
                      value={formData.isFree ? 0 : (formData.priceThb ?? 950)}
                      onChange={(e) => setFormData({ ...formData, priceThb: Number(e.target.value) })}
                      placeholder={formData.isFree ? 'ฟรี (0 THB)' : '950'}
                      className={`w-full px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84] ${
                        formData.isFree ? 'bg-emerald-50/60 text-emerald-800 border-emerald-300 font-bold' : ''
                      }`}
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

              {/* Row 7: Event Photo Upload (Optional) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[#555] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#E84D84]" />
                    <span>รูปภาพโปสเตอร์กิจกรรม (Event Photo - Optional)</span>
                  </label>
                  <span className="text-[10px] text-[#888]">รองรับ JPG, PNG, GIF, WEBP (สูงสุด 5MB)</span>
                </div>

                {/* Photo Preview if Selected or Available */}
                {photoPreview ? (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-[#E5DFD7]">
                    <img 
                      src={photoPreview} 
                      alt="Event Preview" 
                      className="w-16 h-16 rounded-lg object-cover border border-[#EFE8E1] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1E1E1E] truncate">
                        {selectedPhoto ? selectedPhoto.name : 'รูปภาพปัจจุบันของกิจกรรม'}
                      </p>
                      <p className="text-[10px] text-[#888]">
                        {selectedPhoto ? `${(selectedPhoto.size / 1024).toFixed(1)} KB` : 'บันทึกอยู่ในระบบแล้ว'}
                      </p>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="mt-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบรูปภาพ (Remove Photo)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-[#FAF0F3] border border-dashed border-[#D5CEC7] hover:border-[#E84D84] rounded-xl cursor-pointer transition-colors text-xs text-[#666]">
                      <UploadCloud className="w-4 h-4 text-[#E84D84]" />
                      <span className="font-semibold text-[#1E1E1E]">เลือกไฟล์รูปภาพ (Choose Photo)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Row 8: Description */}
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

              {/* Row 9: Facilitator Sync & Custom Profile */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#E84D84]" />
                    <span className="font-bold text-xs text-[#1E1E1E]">ข้อมูลครูผู้สอน / ผู้บำบัด (Facilitator)</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#E84D84]">
                    <input
                      type="checkbox"
                      checked={formData.useGlobalFacilitator !== false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          useGlobalFacilitator: checked,
                          facilitator: checked ? {
                            name: globalFacilitator?.nameTh || globalFacilitator?.nameEn || 'Kru Beever (Supapit)',
                            role: globalFacilitator?.titleTh || globalFacilitator?.titleEn || 'Founder & Lead Somatic Alchemist',
                            bio: globalFacilitator?.bioShortTh || globalFacilitator?.bioLongTh || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.',
                            avatarUrl: globalFacilitator?.photoUrl || '',
                            certifications: globalFacilitator?.certifications || []
                          } : prev.facilitator
                        }));
                      }}
                      className="w-3.5 h-3.5 accent-[#E84D84] rounded"
                    />
                    <span>ซิงค์อัตโนมัติกับโปรไฟล์ครูในระบบ</span>
                  </label>
                </div>

                {formData.useGlobalFacilitator !== false ? (
                  /* Global Facilitator Info Preview Card */
                  <div className="p-3 bg-white rounded-xl border border-[#E8DFD8] flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FAF0F3] border border-[#F8DDE5] text-[#E84D84] flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
                      {globalFacilitator?.photoUrl ? (
                        <img 
                          src={globalFacilitator.photoUrl} 
                          alt="Facilitator" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span>KB</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-bold text-xs text-[#1E1E1E] truncate">
                          {globalFacilitator?.nameTh || globalFacilitator?.nameEn || 'Kru Beever (Supapit)'}
                        </h5>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold whitespace-nowrap">
                          ✓ ซิงค์กับระบบ
                        </span>
                      </div>
                      <p className="text-[11px] text-[#E84D84] font-medium truncate">
                        {globalFacilitator?.titleTh || globalFacilitator?.titleEn || 'Founder & Lead Somatic Alchemist'}
                      </p>
                      <p className="text-[10px] text-[#777] line-clamp-2 mt-0.5">
                        {globalFacilitator?.bioShortTh || globalFacilitator?.bioLongTh || 'Certified Sound Healing Practitioner and Holistic Facial Ritualist.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Custom Facilitator Override Inputs */
                  <div className="space-y-2.5 pt-1">
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      ℹ️ กำหนดครูผู้สอนเฉพาะอีเวนท์นี้ (เช่น วิทยากรรับเชิญ หรือ Guest Facilitator)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#666] mb-0.5">ชื่อครูผู้สอน (Name)</label>
                        <input
                          type="text"
                          value={formData.facilitator?.name || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            facilitator: {
                              name: e.target.value,
                              role: prev.facilitator?.role || '',
                              bio: prev.facilitator?.bio || '',
                              certifications: prev.facilitator?.certifications || []
                            }
                          }))}
                          placeholder="เช่น Kru Beever / Guest Teacher"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#666] mb-0.5">ตำแหน่ง / บทบาท (Role / Title)</label>
                        <input
                          type="text"
                          value={formData.facilitator?.role || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            facilitator: {
                              name: prev.facilitator?.name || '',
                              role: e.target.value,
                              bio: prev.facilitator?.bio || '',
                              certifications: prev.facilitator?.certifications || []
                            }
                          }))}
                          placeholder="เช่น Lead Sound Alchemist"
                          className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#666] mb-0.5">ประวัติย่อ (Bio)</label>
                      <textarea
                        rows={2}
                        value={formData.facilitator?.bio || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          facilitator: {
                            name: prev.facilitator?.name || '',
                            role: prev.facilitator?.role || '',
                            bio: e.target.value,
                            certifications: prev.facilitator?.certifications || []
                          }
                        }))}
                        placeholder="ประวัติย่อและศาสตร์ความเชี่ยวชาญ..."
                        className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 10: Sensory Notes / Tools (สัมผัสและเครื่องมือบำบัด) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#1E1E1E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E84D84]" />
                    <span>สัมผัสและเครื่องมือบำบัด (Sensory Notes / Tools)</span>
                  </label>
                  <span className="text-[10px] text-[#888]">แสดงเป็นแท็กในหน้ารายละเอียด</span>
                </div>

                {/* Current Sensory Tags List */}
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-white rounded-xl border border-[#E5DFD7]">
                  {(formData.sensoryNotes || []).length === 0 ? (
                    <span className="text-[11px] text-[#999] italic py-0.5">ยังไม่มีรายการสัมผัส/เครื่องมือ กรุณาพิมพ์เพิ่มด้านล่าง</span>
                  ) : (
                    formData.sensoryNotes?.map((note, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF0F3] text-[#A82B5A] border border-[#F8DDE5] rounded-full text-xs font-medium"
                      >
                        <span>{note}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSensoryNote(idx)}
                          className="hover:text-rose-700 hover:bg-rose-100 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add new sensory note input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSensoryNoteInput}
                    onChange={(e) => setNewSensoryNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSensoryNote(newSensoryNoteInput);
                      }
                    }}
                    placeholder="พิมพ์เครื่องมือบำบัด เช่น Tibetan Singing Bowls แล้วกด Enter"
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSensoryNote(newSensoryNoteInput)}
                    className="px-3.5 py-2 bg-[#E84D84] text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer hover:bg-[#D43D73] transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="pt-1">
                  <span className="text-[10px] text-[#777] block mb-1">ตัวเลือกแนะนำ (คลิกเพื่อเพิ่มด่วน):</span>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_SENSORY_NOTES.map((suggested, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddSensoryNote(suggested)}
                        className="px-2 py-0.5 bg-[#FAF7F5] hover:bg-[#FCE3EB] hover:text-[#A82B5A] border border-[#E5DFD7] hover:border-[#F8DDE5] rounded-md text-[10px] text-[#666] transition-colors cursor-pointer"
                      >
                        + {suggested}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 11: Key Benefits (สิ่งที่คุณจะได้รับ) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#1E1E1E] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E84D84]" />
                    <span>สิ่งที่คุณจะได้รับ (Key Benefits)</span>
                  </label>
                  <span className="text-[10px] text-[#888]">แสดงเป็นเช็กลิสต์ในหน้ารายละเอียด</span>
                </div>

                {/* Current Benefits List */}
                <div className="space-y-1.5 p-2 bg-white rounded-xl border border-[#E5DFD7]">
                  {(formData.benefits || []).length === 0 ? (
                    <span className="text-[11px] text-[#999] italic py-0.5 block">ยังไม่มีรายการสิ่งที่จะได้รับ กรุณาพิมพ์เพิ่มด้านล่าง</span>
                  ) : (
                    formData.benefits?.map((benefit, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#FAF8F5] rounded-lg border border-[#EFE8E1] text-xs text-[#333]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Check className="w-3.5 h-3.5 text-[#E84D84] flex-shrink-0" />
                          <span className="truncate">{benefit}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(idx)}
                          className="text-[#999] hover:text-rose-600 p-0.5 cursor-pointer flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new benefit input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit(newBenefitInput);
                      }
                    }}
                    placeholder="พิมพ์ผลลัพธ์ที่จะได้รับ เช่น คืนสมดุลให้ร่างกายและจิตใจ แล้วกด Enter"
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddBenefit(newBenefitInput)}
                    className="px-3.5 py-2 bg-[#E84D84] text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer hover:bg-[#D43D73] transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>

                {/* Quick Add Benefit Suggestions */}
                <div className="pt-1">
                  <span className="text-[10px] text-[#777] block mb-1">ตัวเลือกแนะนำ (คลิกเพื่อเพิ่มด่วน):</span>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_BENEFITS.map((suggested, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddBenefit(suggested)}
                        className="px-2 py-0.5 bg-[#FAF7F5] hover:bg-[#FCE3EB] hover:text-[#A82B5A] border border-[#E5DFD7] hover:border-[#F8DDE5] rounded-md text-[10px] text-[#666] transition-colors cursor-pointer"
                      >
                        + {suggested}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 12: Preparation Tips (คำแนะนำการเตรียมตัว) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#1E1E1E] flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#E84D84]" />
                    <span>คำแนะนำการเตรียมตัว (Preparation Tips - Optional)</span>
                  </label>
                  <span className="text-[10px] text-[#888]">คำแนะนำสำหรับผู้เข้าร่วมกิจกรรม</span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-white rounded-xl border border-[#E5DFD7]">
                  {(formData.preparationTips || []).length === 0 ? (
                    <span className="text-[11px] text-[#999] italic py-0.5">ยังไม่มีคำแนะนำการเตรียมตัว</span>
                  ) : (
                    formData.preparationTips?.map((tip, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF7F5] text-[#555] border border-[#E5DFD7] rounded-full text-xs"
                      >
                        <span>{tip}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePrepTip(idx)}
                          className="hover:text-rose-700 rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrepTipInput}
                    onChange={(e) => setNewPrepTipInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrepTip(newPrepTipInput);
                      }
                    }}
                    placeholder="เช่น สวมใส่ชุดหลวมสบาย ไม่รัดแน่น"
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPrepTip(newPrepTipInput)}
                    className="px-3.5 py-2 bg-[#FAF0F3] hover:bg-[#FCE3EB] text-[#E84D84] border border-[#F8DDE5] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>
              </div>

              {/* Row 13: Special Star Highlight Toggle */}
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

      {/* Modal: Duplicate Event Across Months */}
      {duplicatingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E5DFD7] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E5DFD7] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF7EB] border border-[#FDE6B5] flex items-center justify-center text-[#E08A00]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1E1E]">คัดลอกอีเวนท์ข้ามเดือน</h3>
                  <p className="text-xs text-[#777]">Duplicate "{duplicatingEvent.name}" Across Months</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicatingEvent(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#888] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Info Snapshot */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1E1E1E] text-sm">{duplicatingEvent.name}</span>
                {duplicatingEvent.isSpecialStar && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF4D4] text-[#B27B00] border border-[#FEE180] text-[10px] font-bold">
                    ★ ไฮไลท์
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[#666] text-[11px] flex-wrap">
                <span>สาขา: {duplicatingEvent.branch}</span>
                <span>•</span>
                <span>เวลา: {duplicatingEvent.startTime} - {duplicatingEvent.endTime}</span>
                <span>•</span>
                <span>วันที่เดิม: {duplicatingEvent.dateDisplay} ({duplicatingEvent.dateStr})</span>
              </div>
              <p className="text-[11px] text-[#888] pt-1">
                💡 ระบบจะคัดลอกเนื้อหาทั้งหมด (รูปภาพ, ผู้สอน, ราคา, sensory notes, benefits) ไปยังวันเดียวกันของแต่ละเดือนเป้าหมาย (หากเดือนนั้นมีจำนวนวันน้อยกว่า จะปรับให้อัตโนมัติ)
              </p>
            </div>

            {/* Target Months List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#333]">เลือกเดือนเป้าหมายที่ต้องการสร้างอีเวนท์:</label>
                <button
                  type="button"
                  onClick={() => {
                    const lastTarget = duplicateTargetMonths[duplicateTargetMonths.length - 1];
                    const nextM = lastTarget ? (lastTarget.month === 12 ? 1 : lastTarget.month + 1) : (currentMonth === 11 ? 1 : currentMonth + 2);
                    const nextY = lastTarget ? (lastTarget.month === 12 ? lastTarget.year + 1 : lastTarget.year) : (currentMonth === 11 ? currentYear + 1 : currentYear);
                    setDuplicateTargetMonths([...duplicateTargetMonths, { year: nextY, month: nextM }]);
                  }}
                  className="px-2.5 py-1 bg-[#FAF0F3] hover:bg-[#FCE3EB] text-[#E84D84] border border-[#F8DDE5] rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มเดือนเป้าหมาย</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {duplicateTargetMonths.map((target, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7]">
                    <span className="text-xs font-bold text-[#888] w-5 text-center">{idx + 1}.</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <select
                        value={target.month}
                        onChange={(e) => {
                          const updated = [...duplicateTargetMonths];
                          updated[idx] = { ...updated[idx], month: Number(e.target.value) };
                          setDuplicateTargetMonths(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#E5DFD7] text-xs font-semibold focus:outline-none focus:border-[#E84D84]"
                      >
                        {TRANSLATIONS.th.monthNames.map((name, mIdx) => (
                          <option key={mIdx + 1} value={mIdx + 1}>
                            {mIdx + 1}. {name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={target.year}
                        onChange={(e) => {
                          const updated = [...duplicateTargetMonths];
                          updated[idx] = { ...updated[idx], year: Number(e.target.value) };
                          setDuplicateTargetMonths(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-[#E5DFD7] text-xs font-mono focus:outline-none focus:border-[#E84D84]"
                      >
                        {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                          <option key={y} value={y}>
                            {y} (พ.ศ. {y + 543})
                          </option>
                        ))}
                      </select>
                    </div>

                    {duplicateTargetMonths.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDuplicateTargetMonths(duplicateTargetMonths.filter((_, i) => i !== idx))}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD7]">
              <button
                type="button"
                onClick={() => setDuplicatingEvent(null)}
                disabled={isDuplicatingLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#666] hover:bg-black/5 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicateAcrossMonths}
                disabled={isDuplicatingLoading || duplicateTargetMonths.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E84D84] hover:bg-[#D43D73] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isDuplicatingLoading ? 'กำลังคัดลอก...' : `ยืนยันคัดลอก (${duplicateTargetMonths.length} เดือน)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastState && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 border ${
          toastState.type === 'error'
            ? 'bg-[#991B1B] border-rose-400/30'
            : 'bg-[#1E1E1E] border-emerald-500/30'
        }`}>
          {toastState.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 flex-shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-[#E84D84] flex-shrink-0" />
          )}
          <span>{toastState.message}</span>
        </div>
      )}
    </div>
  );
};
