import React, { useState } from 'react';
import { Lock, Sparkles, Key, AlertCircle, ArrowLeft, User, Eye, EyeOff } from 'lucide-react';
import { validateAdminLogin, getAdminCredentials } from '../../utils/adminStorage';
import { apiAdminLogin } from '../../utils/apiClient';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToClient: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToClient }) => {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const targetUser = username.trim() || 'admin';
    const targetPass = passcode.trim();

    // 1. Try backend API login first
    const apiResult = await apiAdminLogin(targetUser, targetPass);
    if (apiResult) {
      setIsLoading(false);
      onSuccess();
      return;
    }

    // 2. Fallback to client validation
    const isValid = validateAdminLogin(targetUser, targetPass);
    if (isValid) {
      setIsLoading(false);
      onSuccess();
    } else {
      setError('ชื่อผู้ใช้ (Username) หรือ รหัสผ่าน (Password) ไม่ถูกต้อง');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col justify-center items-center p-4 selection:bg-[#E84D84]/20 selection:text-[#E84D84]">
      {/* Top back link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onBackToClient}
          className="inline-flex items-center gap-1.5 text-xs text-[#777] hover:text-[#1E1E1E] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-full border border-[#E5DFD7] shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับไปยังหน้าปฏิทินลูกค้า</span>
        </button>
        <span className="text-[11px] text-[#999] font-mono">Me.My.Mind Portal</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#EBE5DE] shadow-xl shadow-black/5 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF0F3] border border-[#F5D5DF] flex items-center justify-center text-[#E84D84] shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#1E1E1E]">Me.My.Mind Admin</h1>
          <p className="text-xs text-[#777]">
            ระบบจัดการตารางปฏิทิน บาร์สถานะสาขา & รายการอีเวนท์
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#444] text-left">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="กรอกชื่อผู้ใช้"
                className="w-full px-4 py-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-sm text-[#1E1E1E] focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all pl-10 font-mono"
              />
              <User className="w-4 h-4 text-[#999] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#444] text-left">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError('');
                }}
                placeholder="กรอกรหัสผ่าน"
                autoFocus
                className="w-full px-4 py-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-sm text-[#1E1E1E] focus:outline-none focus:border-[#E84D84] focus:bg-white transition-all pl-10 pr-10 font-mono"
              />
              <Key className="w-4 h-4 text-[#999] absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#999] hover:text-[#555] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 pt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passcode}
            className="w-full py-3 px-4 bg-[#E84D84] hover:bg-[#D43D73] disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-[#E84D84]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>เข้าสู่ระบบจัดการ</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
