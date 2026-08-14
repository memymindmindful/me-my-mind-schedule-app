import React, { useState, useRef } from 'react';
import { FacilitatorProfile } from '../../types';
import { Upload, Plus, Trash2, ArrowUp, ArrowDown, Save, Check, RefreshCw, Award, User } from 'lucide-react';

interface FacilitatorEditorProps {
  initialData: FacilitatorProfile;
  onSave: (data: FacilitatorProfile, photoFile?: File) => Promise<void>;
  isSaving: boolean;
}

export const FacilitatorEditor: React.FC<FacilitatorEditorProps> = ({ initialData, onSave, isSaving }) => {
  const [formData, setFormData] = useState<FacilitatorProfile>(initialData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData.photoUrl || '');
  const [newCertInput, setNewCertInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFormData(prev => ({ ...prev, photoUrl: '' }));
  };

  // Add certification
  const handleAddCert = () => {
    const trimmed = newCertInput.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, trimmed]
    }));
    setNewCertInput('');
  };

  // Remove certification
  const handleRemoveCert = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, idx) => idx !== index)
    }));
  };

  // Move certification up/down
  const handleMoveCert = (index: number, direction: 'up' | 'down') => {
    const certs = [...formData.certifications];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= certs.length) return;
    const temp = certs[index];
    certs[index] = certs[targetIdx];
    certs[targetIdx] = temp;
    setFormData(prev => ({ ...prev, certifications: certs }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, photoFile || undefined);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-2xs space-y-6">
        <div className="border-b border-[#EFE8E1] pb-4">
          <h3 className="text-base font-bold text-[#1E1E1E]">2. ข้อมูลครูและผู้บำบัด (Facilitator Profile)</h3>
          <p className="text-xs text-[#777] mt-0.5">
            จัดการรูปภาพโปรไฟล์ ชื่อ ตำแหน่ง คำแนะนำตัว และประกาศนียบัตรรับรอง (Certifications)
          </p>
        </div>

        {/* Facilitator Photo & Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#333]">
            รูปถ่ายครูผู้สอน / ผู้บำบัด (Facilitator Photo)
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-24 h-24 rounded-2xl bg-[#FAF7F5] border-2 border-dashed border-[#DDD5CC] flex items-center justify-center overflow-hidden shrink-0 relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Facilitator" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#999]">
                  <User className="w-8 h-8 stroke-1" />
                  <span className="text-[10px] mt-1">ไม่มีรูปภาพ</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
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
                  className="px-3.5 py-1.5 bg-[#FAF7F5] hover:bg-[#FAF0F3] text-[#333] hover:text-[#E84D84] border border-[#E5DFD7] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoPreview ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพครู'}</span>
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
              <p className="text-[11px] text-[#888]">
                ภาพบุคคลแนวตั้ง แนะนำขนาด 400x400px ขึ้นไป ไฟล์ JPG/PNG/WebP
              </p>
            </div>
          </div>
        </div>

        {/* Names & Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              ชื่อ-นามสกุล (ภาษาไทย) <span className="text-[#E84D84]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nameTh}
              onChange={e => setFormData(prev => ({ ...prev, nameTh: e.target.value }))}
              placeholder="ครูบีเวอร์ (ศุภพิชญ์)"
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
              value={formData.nameEn}
              onChange={e => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
              placeholder="Kru Beever (Supapit)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              ตำแหน่ง / Role (ภาษาไทย)
            </label>
            <input
              type="text"
              value={formData.titleTh}
              onChange={e => setFormData(prev => ({ ...prev, titleTh: e.target.value }))}
              placeholder="ผู้ก่อตั้ง & ผู้เชี่ยวชาญการบำบัด Somatic Alchemy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              ตำแหน่ง / Role (ภาษาอังกฤษ)
            </label>
            <input
              type="text"
              value={formData.titleEn}
              onChange={e => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
              placeholder="Founder & Lead Somatic Alchemist"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>
        </div>

        {/* Short Bio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              คำแนะนำตัวแบบย่อ (ไทย)
            </label>
            <textarea
              rows={3}
              value={formData.bioShortTh}
              onChange={e => setFormData(prev => ({ ...prev, bioShortTh: e.target.value }))}
              placeholder="ผู้บำบัดคลื่นเสียงและศาสตร์นวดหน้ายกกระชับ..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              Short Bio (English)
            </label>
            <textarea
              rows={3}
              value={formData.bioShortEn}
              onChange={e => setFormData(prev => ({ ...prev, bioShortEn: e.target.value }))}
              placeholder="Certified Sound Healing Practitioner, Advanced Facial Massage Ritualist..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5] resize-none"
            />
          </div>
        </div>

        {/* Certifications Manager */}
        <div className="pt-4 border-t border-[#EFE8E1] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#333] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#E84D84]" />
                <span>ใบประกาศนียบัตร & วุฒิบัตรรับรอง (Certifications)</span>
              </h4>
              <p className="text-[11px] text-[#777]">แสดงเป็นรายการเครื่องหมายถูกในหน้าแนะนำครู</p>
            </div>
            <span className="text-xs text-[#888] font-medium">
              {formData.certifications.length} รายการ
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
              className="px-4 py-2 bg-[#FAF7F5] hover:bg-[#FAF0F3] text-[#333] hover:text-[#E84D84] border border-[#E5DFD7] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่ม</span>
            </button>
          </div>

          {/* Cert List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {formData.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-[#FAF8F5] border border-[#EBE3DA] rounded-xl text-xs group"
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
                    disabled={index === formData.certifications.length - 1}
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
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> บันทึกข้อมูลครูเรียบร้อยแล้ว
          </span>
        )}
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
              <span>บันทึกโปรไฟล์ครู (Save Profile)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
