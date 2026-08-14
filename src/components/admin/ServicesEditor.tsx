import React, { useState } from 'react';
import { ServiceItem, OfferingCategory } from '../../types';
import { Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Save, Sparkles, Clock, DollarSign } from 'lucide-react';

interface ServicesEditorProps {
  services: ServiceItem[];
  onSaveService: (service: ServiceItem, photoFile?: File) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  isSaving: boolean;
}

const CATEGORIES: OfferingCategory[] = [
  'Sound Healing / Sound Baths',
  'Facial Massage Rituals',
  'Workshops & Training',
  'Kundalini Yoga',
  'Reiki',
  'Corporate Workshops'
];

export const ServicesEditor: React.FC<ServicesEditorProps> = ({
  services,
  onSaveService,
  onDeleteService,
  isSaving
}) => {
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStartCreate = () => {
    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      nameTh: '',
      nameEn: '',
      category: 'Sound Healing / Sound Baths',
      descriptionTh: '',
      descriptionEn: '',
      basePrice: 950,
      durationMinutes: 90,
      isActive: true,
      displayOrder: services.length + 1
    };
    setEditingService(newService);
    setIsNew(true);
  };

  const handleStartEdit = (service: ServiceItem) => {
    setEditingService({ ...service });
    setIsNew(false);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    await onSaveService(editingService);
    setToastMessage(isNew ? 'เพิ่มบริการใหม่เรียบร้อยแล้ว' : 'อัปเดตบริการเรียบร้อยแล้ว');
    setEditingService(null);
    setIsNew(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบริการ "${name}"?`)) {
      await onDeleteService(id);
      setToastMessage('ลบบริการเรียบร้อยแล้ว');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleToggleActive = async (service: ServiceItem) => {
    const updated = { ...service, isActive: !service.isActive };
    await onSaveService(updated);
    setToastMessage(updated.isActive ? 'เปิดแสดงบริการแล้ว' : 'ซ่อนบริการแล้ว');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8E1] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1E1E1E]">4. บริการและเวิร์กช็อป (Services & Offerings)</h3>
            <p className="text-xs text-[#777] mt-0.5">
              จัดการรายการบำบัด คลาสโยคะ เวิร์กช็อป ราคาเริ่มต้น และระยะเวลา
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 bg-[#FAF0F3] text-[#E84D84] hover:bg-[#FCE6EC] border border-[#F8DDE5] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มบริการใหม่ (Add Service)</span>
          </button>
        </div>

        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(srv => (
            <div
              key={srv.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                srv.isActive ? 'bg-[#FAF8F5] border-[#E8E1D8]' : 'bg-gray-50/70 border-gray-200 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF0F3] text-[#E84D84] text-[10px] font-bold">
                    {srv.category}
                  </span>
                  <span className="text-xs font-bold text-[#1E1E1E]">
                    ฿{srv.basePrice.toLocaleString()}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-[#1E1E1E]">
                  {srv.nameTh || srv.nameEn}
                </h4>
                {srv.nameEn && srv.nameTh && (
                  <p className="text-[11px] text-[#888] font-medium">
                    {srv.nameEn}
                  </p>
                )}

                <p className="text-[11px] text-[#666] line-clamp-2">
                  {srv.descriptionTh || srv.descriptionEn}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-[#888] pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{srv.durationMinutes} นาที</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => handleToggleActive(srv)}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                    srv.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-200'
                  }`}
                  title={srv.isActive ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
                >
                  {srv.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{srv.isActive ? 'แสดงอยู่' : 'ซ่อนไว้'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(srv)}
                    className="p-1.5 rounded-lg text-[#555] hover:text-[#1E1E1E] hover:bg-black/5 transition-colors cursor-pointer"
                    title="แก้ไขบริการ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(srv.id, srv.nameTh || srv.nameEn)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="ลบบริการ"
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
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E5DFD7] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8E1] pb-3">
              <h4 className="text-sm font-bold text-[#1E1E1E]">
                {isNew ? '✨ เพิ่มบริการ / เวิร์กช็อปใหม่' : '✏️ แก้ไขข้อมูลบริการ'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 rounded-lg text-[#888] hover:text-[#1E1E1E] hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#333]">หมวดหมู่บริการ (Category) *</label>
                <select
                  value={editingService.category}
                  onChange={e => setEditingService(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ชื่อบริการ (ภาษาไทย) *</label>
                  <input
                    type="text"
                    required
                    value={editingService.nameTh}
                    onChange={e => setEditingService(prev => prev ? ({ ...prev, nameTh: e.target.value }) : null)}
                    placeholder="เช่น Sound Healing & Sound Baths"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ชื่อบริการ (ภาษาอังกฤษ) *</label>
                  <input
                    type="text"
                    required
                    value={editingService.nameEn}
                    onChange={e => setEditingService(prev => prev ? ({ ...prev, nameEn: e.target.value }) : null)}
                    placeholder="e.g. Tibetan & Quartz Sound Bath"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ราคาเริ่มต้น (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={editingService.basePrice}
                    onChange={e => setEditingService(prev => prev ? ({ ...prev, basePrice: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ระยะเวลา (นาที) *</label>
                  <input
                    type="number"
                    required
                    value={editingService.durationMinutes}
                    onChange={e => setEditingService(prev => prev ? ({ ...prev, durationMinutes: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#333]">รายละเอียดบริการ (ภาษาไทย)</label>
                <textarea
                  rows={3}
                  value={editingService.descriptionTh}
                  onChange={e => setEditingService(prev => prev ? ({ ...prev, descriptionTh: e.target.value }) : null)}
                  placeholder="คำอธิบายสั้นๆ เกี่ยวกับประโยชน์และขั้นตอนการบำบัด..."
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#333]">รายละเอียดบริการ (ภาษาอังกฤษ)</label>
                <textarea
                  rows={3}
                  value={editingService.descriptionEn}
                  onChange={e => setEditingService(prev => prev ? ({ ...prev, descriptionEn: e.target.value }) : null)}
                  placeholder="Short description about healing benefits..."
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-[#FAF7F5] hover:bg-black/5 text-[#666] rounded-xl text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#E84D84] hover:bg-[#D43D73] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกบริการ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
