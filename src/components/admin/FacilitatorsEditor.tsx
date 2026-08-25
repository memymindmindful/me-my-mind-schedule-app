import React, { useState, useRef } from 'react';
import { FacilitatorProfile } from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  User, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  Upload, 
  Award, 
  ArrowUp, 
  ArrowDown, 
  Phone, 
  Mail, 
  Instagram, 
  MessageCircle,
  Sparkles
} from 'lucide-react';

interface FacilitatorsEditorProps {
  facilitators: FacilitatorProfile[];
  onSaveFacilitator: (facilitator: FacilitatorProfile, photoFile?: File) => Promise<void>;
  onDeleteFacilitator: (id: string) => Promise<void>;
  isSaving: boolean;
}

export const FacilitatorsEditor: React.FC<FacilitatorsEditorProps> = ({
  facilitators,
  onSaveFacilitator,
  onDeleteFacilitator,
  isSaving
}) => {
  const [editingFacilitator, setEditingFacilitator] = useState<FacilitatorProfile | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [newCertInput, setNewCertInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreate = () => {
    const newFacilitator: FacilitatorProfile = {
      id: `fac-${Date.now()}`,
      nameTh: '',
      nameEn: '',
      titleTh: 'ผู้บำบัด / ครูผู้สอน',
      titleEn: 'Facilitator & Sound Guide',
      photoUrl: '',
      bioShortTh: '',
      bioShortEn: '',
      bioLongTh: '',
      bioLongEn: '',
      certifications: [],
      lineOa: '@me.my.mind.mindful',
      email: '',
      phone: '',
      instagram: '',
      isActive: true,
      displayOrder: facilitators.length + 1
    };
    setEditingFacilitator(newFacilitator);
    setIsNew(true);
    setPhotoFile(null);
    setPhotoPreview('');
    setNewCertInput('');
  };

  const handleStartEdit = (facilitator: FacilitatorProfile) => {
    setEditingFacilitator({ ...facilitator });
    setIsNew(false);
    setPhotoFile(null);
    setPhotoPreview(facilitator.photoUrl || '');
    setNewCertInput('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (editingFacilitator) {
      setEditingFacilitator(prev => prev ? { ...prev, photoUrl: '' } : null);
    }
  };

  const handleAddCert = () => {
    const trimmed = newCertInput.trim();
    if (!trimmed || !editingFacilitator) return;
    setEditingFacilitator(prev => prev ? {
      ...prev,
      certifications: [...(prev.certifications || []), trimmed]
    } : null);
    setNewCertInput('');
  };

  const handleRemoveCert = (index: number) => {
    if (!editingFacilitator) return;
    setEditingFacilitator(prev => prev ? {
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== index)
    } : null);
  };

  const handleMoveCert = (index: number, direction: 'up' | 'down') => {
    if (!editingFacilitator) return;
    const certs = [...editingFacilitator.certifications];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= certs.length) return;
    const temp = certs[index];
    certs[index] = certs[targetIdx];
    certs[targetIdx] = temp;
    setEditingFacilitator(prev => prev ? { ...prev, certifications: certs } : null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacilitator) return;

    await onSaveFacilitator(editingFacilitator, photoFile || undefined);
    setToastMessage(isNew ? 'เพิ่มโปรไฟล์ครูผู้สอนเรียบร้อยแล้ว' : 'อัปเดตข้อมูลครูผู้สอนเรียบร้อยแล้ว');
    setEditingFacilitator(null);
    setIsNew(false);
    setPhotoFile(null);
    setPhotoPreview('');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (facilitators.length <= 1) {
      alert('ไม่สามารถลบโปรไฟล์ครูคนสุดท้ายได้ กรุณาเก็บไว้อย่างน้อย 1 ท่าน');
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ครูผู้สอน "${name}"? (คลาสที่เคยผูกไว้จะปรับไปใช้ค่าเริ่มต้น)`)) {
      await onDeleteFacilitator(id);
      setToastMessage('ลบโปรไฟล์ครูเรียบร้อยแล้ว');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleToggleActive = async (facilitator: FacilitatorProfile) => {
    const updated = { ...facilitator, isActive: !facilitator.isActive };
    await onSaveFacilitator(updated);
    setToastMessage(updated.isActive ? 'เปิดแสดงโปรไฟล์ครูแล้ว' : 'ปิดการแสดงผลโปรไฟล์ครูแล้ว');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8E1] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1E1E1E]">2. รายชื่อครูผู้สอนและผู้บำบัด (Facilitators & Instructors)</h3>
            <p className="text-xs text-[#777] mt-0.5">
              จัดการโปรไฟล์ครูผู้สอน เพิ่มผู้เชี่ยวชาญท่านใหม่ วุฒิบัตรรับรอง และเปิด/ปิดการแสดงผลในหน้าเว็บ
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 bg-[#FAF0F3] text-[#E84D84] hover:bg-[#FCE6EC] border border-[#F8DDE5] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มครูผู้สอนใหม่ (Add Facilitator)</span>
          </button>
        </div>

        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Facilitators Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilitators.map(fac => (
            <div
              key={fac.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                fac.isActive ? 'bg-[#FAF8F5] border-[#E8E1D8]' : 'bg-gray-50/70 border-gray-200 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Header with Avatar & Name */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#FAF0F3] border border-[#F8DDE5] shrink-0 flex items-center justify-center">
                    {fac.photoUrl ? (
                      <img src={fac.photoUrl} alt={fac.nameEn || fac.nameTh} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#E84D84] text-white flex items-center justify-center font-bold text-sm">
                        {(fac.nameEn || fac.nameTh || 'FB').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-[#1E1E1E] truncate">
                        {fac.nameTh || fac.nameEn}
                      </h4>
                      {fac.id === 'default' && (
                        <span className="px-1.5 py-0.5 bg-[#FAF0F3] text-[#E84D84] text-[9px] font-bold rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    {fac.nameEn && fac.nameTh && (
                      <p className="text-[10px] text-[#888] truncate">{fac.nameEn}</p>
                    )}
                    <p className="text-[11px] text-[#E84D84] font-semibold truncate mt-0.5">
                      {fac.titleTh || fac.titleEn}
                    </p>
                  </div>
                </div>

                {/* Short Bio snippet */}
                {(fac.bioShortTh || fac.bioShortEn) && (
                  <p className="text-[11px] text-[#666] line-clamp-2 leading-relaxed">
                    {fac.bioShortTh || fac.bioShortEn}
                  </p>
                )}

                {/* Certifications Badge count */}
                {fac.certifications && fac.certifications.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#555] bg-white/80 px-2.5 py-1 rounded-lg border border-[#EFE8E1]">
                    <Award className="w-3 h-3 text-[#E84D84] shrink-0" />
                    <span>{fac.certifications.length} วุฒิบัตรรับรอง (Certifications)</span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => handleToggleActive(fac)}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                    fac.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-200'
                  }`}
                  title={fac.isActive ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
                >
                  {fac.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{fac.isActive ? 'แสดงอยู่' : 'ซ่อนไว้'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(fac)}
                    className="p-1.5 text-[#555] hover:text-[#1E1E1E] hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="แก้ไขโปรไฟล์"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(fac.id, fac.nameTh || fac.nameEn)}
                    disabled={facilitators.length <= 1}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                    title={facilitators.length <= 1 ? 'ไม่สามารถลบโปรไฟล์คนสุดท้ายได้' : 'ลบโปรไฟล์'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editingFacilitator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD7] shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EFE8E1] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FAF0F3] text-[#E84D84] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1E1E]">
                    {isNew ? 'เพิ่มโปรไฟล์ครูผู้สอนใหม่' : `แก้ไขโปรไฟล์: ${editingFacilitator.nameTh || editingFacilitator.nameEn}`}
                  </h3>
                  <p className="text-xs text-[#777]">กรอกรายละเอียด วุฒิบัตร และช่องทางติดต่อ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFacilitator(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-5">
              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#333]">
                  รูปถ่ายครูผู้สอน / ผู้บำบัด (Facilitator Photo)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-[#FAF7F5] border-2 border-dashed border-[#DDD5CC] flex items-center justify-center overflow-hidden shrink-0 relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Facilitator" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#999]">
                        <User className="w-6 h-6 stroke-1" />
                        <span className="text-[9px] mt-0.5">ไม่มีรูป</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#FAF7F5] hover:bg-[#FAF0F3] text-[#333] hover:text-[#E84D84] border border-[#E5DFD7] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{photoPreview ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}</span>
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          ลบรูปภาพ
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#888]">
                      แนะนำรูปสี่เหลี่ยมจัตุรัส 400x400px ขึ้นไป ไฟล์ JPG/PNG/WebP
                    </p>
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333]">
                    ชื่อ-นามสกุล (ภาษาไทย) <span className="text-[#E84D84]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFacilitator.nameTh}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, nameTh: e.target.value }) : null)}
                    placeholder="เช่น ครูบีเวอร์ (ศุภพิชญ์)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333]">
                    ชื่อ-นามสกุล (ภาษาอังกฤษ) <span className="text-[#E84D84]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFacilitator.nameEn}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, nameEn: e.target.value }) : null)}
                    placeholder="เช่น Kru Beever (Supapit)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333]">
                    ตำแหน่ง / Role (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={editingFacilitator.titleTh}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, titleTh: e.target.value }) : null)}
                    placeholder="เช่น ผู้เชี่ยวชาญการบำบัด Somatic Alchemy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333]">
                    ตำแหน่ง / Role (ภาษาอังกฤษ)
                  </label>
                  <input
                    type="text"
                    value={editingFacilitator.titleEn}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, titleEn: e.target.value }) : null)}
                    placeholder="เช่น Lead Somatic Alchemist"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Short Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333]">
                    คำแนะนำตัวแบบย่อ (ไทย)
                  </label>
                  <textarea
                    rows={3}
                    value={editingFacilitator.bioShortTh}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, bioShortTh: e.target.value }) : null)}
                    placeholder="คำแนะนำตัวสั้นๆ แสดงในหน้าปฏิทินและรายละเอียดเซสชัน..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5] resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333]">
                    Short Bio (English)
                  </label>
                  <textarea
                    rows={3}
                    value={editingFacilitator.bioShortEn}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, bioShortEn: e.target.value }) : null)}
                    placeholder="Brief intro for international guests..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5] resize-none"
                  />
                </div>
              </div>

              {/* Certifications Manager */}
              <div className="pt-2 border-t border-[#EFE8E1] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#E84D84]" />
                    <span>ใบประกาศนียบัตร & วุฒิบัตรรับรอง (Certifications)</span>
                  </label>
                  <span className="text-[11px] text-[#888]">
                    {editingFacilitator.certifications?.length || 0} รายการ
                  </span>
                </div>

                {/* Add Cert Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertInput}
                    onChange={e => setNewCertInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCert();
                      }
                    }}
                    placeholder="เพิ่มวุฒิบัตรใหม่ เช่น Certified Sound Healing Alchemist..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-4 py-2 bg-[#FAF7F5] hover:bg-[#FAF0F3] text-[#333] hover:text-[#E84D84] border border-[#E5DFD7] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่ม</span>
                  </button>
                </div>

                {/* Cert List */}
                {editingFacilitator.certifications && editingFacilitator.certifications.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {editingFacilitator.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#EBE3DA] rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E84D84] shrink-0" />
                          <span className="text-[#333] font-medium">{cert}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveCert(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded text-[#888] hover:text-[#333] disabled:opacity-30 cursor-pointer"
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCert(index, 'down')}
                            disabled={index === editingFacilitator.certifications.length - 1}
                            className="p-1 rounded text-[#888] hover:text-[#333] disabled:opacity-30 cursor-pointer"
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCert(index)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact & Social info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EFE8E1]">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>LINE Official Account</span>
                  </label>
                  <input
                    type="text"
                    value={editingFacilitator.lineOa || ''}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, lineOa: e.target.value }) : null)}
                    placeholder="@me.my.mind.mindful"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>Instagram</span>
                  </label>
                  <input
                    type="text"
                    value={editingFacilitator.instagram || ''}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, instagram: e.target.value }) : null)}
                    placeholder="@me.my.mind.mindful"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Display Order & Active */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EFE8E1]">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#333]">ลำดับการแสดงผล:</label>
                  <input
                    type="number"
                    min={1}
                    value={editingFacilitator.displayOrder}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }) : null)}
                    className="w-20 px-3 py-1.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFacilitator.isActive}
                    onChange={e => setEditingFacilitator(prev => prev ? ({ ...prev, isActive: e.target.checked }) : null)}
                    className="w-4 h-4 text-[#E84D84] rounded border-gray-300 focus:ring-[#E84D84]"
                  />
                  <span className="text-xs font-bold text-[#333]">เปิดแสดงผลในเว็บไซต์ (Active)</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => setEditingFacilitator(null)}
                  className="px-5 py-2.5 text-xs font-bold text-[#666] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#E84D84] hover:bg-[#D43D73] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกโปรไฟล์ครู</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
