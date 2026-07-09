
import React, { useState, useRef, useEffect } from 'react';
import {
  Building2, MapPin, Globe, Mail, Phone, Camera,
  Clock, ShieldCheck, Instagram, Twitter, Facebook,
  Share2, Save, ArrowUpRight, ExternalLink, Info,
  Store, Map as MapIcon, Calendar, CheckCircle2,
  Image as ImageIcon, Edit3, Heart, Zap, Sparkles,
  LayoutDashboard, Settings2, Fingerprint, History,
  UploadCloud, X, Navigation, ClipboardList,
  Loader2, Lock, AlertTriangle, Briefcase, Tag, Hash, MapPinned, LandPlot
} from 'lucide-react';
import { VendorProfile } from '../types';

interface CompanyProps {
  shopData: any;
  onUpdateShop: (data: any) => void;
  vendorProfile: VendorProfile | null;
  vendorProfileLoading: boolean;
  vendorProfileError: string | null;
}

const Company: React.FC<CompanyProps> = ({ shopData, onUpdateShop, vendorProfile, vendorProfileLoading, vendorProfileError }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Local form state synced with props
  const [formData, setFormData] = useState(shopData);

  useEffect(() => {
    setFormData(shopData);
  }, [shopData]);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdateShop(formData);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the actual file for API upload
      if (type === 'banner') setFormData(prev => ({ ...prev, bannerFile: file }));
      else setFormData(prev => ({ ...prev, logoFile: file }));

      // Preview locally using reader
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'banner') handleInputChange('banner', result);
        else handleInputChange('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in duration-1000 relative">
      {showSuccess && (
        <div className="fixed top-24 right-8 z-[100] bg-brand-900 text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center space-x-4 border-l-4 border-brand-500 animate-in slide-in-from-right duration-500">
          <div className="bg-brand-500/20 p-2 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">Registry Updated</p>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5">Shop location synchronized across JiffyKart.</p>
          </div>
        </div>
      )}

      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />

      <div className="relative group rounded-[32px] md:rounded-[48px] overflow-hidden bg-brand-900 min-h-[340px] md:h-[340px] shadow-2xl">
        {/* 1. Banner Image Layer (Bottom) */}
        <div className="absolute inset-0">
          <img src={formData.banner} className="w-full h-full object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 transition-transform duration-[8000ms]" alt="Banner" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-transparent to-transparent opacity-90"></div>
        </div>

        {/* 2. Content Layer (Middle) - Z-index 10 */}
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group/avatar">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[32px] md:rounded-[40px] p-2 shadow-2xl ring-8 ring-white/10 overflow-hidden">
                <img src={formData.logo} className="w-full h-full object-cover rounded-[32px]" alt="Logo" />
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all ring-4 ring-brand-900 z-20"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 md:space-y-2 text-center md:text-left">
              <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter md:truncate md:max-w-md uppercase">{formData.title || 'Your Shop'}</h1>
              <p className="text-sm md:text-lg font-medium text-gray-400 max-w-lg leading-relaxed">{formData.tagline}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-500 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl disabled:opacity-50 min-w-[180px] w-full md:w-auto flex items-center justify-center space-x-3 z-20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Update Profile'}</span>
          </button>
        </div>

        {/* 3. Upload Overlay Layer (Top) - Z-index 30 but with pointer-events-none */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-30 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              bannerInputRef.current?.click();
            }}
            className="bg-white text-gray-900 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 shadow-2xl hover:scale-105 transition-all pointer-events-auto"
          >
            <ImageIcon className="w-4 h-4" /> <span>Upload Banner</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* ═══ Vendor Business Details (Read-Only from Application) ═══ */}
        <VendorBusinessCard
          vendorProfile={vendorProfile}
          isLoading={vendorProfileLoading}
          error={vendorProfileError}
        />

        {/* ═══ Editable Shop Settings ═══ */}
        <div className="bg-white rounded-[48px] p-10 border border-gray-50 shadow-sm">
          <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-4 mb-2">
              <div className="bg-brand-500/10 p-2 rounded-xl">
                <Store className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Shop Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ShopInp label="Shop Name" value={formData.title} onChange={(v) => handleInputChange('title', v)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Business Category</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-6 pr-4 py-4 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all shadow-inner appearance-none"
                >
                  <option value="Food">Food (Restaurants)</option>
                  <option value="Ecommerce">Ecommerce (Groceries/Retail)</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Street Hub">Street Hub</option>
                  <option value="Cafe">Jiffy Cafe</option>
                </select>
              </div>
              <ShopInp label="Business Type" value={formData.businessType} onChange={(v) => handleInputChange('businessType', v)} />
            </div>

            <div className="flex items-center space-x-4 mt-12 mb-2">
              <div className="bg-brand-500/10 p-2 rounded-xl">
                <MapIcon className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Shop Location</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ShopInp label="Store Address" value={formData.address} onChange={(v) => handleInputChange('address', v)} />
              <ShopInp label="Area / Neighborhood" value={formData.area} onChange={(v) => handleInputChange('area', v)} />
              <ShopInp label="City" value={formData.city} onChange={(v) => handleInputChange('city', v)} />
              <ShopInp label="Postal Code" value={formData.postalCode} onChange={(v) => handleInputChange('postalCode', v)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Logistics Instructions</label>
              <textarea 
                value={formData.pickupInstructions} 
                rows={3} 
                onChange={(e) => handleInputChange('pickupInstructions', e.target.value)} 
                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[32px] text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all resize-none shadow-inner" 
                placeholder="Details for delivery partners (e.g., Near the main gate, 2nd floor)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   VENDOR BUSINESS DETAILS CARD (Read-Only)
   ═══════════════════════════════════════ */

interface VendorBusinessCardProps {
  vendorProfile: VendorProfile | null;
  isLoading: boolean;
  error: string | null;
}

const VendorBusinessCard: React.FC<VendorBusinessCardProps> = ({ vendorProfile, isLoading, error }) => {
  // Skeleton loader
  if (isLoading) {
    return (
      <div className="bg-white rounded-[48px] p-10 border border-gray-50 shadow-sm">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-10 h-10 bg-gray-100 rounded-2xl animate-pulse" />
          <div>
            <div className="h-4 w-48 bg-gray-100 rounded-xl animate-pulse mb-2" />
            <div className="h-3 w-64 bg-gray-50 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-50 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-amber-50 rounded-[48px] p-10 border border-amber-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-800 uppercase tracking-wider">{error}</p>
            <p className="text-xs text-amber-600 mt-1">Please contact admin if you believe this is an error.</p>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!vendorProfile) return null;

  const fields = [
    { label: 'Shop Name', value: vendorProfile.shopName, icon: <Store className="w-4 h-4" /> },
    { label: 'Business Type', value: vendorProfile.businessType, icon: <Briefcase className="w-4 h-4" /> },
    { label: 'Category', value: vendorProfile.category, icon: <Tag className="w-4 h-4" /> },
    { label: 'GST Number', value: vendorProfile.gstNumber || 'N/A', icon: <Hash className="w-4 h-4" /> },
    { label: 'Business Address', value: vendorProfile.businessAddress, icon: <MapPinned className="w-4 h-4" /> },
    { label: 'City', value: vendorProfile.city, icon: <Building2 className="w-4 h-4" /> },
    { label: 'Area / Neighborhood', value: vendorProfile.area, icon: <Navigation className="w-4 h-4" /> },
    { label: 'State', value: vendorProfile.state, icon: <LandPlot className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-[48px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="flex items-center space-x-4">
          <div className="bg-brand-900 p-3 rounded-2xl shadow-lg">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Vendor Business Details</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Auto-filled from your approved application</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Verified</span>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {fields.map((field, i) => (
          <ReadOnlyField key={i} label={field.label} value={field.value} icon={field.icon} />
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center space-x-3 relative">
        <Lock className="w-3.5 h-3.5 text-gray-300" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          These fields are read-only. To update, contact admin or submit a change request.
        </p>
      </div>
    </div>
  );
};

/* ═══ Read-Only Field Component ═══ */
const ReadOnlyField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="space-y-2 group">
    <div className="flex items-center space-x-2 px-2">
      <span className="text-gray-300 group-hover:text-brand-400 transition-colors">{icon}</span>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    </div>
    <div className="relative">
      <div className="w-full px-6 py-4 bg-gray-50/80 border border-gray-100 rounded-[24px] text-sm font-bold text-gray-700 shadow-inner flex items-center justify-between cursor-not-allowed select-none">
        <span className="truncate">{value || '—'}</span>
        <Lock className="w-3 h-3 text-gray-300 flex-shrink-0 ml-2" />
      </div>
    </div>
  </div>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-brand-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}>
    <div className={active ? 'text-brand-500' : 'text-gray-300'}>{icon}</div> <span>{label}</span>
  </button>
);

const ShopInp: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-6 pr-4 py-4 bg-gray-50 border border-transparent rounded-[24px] text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all shadow-inner" />
  </div>
);

export default Company;
