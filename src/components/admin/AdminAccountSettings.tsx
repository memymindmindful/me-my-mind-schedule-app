import React, { useState, useEffect } from 'react';
import { Shield, Key, User, Check, Eye, EyeOff, Lock, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { getAdminCredentials, saveAdminCredentials, AdminCredentials } from '../../utils/adminStorage';

interface AdminAccountSettingsProps {
  onCredentialsUpdated?: () => void;
}

export const AdminAccountSettings: React.FC<AdminAccountSettingsProps> = ({ onCredentialsUpdated }) => {
  const [username, setUsername] = useState('');
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [savedCreds, setSavedCreds] = useState<AdminCredentials>({ username: 'admin', passcode: '1234' });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const creds = getAdminCredentials();
    setSavedCreds(creds);
    setUsername(creds.username);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSubmitting(true);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setStatusMessage({ type: 'error', text: 'กรุณาระบุชื่อผู้ใช้ (Username)' });
      setIsSubmitting(false);
      return;
    }

    // Verify current passcode if user wants to change password
    if (newPasscode) {
      if (currentPasscode !== savedCreds.passcode && currentPasscode !== 'admin' && currentPasscode !== '1234') {
        setStatusMessage({ type: 'error', text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
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

    const finalPasscode = newPasscode ? newPasscode.trim() : savedCreds.passcode;

    const success = saveAdminCredentials({
      username: trimmedUser,
      passcode: finalPasscode
    });

    if (success) {
      setSavedCreds({
        username: trimmedUser,
        passcode: finalPasscode,
        updatedAt: new Date().toISOString()
      });
      setCurrentPasscode('');
      setNewPasscode('');
      setConfirmPasscode('');
      setStatusMessage({ 
        type: 'success', 
        text: 'บันทึกการเปลี่ยนแปลงชื่อผู้ใช้และรหัสผ่านเรียบร้อยแล้ว!' 
      });
      if (onCredentialsUpdated) {
        onCredentialsUpdated();
      }
    } else {
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' });
    }

    setIsSubmitting(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('ต้องการรีเซ็ต Username และ Password กลับเป็นค่าเริ่มต้น (admin / 1234) หรือไม่?')) {
      saveAdminCredentials({
        username: 'admin',
        passcode: '1234'
      });
      setSavedCreds({ username: 'admin', passcode: '1234' });
      setUsername('admin');
      setCurrentPasscode('');
      setNewPasscode('');
      setConfirmPasscode('');
      setStatusMessage({ type: 'success', text: 'รีเซ็ตบัญชีผู้ดูแลเป็นค่าเริ่มต้น (admin / 1234) แล้ว' });
      if (onCredentialsUpdated) onCredentialsUpdated();
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
            กำหนดชื่อผู้ใช้ (Username) และรหัสผ่าน (Password) สำหรับเข้าสู่ระบบจัดการได้ตามต้องการ
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetToDefault}
          className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-rose-50 border border-[#E5DFD7] hover:border-rose-200 text-[#777] hover:text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเซ็ตเป็นค่าเริ่มต้น (Default)</span>
        </button>
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
                  placeholder="เช่น admin, mindful_admin, beever"
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
              <span>ข้อมูลบัญชีที่ใช้อยู่ปัจจุบัน</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-1">
                <span className="text-[11px] text-[#777] block">Username ปัจจุบัน:</span>
                <span className="font-mono font-bold text-sm text-[#1E1E1E]">{savedCreds.username}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E1] space-y-1">
                <span className="text-[11px] text-[#777] block">รหัสผ่านปัจจุบัน (ความยาว):</span>
                <span className="font-mono font-bold text-sm text-[#1E1E1E]">
                  {'•'.repeat(Math.max(4, savedCreds.passcode.length))} ({savedCreds.passcode.length} ตัวอักษร)
                </span>
              </div>

              {savedCreds.updatedAt && (
                <p className="text-[10px] text-[#888] pt-1">
                  อัปเดตล่าสุด: {new Date(savedCreds.updatedAt).toLocaleString('th-TH')}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#FAF0F3] border border-[#F8DDE5] text-xs text-[#777] space-y-2">
            <h4 className="font-bold text-[#E84D84] flex items-center gap-1.5">
              <span>คำแนะนำความปลอดภัย:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#666] leading-relaxed">
              <li>ข้อมูลถูกจัดเก็บในเครื่องของคุณอย่างปลอดภัย</li>
              <li>สามารถตั้ง Username และรหัสผ่านที่จำง่าย เช่น ชื่อเล่น หรือ รหัสร้าน</li>
              <li>หากลืมรหัสผ่าน สามารถใช้รหัส Master (<code className="font-mono bg-white px-1 py-0.5 rounded text-[#E84D84]">admin</code> หรือ <code className="font-mono bg-white px-1 py-0.5 rounded text-[#E84D84]">1234</code>) เข้าสู่ระบบได้ตลอดเวลา</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
