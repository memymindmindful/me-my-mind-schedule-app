import React, { useState, useRef } from 'react';
import { StudioInfo } from '../../types';
import { Upload, Image as ImageIcon, Save, Check, RefreshCw } from 'lucide-react';

interface StudioInfoEditorProps {
  initialData: StudioInfo;
  onSave: (data: StudioInfo, logoFile?: File) => Promise<void>;
  isSaving: boolean;
}

export const StudioInfoEditor: React.FC<StudioInfoEditorProps> = ({ initialData, onSave, isSaving }) => {
  const [formData, setFormData] = useState<StudioInfo>(initialData);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialData.logoUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, logoFile || undefined);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-2xs space-y-6">
        <div className="border-b border-[#EFE8E1] pb-4">
          <h3 className="text-base font-bold text-[#1E1E1E]">1. ข้อมูลแบรนด์และสตูดิโอ (Studio Branding)</h3>
          <p className="text-xs text-[#777] mt-0.5">
            กำหนดชื่อสตูดิโอ คำโปรย (Tagline) โลโก้ และการตั้งค่าภาษาเริ่มต้น
          </p>
        </div>

        {/* Logo Upload & Preview */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#333]">
            โลโก้สตูดิโอ (Studio Logo)
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#FAF7F5] border-2 border-dashed border-[#DDD5CC] flex items-center justify-center overflow-hidden shrink-0 relative group">
              {logoPreview ? (
                <img src={logoPreview} alt="Studio Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#E84D84] text-white font-bold flex items-center justify-center text-base">
                  M
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-[#FAF7F5] hover:bg-[#FAF0F3] text-[#333] hover:text-[#E84D84] border border-[#E5DFD7] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoPreview ? 'เปลี่ยนรูปภาพโลโก้' : 'อัปโหลดโลโก้'}</span>
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ลบโลโก้
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#888]">
                แนะนำเป็นไฟล์ PNG/JPG หรือ WebP พื้นหลังโปร่งใส ขนาดไม่เกิน 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Studio Name TH & EN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              ชื่อสตูดิโอ (ภาษาไทย) <span className="text-[#E84D84]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.studioNameTh}
              onChange={e => setFormData(prev => ({ ...prev, studioNameTh: e.target.value }))}
              placeholder="Me.My.Mind Mindfulness Studio"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              ชื่อสตูดิโอ (ภาษาอังกฤษ) <span className="text-[#E84D84]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.studioNameEn}
              onChange={e => setFormData(prev => ({ ...prev, studioNameEn: e.target.value }))}
              placeholder="Me.My.Mind Mindfulness Studio"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>
        </div>

        {/* Tagline TH & EN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              คำโปรย / Tagline (ภาษาไทย)
            </label>
            <textarea
              rows={2}
              value={formData.taglineTh}
              onChange={e => setFormData(prev => ({ ...prev, taglineTh: e.target.value }))}
              placeholder="Your Daily Rituals of Self-Love"
              className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333]">
              คำโปรย / Tagline (ภาษาอังกฤษ)
            </label>
            <textarea
              rows={2}
              value={formData.taglineEn}
              onChange={e => setFormData(prev => ({ ...prev, taglineEn: e.target.value }))}
              placeholder="Your Daily Rituals of Self-Love"
              className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5] resize-none"
            />
          </div>
        </div>

        {/* General Locale Settings */}
        <div className="pt-4 border-t border-[#EFE8E1]">
          <h4 className="text-xs font-bold text-[#333] mb-3">การตั้งค่าแสดงผลเริ่มต้น (System Localization)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555]">ภาษาเริ่มต้น</label>
              <select
                value={formData.defaultLanguage}
                onChange={e => setFormData(prev => ({ ...prev, defaultLanguage: e.target.value as 'th' | 'en' }))}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
              >
                <option value="th">ภาษาไทย (Thai)</option>
                <option value="en">English (อังกฤษ)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555]">สกุลเงินที่แสดง</label>
              <input
                type="text"
                value={formData.currency}
                onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="THB"
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#555]">รูปแบบเวลา</label>
              <select
                value={formData.timeFormat}
                onChange={e => setFormData(prev => ({ ...prev, timeFormat: e.target.value as '24h' | '12h' }))}
                className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
              >
                <option value="24h">24-hour (เช่น 14:00 น.)</option>
                <option value="12h">12-hour (เช่น 2:00 PM)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> บันทึกข้อมูลเรียบร้อยแล้ว
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
              <span>บันทึกข้อมูลสตูดิโอ (Save Studio Info)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
