import React, { useState } from 'react';
import { ContactInfo } from '../../types';
import { Save, Check, RefreshCw, MessageCircle, Mail, Phone, Instagram, Facebook, Globe } from 'lucide-react';

interface ContactInfoEditorProps {
  initialData: ContactInfo;
  onSave: (data: ContactInfo) => Promise<void>;
  isSaving: boolean;
}

export const ContactInfoEditor: React.FC<ContactInfoEditorProps> = ({ initialData, onSave, isSaving }) => {
  const [formData, setFormData] = useState<ContactInfo>(initialData);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-2xs space-y-6">
        <div className="border-b border-[#EFE8E1] pb-4">
          <h3 className="text-base font-bold text-[#1E1E1E]">5. ช่องทางการติดต่อ & โซเชียลมีเดีย (Contact & Social)</h3>
          <p className="text-xs text-[#777] mt-0.5">
            กำหนดช่องทางสำหรับลูกค้าติดต่อ จองคิว และสอบถามข้อมูลเพิ่มเติม
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LINE OA */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#06C755]" />
              <span>LINE Official Account ID <span className="text-[#E84D84]">*</span></span>
            </label>
            <input
              type="text"
              required
              value={formData.lineOa}
              onChange={e => setFormData(prev => ({ ...prev, lineOa: e.target.value }))}
              placeholder="@me.my.mind.mindful"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>

          {/* LINE URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#06C755]" />
              <span>LINE Deep Link (ลิงก์กดคุย)</span>
            </label>
            <input
              type="url"
              value={formData.lineUrl}
              onChange={e => setFormData(prev => ({ ...prev, lineUrl: e.target.value }))}
              placeholder="https://line.me/R/oaMessage/@me.my.mind.mindful"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#E84D84]" />
              <span>อีเมล (Email)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="me.my.mind.facialmassage@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#E84D84]" />
              <span>เบอร์โทรศัพท์ติดต่อ (Phone)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="081-xxx-xxxx"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-[#E1306C]" />
              <span>Instagram (@username)</span>
            </label>
            <input
              type="text"
              value={formData.instagram}
              onChange={e => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
              placeholder="@me.my.mind.mindful"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              <span>Facebook Fanpage</span>
            </label>
            <input
              type="text"
              value={formData.facebook}
              onChange={e => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
              placeholder="Me.My.Mind Mindfulness Studio"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-[#333] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#E84D84]" />
              <span>เว็บไซต์ (Website / Domain)</span>
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="me-my-mind.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5CC] text-xs focus:outline-none focus:border-[#E84D84] bg-[#FAF8F5]"
            />
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4" /> บันทึกข้อมูลการติดต่อเรียบร้อยแล้ว
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
              <span>บันทึกช่องทางติดต่อ (Save Contact Info)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
