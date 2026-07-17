
import React, { useState, useRef, useEffect } from 'react';
import {
  User, Smartphone, Mail, Store, Check, Building2,
  Lock, ArrowRight, CheckCircle, ArrowLeft, Briefcase, Eye, EyeOff,
  CreditCard, ShieldCheck, ChevronRight, ChevronLeft, MapPin, X,
  FileText, Phone, Upload, Trash2, Image, AlertCircle, Landmark, IndianRupee
} from 'lucide-react';
import { ApiService } from '../services/apiService';
import api from '../services/axiosConfig';

interface SellerRegistrationProps {
  onBack: () => void;
  onPrivacyClick: () => void;
}

interface FileUpload {
  file: File | null;
  preview: string;
  name: string;
}

interface FormErrors {
  [key: string]: string;
}

const CATEGORIES = [
  'Groceries', 'Electronics', 'Fashion', 'Home & Kitchen',
  'Furniture', 'Beauty & Health', 'Sports', 'Books', 'Toys',
  'Auto Parts', 'Stationery', 'Pet Supplies', 'Food'
];

const CUISINE_TYPES = [
  'Indian', 'Chinese', 'Fast Food', 'South Indian', 'North Indian',
  'Continental', 'Bakery', 'Beverages', 'Desserts', 'Healthy Food'
];

const BUSINESS_TYPES = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'pvt_ltd', label: 'Private Limited (Pvt. Ltd.)' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

// ─── Standalone Components (defined outside to prevent re-mounting) ────
const InputField = ({ label, name, type = 'text', placeholder, required = true, icon, suffix, maxLength, value, onChange, error }: {
  label: string; name: string; type?: string; placeholder: string; required?: boolean; icon?: React.ReactNode; suffix?: React.ReactNode; maxLength?: number;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string;
}) => (
  <div>
    {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label} {required && <span className="text-red-400">*</span>}</label>}
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full p-4 ${icon ? 'pl-12' : ''} bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm ${error ? 'border-red-300 focus:border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-indigo-400'}`}
      />
      {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
    {error && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
  </div>
);

const FileUploadField = ({ label, fileState, onUpload, onRemove, error }: {
  label: string; fileState: FileUpload; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: () => void; error?: string;
}) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label} <span className="text-red-400">*</span></label>
    {fileState.file ? (
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
        {fileState.preview ? (
          <img src={fileState.preview} alt="preview" className="w-12 h-12 object-cover rounded-xl border border-emerald-200" />
        ) : (
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><FileText size={20} className="text-emerald-600" /></div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800 truncate">{fileState.name}</p>
          <p className="text-[10px] text-emerald-500 font-semibold">{(fileState.file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button type="button" onClick={onRemove} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={16} /></button>
      </div>
    ) : (
      <label className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition hover:bg-indigo-50/50 hover:border-indigo-300 ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
        <Upload size={24} className="text-slate-300" />
        <span className="text-xs font-bold text-slate-400">Tap to upload</span>
        <span className="text-[9px] text-slate-300 font-semibold">JPG, PNG, WEBP, PDF • Max 5MB</span>
        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onUpload} />
      </label>
    )}
    {error && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
  </div>
);

export const SellerRegistration: React.FC<SellerRegistrationProps> = ({ onBack, onPrivacyClick }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(30);

  // Password visibility
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Bank auto-populate
  const [bankName, setBankName] = useState('');
  const [fetchingBank, setFetchingBank] = useState(false);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    ApiService.getLocations().then(setCities);
  }, []);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1 – Seller Basics
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2 – Business Details
    businessName: '',
    businessType: '',
    category: '',
    gstNumber: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    businessAddress: '',
    area: '',
    // Step 3 – KYC
    panNumber: '',
    // Step 4 – Bank
    accountHolderName: '',
    bankAccountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    agreed: false,
    // Food Specific
    vendorType: 'ECOMMERCE',
    cuisineType: '',
    fssaiNumber: '',
    openingTime: '09:00',
    closingTime: '22:00',
  });

  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // File uploads (Step 3 + Step 4)
  const [idProof, setIdProof] = useState<FileUpload>({ file: null, preview: '', name: '' });
  const [businessProof, setBusinessProof] = useState<FileUpload>({ file: null, preview: '', name: '' });
  const [addressProof, setAddressProof] = useState<FileUpload>({ file: null, preview: '', name: '' });
  const [cancelledCheque, setCancelledCheque] = useState<FileUpload>({ file: null, preview: '', name: '' });

  const steps = [
    { id: 1, title: 'Seller Basics', icon: <User size={16} /> },
    { id: 2, title: 'Business', icon: <Building2 size={16} /> },
    { id: 3, title: 'KYC', icon: <ShieldCheck size={16} /> },
    { id: 4, title: 'Bank', icon: <Landmark size={16} /> },
    { id: 5, title: 'Review', icon: <FileText size={16} /> },
  ];

  // OTP Timer
  useEffect(() => {
    let interval: any;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => setTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  useEffect(() => {
    if (showOtpModal) setTimer(30);
  }, [showOtpModal]);

  // IFSC auto-populate
  useEffect(() => {
    const ifsc = formData.ifscCode.toUpperCase();
    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      setFetchingBank(true);
      fetch(`https://ifsc.razorpay.com/${ifsc}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.BANK) {
            setBankName(`${data.BANK} — ${data.BRANCH}`);
          } else {
            setBankName('');
          }
        })
        .catch(() => setBankName(''))
        .finally(() => setFetchingBank(false));
    } else {
      setBankName('');
    }
  }, [formData.ifscCode]);

  useEffect(() => {
    if (formData.city) {
      const selectedCity = cities.find(c => c.name.toLowerCase() === formData.city.toLowerCase());
      if (selectedCity) {
        setLoadingAreas(true);
        ApiService.getZones(selectedCity.id)
          .then(setAreas)
          .finally(() => setLoadingAreas(false));
      } else {
        setAreas([]);
      }
    } else {
      setAreas([]);
    }
  }, [formData.city, cities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') setIsOtpVerified(false);

    // Numeric-only fields
    if (['mobile', 'pincode', 'bankAccountNumber', 'confirmAccountNumber'].includes(name)) {
      const num = value.replace(/\D/g, '');
      if (name === 'mobile' && num.length > 10) return;
      if (name === 'pincode' && num.length > 6) return;
      setFormData(prev => ({ ...prev, [name]: num }));
    } else if (name === 'panNumber') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 10) }));
    } else if (name === 'ifscCode') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 11) }));
    } else if (name === 'gstNumber') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 15) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  // File handler
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileUpload>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }
    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Only JPG, PNG, WEBP, or PDF files accepted');
      return;
    }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setter({ file, preview, name: file.name });
  };

  const removeFile = (setter: React.Dispatch<React.SetStateAction<FileUpload>>) => {
    setter({ file: null, preview: '', name: '' });
  };

  // ─── Validation ─────────────────────────────────
  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!formData.fullName.trim()) e.fullName = 'Full name is required';
    if (!formData.mobile || formData.mobile.length !== 10) e.mobile = 'Enter a valid 10-digit number';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.password || formData.password.length < 6) e.password = 'Min 6 characters required';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FormErrors = {};
    if (!formData.businessName.trim()) e.businessName = 'Business name is required';
    if (!formData.businessType) e.businessType = 'Select a business type';
    if (!formData.category && formData.vendorType === 'ECOMMERCE') e.category = 'Select a category';
    if (!formData.gstNumber || !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]$/.test(formData.gstNumber)) {
      e.gstNumber = 'Valid 15-character GST is required';
    }
    if (!formData.city.trim()) e.city = 'City is required';
    if (!formData.area.trim()) e.area = 'Area is required';
    if (!formData.state) e.state = 'State is required';
    if (!formData.pincode || formData.pincode.length !== 6) e.pincode = 'Enter a valid 6-digit pincode';
    if (!formData.businessAddress.trim()) e.businessAddress = 'Address is required';

    if (!formData.openingTime) e.openingTime = 'Opening time is required';
    if (!formData.closingTime) e.closingTime = 'Closing time is required';

    if (formData.vendorType === 'FOOD' || formData.vendorType === 'STREET_HUB') {
      if (!formData.cuisineType) e.cuisineType = 'Select a cuisine type';
      if (!formData.fssaiNumber.trim()) e.fssaiNumber = 'FSSAI number is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: FormErrors = {};
    if (!formData.panNumber || !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.panNumber)) e.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F)';
    if (!idProof.file) e.idProof = 'ID proof is required';
    if (!businessProof.file) e.businessProof = 'Business proof is required';
    if (!addressProof.file) e.addressProof = 'Address proof is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep4 = (): boolean => {
    const e: FormErrors = {};
    if (!formData.accountHolderName.trim()) e.accountHolderName = 'Account holder name is required';
    if (!formData.bankAccountNumber || formData.bankAccountNumber.length < 9) e.bankAccountNumber = 'Enter a valid account number';
    if (formData.bankAccountNumber !== formData.confirmAccountNumber) e.confirmAccountNumber = 'Account numbers do not match';
    if (!formData.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) e.ifscCode = 'Enter a valid IFSC code';
    if (!cancelledCheque.file) e.cancelledCheque = 'Cancelled cheque is required';
    if (!formData.agreed) e.agreed = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Navigation ─────────────────────────────────
  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      if (!isOtpVerified) {
        try {
          setIsLoading(true);
          await api.post('/auth/login/send-otp', { phone: formData.mobile });
          setShowOtpModal(true);
        } catch (err: any) {
          alert(err?.response?.data?.message || 'Failed to send OTP.');
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      scrollToTop();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      scrollToTop();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login/verify-otp', { phone: formData.mobile, otp });
      if (res.data?.token) {
        // Save session so axiosConfig can pick it up
        ApiService._saveSession(res.data.token, res.data.user);

        setIsOtpVerified(true);
        setShowOtpModal(false);
        setCurrentStep(2);
        scrollToTop();
        setOtp('');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Final check
    if (!validateStep4()) {
      setCurrentStep(4);
      scrollToTop();
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      // 1. User Basics (Required for public registration)
      data.append('name', formData.fullName);
      data.append('email', formData.email);
      data.append('phone', formData.mobile);
      data.append('password', formData.password);

      // 2. Business Details
      data.append('shopName', formData.businessName);
      data.append('businessType', formData.businessType);
      data.append('category', formData.category);
      data.append('gstNumber', formData.gstNumber);
      data.append('address', formData.businessAddress);
      data.append('area', formData.area);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('pincode', formData.pincode);

      // 3. KYC
      data.append('panNumber', formData.panNumber);
      if (idProof.file) data.append('idProof', idProof.file);
      if (businessProof.file) data.append('businessProof', businessProof.file);
      if (addressProof.file) data.append('addressProof', addressProof.file);

      // 4. Bank
      data.append('accountHolderName', formData.accountHolderName);
      data.append('bankAccountNumber', formData.bankAccountNumber);
      data.append('ifscCode', formData.ifscCode);
      if (cancelledCheque.file) data.append('cancelledCheque', cancelledCheque.file);

      // Vendor Type & Universal Business Hours
      data.append('vendorType', formData.vendorType);
      data.append('openingTime', formData.openingTime);
      data.append('closingTime', formData.closingTime);

      if (formData.vendorType === 'FOOD' || formData.vendorType === 'STREET_HUB') {
        data.append('cuisineType', formData.cuisineType);
        data.append('fssaiNumber', formData.fssaiNumber);
      }

      // Use public endpoint
      await api.post('/public/vendor/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsSubmitted(true);
      scrollToTop();
    } catch (err: any) {
      console.error('Submission Error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Please try again.';
      alert(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  // ─── Step Content ────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      // ──────── Step 1: Seller Basics ──────────
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Seller Basics</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Let's get you started</p>
            </div>

            <InputField label="Full Name" name="fullName" placeholder="e.g. Rajesh Kumar" icon={<User size={16} />} value={formData.fullName} onChange={handleChange} error={errors.fullName} />

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number <span className="text-red-400">*</span></label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  name="mobile" type="tel" value={formData.mobile} onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className={`w-full p-4 pl-12 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm ${errors.mobile ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`}
                />
                {isOtpVerified && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Verified</span>
                  </div>
                )}
              </div>
              {errors.mobile && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.mobile}</p>}
            </div>

            <InputField label="Email Address" name="email" type="email" placeholder="seller@example.com" icon={<Mail size={16} />} value={formData.email} onChange={handleChange} error={errors.email} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Min 6 chars"
                    className={`w-full p-4 pl-12 pr-12 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm ${errors.password ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" /> {errors.password}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter"
                    className={`w-full p-4 pl-12 pr-12 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" /> {errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        );

      // ──────── Step 2: Business Details ──────────
      case 2:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Business Details</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Tell us about your business</p>
            </div>

            <div className="bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 flex gap-2 overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, vendorType: 'ECOMMERCE', category: (p.category === 'Food' || p.category === 'Street Hub') ? '' : p.category }))}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.vendorType === 'ECOMMERCE' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                E-commerce
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, vendorType: 'FOOD', category: 'Food' }))}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.vendorType === 'FOOD' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Restaurant
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, vendorType: 'STREET_HUB', category: 'Food' }))}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.vendorType === 'STREET_HUB' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Street Hub
              </button>
            </div>

            <InputField label="Business / Shop Name" name="businessName" placeholder="e.g. Rajesh General Store" icon={<Store size={16} />} value={formData.businessName} onChange={handleChange} error={errors.businessName} />

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Type <span className="text-red-400">*</span></label>
              <select name="businessType" value={formData.businessType} onChange={handleChange}
                className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${formData.businessType ? 'text-slate-900' : 'text-slate-400'} ${errors.businessType ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm`}>
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
              {errors.businessType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.businessType}</p>}
            </div>

            {formData.vendorType === 'ECOMMERCE' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category <span className="text-red-400">*</span></label>
                <select name="category" value={formData.category} onChange={handleChange}
                  className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${formData.category ? 'text-slate-900' : 'text-slate-400'} ${errors.category ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm`}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.category}</p>}
              </div>
            )}

            {(formData.vendorType === 'FOOD' || formData.vendorType === 'STREET_HUB') && (
              <div className="space-y-4 animate-fade-in py-2 bg-indigo-50/30 rounded-3xl p-4 border-2 border-indigo-50">
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Cuisine Type <span className="text-red-400">*</span></label>
                  <select name="cuisineType" value={formData.cuisineType} onChange={handleChange}
                    className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${formData.cuisineType ? 'text-slate-900' : 'text-slate-400'} ${errors.cuisineType ? 'border-red-300' : 'border-indigo-100 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                    <option value="">Select cuisine</option>
                    {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.cuisineType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.cuisineType}</p>}
                </div>

                <InputField label="FSSAI License Number" name="fssaiNumber" placeholder="14-digit FSSAI number" maxLength={14} value={formData.fssaiNumber} onChange={handleChange} error={errors.fssaiNumber} />

              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Opening Time <span className="text-red-400">*</span></label>
                <input type="time" name="openingTime" value={formData.openingTime} onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:outline-none transition shadow-sm" />
                {errors.openingTime && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" />{errors.openingTime}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Closing Time <span className="text-red-400">*</span></label>
                <input type="time" name="closingTime" value={formData.closingTime} onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:outline-none transition shadow-sm" />
                {errors.closingTime && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" />{errors.closingTime}</p>}
              </div>
            </div>

            {/* GST Number */}
            <div className="animate-fade-in">
              <InputField label="GST Number" name="gstNumber" placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} value={formData.gstNumber} onChange={handleChange} error={errors.gstNumber} />
            </div>

            <div className="pt-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Address <span className="text-red-400">*</span></label>
              <textarea name="businessAddress" value={formData.businessAddress} onChange={handleChange} rows={2} placeholder="Full street address, landmark"
                className={`w-full p-4 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm resize-none ${errors.businessAddress ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`} />
              {errors.businessAddress && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.businessAddress}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City <span className="text-red-400">*</span></label>
                <select name="city" value={formData.city} onChange={handleChange}
                  className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${formData.city ? 'text-slate-900' : 'text-slate-400'} ${errors.city ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm`}>
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {errors.city && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.city}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Area / Neighborhood <span className="text-red-400">*</span></label>
                <select name="area" value={formData.area} onChange={handleChange} disabled={!formData.city || loadingAreas}
                  className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${formData.area ? 'text-slate-900' : 'text-slate-400'} ${errors.area ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm disabled:opacity-50`}>
                  <option value="">{loadingAreas ? 'Loading areas...' : 'Select area'}</option>
                  {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  <option value="Other">Other</option>
                </select>
                {errors.area && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.area}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">State <span className="text-red-400">*</span></label>
                <select name="state" value={formData.state} onChange={handleChange}
                  className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-semibold text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:outline-none transition shadow-sm appearance-none">
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="Pincode" name="pincode" placeholder="600001" maxLength={6} value={formData.pincode} onChange={handleChange} error={errors.pincode} />
            </div>
          </div>
        );

      // ──────── Step 3: KYC & Documents ──────────
      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">KYC & Documents</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Identity verification</p>
            </div>

            <InputField label="PAN Number" name="panNumber" placeholder="e.g. ABCDE1234F" maxLength={10} icon={<CreditCard size={16} />} value={formData.panNumber} onChange={handleChange} error={errors.panNumber} />

            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">📋 Upload Guidelines</p>
              <p className="text-[10px] text-indigo-400/80 font-semibold leading-relaxed">
                Upload clear, legible scans or photos. Accepted: JPG, PNG, WEBP, PDF (max 5MB each).
              </p>
            </div>

            <FileUploadField label="ID Proof (Aadhaar / Voter ID / Passport)" fileState={idProof} onUpload={(e) => handleFileUpload(e, setIdProof)} onRemove={() => removeFile(setIdProof)} error={errors.idProof} />
            <FileUploadField label="Business Proof (Shop License / GST Certificate)" fileState={businessProof} onUpload={(e) => handleFileUpload(e, setBusinessProof)} onRemove={() => removeFile(setBusinessProof)} error={errors.businessProof} />
            <FileUploadField label="Address Proof (Utility Bill / Rent Agreement)" fileState={addressProof} onUpload={(e) => handleFileUpload(e, setAddressProof)} onRemove={() => removeFile(setAddressProof)} error={errors.addressProof} />
          </div>
        );

      // ──────── Step 4: Bank Details ──────────
      case 4:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Bank Details</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">For payouts & settlements</p>
            </div>

            <InputField label="Account Holder Name" name="accountHolderName" placeholder="As per bank records" icon={<User size={16} />} value={formData.accountHolderName} onChange={handleChange} error={errors.accountHolderName} />
            <InputField label="Account Number" name="bankAccountNumber" placeholder="Enter account number" icon={<Landmark size={16} />} value={formData.bankAccountNumber} onChange={handleChange} error={errors.bankAccountNumber} />
            <InputField label="Re-enter Account Number" name="confirmAccountNumber" placeholder="Confirm account number" icon={<Landmark size={16} />} value={formData.confirmAccountNumber} onChange={handleChange} error={errors.confirmAccountNumber} />

            <div>
              <InputField label="IFSC Code" name="ifscCode" placeholder="e.g. SBIN0001234" maxLength={11} icon={<IndianRupee size={16} />}
                value={formData.ifscCode} onChange={handleChange} error={errors.ifscCode}
                suffix={fetchingBank ? <span className="text-[9px] text-indigo-400 font-bold animate-pulse">Looking up...</span> : undefined}
              />
              {bankName && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">{bankName}</p>
                </div>
              )}
            </div>

            <FileUploadField label="Cancelled Cheque / Passbook Front Page" fileState={cancelledCheque} onUpload={(e) => handleFileUpload(e, setCancelledCheque)} onRemove={() => removeFile(setCancelledCheque)} error={errors.cancelledCheque} />

            {/* Agreement */}
            <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition ${errors.agreed ? 'border-red-200 bg-red-50/30' : 'border-slate-100 bg-slate-50'}`}>
              <button type="button" onClick={() => { setFormData(p => ({ ...p, agreed: !p.agreed })); if (errors.agreed) setErrors(p => { const n = { ...p }; delete n.agreed; return n; }); }}
                className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${formData.agreed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                {formData.agreed && <Check size={14} className="text-white" />}
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                I confirm that the information provided is accurate and I agree to the <button type="button" className="text-indigo-500 hover:underline">Terms of Service</button> and <button type="button" onClick={onPrivacyClick} className="text-indigo-500 hover:underline">Privacy Policy</button>.
              </p>
            </div>
            {errors.agreed && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.agreed}</p>}
          </div>
        );

      // ──────── Step 5: Review ──────────
      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Review Application</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">One last look before you submit</p>
            </div>

            <div className="bg-slate-50/80 rounded-3xl p-6 border-2 border-slate-100 space-y-6">
              {/* Basics */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><User size={12} /> Personal Details</span>
                  <button onClick={() => { setCurrentStep(1); scrollToTop(); }} className="text-[10px] text-indigo-500 hover:underline cursor-pointer">Edit</button>
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Name</span> <span className="text-xs font-bold text-slate-700">{formData.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Mobile</span> <span className="text-xs font-bold text-slate-700">+91 {formData.mobile}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Email</span> <span className="text-xs font-bold text-slate-700">{formData.email}</span></div>
                </div>
              </div>

              {/* Business */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Store size={12} /> Business Info</span>
                  <button onClick={() => { setCurrentStep(2); scrollToTop(); }} className="text-[10px] text-indigo-500 hover:underline cursor-pointer">Edit</button>
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Shop Name</span> <span className="text-xs font-bold text-slate-700">{formData.businessName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Type</span> <span className="text-xs font-bold text-slate-700">{BUSINESS_TYPES.find(b => b.value === formData.businessType)?.label}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Category</span> <span className="text-xs font-bold text-slate-700">{formData.category}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">GST</span> <span className="text-xs font-bold text-slate-700">{formData.gstNumber || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Hours</span> <span className="text-xs font-bold text-slate-700">{formData.openingTime && formData.closingTime ? `${formData.openingTime} to ${formData.closingTime}` : 'N/A'}</span></div>
                  <div className="pt-2 border-t border-slate-50 mt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Address</p>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed max-w-[200px] ml-auto text-right">
                      {formData.businessAddress}, {formData.city}, {formData.state} - {formData.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank & Docs */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Landmark size={12} /> Banking & Docs</span>
                  <button onClick={() => { setCurrentStep(4); scrollToTop(); }} className="text-[10px] text-indigo-500 hover:underline cursor-pointer">Edit</button>
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Account</span> <span className="text-xs font-bold text-slate-700">•••• {formData.bankAccountNumber.slice(-4)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">IFSC</span> <span className="text-xs font-bold text-slate-700">{formData.ifscCode}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Bank</span> <span className="text-xs font-bold text-emerald-600">{bankName || 'Unknown'}</span></div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg"><CheckCircle size={10} className="text-emerald-500" /> <span className="text-[9px] font-bold text-slate-500">ID Proof</span></div>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg"><CheckCircle size={10} className="text-emerald-500" /> <span className="text-[9px] font-bold text-slate-500">Business Proof</span></div>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg"><CheckCircle size={10} className="text-emerald-500" /> <span className="text-[9px] font-bold text-slate-500">Addr. Proof</span></div>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg"><CheckCircle size={10} className="text-emerald-500" /> <span className="text-[9px] font-bold text-slate-500">Cheque</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <div className="p-2 bg-indigo-100 rounded-full text-indigo-600"><ShieldCheck size={16} /></div>
              <p className="text-[10px] text-indigo-800 font-semibold leading-relaxed">
                By submitting, you confirm that all details are correct. Incorrect details may lead to rejection or delay in payouts.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Success Screen ─────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center font-sans p-6" ref={topRef}>
        <div className="bg-white rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-2xl animate-slide-up">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-secondary tracking-tight uppercase mb-3">Application Submitted!</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">Your seller application is under review.</p>
          <p className="text-slate-400 text-xs mb-8">We'll notify you via email and SMS once your application is approved. This usually takes 1–2 business days.</p>
          <button onClick={onBack} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Layout ────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex flex-col font-sans" ref={topRef}>
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-6 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h1 className="font-black text-secondary uppercase tracking-tight text-base">Seller Registration</h1>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Step {currentStep} of {steps.length}</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-6 pb-5 pt-4 border-b border-slate-100 sticky top-[64px] z-20">
        <div className="flex justify-between relative max-w-lg mx-auto">
          {/* Track line */}
          <div className="absolute top-[16px] left-[5%] right-[5%] h-1 bg-slate-100 -z-10 rounded-full"></div>
          <div className="absolute top-[16px] left-[5%] h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 90}%` }}></div>

          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1.5 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 ${step.id === currentStep
                ? 'border-indigo-600 bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200'
                : step.id < currentStep
                  ? 'border-emerald-400 bg-emerald-400 text-white'
                  : 'border-slate-200 bg-white text-slate-300'
                }`}>
                {step.id < currentStep ? <Check size={14} /> : step.icon}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider ${step.id === currentStep ? 'text-indigo-600' : step.id < currentStep ? 'text-emerald-500' : 'text-slate-300'
                }`}>{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-6 pb-32 pt-6">
        <form onSubmit={handleSubmit} autoComplete="off">
          {renderStepContent()}
        </form>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg p-5 border-t border-slate-100 flex items-center justify-between z-40">
        <button type="button" onClick={handlePrev} disabled={currentStep === 1}
          className={`flex items-center gap-2 px-5 py-3 font-black text-xs uppercase tracking-widest transition rounded-2xl ${currentStep === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
          <ChevronLeft size={18} /> Back
        </button>

        <button type="button"
          onClick={currentStep < steps.length ? handleNext : handleSubmit}
          disabled={isSubmitting || isLoading}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-60">
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing</>
          ) : isLoading ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP</>
          ) : currentStep < steps.length ? (
            <>Next <ChevronRight size={16} /></>
          ) : (
            <>Submit Application <ArrowRight size={16} /></>
          )}
        </button>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/80 backdrop-blur-md animate-fade-in" onClick={() => setShowOtpModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative z-10 shadow-2xl animate-slide-up">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"><X size={20} /></button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500">
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-black text-secondary tracking-tight uppercase">Verify Mobile</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">OTP sent to +91 {formData.mobile}</p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input type="text" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition" placeholder="0000" autoFocus />
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold">Resend OTP in <span className="text-indigo-500">{timer}s</span></p>
                ) : (
                  <button type="button" onClick={async () => {
                    try { await api.post('/auth/login/send-otp', { phone: formData.mobile }); setTimer(30); } catch { alert('Failed to resend'); }
                  }} className="text-[10px] text-indigo-500 font-black uppercase hover:underline">Resend OTP</button>
                )}
              </div>
              <button type="submit" disabled={isLoading || otp.length < 4}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50">
                {isLoading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
