import React from 'react';
import { X, Clock, Video } from 'lucide-react';
import type { ScheduleEvent } from '../types';
import type { Language } from '../utils/translations';

interface DayEventsListModalProps {
  dateStr: string | null;
  events: ScheduleEvent[];
  lang: Language;
  onClose: () => void;
  onSelectEvent: (evt: ScheduleEvent) => void;
}

export const DayEventsListModal: React.FC<DayEventsListModalProps> = ({
  dateStr,
  events,
  lang,
  onClose,
  onSelectEvent
}) => {
  if (!dateStr || events.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm max-h-[75vh] flex flex-col shadow-2xl border border-[#EAE3DC] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3.5 border-b border-[#F0EEEA] rounded-t-2xl">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-[#A85B7A] uppercase">
              {lang === 'th' ? 'ตารางกิจกรรมประจำวัน' : 'Daily Schedule'}
            </span>
            <h3 className="text-sm font-bold text-[#2B2B2B]">
              {lang === 'th' ? `กิจกรรมวันที่ ${dateStr}` : `Events on ${dateStr}`}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-[#999] hover:text-[#333] hover:bg-[#F5F2EC] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event List */}
        <div className="p-3 space-y-2 overflow-y-auto max-h-[58vh]">
          {events.map((evt) => (
            <button
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#EFECE6] bg-[#FAF8F5] hover:bg-white hover:border-[#E84D84]/40 hover:shadow-xs transition-all text-left group"
            >
              {evt.posterUrl ? (
                <img 
                  src={evt.posterUrl} 
                  alt={evt.name} 
                  className="w-13 h-13 rounded-lg object-cover flex-shrink-0 border border-[#EAE3DC]" 
                />
              ) : (
                <div className="w-13 h-13 rounded-lg bg-[#EFECE6] flex items-center justify-center flex-shrink-0 text-xl text-[#A67863]">
                  🧘
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-[#2B2B2B] group-hover:text-[#E84D84] transition-colors truncate max-w-[170px]">
                    {lang === 'th' ? evt.name : (evt.englishName || evt.name)}
                  </p>
                  {evt.isSpecialStar && (
                    <span className="text-[11px] flex-shrink-0" title="Special Event">⭐</span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-[11px] text-[#777] mt-0.5">
                  <Clock className="w-3 h-3 text-[#A85B7A] flex-shrink-0" />
                  <span>{evt.startTime} - {evt.endTime}</span>
                  {evt.durationMinutes && (
                    <span className="text-[10px] text-[#999]">({evt.durationMinutes} min)</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-medium ${
                    evt.branch === 'Online'
                      ? 'bg-[#E9E0F5] text-[#5D4488]'
                      : evt.branch === 'Ratchathewi'
                      ? 'bg-[#FCE3EB] text-[#A82B5A]'
                      : evt.branch === 'On-Tour'
                      ? 'bg-[#F4EBE1] text-[#A67863]'
                      : 'bg-[#F0EEEA] text-[#555]'
                  }`}>
                    {evt.branch === 'Online' ? (lang === 'th' ? 'ออนไลน์' : 'Online') :
                     evt.branch === 'Ratchathewi' ? (lang === 'th' ? 'ราชเทวี' : 'Ratchathewi') :
                     evt.branch === 'On-Tour' ? (lang === 'th' ? 'ออนทัวร์' : 'On-Tour') :
                     (lang === 'th' ? 'นครสวรรค์' : 'Nakhonsawan')}
                  </span>
                  
                  {evt.branch === 'Online' && (
                    <span className="w-3.5 h-3.5 rounded-full bg-[#8A6FAE] flex items-center justify-center flex-shrink-0">
                      <Video className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
