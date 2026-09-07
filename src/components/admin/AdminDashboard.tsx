import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Layers, 
  Sparkles, 
  LogOut, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Globe,
  Sliders,
  Check,
  RotateCcw,
  AlertTriangle,
  X,
  UserCheck,
  KeyRound,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  Settings,
  Ticket,
  Store,
  Users,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { checkAdminAuth, setAdminAuth } from '../../utils/adminStorage';
import { apiResetData, apiVerifyAdminPassword } from '../../utils/apiClient';
import { AdminLogin } from './AdminLogin';
import { AdminBarsManager } from './AdminBarsManager';
import { AdminEventsManager } from './AdminEventsManager';
import { AdminAccountSettings } from './AdminAccountSettings';
import { AdminSettingsPage } from './AdminSettingsPage';
import { TRANSLATIONS } from '../../utils/translations';

interface AdminDashboardProps {
  onBackToClient: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToClient }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'bars' | 'events' | 'settings' | 'account'>('bars');
  const [showStudioMenu, setShowStudioMenu] = useState(false);
  const [studioInitialSubTab, setStudioInitialSubTab] = useState<'studio' | 'facilitator' | 'branches' | 'services' | 'contact'>('studio');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<'month_events' | 'month_bars' | 'all_data' | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active year and month for admin editing (defaults to current date)
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed

  // Check auth state on mount and listen to token expiration
  useEffect(() => {
    setIsAuthenticated(checkAdminAuth());

    const handleAuthExpired = (e: any) => {
      setAdminAuth(false);
      setIsAuthenticated(false);
      setToastMessage(e?.detail?.error || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      setTimeout(() => setToastMessage(null), 4000);
    };

    window.addEventListener('mmm_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('mmm_auth_expired', handleAuthExpired);
  }, []);

  const handleLoginSuccess = () => {
    setAdminAuth(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAdminAuth(false);
    setIsAuthenticated(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputPass = resetPasswordInput.trim();

    // Verify password with backend API
    const isPasswordValid = await apiVerifyAdminPassword(inputPass);

    if (!isPasswordValid) {
      setResetPasswordError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง');
      return;
    }

    if (resetTarget === 'month_events') {
      await apiResetData('month_events', currentYear, currentMonth);
      window.dispatchEvent(new CustomEvent('mmm_events_updated', {
        detail: { year: currentYear, month: currentMonth, events: [] }
      }));
      setToastMessage(`ล้างอีเวนท์เดือน ${monthName} เรียบร้อยแล้ว`);
    } else if (resetTarget === 'month_bars') {
      await apiResetData('month_bars', currentYear, currentMonth);
      window.dispatchEvent(new CustomEvent('mmm_bars_updated', {
        detail: { year: currentYear, month: currentMonth }
      }));
      setToastMessage(`รีเซ็ตแถบสีเดือน ${monthName} เรียบร้อยแล้ว`);
    } else if (resetTarget === 'all_data') {
      await apiResetData('all_data');
      window.dispatchEvent(new CustomEvent('mmm_events_updated', {
        detail: { year: currentYear, month: currentMonth }
      }));
      window.dispatchEvent(new CustomEvent('mmm_bars_updated', {
        detail: { year: currentYear, month: currentMonth }
      }));
      setToastMessage('ล้างข้อมูลและเริ่มต้นตารางในฐานข้อมูลเรียบร้อยแล้ว');
    }

    // Reset states
    setIsResetModalOpen(false);
    setResetTarget(null);
    setResetPasswordInput('');
    setResetPasswordError('');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetTarget(null);
    setResetPasswordInput('');
    setResetPasswordError('');
  };

  // If not authenticated, show Clean Passcode Screen
  if (!isAuthenticated) {
    return (
      <AdminLogin 
        onSuccess={handleLoginSuccess}
        onBackToClient={onBackToClient}
      />
    );
  }

  const monthName = TRANSLATIONS.th.monthNames[currentMonth];

  const handleSelectStudioSubTab = (subTab: 'studio' | 'facilitator' | 'branches' | 'services' | 'contact') => {
    setStudioInitialSubTab(subTab);
    setActiveTab('settings');
    setShowStudioMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-[#2B2B2B] flex flex-col font-sans selection:bg-[#E84D84]/20 selection:text-[#E84D84]">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5DFD7] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Logo & Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E84D84] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#1E1E1E]">
                  Me.My.Mind Control Center
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF0F3] text-[#E84D84] border border-[#F8DDE5] text-[10px] font-bold">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-[#777]">
                ระบบจัดการตารางเวลา สีแถบสาขา & กิจกรรมเวิร์กช็อป
              </p>
            </div>
          </div>

          {/* Month Selector in Header & Client Preview Link */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Month & Year Navigator */}
            <div className="flex items-center bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-black/5 text-[#555] transition-colors cursor-pointer"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-bold text-[#1E1E1E]">
                {monthName} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-black/5 text-[#555] transition-colors cursor-pointer"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Switch to April 2026 (Mockup) */}
            <button
              type="button"
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(3);
              }}
              className="px-2.5 py-1.5 bg-[#FAF0F3] text-[#E84D84] border border-[#F8DDE5] rounded-xl text-xs font-semibold hover:bg-[#FCE6EC] transition-colors cursor-pointer"
            >
              เม.ย. 2026
            </button>

            {/* Reset All / Month Data Button */}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-rose-50 text-[#777] hover:text-rose-600 border border-[#E5DFD7] hover:border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="รีเซ็ตหรือล้างข้อมูลตาราง"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>รีเซ็ตข้อมูล</span>
            </button>

            {/* Back to Client View */}
            <button
              type="button"
              onClick={onBackToClient}
              className="px-3 py-1.5 bg-[#1E1E1E] text-white hover:bg-black rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#E84D84]" />
              <span className="hidden sm:inline">ดูหน้าปฏิทินลูกค้า (Live View)</span>
              <span className="sm:hidden">Live View</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-[#777] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 pb-28 sm:pb-32 space-y-6">
        
        {/* Tab 1: Bars Manager (ปฏิทิน) */}
        {activeTab === 'bars' && (
          <AdminBarsManager
            currentYear={currentYear}
            currentMonth={currentMonth}
            onDataChanged={() => {}}
          />
        )}

        {/* Tab 2: Events Manager (อีเวนท์) */}
        {activeTab === 'events' && (
          <AdminEventsManager
            currentYear={currentYear}
            currentMonth={currentMonth}
            onDataChanged={() => {}}
            onMonthChange={(year, month) => {
              setCurrentYear(year);
              setCurrentMonth(month);
            }}
          />
        )}

        {/* Tab 3: Studio Settings (สตูดิโอ) */}
        {activeTab === 'settings' && (
          <AdminSettingsPage initialSubTab={studioInitialSubTab} />
        )}

        {/* Tab 4: Account & Password Manager (ตั้งค่า) */}
        {activeTab === 'account' && (
          <AdminAccountSettings
            onCredentialsUpdated={() => {
              setToastMessage('อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว');
              setTimeout(() => setToastMessage(null), 3000);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#888] border-t border-[#E5DFD7] bg-white">
        <p>Me.My.Mind Mindfulness Schedule Management Platform • Version 2.0</p>
      </footer>

      {/* Global & Month Reset Modal with Admin Password Confirmation */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E5DFD7] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  resetTarget ? 'bg-rose-100 border border-rose-300 text-rose-700' : 'bg-rose-50 border border-rose-200 text-rose-600'
                }`}>
                  {resetTarget ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1E1E]">
                    {resetTarget ? 'ยืนยันรหัสผ่านเพื่อรีเซ็ต' : 'รีเซ็ตข้อมูลระบบ (Reset Data)'}
                  </h3>
                  <p className="text-xs text-[#777]">
                    {resetTarget ? 'กรอกรหัส Admin เพื่อยืนยันความปลอดภัย' : 'เตรียมระบบก่อนเริ่มใช้งานจริง'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseResetModal}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#777] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Choose Reset Option */}
            {!resetTarget ? (
              <div className="space-y-2.5 text-xs">
                {/* Option 1: Clear current month events only */}
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget('month_events');
                    setResetPasswordInput('');
                    setResetPasswordError('');
                  }}
                  className="w-full p-3.5 rounded-2xl border border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-[#1E1E1E] group-hover:text-[#E84D84] flex items-center justify-between">
                    <span>1. ล้างอีเวนท์เฉพาะเดือนนี้ ({monthName})</span>
                    <RotateCcw className="w-3.5 h-3.5 text-[#888] group-hover:text-[#E84D84]" />
                  </div>
                  <p className="text-[11px] text-[#777] mt-0.5">
                    ล้างอีเวนท์ในเดือน {monthName} {currentYear} ให้เป็นตารางว่าง เพื่อเตรียมกรอกอีเวนท์จริงของเดือนนี้
                  </p>
                </button>

                {/* Option 2: Reset current month bars to default Nakhonsawan */}
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget('month_bars');
                    setResetPasswordInput('');
                    setResetPasswordError('');
                  }}
                  className="w-full p-3.5 rounded-2xl border border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-[#1E1E1E] group-hover:text-[#E84D84] flex items-center justify-between">
                    <span>2. รีเซ็ตแถบสีสาขาเฉพาะเดือนนี้ ({monthName})</span>
                    <RotateCcw className="w-3.5 h-3.5 text-[#888] group-hover:text-[#E84D84]" />
                  </div>
                  <p className="text-[11px] text-[#777] mt-0.5">
                    เปลี่ยนแถบสีทุกวันในเดือน {monthName} เป็นสาขานครสวรรค์ปกติ (ล้างแถบสีชมพู/น้ำตาล/วันปิด)
                  </p>
                </button>

                {/* Option 3: Reset ALL months data to empty for complete fresh start */}
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget('all_data');
                    setResetPasswordInput('');
                    setResetPasswordError('');
                  }}
                  className="w-full p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-rose-700 flex items-center justify-between">
                    <span>3. รีเซ็ตข้อมูลทุกเดือนทั้งหมด (Start Fresh)</span>
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p className="text-[11px] text-rose-600/90 mt-0.5 leading-relaxed">
                    ล้างอุบลงตทั้งหมด และมุ่งเน้นไปยัง นครสวรรค์ เพื่อเตรียมกรอกข้อมูลใหม่ (Clear all events AND focus view to Nakhonsawan for fresh start)
                  </p>
                </button>


                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    className="px-4 py-2 rounded-xl border border-[#E5DFD7] text-xs font-semibold text-[#555] hover:bg-black/5 cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: Password Confirmation Form */
              <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
                {/* Action summary box */}
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <span className="font-bold block flex items-center gap-1 text-rose-800">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    {resetTarget === 'month_events' && `ล้างอีเวนท์เดือน ${monthName} ${currentYear}`}
                    {resetTarget === 'month_bars' && `รีเซ็ตแถบสีสาขาเดือน ${monthName} ${currentYear}`}
                    {resetTarget === 'all_data' && 'ล้างข้อมูลทุกเดือนทั้งหมดในระบบ (Start Fresh)'}
                  </span>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    {resetTarget === 'month_events' && `อีเวนท์ทั้งหมดในเดือน ${monthName} จะถูกลบออกเป็นตารางว่าง (0 รายการ)`}
                    {resetTarget === 'month_bars' && `แถบสีทุกวันในเดือน ${monthName} จะถูกเปลี่ยนกลับเป็นสาขานครสวรรค์ปกติ (สีขาว)`}
                    {resetTarget === 'all_data' && '⚠️ ล้างอุบลงตทั้งหมด และมุ่งเน้นไปยัง นครสวรรค์ เพื่อเตรียมกรอกข้อมูลใหม่ (Clear all events AND focus view to Nakhonsawan for fresh start)'}
                  </p>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-[#444] text-left">
                    กรอกรหัสผ่านผู้ดูแลระบบ (Admin Password) เพื่อยืนยัน:
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={resetPasswordInput}
                      onChange={(e) => {
                        setResetPasswordInput(e.target.value);
                        setResetPasswordError('');
                      }}
                      placeholder="กรอกรหัสผ่านแอดมินของคุณ"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs font-mono text-[#1E1E1E] focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    />
                    <Key className="w-4 h-4 text-[#888] absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-2.5 text-[#888] hover:text-[#444] cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {resetPasswordError && (
                    <p className="text-[11px] text-rose-600 font-semibold pt-0.5">
                      {resetPasswordError}
                    </p>
                  )}
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetTarget(null);
                      setResetPasswordInput('');
                      setResetPasswordError('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[#E5DFD7] text-xs font-semibold text-[#555] hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ยืนยันการล้างข้อมูล</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Studio Popup Menu (Modal / Bottom Sheet) */}
      {showStudioMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop click */}
          <div className="absolute inset-0" onClick={() => setShowStudioMenu(false)} />
          
          <div className="relative z-10 bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-[#E5DFD7] shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF0F3] text-[#E84D84] border border-[#F8DDE5] flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1E1E]">เลือกหมวดหมู่สตูดิโอ</h3>
                  <p className="text-[11px] text-[#777]">เลือกส่วนที่ต้องการจัดการในระบบสตูดิโอ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudioMenu(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#777] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Studio Options */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectStudioSubTab('studio')}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                  activeTab === 'settings' && studioInitialSubTab === 'studio'
                    ? 'bg-[#FAF0F3] border-[#E84D84] text-[#E84D84] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-[#333]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DFD7] flex items-center justify-center text-[#E84D84] shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">1. ข้อมูลสตูดิโอทั่วไป (Studio Info)</span>
                  <span className="text-[10px] text-[#777] block truncate">ชื่อสตูดิโอ, สโลแกน, ปรัชญา และธีมสี</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStudioSubTab('facilitator')}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                  activeTab === 'settings' && studioInitialSubTab === 'facilitator'
                    ? 'bg-[#FAF0F3] border-[#E84D84] text-[#E84D84] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-[#333]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DFD7] flex items-center justify-center text-[#E84D84] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">2. ครูผู้สอน (Facilitators)</span>
                  <span className="text-[10px] text-[#777] block truncate">จัดการข้อมูลครู, ประวัติ, รูปโปรไฟล์ และใบรับรอง</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStudioSubTab('branches')}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                  activeTab === 'settings' && studioInitialSubTab === 'branches'
                    ? 'bg-[#FAF0F3] border-[#E84D84] text-[#E84D84] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-[#333]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DFD7] flex items-center justify-center text-[#E84D84] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">3. สาขา (Branches)</span>
                  <span className="text-[10px] text-[#777] block truncate">ราชเทวี, นครสวรรค์, ออนทัวร์, จุดสังเกต และสีแถบ</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStudioSubTab('services')}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                  activeTab === 'settings' && studioInitialSubTab === 'services'
                    ? 'bg-[#FAF0F3] border-[#E84D84] text-[#E84D84] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-[#333]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DFD7] flex items-center justify-center text-[#E84D84] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">4. บริการ & เวิร์กช็อป (Services)</span>
                  <span className="text-[10px] text-[#777] block truncate">Sound Healing, กิจกรรมกลุ่ม, คลาสส่วนตัว</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStudioSubTab('contact')}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                  activeTab === 'settings' && studioInitialSubTab === 'contact'
                    ? 'bg-[#FAF0F3] border-[#E84D84] text-[#E84D84] font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E5DFD7] hover:border-[#E84D84] hover:bg-[#FAF0F3]/40 text-[#333]'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DFD7] flex items-center justify-center text-[#E84D84] shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold block truncate">5. ช่องทางติดต่อ (Contact Channels)</span>
                  <span className="text-[10px] text-[#777] block truncate">LINE OA, เบอร์โทรศัพท์, IG, Facebook, อีเมล</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DFD7] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 sm:px-6 py-2">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 sm:gap-2">
          {/* Tab 1: Calendar (ปฏิทิน) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('bars');
              setShowStudioMenu(false);
            }}
            className={`py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'bars'
                ? 'text-[#E84D84] bg-[#FAF0F3]'
                : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'bars' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[11px] leading-tight ${activeTab === 'bars' ? 'font-bold' : 'font-medium'}`}>
              ปฏิทิน
            </span>
          </button>

          {/* Tab 2: Events (อีเวนท์) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('events');
              setShowStudioMenu(false);
            }}
            className={`py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'text-[#E84D84] bg-[#FAF0F3]'
                : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
            }`}
          >
            <Ticket className={`w-5 h-5 ${activeTab === 'events' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[11px] leading-tight ${activeTab === 'events' ? 'font-bold' : 'font-medium'}`}>
              อีเวนท์
            </span>
          </button>

          {/* Tab 3: Studio (สตูดิโอ - With Popup Menu) */}
          <button
            type="button"
            onClick={() => setShowStudioMenu(prev => !prev)}
            className={`py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'settings' || showStudioMenu
                ? 'text-[#E84D84] bg-[#FAF0F3]'
                : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
            }`}
          >
            <Store className={`w-5 h-5 ${activeTab === 'settings' || showStudioMenu ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[11px] leading-tight ${activeTab === 'settings' || showStudioMenu ? 'font-bold' : 'font-medium'}`}>
              สตูดิโอ
            </span>
            {activeTab === 'settings' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#E84D84] absolute top-1 right-1/4" />
            )}
          </button>

          {/* Tab 4: Settings (ตั้งค่า - Account & Security) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('account');
              setShowStudioMenu(false);
            }}
            className={`py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'text-[#E84D84] bg-[#FAF0F3]'
                : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === 'account' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[11px] leading-tight ${activeTab === 'account' ? 'font-bold' : 'font-medium'}`}>
              ตั้งค่า
            </span>
          </button>
        </div>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1E1E1E] text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#E84D84]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
