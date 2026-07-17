import React, { useState, useEffect } from 'react';
import {
  User, Package, MapPin, Heart, CreditCard, HelpCircle, LogOut,
  Edit2, CheckCircle, Clock, RotateCw, Bike, Plus, Smartphone,
  X, Trash2, ShieldCheck, AlertTriangle, Save, Loader2, Mail, Phone, KeyRound
} from 'lucide-react';
import { Order, Address, PaymentMethod, Product } from '../types';
import { useNavigation, useCart, useFavorites, useAuth } from '../hooks';
import { ApiService } from '../services/apiService';
import { createPortal } from 'react-dom';

interface UserProfileProps {
  onLogout: () => void;
  onTrackOrder?: (order: Order) => void;
  onBuyAgain?: (order: Order) => void;
  initialTab?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogout, onTrackOrder, onBuyAgain, initialTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { navigate } = useNavigation();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { user, updateUser } = useAuth();

  const [userData, setUserData] = useState({
    name: '', email: '', phone: '', gender: 'Not Specified',
    avatar: '',
    pendingEmail: null as string | null,
    pendingPhone: null as string | null,
    emailVerified: false,
    phoneVerified: false,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', gender: 'Not Specified'
  });

  // Contact change state
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [contactOtp, setContactOtp] = useState('');
  const [contactChangeType, setContactChangeType] = useState<'EMAIL_CHANGE' | 'PHONE_CHANGE' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isRequestingChange, setIsRequestingChange] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [dbAddresses, setDbAddresses] = useState<Address[]>([]);
  const [dbPayments, setDbPayments] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    type: 'Home', address_line1: '', address_line2: ''
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'address' | 'payment'; id: string; label: string } | null>(null);

  // Return & Replace
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnForm, setReturnForm] = useState({
    reason: '', details: '', type: 'RETURN'
  });
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [profile, ordersData, addrs, payments] = await Promise.all([
        ApiService.getProfile(),
        ApiService.getOrders(),
        ApiService.getAddresses(user.id),
        ApiService.getPaymentMethods(user.id)
      ]);
      setUserData(profile);
      setEditForm({ name: profile.name, gender: profile.gender });
      setOrders(ordersData);
      setDbAddresses(addrs);
      setDbPayments(payments);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // ── Save safe fields (name, gender) ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await ApiService.updateProfile(editForm);
      const updatedUser = result.user || result;
      setUserData(prev => ({ ...prev, ...updatedUser }));
      updateUser(updatedUser);
      setIsEditing(false);
      showToast("Profile updated successfully!");
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || "Failed to update profile.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpdate = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        showToast('Uploading profile photo...', 'success');
        const response = await ApiService.updateProfileImage(file);

        if (response.avatarUrl) {
          const newUser = { ...userData, avatar: response.avatarUrl };
          setUserData(newUser);
          updateUser(newUser);
        }

        showToast('Profile photo updated successfully!', 'success');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to upload photo";
        showToast(errorMessage, 'error');
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!userData.avatar) return;
    try {
      showToast('Deleting profile photo...', 'success');
      const success = await ApiService.deleteProfileImage();
      if (success) {
        const newUser = { ...userData, avatar: '' };
        setUserData(newUser);
        updateUser(newUser);
        showToast('Profile photo deleted successfully!', 'success');
      }
    } catch (err: any) {
      showToast("Failed to delete photo", 'error');
    }
  };


  // ── Request email/phone change (sends OTP) ──
  const handleRequestContactChange = async (type: 'EMAIL_CHANGE' | 'PHONE_CHANGE') => {
    setIsRequestingChange(true);
    try {
      if (type === 'EMAIL_CHANGE') {
        if (!newEmail.trim()) { showToast("Please enter a new email address.", 'error'); return; }
        await ApiService.requestEmailChange(newEmail.trim());
        showToast("OTP sent to your new email address.");
      } else {
        if (!newPhone.trim()) { showToast("Please enter a new phone number.", 'error'); return; }
        await ApiService.requestPhoneChange(newPhone.trim());
        showToast("OTP sent to your new phone number.");
      }
      setContactChangeType(type);
      setOtpSent(true);
      setContactOtp('');
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || "Failed to send OTP.";
      showToast(errorMessage, 'error');
    } finally {
      setIsRequestingChange(false);
    }
  };

  // ── Verify OTP and apply change ──
  const handleVerifyContactChange = async () => {
    if (!contactChangeType || !contactOtp.trim()) {
      showToast("Please enter the OTP.", 'error');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const result = await ApiService.verifyContactChange(contactOtp.trim(), contactChangeType);
      const updatedUser = result.user || result;
      setUserData(prev => ({ ...prev, ...updatedUser }));
      updateUser(updatedUser);
      showToast(result.message || "Contact updated successfully!");
      // Reset contact change state
      resetContactChange();
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || "OTP verification failed.";
      showToast(errorMessage, 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      if (editingAddress) {
        await ApiService.updateAddress(user.id, editingAddress.id, addressForm);
        showToast("Address updated successfully!");
      } else {
        await ApiService.addAddress(user.id, addressForm);
        showToast("Address added successfully!");
      }
      setShowAddressModal(false);
      fetchData(); // Refresh list
    } catch (e: any) {
      showToast(e.message || "Failed to save address.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    try {
      await ApiService.deleteAddress(user.id, id);
      showToast("Address deleted successfully!");
      fetchData(); // Refresh list
    } catch (e: any) {
      showToast(e.message || "Failed to delete address.", 'error');
    }
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({ type: address.type, address_line1: address.address_line1, address_line2: address.address_line2 });
    } else {
      setEditingAddress(null);
      setAddressForm({ type: 'Home', address_line1: '', address_line2: '' });
    }
    setShowAddressModal(true);
  };

  const openReturnModal = (order: Order) => {
    setReturnOrder(order);
    setReturnForm({ reason: '', details: '', type: 'RETURN' });
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !returnOrder || !returnOrder.items.length) return;
    setIsSubmittingReturn(true);
    try {
      const payload = {
        orderId: returnOrder.id,
        userId: user.id,
        vendorId: returnOrder.shop_id,
        productId: returnOrder.items[0].product.id,
        reason: returnForm.reason,
        details: returnForm.details,
        type: returnForm.type,
        images: []
      };
      await ApiService.createReturnRequest(payload);
      showToast("Request submitted successfully!");
      setShowReturnModal(false);
      fetchData(); // Refresh list to show return status immediately
    } catch (e: any) {
      showToast(e.message || "Failed to submit request.", 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const resetContactChange = () => {
    setContactChangeType(null);
    setOtpSent(false);
    setContactOtp('');
    setNewEmail('');
    setNewPhone('');
  };

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={20} /> },
    { id: 'favorites', label: 'Favourites', icon: <Heart size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Account...</p>
      </div>
    </div>
  );

  const renderReturnStatus = (order: Order) => {
    if (!order.returnRequest) return null;
    const rr = order.returnRequest;

    const getStatusStyle = (status: string) => {
      switch (status.toUpperCase()) {
        case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'COMPLETED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
      }
    };

    return (
      <div className="mt-4 p-5 bg-slate-50 rounded-3xl border border-dashed border-slate-200 animate-fade-in relative overflow-hidden group/return">
        <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover/return:opacity-10 transition-opacity">
            <RotateCw size={60} strokeWidth={4} />
        </div>
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover/return:rotate-12">
              <RotateCw size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status Tracker</p>
              <h5 className="text-sm font-black text-slate-900 tracking-tight">{rr.type} Request</h5>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(rr.status)}`}>
            {rr.status}
          </span>
        </div>
        
        <div className="space-y-3 relative z-10">
           <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <p className="text-xs text-slate-600 font-bold">Reason: <span className="text-slate-500 ml-1 font-medium">{rr.reason}</span></p>
           </div>
           
           {rr.rejectionReason && (
             <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 animate-slide-up">
               <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle size={14} className="text-rose-500" />
                 <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Rejection Note</p>
               </div>
               <p className="text-xs text-rose-700 font-medium leading-relaxed italic">"{rr.rejectionReason}"</p>
             </div>
           )}
           
           <div className="pt-2 border-t border-slate-200/50">
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-right">Requested on: {new Date(rr.createdAt).toLocaleDateString()}</p>
           </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            {isEditing ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-zoom-in">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">Edit Profile</h3>
                  <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        required
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                      <select
                        value={editForm.gender}
                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none appearance-none"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                        <option>Not Specified</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden group">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center font-black text-4xl uppercase text-primary border-4 border-white shadow-lg relative z-10 overflow-hidden group/avatar">
                    {userData.avatar ? (
                      <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userData.name.charAt(0) || <User size={40} />
                    )}
                    <div
                      onClick={handlePhotoUpdate}
                      className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-white"
                    >
                      <User size={24} className="mb-1" />
                    </div>
                    {userData.avatar && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(); }}
                        className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20 hover:bg-rose-600 shadow-sm"
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
                  <div className="text-center md:text-left flex-1 relative z-10">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userData.name || 'User'}</h2>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-6 mt-2">
                      <p className="text-slate-400 font-bold text-sm uppercase flex items-center justify-center md:justify-start gap-2">
                        <Smartphone size={14} className="text-primary" /> {userData.phone}
                      </p>
                      <p className="text-slate-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" /> Verified Member
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="md:absolute top-6 right-6 p-3 bg-slate-50 hover:bg-primary hover:text-white rounded-2xl text-slate-400 transition-all shadow-sm border border-slate-50 flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </button>
                </div>

                {/* Account Details */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" /> Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email Address</p>
                      <p className="font-black text-slate-700 text-lg">{userData.email || 'Not provided'}</p>
                      {userData.emailVerified && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle size={12} /> Verified</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Gender</p>
                      <p className="font-black text-slate-700 text-lg">{userData.gender || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Secure Contact Change Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-xl mb-2 flex items-center gap-2">
                    <KeyRound size={20} className="text-amber-500" /> Change Contact Info
                  </h3>
                  <p className="text-sm text-slate-400 font-bold mb-8">
                    Email and phone changes require OTP verification for your security.
                  </p>

                  {/* OTP Verification Panel (shown when OTP is sent) */}
                  {otpSent && contactChangeType && (
                    <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-zoom-in">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-xl">
                          <KeyRound size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-black text-amber-800 text-sm">
                            OTP Sent to {contactChangeType === 'EMAIL_CHANGE' ? 'New Email' : 'New Phone'}
                          </p>
                          <p className="text-xs text-amber-600 font-bold">
                            {contactChangeType === 'EMAIL_CHANGE' ? newEmail : newPhone}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter 4-digit OTP"
                          value={contactOtp}
                          onChange={e => setContactOtp(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-5 py-3 bg-white border-2 border-amber-200 rounded-xl font-black text-center text-xl tracking-[0.5em] text-slate-900 focus:border-amber-400 transition-all outline-none"
                        />
                        <button
                          onClick={handleVerifyContactChange}
                          disabled={isVerifyingOtp || contactOtp.length < 4}
                          className="bg-amber-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {isVerifyingOtp ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                          Verify
                        </button>
                        <button
                          onClick={resetContactChange}
                          className="p-3 text-slate-400 hover:text-slate-600 transition"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email Change */}
                  {!otpSent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Mail size={12} /> Change Email
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="email"
                            placeholder={userData.email || "Enter new email"}
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="flex-1 px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none text-sm"
                          />
                          <button
                            onClick={() => handleRequestContactChange('EMAIL_CHANGE')}
                            disabled={isRequestingChange || !newEmail.trim()}
                            className="bg-primary text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
                          >
                            {isRequestingChange ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />}
                            Send OTP
                          </button>
                        </div>
                        {userData.pendingEmail && (
                          <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <AlertTriangle size={12} /> Pending: {userData.pendingEmail} (awaiting verification)
                          </p>
                        )}
                      </div>

                      {/* Phone Change */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Phone size={12} /> Change Phone
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="tel"
                            placeholder={userData.phone || "Enter new phone"}
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            className="flex-1 px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none text-sm"
                          />
                          <button
                            onClick={() => handleRequestContactChange('PHONE_CHANGE')}
                            disabled={isRequestingChange || !newPhone.trim()}
                            className="bg-primary text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
                          >
                            {isRequestingChange ? <Loader2 className="animate-spin" size={14} /> : <Phone size={14} />}
                            Send OTP
                          </button>
                        </div>
                        {userData.pendingPhone && (
                          <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            <AlertTriangle size={12} /> Pending: {userData.pendingPhone} (awaiting verification)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-2xl text-slate-900">Order History</h3>
              <span className="bg-slate-100 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Total: {orders.length}</span>
            </div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-200">
                  <Package size={40} />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-2">No orders yet</h4>
                <button onClick={() => navigate('home')} className="mt-6 bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition shadow-lg">Start Shopping</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white border rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                        <img src={order.shop_image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-xl group-hover:text-primary transition-colors tracking-tight">{order.shop_name}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Order #{order.id}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{order.status}</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100/50">
                    <p className="text-sm text-slate-500 font-bold leading-relaxed">{order.items.join(', ')}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-2xl text-slate-900">₹{order.total.toLocaleString()}</span>
                    <div className="flex gap-4">
                      {order.status === 'On the way' && (
                        <button onClick={() => onTrackOrder?.(order)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition">Track Live</button>
                      )}
                      {(order.status === 'Delivered' || order.status === 'Completed') && !order.returnRequest && (
                        <button onClick={() => openReturnModal(order)} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition flex items-center gap-2" title="Request Return or Replace"><RotateCw size={14} /> Return/Replace</button>
                      )}
                      <button onClick={() => onBuyAgain?.(order)} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-indigo-600 transition flex items-center gap-2"><Plus size={14} /> Reorder</button>
                    </div>
                  </div>
                  {renderReturnStatus(order)}
                </div>
              ))
            )}
          </div>
        );
      case 'addresses':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl">Saved Addresses</h3>
              <button onClick={() => setShowAddressModal(true)} className="bg-indigo-50 text-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition flex items-center gap-2"><Plus size={16} strokeWidth={3} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dbAddresses.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-300 font-black uppercase tracking-widest">No addresses saved</div>
              ) : (
                dbAddresses.map(addr => (
                  <div key={addr.id} className="bg-white border rounded-[2.5rem] p-8 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        {addr.type === 'Home' ? <ShieldCheck size={24} /> : <Clock size={24} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-black text-xl">{addr.type}</h4>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openAddressModal(addr)} className="p-2 text-slate-400 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 font-bold leading-relaxed">{addr.address_line1}, {addr.address_line2}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'favorites':
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-black text-2xl mb-8">My Favourites</h3>
            {favorites.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] py-20 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                <Heart size={40} className="text-rose-200 mb-4" />
                <p className="text-slate-400 font-bold">You haven't favorited any items yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favorites.map(p => (
                  <div key={p.id} className="bg-white border rounded-[2.5rem] p-6 shadow-sm flex gap-6 hover:shadow-lg transition-all">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 shrink-0">
                      <img src={p.image} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 truncate">{p.name}</h4>
                      <p className="text-emerald-600 font-black mt-1">₹{p.price.toLocaleString()}</p>
                      <button onClick={() => addToCart(p)} className="mt-3 text-[10px] font-black uppercase text-primary hover:underline">Add to Cart</button>
                    </div>
                    <button onClick={() => toggleFavorite(p)} className="text-rose-500"><X size={18} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl">Payment Methods</h3>
              <button onClick={() => setShowPaymentModal(true)} className="bg-indigo-50 text-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition flex items-center gap-2"><Plus size={16} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dbPayments.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-300 font-black uppercase tracking-widest">No payment methods saved</div>
              ) : (
                dbPayments.map(p => (
                  <div key={p.id} className="bg-white border rounded-[2.5rem] p-8 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-indigo-50 text-primary rounded-2xl">
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-lg">{p.provider}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{p.type} • {p.upi_id || `•••• ${p.last4}`}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      default: return <div className="p-10 text-center text-slate-300">Feature Syncing...</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative bg-background">
      {/* Toast */}
      {toast && createPortal(
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm pointer-events-none">
          <div className={`${toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10 backdrop-blur-md`}>
            <div className={`${toast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-500'} rounded-full p-1.5 shrink-0 shadow-lg`}>
              {toast.type === 'error' ? <AlertTriangle size={16} strokeWidth={4} className="text-white" /> : <CheckCircle size={16} strokeWidth={4} className="text-white" />}
            </div>
            <p className="font-bold text-sm tracking-tight flex-1">{toast.message}</p>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 p-4 sticky top-28">
            <div className="space-y-2">
              {menuItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 px-6 py-4 text-sm font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-50 text-primary shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <span className={activeTab === item.id ? 'text-primary' : 'text-slate-200'}>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 px-2">
              <button onClick={onLogout} className="w-full flex items-center gap-5 px-6 py-4 text-sm font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 rounded-2xl transition-all"><LogOut size={20} /> Logout</button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>

      {/* Address Modal */}
      {showAddressModal && createPortal(
        <div className="fixed inset-0 z-[400] overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{editingAddress ? 'Update' : 'Add New'} Address</h3>
                <button onClick={() => setShowAddressModal(false)} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveAddress} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Home', 'Office'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, type: t })}
                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${addressForm.type === t ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/30'}`}
                      >
                        {t === 'Home' ? <ShieldCheck size={18} /> : <Clock size={14} />} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">House/Flat No, Apartment Name</label>
                  <input
                    required
                    type="text"
                    value={addressForm.address_line1}
                    onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none"
                    placeholder="e.g. 402, Green Valley Apartments"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area, Street, Landmark</label>
                  <textarea
                    required
                    value={addressForm.address_line2}
                    onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none min-h-[100px] resize-none"
                    placeholder="e.g. T. Nagar, Near Saravana Stores"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    {isSaving ? 'Processing...' : (editingAddress ? 'Update' : 'Save')} Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Return / Replace Modal */}
      {showReturnModal && createPortal(
        <div className="fixed inset-0 z-[400] overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2"><RotateCw className="text-primary"/> Need Help with Order?</h3>
                <button onClick={() => setShowReturnModal(false)} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"><X size={24} /></button>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-6">
                File a return or replacement request for Order <strong>#{returnOrder?.id}</strong> from <strong>{returnOrder?.shop_name}</strong>.
              </p>
              
              <form onSubmit={handleReturnSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Request Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['RETURN', 'REPLACEMENT'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setReturnForm({ ...returnForm, type: t })}
                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${returnForm.type === t ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/30'}`}
                      >
                       {t}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Reason</label>
                  <select
                    required
                    value={returnForm.reason}
                    onChange={e => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none appearance-none"
                  >
                    <option value="" disabled>Select a reason...</option>
                    <option value="Damaged Product">Item was damaged upon arrival</option>
                    <option value="Wrong Item">Received completely wrong item</option>
                    <option value="Missing Parts">Item is missing parts or accessories</option>
                    <option value="Quality Issue">Quality is not as expected</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Details</label>
                  <textarea
                    required
                    value={returnForm.details}
                    onChange={e => setReturnForm({ ...returnForm, details: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-primary transition-all outline-none min-h-[100px] resize-none"
                    placeholder="Provide more details about the issue..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmittingReturn || !returnForm.reason}
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmittingReturn ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};