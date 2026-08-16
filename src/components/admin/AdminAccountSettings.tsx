import React, { useState } from 'react';
import { Shield, Key, User, Check, Eye, EyeOff, Lock, AlertCircle, Info } from 'lucide-react';
import { apiChangeAdminPassword } from '../../utils/apiClient';

interface AdminAccountSettingsProps {
  onCredentialsUpdated?: () => void;
}

export const AdminAccountSettings: React.FC<AdminAccountSettingsProps> = ({ onCredentialsUpdated }) => {
  const [username, setUsername] = useState('admin');
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setStatusMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้ใช้ (Username)' });
      setIsSubmitting(false);
      return;
    }

    if (newPasscode) {
      if (!currentPasscode) {
        setStatusMessage({ type: 'error', text: 'กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันสิทธิ์' });
        setIsSubmitting(false);
        return;
      }

      if (newPasscode.length < 3) {
        setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' });
        setIsSubmitting(false);
        return;
      }

      if (newPasscode !== confirmPasscode) {
        setStatusMessage({ type: 'error', text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await apiChangeAdminPassword({
        username: trimmedUser,
        currentPassword: currentPasscode || undefined,
        newPassword: newPasscode ? newPasscode.trim() : undefined
      });

      if (res && res.success) {
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
        setStatusMessage({ 
          type: 'success', 
          text: res.message || 'บันทึกการเปลี่ยนแปลงชื่อผู้ใช้และรหัสผ่านในฐานข้อมูลเรียบร้อยแล้ว!' 
        });
        if (onCredentialsUpdated) {
          onCredentialsUpdated();
        }
      } else {
        setStatusMessage({ type: 'error', text: res?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบรหัสผ่านปัจจุบัน' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EFE8E1]">
        <div>
          <h2 className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E84D84]" />
            <span>ตั้งค่าความปลอดภัยบัญชีผู้ดูแลระบบ (Admin Account & Security)</span>
          </h2>
          <p className="text-xs text-[#777] mt-0.5">
            กำหนดชื่อผู้ใช้ (Username) และรหัสผ่าน (Password) สำหรับเข้าสู่ระบบจัดการได้ตามต้องการ โดยบันทึกลงฐานข้อมูล SQLite
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E5DFD7] shadow-xs space-y-5">
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block font-bold text-[#444]">
                ชื่อผู้ใช้ (Username) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, beever"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                />
                <User className="w-4 h-4 text-[#888] absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-[#888]">
                ใช้สำหรับพิมพ์ลงในช่อง Username ตอนล็อกอิน
              </p>
            </div>

            <div className="pt-2 border-t border-[#EFE8E1]">
              <h3 className="font-bold text-xs text-[#1E1E1E] flex items-center gap-1.5 mb-3">
                <Lock className="w-3.5 h-3.5 text-[#E84D84]" />
                <span>เปลี่ยนรหัสผ่าน (Change Password)</span>
              </h3>

              <div className="space-y-3.5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#555]">
                    รหัสผ่านปัจจุบัน (Current Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPasscode}
                      onChange={(e) => setCurrentPasscode(e.target.value)}
                      placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยันสิทธิ์"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                    />
                    <Key className="w-4 h-4 text-[#888] absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-[#888] hover:text-[#444] cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-[#555]">
                      รหัสผ่านใหม่ (New Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 3 ตัวอักษร)"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                      />
                      <Key className="w-4 h-4 text-[#888] absolute left-3 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-[#888] hover:text-[#444] cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold text-[#555]">
                      ยืนยันรหัสผ่านใหม่ (Confirm New Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPasscode}
                        onChange={(e) => setConfirmPasscode(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all"
                      />
                      <Key className="w-4 h-4 text-[#888] absolute left-3 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5 text-[#888] hover:text-[#444] cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#E84D84] hover:bg-[#D43D73] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-[#E84D84]/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกข้อมูลบัญชีผู้ดูแล</span>
              </button>
            </div>
          </form>
        </div>

        {/* Status / Current Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5DFD7] shadow-xs space-y-3.5">
            <h3 className="font-bold text-xs text-[#1E1E1E] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#E84D84]" />
              <span>ความปลอดภัยบัญชี</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-1">
                <span className="text-[11px] text-[#777] block">สถานะการเชื่อมต่อ:</span>
                <span className="font-mono font-bold text-xs text-emerald-600">SQLite Database Authenticated</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-1">
                <span className="text-[11px] text-[#777] block">การเข้ารหัสรหัสผ่าน:</span>
                <span className="font-mono text-xs text-[#444]">Bcrypt Salted Hash (10 Rounds)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#FAF0F3] border border-[#F8DDE5] text-xs text-[#777] space-y-2">
            <h4 className="font-bold text-[#E84D84] flex items-center gap-1.5">
              <span>คำแนะนำความปลอดภัย:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#666] leading-relaxed">
              <li>รหัสผ่านถูกเข้ารหัสและบันทึกในฐานข้อมูลอย่างปลอดภัย</li>
              <li>สามารถตั้ง Username และรหัสผ่านใหม่ได้ตลอดเวลาผ่านหน้านี้</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
