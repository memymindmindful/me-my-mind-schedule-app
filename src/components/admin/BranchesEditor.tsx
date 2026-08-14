import React, { useState } from 'react';
import { BranchItem, BranchLocation } from '../../types';
import { Plus, Edit2, Trash2, Check, X, MapPin, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';

interface BranchesEditorProps {
  branches: BranchItem[];
  onSaveBranch: (branch: BranchItem, photoFile?: File) => Promise<void>;
  onDeleteBranch: (id: string) => Promise<void>;
  isSaving: boolean;
}

export const BranchesEditor: React.FC<BranchesEditorProps> = ({
  branches,
  onSaveBranch,
  onDeleteBranch,
  isSaving
}) => {
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStartCreate = () => {
    const newBranch: BranchItem = {
      id: `branch-${Date.now()}`,
      branchKey: 'Nakhonsawan',
      nameTh: '',
      nameEn: '',
      taglineTh: '',
      taglineEn: '',
      addressTh: '',
      addressEn: '',
      landmarkTh: '',
      landmarkEn: '',
      dotColor: '#E84D84',
      pillBg: '#F9D7E1',
      textColor: '#8E2849',
      isActive: true,
      displayOrder: branches.length + 1
    };
    setEditingBranch(newBranch);
    setIsNew(true);
  };

  const handleStartEdit = (branch: BranchItem) => {
    setEditingBranch({ ...branch });
    setIsNew(false);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    await onSaveBranch(editingBranch);
    setToastMessage(isNew ? 'เพิ่มสาขาเรียบร้อยแล้ว' : 'อัปเดตสาขาเรียบร้อยแล้ว');
    setEditingBranch(null);
    setIsNew(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสาขา "${name}"?`)) {
      await onDeleteBranch(id);
      setToastMessage('ลบสาขาเรียบร้อยแล้ว');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleToggleActive = async (branch: BranchItem) => {
    const updated = { ...branch, isActive: !branch.isActive };
    await onSaveBranch(updated);
    setToastMessage(updated.isActive ? 'เปิดใช้งานสาขาแล้ว' : 'ปิดการแสดงผลสาขาแล้ว');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DFD7] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE8E1] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1E1E1E]">3. การจัดการสาขาสตูดิโอ (Studio Branches)</h3>
            <p className="text-xs text-[#777] mt-0.5">
              แก้ไขข้อมูลที่ตั้ง จุดสังเกต สีแถบประจำสาขา และเปิด/ปิดการแสดงผลในหน้าเว็บ
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 bg-[#FAF0F3] text-[#E84D84] hover:bg-[#FCE6EC] border border-[#F8DDE5] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสาขาใหม่ (Add Branch)</span>
          </button>
        </div>

        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Branches Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <div
              key={branch.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                branch.isActive ? 'bg-[#FAF8F5] border-[#E8E1D8]' : 'bg-gray-50/70 border-gray-200 opacity-60'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: branch.dotColor }}
                    />
                    <span className="font-bold text-xs text-[#1E1E1E]">
                      {branch.nameTh || branch.nameEn}
                    </span>
                  </div>
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md"
                    style={{
                      backgroundColor: branch.pillBg,
                      color: branch.textColor,
                      border: branch.dotColor === '#FFFFFF' ? '1px solid #CCC' : 'none'
                    }}
                  >
                    {branch.branchKey}
                  </span>
                </div>

                <p className="text-[11px] text-[#E84D84] font-medium">
                  {branch.taglineTh || branch.taglineEn}
                </p>

                <div className="text-[11px] text-[#666] space-y-1">
                  <p className="line-clamp-2">📍 {branch.addressTh || branch.addressEn}</p>
                  {(branch.landmarkTh || branch.landmarkEn) && (
                    <p className="text-[10px] text-[#888] italic">
                      ✨ {branch.landmarkTh || branch.landmarkEn}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => handleToggleActive(branch)}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                    branch.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-200'
                  }`}
                  title={branch.isActive ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
                >
                  {branch.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{branch.isActive ? 'แสดงอยู่' : 'ซ่อนไว้'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(branch)}
                    className="p-1.5 rounded-lg text-[#555] hover:text-[#1E1E1E] hover:bg-black/5 transition-colors cursor-pointer"
                    title="แก้ไขข้อมูลสาขา"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(branch.id, branch.nameTh || branch.nameEn)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="ลบสาขา"
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
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E5DFD7] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8E1] pb-3">
              <h4 className="text-sm font-bold text-[#1E1E1E]">
                {isNew ? '✨ เพิ่มสาขาสตูดิโอใหม่' : '✏️ แก้ไขข้อมูลสาขา'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="p-1 rounded-lg text-[#888] hover:text-[#1E1E1E] hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">คีย์ระบุสาขา (Branch Key)</label>
                  <select
                    value={editingBranch.branchKey}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, branchKey: e.target.value as BranchLocation }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  >
                    <option value="Nakhonsawan">Nakhonsawan (นครสวรรค์)</option>
                    <option value="Ratchathewi">Ratchathewi (ราชเทวี)</option>
                    <option value="On-Tour">On-Tour (ออนทัวร์)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    value={editingBranch.displayOrder}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, displayOrder: Number(e.target.value) }) : null)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ชื่อสาขา (ภาษาไทย) *</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.nameTh}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, nameTh: e.target.value }) : null)}
                    placeholder="สาขาราชเทวี กรุงเทพฯ"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">ชื่อสาขา (ภาษาอังกฤษ) *</label>
                  <input
                    type="text"
                    required
                    value={editingBranch.nameEn}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, nameEn: e.target.value }) : null)}
                    placeholder="Bangkok City Loft (Ratchathewi)"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">คำโปรยสาขา (ไทย)</label>
                  <input
                    type="text"
                    value={editingBranch.taglineTh}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, taglineTh: e.target.value }) : null)}
                    placeholder="สตูดิโอกลางเมือง & เวิร์กช็อปสุดสัปดาห์"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">คำโปรยสาขา (อังกฤษ)</label>
                  <input
                    type="text"
                    value={editingBranch.taglineEn}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, taglineEn: e.target.value }) : null)}
                    placeholder="Bangkok City Loft & Weekend Workshop Space"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#333]">ที่อยู่ (ภาษาไทย)</label>
                <textarea
                  rows={2}
                  value={editingBranch.addressTh}
                  onChange={e => setEditingBranch(prev => prev ? ({ ...prev, addressTh: e.target.value }) : null)}
                  placeholder="อาคารพญาไทพลาซ่า ชั้น 5 ถนนพญาไท ราชเทวี กรุงเทพฯ 10400"
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#333]">ที่อยู่ (ภาษาอังกฤษ)</label>
                <textarea
                  rows={2}
                  value={editingBranch.addressEn}
                  onChange={e => setEditingBranch(prev => prev ? ({ ...prev, addressEn: e.target.value }) : null)}
                  placeholder="Phayathai Plaza Building, 5th Floor, Phayathai Rd, Bangkok 10400"
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">จุดสังเกต / การเดินทาง (ไทย)</label>
                  <input
                    type="text"
                    value={editingBranch.landmarkTh || ''}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, landmarkTh: e.target.value }) : null)}
                    placeholder="BTS ราชเทวี ทางออก 2 มีทางเชื่อมตรงเข้าตึก"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#333]">จุดสังเกต / การเดินทาง (อังกฤษ)</label>
                  <input
                    type="text"
                    value={editingBranch.landmarkEn || ''}
                    onChange={e => setEditingBranch(prev => prev ? ({ ...prev, landmarkEn: e.target.value }) : null)}
                    placeholder="BTS Ratchathewi (Direct Skywalk Exit 2)"
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD5CC] text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Color Styling */}
              <div className="pt-2 border-t border-[#EFE8E1]">
                <label className="block text-xs font-bold text-[#333] mb-2">สีสัญลักษณ์ & แถบสี (Branch Colors)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#666] block mb-1">สีจุด Dot</label>
                    <input
                      type="color"
                      value={editingBranch.dotColor}
                      onChange={e => setEditingBranch(prev => prev ? ({ ...prev, dotColor: e.target.value }) : null)}
                      className="w-full h-8 rounded-lg border border-[#DDD5CC] cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#666] block mb-1">สีพื้นหลัง Pill</label>
                    <input
                      type="color"
                      value={editingBranch.pillBg}
                      onChange={e => setEditingBranch(prev => prev ? ({ ...prev, pillBg: e.target.value }) : null)}
                      className="w-full h-8 rounded-lg border border-[#DDD5CC] cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#666] block mb-1">สีตัวหนังสือ</label>
                    <input
                      type="color"
                      value={editingBranch.textColor}
                      onChange={e => setEditingBranch(prev => prev ? ({ ...prev, textColor: e.target.value }) : null)}
                      className="w-full h-8 rounded-lg border border-[#DDD5CC] cursor-pointer p-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EFE8E1]">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
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
                  <span>บันทึกสาขา</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
