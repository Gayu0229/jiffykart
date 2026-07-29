import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// ─── ZOD SCHEMAS FOR INDIVIDUAL STEPS ──────────────────────────────────────────

const step1Schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  mobile: z.string().length(10, 'Enter a valid 10-digit number'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Min 6 characters required'),
  confirmPassword: z.string().min(6, 'Min 6 characters required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.string().min(1, 'Select a business type'),
  category: z.string().optional(),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]$/, 'Valid 15-character GST is required'),
  city: z.string().min(1, 'City is required'),
  area: z.string().min(1, 'Area is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().length(6, 'Enter a valid 6-digit pincode'),
  businessAddress: z.string().min(1, 'Address is required'),
  openingTime: z.string().min(1, 'Opening time is required'),
  closingTime: z.string().min(1, 'Closing time is required'),
  vendorType: z.enum(['VENDOR', 'FOOD_VENDOR', 'STREET_HUB_VENDOR']),
  cuisineType: z.string().optional(),
  fssaiNumber: z.string().optional(),
  foodBusinessType: z.string().optional(),
  restaurantName: z.string().optional(),
  foodCategory: z.string().optional(),
  deliveryRadius: z.string().optional(),
  kitchenType: z.string().optional(),
  vegNonVeg: z.string().optional(),
  restaurantCategory: z.string().optional(),
  diningType: z.string().optional(),
  indoorSeats: z.string().optional(),
  outdoorSeats: z.string().optional(),
  restaurantCapacity: z.string().optional(),
  parkingAvailable: z.boolean().optional(),
  reservationEnabled: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.vendorType === 'VENDOR') {
    if (!data.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'Select a category',
      });
    }
  }

  if (data.vendorType === 'FOOD_VENDOR' || data.vendorType === 'STREET_HUB_VENDOR') {
    if (!data.cuisineType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cuisineType'],
        message: 'Select a cuisine type',
      });
    }
    if (!data.fssaiNumber || data.fssaiNumber.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fssaiNumber'],
        message: 'FSSAI number is required',
      });
    }
  }

  if (data.vendorType === 'FOOD_VENDOR') {
    if (!data.foodBusinessType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['foodBusinessType'],
        message: 'Select a Food Business Type',
      });
    } else {
      const isOnline = data.foodBusinessType === 'ONLINE_FOOD' || data.foodBusinessType === 'BOTH';
      const isBooking = data.foodBusinessType === 'RESTAURANT_BOOKING' || data.foodBusinessType === 'BOTH';

      if (isOnline || isBooking) {
        if (!data.restaurantName || data.restaurantName.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['restaurantName'],
            message: 'Restaurant Name is required',
          });
        }
      }

      if (isOnline) {
        if (!data.foodCategory) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['foodCategory'],
            message: 'Food Category is required',
          });
        }
        if (!data.deliveryRadius) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deliveryRadius'],
            message: 'Delivery Radius is required',
          });
        }
        if (!data.kitchenType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['kitchenType'],
            message: 'Kitchen Type is required',
          });
        }
        if (!data.vegNonVeg) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['vegNonVeg'],
            message: 'Veg/Non-Veg type is required',
          });
        }
      }

      if (isBooking) {
        if (!data.restaurantCategory) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['restaurantCategory'],
            message: 'Restaurant Category is required',
          });
        }
        if (!data.diningType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['diningType'],
            message: 'Dining Type is required',
          });
        }
        if (!data.indoorSeats) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['indoorSeats'],
            message: 'Indoor Seats count is required',
          });
        }
        if (!data.outdoorSeats) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['outdoorSeats'],
            message: 'Outdoor Seats count is required',
          });
        }
        if (!data.restaurantCapacity) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['restaurantCapacity'],
            message: 'Restaurant Capacity is required',
          });
        }
      }
    }
  }
});

const step3Schema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Enter a valid PAN (e.g. ABCDE1234F)'),
});

const step4Schema = z.object({
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  bankAccountNumber: z.string().min(9, 'Enter a valid account number'),
  confirmAccountNumber: z.string().min(9, 'Enter a valid account number'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code'),
  agreed: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
}).refine(data => data.bankAccountNumber === data.confirmAccountNumber, {
  message: 'Account numbers do not match',
  path: ['confirmAccountNumber'],
});

// ─── InputField component ──────────────────────────────────────────────────
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

// ─── FileUploadField component ──────────────────────────────────────────────
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const SellerRegistration: React.FC<SellerRegistrationProps> = ({ onBack, onPrivacyClick }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(30);

  // Password visibility
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Bank auto-populate
  const [bankName, setBankName] = useState('');
  const [fetchingBank, setFetchingBank] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // File uploads
  const [idProof, setIdProof] = useState<FileUpload>({ file: null, preview: '', name: '' });
  const [businessProof, setBusinessProof] = useState<FileUpload>({ file: null, preview: '', name: '' });
  const [addressProof, setAddressProof] = useState<FileUpload>({ file: null, preview: '', name: '' });
  const [cancelledCheque, setCancelledCheque] = useState<FileUpload>({ file: null, preview: '', name: '' });

  // File errors state
  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});

  // Form setup using React Hook Form & Zod
  const { register, handleSubmit, setValue, getValues, watch, trigger, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      businessType: '',
      category: '',
      gstNumber: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
      businessAddress: '',
      area: '',
      panNumber: '',
      accountHolderName: '',
      bankAccountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      agreed: false,
      vendorType: 'VENDOR' as 'VENDOR' | 'FOOD_VENDOR' | 'STREET_HUB_VENDOR',
      cuisineType: '',
      fssaiNumber: '',
      openingTime: '09:00',
      closingTime: '22:00',
      foodBusinessType: '',
      restaurantName: '',
      foodCategory: '',
      deliveryRadius: '',
      kitchenType: '',
      vegNonVeg: '',
      restaurantCategory: '',
      diningType: '',
      indoorSeats: '',
      outdoorSeats: '',
      restaurantCapacity: '',
      parkingAvailable: false,
      reservationEnabled: false,
    }
  });

  const watchVendorType = watch('vendorType');
  const watchFoodBusinessType = watch('foodBusinessType');

  const steps = [
    { id: 1, title: 'Seller Basics', icon: <User size={16} /> },
    { id: 2, title: 'Business', icon: <Building2 size={16} /> },
    { id: 3, title: 'KYC', icon: <ShieldCheck size={16} /> },
    { id: 4, title: 'Bank', icon: <Landmark size={16} /> },
    { id: 5, title: 'Review', icon: <FileText size={16} /> },
  ];

  useEffect(() => {
    ApiService.getLocations().then(setCities);
  }, []);

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

  // IFSC lookup
  const watchIfsc = watch('ifscCode');
  useEffect(() => {
    const ifsc = (watchIfsc || '').toUpperCase();
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
  }, [watchIfsc]);

  // City change -> Load areas
  const watchCity = watch('city');
  useEffect(() => {
    if (watchCity) {
      const selectedCity = cities.find(c => c.name.toLowerCase() === watchCity.toLowerCase());
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
  }, [watchCity, cities]);

  // Form custom handler to manage input transformation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') setIsOtpVerified(false);

    let finalValue = value;
    if (['mobile', 'pincode', 'bankAccountNumber', 'confirmAccountNumber', 'deliveryRadius', 'indoorSeats', 'outdoorSeats', 'restaurantCapacity'].includes(name)) {
      finalValue = value.replace(/\D/g, '');
      if (name === 'mobile' && finalValue.length > 10) return;
      if (name === 'pincode' && finalValue.length > 6) return;
    } else if (name === 'panNumber') {
      finalValue = value.toUpperCase().slice(0, 10);
    } else if (name === 'ifscCode') {
      finalValue = value.toUpperCase().slice(0, 11);
    } else if (name === 'gstNumber') {
      finalValue = value.toUpperCase().slice(0, 15);
    }

    setValue(name as any, finalValue as any, { shouldValidate: true });
  };

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  // File upload handler
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileUpload>>,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Only JPG, PNG, WEBP, or PDF files accepted');
      return;
    }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
    setter({ file, preview, name: file.name });
    
    setFileErrors(prev => {
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
  };

  const removeFile = (setter: React.Dispatch<React.SetStateAction<FileUpload>>, fieldKey: string) => {
    setter({ file: null, preview: '', name: '' });
  };

  // Navigations
  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Result = await step1Schema.safeParseAsync(getValues());
      if (!step1Result.success) {
        // Trigger UI error indicators
        await trigger(['fullName', 'mobile', 'email', 'password', 'confirmPassword']);
        return;
      }

      if (!isOtpVerified) {
        try {
          setIsLoading(true);
          await api.post('/auth/login/send-otp', { phone: getValues('mobile') });
          setShowOtpModal(true);
        } catch (err: any) {
          alert(err?.response?.data?.message || 'Failed to send OTP.');
        } finally {
          setIsLoading(false);
        }
        return;
      }
    }

    if (currentStep === 2) {
      const step2Result = await step2Schema.safeParseAsync(getValues());
      if (!step2Result.success) {
        await trigger([
          'businessName', 'businessType', 'category', 'gstNumber', 'city', 'area', 'state', 'pincode',
          'businessAddress', 'openingTime', 'closingTime', 'cuisineType', 'fssaiNumber',
          'foodBusinessType', 'restaurantName', 'foodCategory', 'deliveryRadius', 'kitchenType',
          'vegNonVeg', 'restaurantCategory', 'diningType', 'indoorSeats', 'outdoorSeats', 'restaurantCapacity'
        ]);
        return;
      }
    }

    if (currentStep === 3) {
      const step3Result = await step3Schema.safeParseAsync(getValues());
      const fErrs: { [key: string]: string } = {};
      if (!step3Result.success) {
        await trigger(['panNumber']);
      }
      if (!idProof.file) fErrs.idProof = 'ID proof is required';
      if (!businessProof.file) fErrs.businessProof = 'Business proof is required';
      if (!addressProof.file) fErrs.addressProof = 'Address proof is required';

      if (Object.keys(fErrs).length > 0 || !step3Result.success) {
        setFileErrors(prev => ({ ...prev, ...fErrs }));
        return;
      }
    }

    if (currentStep === 4) {
      const step4Result = await step4Schema.safeParseAsync(getValues());
      const fErrs: { [key: string]: string } = {};
      if (!step4Result.success) {
        await trigger(['accountHolderName', 'bankAccountNumber', 'confirmAccountNumber', 'ifscCode', 'agreed']);
      }
      if (!cancelledCheque.file) fErrs.cancelledCheque = 'Cancelled cheque is required';

      if (Object.keys(fErrs).length > 0 || !step4Result.success) {
        setFileErrors(prev => ({ ...prev, ...fErrs }));
        return;
      }
    }

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
      const res = await api.post('/auth/login/verify-otp', { phone: getValues('mobile'), otp });
      if (res.data?.token) {
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

  const onSubmitForm = async (values: any) => {
    // Check steps again
    const finalValid = await step4Schema.safeParseAsync(values);
    if (!finalValid.success || !cancelledCheque.file) {
      setCurrentStep(4);
      scrollToTop();
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', values.fullName);
      data.append('email', values.email);
      data.append('phone', values.mobile);
      data.append('password', values.password);
      data.append('shopName', values.businessName);
      data.append('businessType', values.businessType);
      data.append('category', values.category || '');
      data.append('gstNumber', values.gstNumber || '');
      data.append('address', values.businessAddress);
      data.append('area', values.area);
      data.append('city', values.city);
      data.append('state', values.state);
      data.append('pincode', values.pincode);

      data.append('panNumber', values.panNumber);
      if (idProof.file) data.append('idProof', idProof.file);
      if (businessProof.file) data.append('businessProof', businessProof.file);
      if (addressProof.file) data.append('addressProof', addressProof.file);

      data.append('accountHolderName', values.accountHolderName);
      data.append('bankAccountNumber', values.bankAccountNumber);
      data.append('ifscCode', values.ifscCode);
      if (cancelledCheque.file) data.append('cancelledCheque', cancelledCheque.file);

      data.append('vendorType', values.vendorType);
      data.append('openingTime', values.openingTime);
      data.append('closingTime', values.closingTime);

      let businessModel = 'ONLINE_STORE';
      if (values.vendorType === 'FOOD_VENDOR') {
        businessModel = values.foodBusinessType || '';
      } else if (values.vendorType === 'STREET_HUB_VENDOR') {
        businessModel = 'STREET_HUB';
      }
      data.append('businessModel', businessModel);

      if (values.vendorType === 'FOOD_VENDOR' || values.vendorType === 'STREET_HUB_VENDOR') {
        data.append('cuisineType', values.cuisineType || '');
        data.append('fssaiNumber', values.fssaiNumber || '');
      }

      if (values.vendorType === 'FOOD_VENDOR') {
        data.append('foodBusinessType', values.foodBusinessType || '');
        data.append('restaurantName', values.restaurantName || '');
        
        if (values.foodBusinessType === 'ONLINE_FOOD' || values.foodBusinessType === 'BOTH') {
          data.append('foodCategory', values.foodCategory || '');
          data.append('deliveryRadius', values.deliveryRadius || '');
          data.append('kitchenType', values.kitchenType || '');
          data.append('vegNonVeg', values.vegNonVeg || '');
        }

        if (values.foodBusinessType === 'RESTAURANT_BOOKING' || values.foodBusinessType === 'BOTH') {
          data.append('restaurantCategory', values.restaurantCategory || '');
          data.append('diningType', values.diningType || '');
          data.append('indoorSeats', values.indoorSeats || '');
          data.append('outdoorSeats', values.outdoorSeats || '');
          data.append('restaurantCapacity', values.restaurantCapacity || '');
          data.append('parkingAvailable', String(values.parkingAvailable || false));
          data.append('reservationEnabled', 'true');
        }
      }

      await api.post('/public/vendor/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsSubmitted(true);
      scrollToTop();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Seller Basics</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Let's get you started</p>
            </div>

            <InputField label="Full Name" name="fullName" placeholder="e.g. Rajesh Kumar" icon={<User size={16} />} value={watch('fullName')} onChange={handleChange} error={errors.fullName?.message} />

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number <span className="text-red-400">*</span></label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  name="mobile" type="tel" value={watch('mobile')} onChange={handleChange}
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
              {errors.mobile && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.mobile.message}</p>}
            </div>

            <InputField label="Email Address" name="email" type="email" placeholder="seller@example.com" icon={<Mail size={16} />} value={watch('email')} onChange={handleChange} error={errors.email?.message} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={watch('password')} onChange={handleChange} placeholder="Min 6 chars"
                    className={`w-full p-4 pl-12 pr-12 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm ${errors.password ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" /> {errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={watch('confirmPassword')} onChange={handleChange} placeholder="Re-enter"
                    className={`w-full p-4 pl-12 pr-12 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm ${errors.confirmPassword ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" /> {errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>
        );

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
                onClick={() => {
                  setValue('vendorType', 'VENDOR');
                  setValue('category', '');
                }}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${watchVendorType === 'VENDOR' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                E-commerce
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('vendorType', 'FOOD_VENDOR');
                  setValue('category', 'Food');
                }}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${watchVendorType === 'FOOD_VENDOR' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Food
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('vendorType', 'STREET_HUB_VENDOR');
                  setValue('category', 'Food');
                }}
                className={`flex-1 min-w-[100px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${watchVendorType === 'STREET_HUB_VENDOR' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Street Hub
              </button>
            </div>

            <InputField label="Business / Shop Name" name="businessName" placeholder="e.g. Rajesh General Store" icon={<Store size={16} />} value={watch('businessName')} onChange={handleChange} error={errors.businessName?.message} />

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Type <span className="text-red-400">*</span></label>
              <select name="businessType" value={watch('businessType')} onChange={handleChange}
                className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('businessType') ? 'text-slate-900' : 'text-slate-400'} ${errors.businessType ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm`}>
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
              </select>
              {errors.businessType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.businessType.message}</p>}
            </div>

            {watchVendorType === 'VENDOR' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category <span className="text-red-400">*</span></label>
                <select name="category" value={watch('category')} onChange={handleChange}
                  className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('category') ? 'text-slate-900' : 'text-slate-400'} ${errors.category ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm`}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.category.message}</p>}
              </div>
            )}

            {watchVendorType === 'FOOD_VENDOR' && (
              <div className="space-y-4 animate-fade-in py-2 bg-indigo-50/30 rounded-3xl p-4 border-2 border-indigo-50">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 ml-1">Food Business Type <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'ONLINE_FOOD', label: 'Online Food Ordering', desc: 'Customers can browse the menu and place online food orders.' },
                    { value: 'RESTAURANT_BOOKING', label: 'Restaurant Table Booking', desc: 'Customers can reserve restaurant seats through JiffyKart DineOut.' },
                    { value: 'BOTH', label: 'Both Services', desc: 'Restaurant supports both Online Food Ordering and Restaurant Table Booking' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('foodBusinessType', opt.value, { shouldValidate: true })}
                      className={`text-left p-3.5 border-2 rounded-2xl transition-all flex flex-col ${watchFoodBusinessType === opt.value ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}
                    >
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        {opt.label}
                        {watchFoodBusinessType === opt.value && <CheckCircle size={14} className="text-indigo-600" />}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.foodBusinessType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.foodBusinessType.message}</p>}
              </div>
            )}

            {/* Dynamic Form Sections for Food */}
            {watchVendorType === 'FOOD_VENDOR' && watchFoodBusinessType && (
              <div className="space-y-4 animate-fade-in py-2">
                <div className="space-y-4 bg-slate-50/60 rounded-3xl p-4 border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-2">Food Vendor Profile</h4>
                  
                  <InputField label="Restaurant Name" name="restaurantName" placeholder="e.g. Nazhirya Restaurant" value={watch('restaurantName') || ''} onChange={handleChange} error={errors.restaurantName?.message} />

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cuisine Type <span className="text-red-400">*</span></label>
                    <select name="cuisineType" value={watch('cuisineType') || ''} onChange={handleChange}
                      className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('cuisineType') ? 'text-slate-900' : 'text-slate-400'} ${errors.cuisineType ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                      <option value="">Select cuisine</option>
                      {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.cuisineType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.cuisineType.message}</p>}
                  </div>

                  <InputField label="FSSAI License Number" name="fssaiNumber" placeholder="14-digit FSSAI number" maxLength={14} value={watch('fssaiNumber') || ''} onChange={handleChange} error={errors.fssaiNumber?.message} />
                </div>

                {(watchFoodBusinessType === 'ONLINE_FOOD' || watchFoodBusinessType === 'BOTH') && (
                  <div className="space-y-4 bg-orange-50/20 rounded-3xl p-4 border border-orange-100/50">
                    <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-orange-100/60 pb-2">Online Ordering Details</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-1">Food Category <span className="text-red-400">*</span></label>
                      <select name="foodCategory" value={watch('foodCategory') || ''} onChange={handleChange}
                        className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('foodCategory') ? 'text-slate-900' : 'text-slate-400'} ${errors.foodCategory ? 'border-red-300' : 'border-orange-100/60 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                        <option value="">Select category</option>
                        {['Veg', 'Non-Veg', 'Bakery', 'Beverages', 'Fast Food', 'Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.foodCategory && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.foodCategory.message}</p>}
                    </div>

                    <InputField label="Delivery Radius (in KM)" name="deliveryRadius" placeholder="e.g. 5" value={watch('deliveryRadius') || ''} onChange={handleChange} error={errors.deliveryRadius?.message} />

                    <div>
                      <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-1">Kitchen Type <span className="text-red-400">*</span></label>
                      <select name="kitchenType" value={watch('kitchenType') || ''} onChange={handleChange}
                        className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('kitchenType') ? 'text-slate-900' : 'text-slate-400'} ${errors.kitchenType ? 'border-red-300' : 'border-orange-100/60 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                        <option value="">Select kitchen type</option>
                        {['Cloud Kitchen', 'Dine-in Kitchen', 'QSR (Quick Service Restaurant)', 'Bakery'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.kitchenType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.kitchenType.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-1">Veg / Non-Veg <span className="text-red-400">*</span></label>
                      <select name="vegNonVeg" value={watch('vegNonVeg') || ''} onChange={handleChange}
                        className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('vegNonVeg') ? 'text-slate-900' : 'text-slate-400'} ${errors.vegNonVeg ? 'border-red-300' : 'border-orange-100/60 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                        <option value="">Select option</option>
                        {['Veg Only', 'Non-Veg Only', 'Both'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.vegNonVeg && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.vegNonVeg.message}</p>}
                    </div>
                  </div>
                )}

                {(watchFoodBusinessType === 'RESTAURANT_BOOKING' || watchFoodBusinessType === 'BOTH') && (
                  <div className="space-y-4 bg-purple-50/20 rounded-3xl p-4 border border-purple-100/50">
                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest border-b border-purple-100/60 pb-2">Table Booking Details</h4>
                    
                    <div>
                      <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 ml-1">Restaurant Category <span className="text-red-400">*</span></label>
                      <select name="restaurantCategory" value={watch('restaurantCategory') || ''} onChange={handleChange}
                        className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('restaurantCategory') ? 'text-slate-900' : 'text-slate-400'} ${errors.restaurantCategory ? 'border-red-300' : 'border-purple-100/60 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                        <option value="">Select category</option>
                        {['Fine Dining', 'Casual Dining', 'Cafe', 'Bar & Lounge', 'Buffet'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.restaurantCategory && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.restaurantCategory.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 ml-1">Dining Type <span className="text-red-400">*</span></label>
                      <select name="diningType" value={watch('diningType') || ''} onChange={handleChange}
                        className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('diningType') ? 'text-slate-900' : 'text-slate-400'} ${errors.diningType ? 'border-red-300' : 'border-purple-100/60 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                        <option value="">Select dining type</option>
                        {['Family', 'Romantic', 'Corporate', 'Casual'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.diningType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.diningType.message}</p>}
                    </div>

                    <InputField label="Indoor Seats" name="indoorSeats" placeholder="e.g. 40" value={watch('indoorSeats') || ''} onChange={handleChange} error={errors.indoorSeats?.message} />
                    <InputField label="Outdoor Seats" name="outdoorSeats" placeholder="e.g. 20" value={watch('outdoorSeats') || ''} onChange={handleChange} error={errors.outdoorSeats?.message} />
                    <InputField label="Restaurant Capacity" name="restaurantCapacity" placeholder="e.g. 60" value={watch('restaurantCapacity') || ''} onChange={handleChange} error={errors.restaurantCapacity?.message} />

                    <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setValue('parkingAvailable', !watch('parkingAvailable'), { shouldValidate: true })}
                        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${watch('parkingAvailable') ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}
                      >
                        {watch('parkingAvailable') && <Check size={14} className="text-white" />}
                      </button>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Parking Available</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(watchVendorType === 'FOOD_VENDOR' || watchVendorType === 'STREET_HUB_VENDOR') && !watchFoodBusinessType && (
              <div className="space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-3xl">
                <InputField label="FSSAI License Number" name="fssaiNumber" placeholder="14-digit FSSAI number" maxLength={14} value={watch('fssaiNumber') || ''} onChange={handleChange} error={errors.fssaiNumber?.message} />
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cuisine Type <span className="text-red-400">*</span></label>
                  <select name="cuisineType" value={watch('cuisineType') || ''} onChange={handleChange}
                    className={`w-full p-4 bg-white border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('cuisineType') ? 'text-slate-900' : 'text-slate-400'} ${errors.cuisineType ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'} focus:outline-none transition shadow-sm`}>
                    <option value="">Select cuisine</option>
                    {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.cuisineType && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.cuisineType.message}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Opening Time <span className="text-red-400">*</span></label>
                <input type="time" name="openingTime" value={watch('openingTime')} onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:outline-none transition shadow-sm" />
                {errors.openingTime && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" />{errors.openingTime.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Closing Time <span className="text-red-400">*</span></label>
                <input type="time" name="closingTime" value={watch('closingTime')} onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:outline-none transition shadow-sm" />
                {errors.closingTime && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1"><AlertCircle size={10} className="inline mr-0.5" />{errors.closingTime.message}</p>}
              </div>
            </div>

            <InputField label="GST Number" name="gstNumber" placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} value={watch('gstNumber')} onChange={handleChange} error={errors.gstNumber?.message} />

            <div className="pt-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Address <span className="text-red-400">*</span></label>
              <textarea name="businessAddress" value={watch('businessAddress')} onChange={handleChange} rows={2} placeholder="Full street address, landmark"
                className={`w-full p-4 bg-slate-50 border-2 rounded-2xl font-semibold text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none transition shadow-sm text-sm resize-none ${errors.businessAddress ? 'border-red-300' : 'border-slate-100 focus:border-indigo-400'}`} />
              {errors.businessAddress && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.businessAddress.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City <span className="text-red-400">*</span></label>
                <select name="city" value={watch('city')} onChange={handleChange}
                  className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('city') ? 'text-slate-900' : 'text-slate-400'} ${errors.city ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm`}>
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {errors.city && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Area / Neighborhood <span className="text-red-400">*</span></label>
                <select name="area" value={watch('area')} onChange={handleChange} disabled={!watch('city') || loadingAreas}
                  className={`w-full p-4 bg-slate-100 border-2 rounded-2xl font-semibold text-sm appearance-none ${watch('area') ? 'text-slate-900' : 'text-slate-400'} ${errors.area ? 'border-red-300' : 'border-slate-200 focus:border-indigo-400'} focus:bg-white focus:outline-none transition shadow-sm disabled:opacity-50`}>
                  <option value="">{loadingAreas ? 'Loading areas...' : 'Select area'}</option>
                  {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  <option value="Other">Other</option>
                </select>
                {errors.area && <p className="text-red-400 text-[10px] font-bold mt-1.5 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.area.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">State <span className="text-red-400">*</span></label>
                <select name="state" value={watch('state')} onChange={handleChange}
                  className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-semibold text-sm text-slate-900 focus:bg-white focus:border-indigo-400 focus:outline-none transition shadow-sm appearance-none">
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <InputField label="Pincode" name="pincode" placeholder="600001" maxLength={6} value={watch('pincode')} onChange={handleChange} error={errors.pincode?.message} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">KYC & Documents</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Identity verification</p>
            </div>

            <InputField label="PAN Number" name="panNumber" placeholder="e.g. ABCDE1234F" maxLength={10} icon={<CreditCard size={16} />} value={watch('panNumber')} onChange={handleChange} error={errors.panNumber?.message} />

            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">📋 Upload Guidelines</p>
              <p className="text-[10px] text-indigo-400/80 font-semibold leading-relaxed">
                Upload clear, legible scans or photos. Accepted: JPG, PNG, WEBP, PDF (max 5MB each).
              </p>
            </div>

            <FileUploadField label="ID Proof (Aadhaar / Voter ID / Passport)" fileState={idProof} onUpload={(e) => handleFileUpload(e, setIdProof, 'idProof')} onRemove={() => removeFile(setIdProof, 'idProof')} error={fileErrors.idProof} />
            <FileUploadField label="Business Proof (Shop License / GST Certificate)" fileState={businessProof} onUpload={(e) => handleFileUpload(e, setBusinessProof, 'businessProof')} onRemove={() => removeFile(setBusinessProof, 'businessProof')} error={fileErrors.businessProof} />
            <FileUploadField label="Address Proof (Utility Bill / Rent Agreement)" fileState={addressProof} onUpload={(e) => handleFileUpload(e, setAddressProof, 'addressProof')} onRemove={() => removeFile(setAddressProof, 'addressProof')} error={fileErrors.addressProof} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Bank Details</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">For payouts & settlements</p>
            </div>

            <InputField label="Account Holder Name" name="accountHolderName" placeholder="As per bank records" icon={<User size={16} />} value={watch('accountHolderName')} onChange={handleChange} error={errors.accountHolderName?.message} />
            <InputField label="Account Number" name="bankAccountNumber" placeholder="Enter account number" icon={<Landmark size={16} />} value={watch('bankAccountNumber')} onChange={handleChange} error={errors.bankAccountNumber?.message} />
            <InputField label="Re-enter Account Number" name="confirmAccountNumber" placeholder="Confirm account number" icon={<Landmark size={16} />} value={watch('confirmAccountNumber')} onChange={handleChange} error={errors.confirmAccountNumber?.message} />

            <div>
              <InputField label="IFSC Code" name="ifscCode" placeholder="e.g. SBIN0001234" maxLength={11} icon={<IndianRupee size={16} />}
                value={watch('ifscCode')} onChange={handleChange} error={errors.ifscCode?.message}
                suffix={fetchingBank ? <span className="text-[9px] text-indigo-400 font-bold animate-pulse">Looking up...</span> : undefined}
              />
              {bankName && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">{bankName}</p>
                </div>
              )}
            </div>

            <FileUploadField label="Cancelled Cheque / Passbook Front Page" fileState={cancelledCheque} onUpload={(e) => handleFileUpload(e, setCancelledCheque, 'cancelledCheque')} onRemove={() => removeFile(setCancelledCheque, 'cancelledCheque')} error={fileErrors.cancelledCheque} />

            <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition ${errors.agreed ? 'border-red-200 bg-red-50/30' : 'border-slate-100 bg-slate-50'}`}>
              <button type="button" onClick={() => { setValue('agreed', !watch('agreed'), { shouldValidate: true }); }}
                className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${watch('agreed') ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                {watch('agreed') && <Check size={14} className="text-white" />}
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                I confirm that the information provided is accurate and I agree to the <button type="button" className="text-indigo-500 hover:underline">Terms of Service</button> and <button type="button" onClick={onPrivacyClick} className="text-indigo-500 hover:underline">Privacy Policy</button>.
              </p>
            </div>
            {errors.agreed && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.agreed.message}</p>}
          </div>
        );

      case 5:
        const values = getValues();
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">Review Application</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">One last look before you submit</p>
            </div>

            <div className="bg-slate-50/80 rounded-3xl p-6 border-2 border-slate-100 space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><User size={12} /> Personal Details</span>
                  <button onClick={() => { setCurrentStep(1); scrollToTop(); }} className="text-[10px] text-indigo-500 hover:underline cursor-pointer">Edit</button>
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Name</span> <span className="text-xs font-bold text-slate-700">{values.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Mobile</span> <span className="text-xs font-bold text-slate-700">+91 {values.mobile}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Email</span> <span className="text-xs font-bold text-slate-700">{values.email}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Store size={12} /> Business Info</span>
                  <button onClick={() => { setCurrentStep(2); scrollToTop(); }} className="text-[10px] text-indigo-500 hover:underline cursor-pointer">Edit</button>
                </h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Shop Name</span> <span className="text-xs font-bold text-slate-700">{values.businessName}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Vendor Type</span> <span className="text-xs font-bold text-slate-700">{values.vendorType === 'FOOD_VENDOR' ? 'Food' : values.vendorType === 'STREET_HUB_VENDOR' ? 'Street Hub' : 'E-commerce'}</span></div>
                  {values.vendorType === 'FOOD_VENDOR' && (
                    <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Food Business Type</span> <span className="text-xs font-bold text-slate-700">{values.foodBusinessType}</span></div>
                  )}
                  {values.category && (
                    <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Category</span> <span className="text-xs font-bold text-slate-700">{values.category}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">GST</span> <span className="text-xs font-bold text-slate-700">{values.gstNumber || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-slate-400 font-bold">Hours</span> <span className="text-xs font-bold text-slate-700">{values.openingTime} to {values.closingTime}</span></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex flex-col font-sans" ref={topRef}>
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

      <div className="bg-white px-6 pb-5 pt-4 border-b border-slate-100 sticky top-[64px] z-20">
        <div className="flex justify-between relative max-w-lg mx-auto">
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

      <div className="flex-1 max-w-lg mx-auto w-full px-6 pb-32 pt-6">
        <form onSubmit={handleSubmit(onSubmitForm)} autoComplete="off">
          {renderStepContent()}
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg p-5 border-t border-slate-100 flex items-center justify-between z-40">
        <button type="button" onClick={handlePrev} disabled={currentStep === 1}
          className={`flex items-center gap-2 px-5 py-3 font-black text-xs uppercase tracking-widest transition rounded-2xl ${currentStep === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
          <ChevronLeft size={18} /> Back
        </button>

        <button type="button"
          onClick={currentStep < steps.length ? handleNext : handleSubmit(onSubmitForm)}
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

      {showOtpModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setShowOtpModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative z-10 shadow-2xl animate-slide-up">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"><X size={20} /></button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500">
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-black text-secondary tracking-tight uppercase">Verify Mobile</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">OTP sent to +91 {getValues('mobile')}</p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input type="text" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-indigo-400 outline-none transition" placeholder="0000" autoFocus />
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold">Resend OTP in <span className="text-indigo-500">{timer}s</span></p>
                ) : (
                  <button type="button" onClick={async () => {
                    try { await api.post('/auth/login/send-otp', { phone: getValues('mobile') }); setTimer(30); } catch { alert('Failed to resend'); }
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
