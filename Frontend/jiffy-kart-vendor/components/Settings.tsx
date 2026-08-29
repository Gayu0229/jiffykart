
import React, { useState, useEffect, useRef } from 'react';
import {
  User, Save, CheckCircle2, Loader2, AlertCircle,
  Smartphone, Mail, Trash2
} from 'lucide-react';

import { UserProfile, UpdateProfileRequest } from '../types';
import { api } from '../vendor.api';

interface SettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ userProfile, onUpdateProfile }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(userProfile);
    setAvatarUrl(userProfile.avatar || '');
  }, [userProfile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Full Name must be at least 3 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = "Alphabets and spaces only";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updateData: UpdateProfileRequest = {
        name: formData.name,
        email: formData.email
      };

      const response: any = await api.updateProfile(updateData);

      onUpdateProfile(response.user);
      setToast({ message: "Profile updated successfully!", type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || "Failed to update profile.",
        type: 'error'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handlePhotoUpdate = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setToast({ message: "Uploading profile photo...", type: 'success' });
        const response = await api.updateProfileImage(file);

        if (response.avatarUrl) {
          setAvatarUrl(response.avatarUrl);
          onUpdateProfile({ ...userProfile, avatar: response.avatarUrl });
        }

        setToast({ message: "Profile photo updated successfully!", type: 'success' });
        setTimeout(() => setToast(null), 3000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to upload photo";
        setToast({ message: errorMessage, type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!avatarUrl) return;
    try {
      setToast({ message: "Deleting profile photo...", type: 'success' });
      await api.deleteProfileImage();
      setAvatarUrl('');
      onUpdateProfile({ ...userProfile, avatar: '' });
      setToast({ message: "Profile photo deleted successfully!", type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete photo";
      setToast({ message: errorMessage, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };


  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {toast && (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border-l-4 animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-emerald-900 border-emerald-500 text-white' : 'bg-rose-900 border-rose-500 text-white'
          }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Identity & Security</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your account credentials and personal details.</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 space-y-12">

          {/* Section: Personal Info */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider">Personal Information</h3>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-600 flex items-center justify-center text-white text-3xl font-bold relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{formData.name?.charAt(0) || 'A'}</span>
                  )}
                </div>
                <button
                  onClick={handlePhotoUpdate}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-brand-600 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                >
                  <User size={16} />
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleDeletePhoto}
                    className="absolute -top-1 -right-1 p-2 bg-rose-500 rounded-full shadow-md border-2 border-white text-white hover:bg-rose-600 transition-colors z-10"
                    title="Delete Photo"
                  >
                    <Trash2 size={12} strokeWidth={4} />
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Profile Picture</h4>
                <p className="text-xs text-slate-500 mt-1">Upload a high-resolution image to help colleagues recognize you. Max 5MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputBox
                label="Full Name"
                icon={<User className="w-4 h-4" />}
                value={formData.name}
                error={errors.name}
                onChange={(val) => handleInputChange('name', val)}
                placeholder="Enter your full name"
              />

              <InputBox
                label="Mobile Number"
                icon={<Smartphone className="w-4 h-4" />}
                value={formData.phone || '+91 - Registered'}
                readOnly
                placeholder="+91 XXXXX XXXXX"
                helperText="Primary identifier (Read-only)"
              />

              <div className="md:col-span-2">
                <InputBox
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  value={formData.email}
                  error={errors.email}
                  onChange={(val) => handleInputChange('email', val)}
                  placeholder="name@company.com"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100" />

          {/* Action Footer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-slate-400">
              <AlertCircle className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-widest">Double check your information before saving</p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="group relative flex items-center justify-center space-x-3 bg-brand-900 text-white px-12 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] disabled:opacity-50 min-w-full sm:min-w-[280px]"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              <span>{isSaving ? 'Updating Profile...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InputBoxProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

const InputBox: React.FC<InputBoxProps> = ({
  label, value, onChange, type = "text", placeholder, readOnly, icon, error, helperText
}) => (
  <div className="space-y-2.5 w-full group">
    <div className="flex justify-between items-center px-1">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">{label}</label>
      {error && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{error}</span>}
    </div>
    <div className="relative">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-brand-600'}`}>
        {icon}
      </div>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full pl-14 pr-6 py-5 bg-slate-50 border-2 rounded-3xl text-[15px] font-bold text-slate-900 outline-none transition-all duration-300 shadow-sm
          ${readOnly ? 'opacity-70 cursor-not-allowed border-transparent bg-slate-100' :
            error ? 'border-rose-100 focus:border-rose-400 bg-rose-50/30' :
              'border-transparent focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 focus:bg-white'}
        `}
      />
    </div>
    {helperText && !error && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">{helperText}</p>}
  </div>
);

export default Settings;
