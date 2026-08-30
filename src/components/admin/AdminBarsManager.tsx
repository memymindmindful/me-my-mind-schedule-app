import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Sparkles, 
  Save, 
  RefreshCw, 
  Check, 
  HelpCircle, 
  Calendar, 
  Layers, 
  Slash, 
  Sparkle 
} from 'lucide-react';
import { BranchLocation, DayBarConfig, SpecialStatusDetails } from '../../types';
import { getDefaultMonthBars } from '../../utils/adminStorage';
import { apiFetchMonthBars, apiSaveMonthBars } from '../../utils/apiClient';
import { TRANSLATIONS } from '../../utils/translations';

interface AdminBarsManagerProps {
  currentYear: number;
  currentMonth: number;
  onDataChanged: () => void;
}

export const AdminBarsManager: React.FC<AdminBarsManagerProps> = ({
  currentYear,
  currentMonth,
  onDataChanged
}) => {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const monthName = TRANSLATIONS.th.monthNames[currentMonth];

  const [barsMap, setBarsMap] = useState<Record<number, DayBarConfig>>(() => getDefaultMonthBars(currentYear, currentMonth));
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick Batch Range Form
  const [batchStartDay, setBatchStartDay] = useState<number>(1);
  const [batchEndDay, setBatchEndDay] = useState<number>(4);
  const [batchActionType, setBatchActionType] = useState<
    'ratchathewi_pink' | 'nakhonsawan_normal' | 'ontour_brown' | 'closed' | 'big_cleaning' | 'fully_booked' | 'clear'
  >('ratchathewi_pink');
  const [batchTourCity, setBatchTourCity] = useState('เชียงใหม่');

  // Load bar settings on month change
  useEffect(() => {
    let isMounted = true;
    apiFetchMonthBars(currentYear, currentMonth).then((remoteBars) => {
      if (!isMounted) return;
      if (remoteBars !== null) {
        setBarsMap(remoteBars);
      } else {
        setBarsMap(getDefaultMonthBars(currentYear, currentMonth));
      }
    }).catch(() => {
      if (isMounted) setBarsMap(getDefaultMonthBars(currentYear, currentMonth));
    });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  const activeDayConfig: DayBarConfig = barsMap[selectedDay] || {
    dayNum: selectedDay,
    branch: 'Nakhonsawan'
  };

  // Update specific day
  const handleUpdateDayConfig = async (updated: Partial<DayBarConfig>) => {
    const newMap = {
      ...barsMap,
      [selectedDay]: {
        ...activeDayConfig,
        ...updated,
        dayNum: selectedDay
      }
    };
    setBarsMap(newMap);
    await apiSaveMonthBars(currentYear, currentMonth, newMap);
    
    // Dispatch in-memory sync event
    window.dispatchEvent(new CustomEvent('mmm_bars_updated', {
      detail: { year: currentYear, month: currentMonth, bars: newMap }
    }));
    
    onDataChanged();
    triggerSaveToast();
  };

  // Batch Apply Range
  const handleApplyBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = Math.min(batchStartDay, batchEndDay);
    const end = Math.max(batchStartDay, batchEndDay);

    const newMap = { ...barsMap };

    for (let d = start; d <= end; d++) {
      if (d < 1 || d > daysInMonth) continue;

      const isStart = d === start;
      const isEnd = d === end;
      const isSingle = start === end;
      const pos = isSingle ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle';

      if (batchActionType === 'ratchathewi_pink') {
        newMap[d] = {
          dayNum: d,
          branch: 'Ratchathewi',
          isPinkPill: true,
          isBrownPill: false,
          pillPosition: pos,
          specialStatus: undefined
        };
      } else if (batchActionType === 'ontour_brown') {
        newMap[d] = {
          dayNum: d,
          branch: 'On-Tour',
          tourCity: batchTourCity || 'เชียงใหม่',
          isPinkPill: false,
          isBrownPill: true,
          pillPosition: pos,
          specialStatus: undefined
        };
      } else if (batchActionType === 'closed') {
        newMap[d] = {
          dayNum: d,
          branch: 'Nakhonsawan',
          isPinkPill: false,
          isBrownPill: false,
          specialStatus: {
            type: 'closed',
            labelTh: 'ปิดร้าน',
            labelEn: 'Studio Closed',
            subTh: 'วันหยุดประจำสัปดาห์',
            subEn: 'Weekly Off-Day',
            badgeBg: '#222222',
            badgeText: '#FFFFFF'
          }
        };
      } else if (batchActionType === 'big_cleaning') {
        newMap[d] = {
          dayNum: d,
          branch: 'Nakhonsawan',
          isPinkPill: false,
          isBrownPill: false,
          specialStatus: {
            type: 'big_cleaning',
            labelTh: 'Big Cleaning',
            labelEn: 'Big Cleaning',
            subTh: 'ปิดทำความสะอาด & อบโอโซน',
            subEn: 'Deep Clean & Space Purification',
            badgeBg: '#BAE6FD',
            badgeText: '#0284C7'
          }
        };
      } else if (batchActionType === 'fully_booked') {
        newMap[d] = {
          ...newMap[d],
          dayNum: d,
          specialStatus: {
            type: 'fully_booked',
            labelTh: 'คิวเต็มทั้งวัน',
            labelEn: 'Fully Booked',
            subTh: '',
            subEn: '',
            badgeBg: '#FFE5E8',
            badgeText: '#D92D4B'
          }
        };
      } else if (batchActionType === 'nakhonsawan_normal') {
        newMap[d] = {
          dayNum: d,
          branch: 'Nakhonsawan',
          isPinkPill: false,
          isBrownPill: false,
          specialStatus: undefined
        };
      } else if (batchActionType === 'clear') {
        newMap[d] = {
          dayNum: d,
          branch: 'Nakhonsawan',
          isPinkPill: false,
          isBrownPill: false,
          hasSpecialStar: false,
          specialStatus: undefined
        };
      }
    }

    setBarsMap(newMap);
    await apiSaveMonthBars(currentYear, currentMonth, newMap);

    // Dispatch in-memory sync event
    window.dispatchEvent(new CustomEvent('mmm_bars_updated', {
      detail: { year: currentYear, month: currentMonth, bars: newMap }
    }));

    onDataChanged();
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5DFD7] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E84D84]" />
            <span>จัดการบาร์สีสาขาและวันปิดร้าน (Bar Tabs & Status)</span>
          </h2>
          <p className="text-xs text-[#777] mt-0.5">
            กำหนดแถบสีเชื่อมต่อ เช่น ราชเทวี (ชมพู), นครสวรรค์ (ชมพู/ปกติ), ออนทัวร์ (น้ำตาล + ชื่อจังหวัด), ปิดร้าน, Big Cleaning
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>บันทึกและซิงค์ทันที!</span>
          </div>
        )}
      </div>

      {/* 2-Column Layout: Grid Visualizer & Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Interactive Calendar Matrix (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#E5DFD7] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#444] uppercase tracking-wider">
              ผังปฏิทิน {monthName} {currentYear} (คลิกวันที่เพื่อแก้ไข)
            </span>
            <span className="text-[11px] text-[#888]">
              วันที่เลือก: <strong className="text-[#E84D84]">{selectedDay} {monthName}</strong>
            </span>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center py-1.5 bg-[#FAF7F5] rounded-xl text-xs font-bold text-[#777]">
            {weekdays.map((w, idx) => (
              <span key={idx} className={idx === 0 ? 'text-[#E84D84]' : ''}>{w}</span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-14 rounded-xl bg-transparent" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const d = idx + 1;
              const cfg = barsMap[d];
              const isSelected = selectedDay === d;

              // Color styles
              let badgeBg = 'bg-[#FAF8F5] text-[#333] border-[#E8E1D9]';
              let badgeLabel = 'นครสวรรค์';

              if (cfg?.specialStatus?.type === 'closed') {
                badgeBg = 'bg-[#1E1E1E] text-white border-[#1E1E1E]';
                badgeLabel = 'ปิดร้าน';
              } else if (cfg?.specialStatus?.type === 'big_cleaning') {
                badgeBg = 'bg-[#BAE6FD] text-[#0369A1] border-[#7DD3FC]';
                badgeLabel = 'Big Clean';
              } else if (cfg?.specialStatus?.type === 'fully_booked') {
                if (cfg?.isBrownPill || cfg?.branch === 'On-Tour') {
                  badgeBg = 'bg-[#9E674F] text-white border-[#8B5640] ring-2 ring-[#D92D4B] ring-offset-1';
                  badgeLabel = 'เต็ม (ทัวร์)';
                } else if (cfg?.isPinkPill || cfg?.branch === 'Ratchathewi') {
                  badgeBg = 'bg-[#FCE3EB] text-[#2B2B2B] border-[#F8C8D7] ring-2 ring-[#D92D4B] ring-offset-1';
                  badgeLabel = 'เต็ม (ราชเทวี)';
                } else {
                  badgeBg = 'bg-[#FFE5E8] text-[#D92D4B] border-[#F8DDE5] ring-2 ring-[#D92D4B] ring-offset-1';
                  badgeLabel = 'เต็มแล้ว';
                }
              } else if (cfg?.isBrownPill || cfg?.branch === 'On-Tour') {
                badgeBg = 'bg-[#9E674F] text-white border-[#8B5640]';
                badgeLabel = cfg?.tourCity ? `ทัวร์ ${cfg.tourCity}` : 'ออนทัวร์';
              } else if (cfg?.isPinkPill) {
                badgeBg = 'bg-[#FCE3EB] text-[#2B2B2B] border-[#F8C8D7]';
                badgeLabel = cfg?.branch === 'Ratchathewi' ? 'ราชเทวี' : 'นครสวรรค์';
              } else if (cfg?.branch === 'Ratchathewi') {
                badgeBg = 'bg-[#FCE3EB] text-[#2B2B2B] border-[#F8C8D7]';
                badgeLabel = 'ราชเทวี';
              }

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDay(d)}
                  className={`h-16 p-1 rounded-2xl flex flex-col justify-between items-center text-left transition-all border cursor-pointer relative ${
                    isSelected 
                      ? 'ring-2 ring-[#E84D84] border-[#E84D84] shadow-md z-10' 
                      : 'hover:border-[#E84D84]/50'
                  } ${badgeBg}`}
                >
                  <div className="w-full flex justify-between items-center px-1">
                    <span className={`text-xs font-bold ${cfg?.isPinkPill && !cfg?.isBrownPill ? 'text-[#1E1E1E]' : ''}`}>
                      {d}
                    </span>
                    {cfg?.hasSpecialStar && (
                      <span className="text-[#FDB827] text-[10px]">★</span>
                    )}
                  </div>

                  <span className="text-[9px] font-medium leading-tight truncate max-w-full px-0.5 opacity-90">
                    {badgeLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Legend */}
          <div className="pt-3 border-t border-[#EFE8E1] flex flex-wrap items-center gap-3 text-[11px] text-[#666]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#FCE3EB] border border-[#F8C8D7] inline-block" />
              <span>แถบสีชมพู (ราชเทวี/นครสวรรค์)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#9E674F] inline-block" />
              <span>แถบสีน้ำตาล (ออนทัวร์)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#1E1E1E] inline-block" />
              <span>ปิดร้าน</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#BAE6FD] border border-[#7DD3FC] inline-block" />
              <span>Big Cleaning</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-white ring-2 ring-[#D92D4B] ring-offset-1 inline-block" />
              <span className="text-[#D92D4B] font-medium">Fully Booked (คิวเต็ม)</span>
            </span>
          </div>
        </div>

        {/* Right Col: Controls (Batch Setting + Single Day Edit) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Range / Batch Tool */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5DFD7] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#EFE8E1]">
              <Sparkles className="w-4 h-4 text-[#E84D84]" />
              <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">
                กำหนดแบบช่วงวันพร้อมกัน (Batch Apply)
              </h3>
            </div>

            <form onSubmit={handleApplyBatch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="number"
                    min="1"
                    max={daysInMonth}
                    value={batchStartDay}
                    onChange={(e) => setBatchStartDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">ถึงวันที่</label>
                  <input
                    type="number"
                    min="1"
                    max={daysInMonth}
                    value={batchEndDay}
                    onChange={(e) => setBatchEndDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] font-mono text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#666] mb-1">เลือกประเภทแถบสถานะ</label>
                <select
                  value={batchActionType}
                  onChange={(e) => setBatchActionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                >
                  <option value="ratchathewi_pink">🌸 แถบสีชมพู: สาขาราชเทวี (Ratchathewi)</option>
                  <option value="ontour_brown">🍂 แถบสีน้ำตาล: ออนทัวร์ต่างจังหวัด (On-Tour)</option>
                  <option value="closed">⛔ วันปิดร้าน (Closed / Weekly Off-day)</option>
                  <option value="big_cleaning">🧹 วันทำความสะอาด (Big Cleaning & Ozone)</option>
                  <option value="fully_booked">🔴 วันที่คิวเต็มทั้งวัน (Fully Booked - Manual)</option>
                  <option value="nakhonsawan_normal">🏠 สาขานครสวรรค์ (สีขาวปกติ)</option>
                  <option value="clear">🗑️ ล้างสถานะ / รีเซ็ตเป็นวันปกติ</option>
                </select>
              </div>

              {batchActionType === 'ontour_brown' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">
                    ระบุชื่อจังหวัดที่ไปทัวร์ (เช่น เชียงใหม่, ขอนแก่น, ภูเก็ต, พัทยา)
                  </label>
                  <input
                    type="text"
                    value={batchTourCity}
                    onChange={(e) => setBatchTourCity(e.target.value)}
                    placeholder="กรอกชื่อจังหวัด เช่น เชียงใหม่"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-3 bg-[#1E1E1E] hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#E84D84]" />
                <span>บันทึกช่วงวันที่ {batchStartDay} - {batchEndDay} ทันที</span>
              </button>
            </form>
          </div>

          {/* Single Day Editor */}
          <div className="bg-white p-5 rounded-3xl border border-[#E5DFD7] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8E1]">
              <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E84D84]" />
                <span>แก้ไขเฉพาะวันที่ {selectedDay} {monthName}</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Branch Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-[#666] mb-1">สาขาหลัก</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Nakhonsawan', 'Ratchathewi', 'On-Tour'] as BranchLocation[]).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleUpdateDayConfig({ 
                        branch: b,
                        isBrownPill: b === 'On-Tour',
                        isPinkPill: b === 'Ratchathewi' ? true : activeDayConfig.isPinkPill
                      })}
                      className={`py-1.5 px-2 rounded-xl text-center font-medium transition-all text-[11px] cursor-pointer border ${
                        activeDayConfig.branch === b 
                          ? 'bg-[#E84D84] text-white border-[#E84D84]' 
                          : 'bg-[#FAF8F5] text-[#555] border-[#E5DFD7] hover:bg-black/5'
                      }`}
                    >
                      {b === 'Nakhonsawan' ? 'นครสวรรค์' : b === 'Ratchathewi' ? 'ราชเทวี' : 'ออนทัวร์'}
                    </button>
                  ))}
                </div>
              </div>

              {/* On-Tour City Input */}
              {activeDayConfig.branch === 'On-Tour' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">
                    จังหวัดที่จัดกิจกรรม (เช่น เชียงใหม่, ภูเก็ต)
                  </label>
                  <input
                    type="text"
                    value={activeDayConfig.tourCity || ''}
                    onChange={(e) => handleUpdateDayConfig({ tourCity: e.target.value })}
                    placeholder="เช่น เชียงใหม่"
                    className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                  />
                </div>
              )}

              {/* Pink Pill Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF0F3] border border-[#F8DDE5]">
                <div>
                  <span className="font-semibold text-xs text-[#1E1E1E] block">แถบสีชมพู (Pink Pill Bar)</span>
                  <span className="text-[10px] text-[#777]">เน้นช่วงวันเวิร์กช็อปพิเศษ</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!activeDayConfig.isPinkPill}
                  onChange={(e) => handleUpdateDayConfig({ isPinkPill: e.target.checked })}
                  className="w-4 h-4 accent-[#E84D84] cursor-pointer"
                />
              </div>

              {/* Star Highlight Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9EA] border border-[#FDE6B0]">
                <div>
                  <span className="font-semibold text-xs text-[#996500] block flex items-center gap-1">
                    <span>★ ติดดาวทองบนวันที่</span>
                  </span>
                  <span className="text-[10px] text-[#997A33]">แสดงไอคอนดาวสีทองบนปฏิทิน</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!activeDayConfig.hasSpecialStar}
                  onChange={(e) => handleUpdateDayConfig({ hasSpecialStar: e.target.checked })}
                  className="w-4 h-4 accent-[#FDB827] cursor-pointer"
                />
              </div>

              {/* Special Status */}
              <div>
                <label className="block text-[11px] font-semibold text-[#666] mb-1">สถานะพิเศษประจำวัน</label>
                <select
                  value={activeDayConfig.specialStatus?.type || 'none'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'closed') {
                      handleUpdateDayConfig({
                        specialStatus: {
                          type: 'closed',
                          labelTh: 'ปิดร้าน',
                          labelEn: 'Studio Closed',
                          subTh: 'วันหยุดประจำสัปดาห์',
                          subEn: 'Weekly Off-Day',
                          badgeBg: '#222222',
                          badgeText: '#FFFFFF'
                        }
                      });
                    } else if (val === 'big_cleaning') {
                      handleUpdateDayConfig({
                        specialStatus: {
                          type: 'big_cleaning',
                          labelTh: 'Big Cleaning',
                          labelEn: 'Big Cleaning',
                          subTh: 'ปิดทำความสะอาด & อบโอโซน',
                          subEn: 'Deep Clean & Space Purification',
                          badgeBg: '#BAE6FD',
                          badgeText: '#0284C7'
                        }
                      });
                    } else if (val === 'fully_booked') {
                      handleUpdateDayConfig({
                        specialStatus: {
                          type: 'fully_booked',
                          labelTh: 'คิวเต็มทั้งวัน',
                          labelEn: 'Fully Booked',
                          subTh: '',
                          subEn: '',
                          badgeBg: '#FFE5E8',
                          badgeText: '#D92D4B'
                        }
                      });
                    } else {
                      handleUpdateDayConfig({ specialStatus: undefined });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E5DFD7] text-xs focus:outline-none focus:border-[#E84D84]"
                >
                  <option value="none">เปิดให้บริการตามปกติ</option>
                  <option value="closed">⛔ ปิดร้าน (Studio Closed)</option>
                  <option value="big_cleaning">🧹 Big Cleaning & Ozone</option>
                  <option value="fully_booked">🔴 เต็มแล้ว (Fully Booked - คิวเต็มทั้งวัน)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
