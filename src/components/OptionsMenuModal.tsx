import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Sparkles, 
  Info, 
  MessageCircle, 
  Calendar, 
  Award,
  Globe,
  Phone,
  Mail
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations';
import { AllStudioSettings } from '../types';
import { DEFAULT_STUDIO_SETTINGS } from '../utils/adminStorage';
import { apiFetchStudioSettings } from '../utils/apiClient';

interface OptionsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMonth: (monthIndex: number) => void;
  currentMonth: number;
  settings?: AllStudioSettings;
  lang: Language;
  onToggleLang: () => void;
}

export const OptionsMenuModal: React.FC<OptionsMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectMonth,
  currentMonth,
  settings: propSettings,
  lang,
  onToggleLang
}) => {
  const [settings, setSettings] = useState<AllStudioSettings>(() => propSettings || DEFAULT_STUDIO_SETTINGS);

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    } else {
      apiFetchStudioSettings().then((res) => {
        if (res && res.studio) setSettings(res);
      });
    }
  }, [propSettings, isOpen]);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      }
    };
    window.addEventListener('mmm_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('mmm_settings_updated', handleSettingsUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const { studio, facilitator, branches, contact } = settings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#FFFFFF] rounded-3xl shadow-2xl overflow-hidden border border-[#F0E4E8] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-b from-[#FDF2F5] to-[#FFFFFF] border-b border-[#F5E6EB] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#E84D84] font-sans tracking-tight">
              {lang === 'th' ? studio.studioNameTh : studio.studioNameEn}
            </h3>
            <p className="text-xs text-[#777]">
              {lang === 'th' ? studio.taglineTh : studio.taglineEn}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#777] hover:text-[#E84D84] hover:bg-[#E84D84]/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#2B2B2B]">
          {/* Language Switcher Setting */}
          <div className="p-3.5 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#E84D84]" />
              <div>
                <span className="font-bold text-xs text-[#1E1E1E] block">
                  {t.languageToggle}
                </span>
                <span className="text-[11px] text-[#777]">
                  {lang === 'th' ? 'ปัจจุบัน: ภาษาไทย' : 'Current: English'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleLang}
              className="px-3 py-1.5 bg-[#E84D84] text-white rounded-xl font-bold text-xs shadow-xs hover:bg-[#D43D73] transition-colors cursor-pointer"
            >
              {t.switchLangPrompt}
            </button>
          </div>

          {/* Quick Month Switcher */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[#888] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#E84D84]" />
              <span>{t.selectMonth}</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: t.monthNames[2], idx: 2 },
                { name: t.monthNames[3], idx: 3 },
                { name: t.monthNames[4], idx: 4 },
                { name: t.monthNames[5], idx: 5 },
                { name: t.monthNames[6], idx: 6 },
                { name: t.monthNames[7], idx: 7 }
              ].map(m => (
                <button
                  key={m.idx}
                  onClick={() => {
                    onSelectMonth(m.idx);
                    onClose();
                  }}
                  className={`py-2 px-3 rounded-xl font-semibold text-center transition-all cursor-pointer ${
                    currentMonth === m.idx 
                      ? 'bg-[#E84D84] text-white shadow-xs' 
                      : 'bg-[#FAF7F5] border border-[#EFE8E1] hover:bg-[#FAF0F3] text-[#444]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Facilitators List */}
          <div className="space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-[#888] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E84D84]" />
              <span>{lang === 'th' ? 'ทีมครูและผู้บำบัด (Facilitators)' : 'Studio Facilitators'}</span>
            </h4>

            {(settings.facilitators && settings.facilitators.length > 0 
              ? settings.facilitators 
              : [facilitator]
            ).map((fac, fIdx) => (
              <div key={fac.id || `fac-${fIdx}`} className="p-4 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] space-y-2.5">
                <div className="flex items-center gap-3">
                  {fac.photoUrl ? (
                    <img
                      src={fac.photoUrl}
                      alt={fac.nameEn || fac.nameTh}
                      className="w-11 h-11 rounded-full object-cover border border-[#F3CDD8] shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#E84D84] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      {fac.nameTh ? fac.nameTh.slice(0, 2) : 'KB'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-[#1E1E1E]">
                      {lang === 'th' ? (fac.nameTh || fac.nameEn) : (fac.nameEn || fac.nameTh)}
                    </h4>
                    <span className="text-[11px] text-[#E84D84] font-semibold block">
                      {lang === 'th' ? (fac.titleTh || fac.titleEn) : (fac.titleEn || fac.titleTh)}
                    </span>
                  </div>
                </div>
                <p className="text-[#555] leading-relaxed text-xs">
                  {lang === 'th' 
                    ? (fac.bioShortTh || fac.bioLongTh || fac.bioShortEn) 
                    : (fac.bioShortEn || fac.bioLongEn || fac.bioShortTh)}
                </p>
                {fac.certifications && fac.certifications.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-[#F3CDD8]">
                    {fac.certifications.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#666]">
                        <Award className="w-3 h-3 text-[#E84D84] flex-shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Studio Branches */}
          <div className="space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-[#888] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#E84D84]" />
              <span>Studio Branches</span>
            </h4>

            {branches.filter(b => b.isActive).map(branch => (
              <div 
                key={branch.id} 
                className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EFE8E1] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1E1E1E]">
                    {lang === 'th' ? branch.nameTh : branch.nameEn}
                  </span>
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: branch.dotColor, border: branch.dotColor === '#FFFFFF' ? '1px solid #CCC' : 'none' }}
                  />
                </div>
                {(branch.taglineTh || branch.taglineEn) && (
                  <p className="text-[11px] text-[#E84D84] font-medium">
                    {lang === 'th' ? branch.taglineTh : branch.taglineEn}
                  </p>
                )}
                <p className="text-[11px] text-[#666]">
                  📍 {lang === 'th' ? branch.addressTh : branch.addressEn}
                </p>
                {(branch.landmarkTh || branch.landmarkEn) && (
                  <p className="text-[10px] text-[#888] italic">
                    ✨ {lang === 'th' ? branch.landmarkTh : branch.landmarkEn}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* LINE Contact */}
          <div className="p-4 rounded-2xl bg-[#FAF0F3] border border-[#F8DDE5] flex items-center justify-between">
            <div>
              <h5 className="font-bold text-xs text-[#E84D84]">{t.contactLine}</h5>
              <p className="text-[11px] text-[#666]">{t.chatWithBeever}</p>
            </div>
            <a
              href={contact.lineUrl || `https://line.me/R/oaMessage/${contact.lineOa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#E84D84] text-white rounded-xl font-bold text-xs shadow-xs hover:bg-[#D43D73] transition-colors"
            >
              {contact.lineOa || '@me.my.mind.mindful'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
