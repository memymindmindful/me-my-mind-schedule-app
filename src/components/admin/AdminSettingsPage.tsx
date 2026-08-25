import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  MapPin, 
  Sparkles, 
  MessageCircle, 
  Check, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  AllStudioSettings, 
  StudioInfo, 
  FacilitatorProfile, 
  BranchItem, 
  ServiceItem, 
  ContactInfo 
} from '../../types';
import { DEFAULT_STUDIO_SETTINGS } from '../../utils/adminStorage';
import { 
  apiFetchStudioSettings, 
  apiSaveStudioSettings, 
  apiSaveFacilitatorItem,
  apiDeleteFacilitatorItem, 
  apiSaveBranch, 
  apiDeleteBranch, 
  apiSaveService, 
  apiDeleteService 
} from '../../utils/apiClient';
import { StudioInfoEditor } from './StudioInfoEditor';
import { FacilitatorsEditor } from './FacilitatorsEditor';
import { BranchesEditor } from './BranchesEditor';
import { ServicesEditor } from './ServicesEditor';
import { ContactInfoEditor } from './ContactInfoEditor';

export const AdminSettingsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'studio' | 'facilitator' | 'branches' | 'services' | 'contact'>('studio');
  const [settings, setSettings] = useState<AllStudioSettings>(DEFAULT_STUDIO_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from backend API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemote = async () => {
      setIsLoading(true);
      try {
        const remote = await apiFetchStudioSettings();
        if (remote && isMounted) {
          const facilitatorsList = Array.isArray(remote.facilitators) && remote.facilitators.length > 0
            ? remote.facilitators
            : (remote.facilitator ? [remote.facilitator] : DEFAULT_STUDIO_SETTINGS.facilitators);

          const merged: AllStudioSettings = {
            studio: remote.studio || DEFAULT_STUDIO_SETTINGS.studio,
            facilitator: remote.facilitator || DEFAULT_STUDIO_SETTINGS.facilitator,
            facilitators: facilitatorsList,
            branches: Array.isArray(remote.branches) && remote.branches.length > 0 ? remote.branches : DEFAULT_STUDIO_SETTINGS.branches,
            services: Array.isArray(remote.services) && remote.services.length > 0 ? remote.services : DEFAULT_STUDIO_SETTINGS.services,
            contact: remote.contact || DEFAULT_STUDIO_SETTINGS.contact
          };
          setSettings(merged);
        }
      } catch (err) {
        console.warn('API fetch studio settings error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRemote();
    return () => { isMounted = false; };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save Studio Info
  const handleSaveStudio = async (data: StudioInfo, logoFile?: File) => {
    setIsSaving(true);
    try {
      const res = await apiSaveStudioSettings(data, logoFile);
      const updatedLogo = res?.data?.logoUrl || data.logoUrl;
      const updated: AllStudioSettings = {
        ...settings,
        studio: { ...data, logoUrl: updatedLogo }
      };
      setSettings(updated);
      window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
      showToast('บันทึกข้อมูลสตูดิโอเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      const updated: AllStudioSettings = { ...settings, studio: data };
      setSettings(updated);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Facilitator (Create / Update in multi-facilitator list)
  const handleSaveFacilitator = async (fac: FacilitatorProfile, photoFile?: File) => {
    setIsSaving(true);
    try {
      const isExisting = (settings.facilitators || []).some(f => f.id === fac.id);
      const res = await apiSaveFacilitatorItem(fac, photoFile, isExisting ? fac.id : undefined);
      const updatedPhoto = res?.data?.photoUrl || fac.photoUrl;
      const facWithPhoto = { ...fac, photoUrl: updatedPhoto };

      let updatedFacilitators: FacilitatorProfile[];
      if (isExisting) {
        updatedFacilitators = (settings.facilitators || []).map(f => f.id === fac.id ? facWithPhoto : f);
      } else {
        updatedFacilitators = [...(settings.facilitators || []), facWithPhoto];
      }

      const updated: AllStudioSettings = { 
        ...settings, 
        facilitators: updatedFacilitators,
        facilitator: updatedFacilitators[0] || facWithPhoto
      };
      setSettings(updated);
      window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
      showToast('บันทึกข้อมูลครูผู้สอนเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      const isExisting = (settings.facilitators || []).some(f => f.id === fac.id);
      const updatedFacilitators = isExisting
        ? (settings.facilitators || []).map(f => f.id === fac.id ? fac : f)
        : [...(settings.facilitators || []), fac];
      const updated: AllStudioSettings = { 
        ...settings, 
        facilitators: updatedFacilitators,
        facilitator: updatedFacilitators[0] || fac
      };
      setSettings(updated);
      showToast('บันทึกข้อมูลครูผู้สอนเรียบร้อยแล้ว');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Facilitator
  const handleDeleteFacilitator = async (id: string) => {
    setIsSaving(true);
    try {
      await apiDeleteFacilitatorItem(id);
    } catch (err) {
      console.warn('API delete facilitator fallback:', err);
    }
    const updatedFacilitators = (settings.facilitators || []).filter(f => f.id !== id);
    const updated: AllStudioSettings = { 
      ...settings, 
      facilitators: updatedFacilitators,
      facilitator: updatedFacilitators[0] || settings.facilitator
    };
    setSettings(updated);
    window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
    setIsSaving(false);
    showToast('ลบโปรไฟล์ครูเรียบร้อยแล้ว');
  };

  // Save Branch (Create / Update)
  const handleSaveBranch = async (branch: BranchItem, photoFile?: File) => {
    setIsSaving(true);
    try {
      const isExisting = settings.branches.some(b => b.id === branch.id);
      const res = await apiSaveBranch(branch, photoFile, isExisting ? branch.id : undefined);
      const updatedPhoto = res?.data?.photoUrl || branch.photoUrl;
      const branchWithPhoto = { ...branch, photoUrl: updatedPhoto };

      let updatedBranches: BranchItem[];
      if (isExisting) {
        updatedBranches = settings.branches.map(b => b.id === branch.id ? branchWithPhoto : b);
      } else {
        updatedBranches = [...settings.branches, branchWithPhoto];
      }

      const updated: AllStudioSettings = { ...settings, branches: updatedBranches };
      setSettings(updated);
      window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
      showToast('บันทึกสาขาเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      const isExisting = settings.branches.some(b => b.id === branch.id);
      const updatedBranches = isExisting
        ? settings.branches.map(b => b.id === branch.id ? branch : b)
        : [...settings.branches, branch];
      const updated: AllStudioSettings = { ...settings, branches: updatedBranches };
      setSettings(updated);
      showToast('บันทึกสาขาเรียบร้อยแล้ว');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Branch
  const handleDeleteBranch = async (id: string) => {
    setIsSaving(true);
    try {
      await apiDeleteBranch(id);
    } catch (err) {
      console.warn('API delete branch fallback:', err);
    }
    const updatedBranches = settings.branches.filter(b => b.id !== id);
    const updated: AllStudioSettings = { ...settings, branches: updatedBranches };
    setSettings(updated);
    window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
    setIsSaving(false);
    showToast('ลบสาขาเรียบร้อยแล้ว');
  };

  // Save Service (Create / Update)
  const handleSaveService = async (service: ServiceItem, photoFile?: File) => {
    setIsSaving(true);
    try {
      const isExisting = settings.services.some(s => s.id === service.id);
      const res = await apiSaveService(service, photoFile, isExisting ? service.id : undefined);
      const updatedPhoto = res?.data?.photoUrl || service.photoUrl;
      const srvWithPhoto = { ...service, photoUrl: updatedPhoto };

      let updatedServices: ServiceItem[];
      if (isExisting) {
        updatedServices = settings.services.map(s => s.id === service.id ? srvWithPhoto : s);
      } else {
        updatedServices = [...settings.services, srvWithPhoto];
      }

      const updated: AllStudioSettings = { ...settings, services: updatedServices };
      setSettings(updated);
      window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
      showToast('บันทึกบริการเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      const isExisting = settings.services.some(s => s.id === service.id);
      const updatedServices = isExisting
        ? settings.services.map(s => s.id === service.id ? service : s)
        : [...settings.services, service];
      const updated: AllStudioSettings = { ...settings, services: updatedServices };
      setSettings(updated);
      showToast('บันทึกบริการเรียบร้อยแล้ว');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (id: string) => {
    setIsSaving(true);
    try {
      await apiDeleteService(id);
    } catch (err) {
      console.warn('API delete service fallback:', err);
    }
    const updatedServices = settings.services.filter(s => s.id !== id);
    const updated: AllStudioSettings = { ...settings, services: updatedServices };
    setSettings(updated);
    window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
    setIsSaving(false);
    showToast('ลบบริการเรียบร้อยแล้ว');
  };

  // Save Contact Info
  const handleSaveContact = async (data: ContactInfo) => {
    setIsSaving(true);
    try {
      await apiSaveStudioSettings({ ...data, isContactOnly: true });
      const updated: AllStudioSettings = { ...settings, contact: data };
      setSettings(updated);
      window.dispatchEvent(new CustomEvent('mmm_settings_updated', { detail: updated }));
      showToast('บันทึกช่องทางติดต่อเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      const updated: AllStudioSettings = { ...settings, contact: data };
      setSettings(updated);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-white border border-[#E5DFD7] text-[#1E1E1E] text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5DFD7]">
        <button
          type="button"
          onClick={() => setActiveSubTab('studio')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'studio'
              ? 'bg-[#1E1E1E] text-white shadow-xs'
              : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>ข้อมูลสตูดิโอ & แบรนด์</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('facilitator')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'facilitator'
              ? 'bg-[#1E1E1E] text-white shadow-xs'
              : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ครูผู้สอน (Facilitators)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('branches')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'branches'
              ? 'bg-[#1E1E1E] text-white shadow-xs'
              : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>สาขาสตูดิโอ (Branches)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('services')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'services'
              ? 'bg-[#1E1E1E] text-white shadow-xs'
              : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>บริการ & เวิร์กช็อป (Services)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'contact'
              ? 'bg-[#1E1E1E] text-white shadow-xs'
              : 'text-[#666] hover:text-[#1E1E1E] hover:bg-black/5'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>ช่องทางติดต่อ & โซเชียล</span>
        </button>
      </div>

      {/* SubTab Contents */}
      {activeSubTab === 'studio' && (
        <StudioInfoEditor
          initialData={settings.studio}
          onSave={handleSaveStudio}
          isSaving={isSaving}
        />
      )}

      {activeSubTab === 'facilitator' && (
        <FacilitatorsEditor
          facilitators={settings.facilitators || (settings.facilitator ? [settings.facilitator] : [])}
          onSaveFacilitator={handleSaveFacilitator}
          onDeleteFacilitator={handleDeleteFacilitator}
          isSaving={isSaving}
        />
      )}

      {activeSubTab === 'branches' && (
        <BranchesEditor
          branches={settings.branches}
          onSaveBranch={handleSaveBranch}
          onDeleteBranch={handleDeleteBranch}
          isSaving={isSaving}
        />
      )}

      {activeSubTab === 'services' && (
        <ServicesEditor
          services={settings.services}
          onSaveService={handleSaveService}
          onDeleteService={handleDeleteService}
          isSaving={isSaving}
        />
      )}

      {activeSubTab === 'contact' && (
        <ContactInfoEditor
          initialData={settings.contact}
          onSave={handleSaveContact}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
