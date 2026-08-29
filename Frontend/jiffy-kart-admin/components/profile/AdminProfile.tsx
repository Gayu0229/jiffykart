
import React, { useState } from 'react';
import {
   User, Mail, Phone, Calendar, Clock, Shield,
   Camera, Lock, Save, LogOut, CheckCircle, AlertCircle, Trash2
} from 'lucide-react';

import { AdminUser } from '../../types';
import { api } from '../../services/api';

interface AdminProfileProps {
   user: AdminUser;
   onLogout: () => void;
   onAvatarUpdate?: (newUrl: string) => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ user, onLogout, onAvatarUpdate }) => {
   const [isEditing, setIsEditing] = useState(false);
   const [isChangingPassword, setIsChangingPassword] = useState(false);
   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
   const [successMsg, setSuccessMsg] = useState('');
   const [avatarUrl, setAvatarUrl] = useState<string | undefined>((user as any).avatarUrl || (user as any).avatar);
   const fileInputRef = React.useRef<HTMLInputElement>(null);

   // Form State
   const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      mobile: user.mobile || '',
   });

   const [passwordData, setPasswordData] = useState({
      current: '',
      new: '',
      confirm: ''
   });

   const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         // Mock API Call: PUT /api/v1/admin/profile
         // await fetch('/api/v1/admin/profile', {
         //   method: 'PUT',
         //   headers: { 'Content-Type': 'application/json' },
         //   body: JSON.stringify(formData)
         // });
         await new Promise(resolve => setTimeout(resolve, 800));

         setSuccessMsg('Profile updated successfully!');
         setIsEditing(false);
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (e) {
         alert("Failed to update profile");
      }
   };

   const handleSavePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordData.new !== passwordData.confirm) {
         alert("New passwords do not match.");
         return;
      }
      try {
         // Mock API Call: POST /api/v1/admin/change-password
         // await fetch('/api/v1/admin/change-password', {
         //   method: 'POST',
         //   headers: { 'Content-Type': 'application/json' },
         //   body: JSON.stringify(passwordData)
         // });
         await new Promise(resolve => setTimeout(resolve, 800));

         setSuccessMsg('Password changed successfully!');
         setIsChangingPassword(false);
         setPasswordData({ current: '', new: '', confirm: '' });
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (e) {
         alert("Failed to change password");
      }
   };

   const handlePhotoUpdate = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         try {
            setSuccessMsg('Uploading profile photo...');
            const response = await api.updateProfileImage(file);

            if (response.avatarUrl) {
               setAvatarUrl(response.avatarUrl);
               // Sync the avatar with the parent (top-right header)
               onAvatarUpdate?.(response.avatarUrl);
            }

            setSuccessMsg('Profile photo updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
         } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to upload photo";
            alert(errorMessage);
            setSuccessMsg('');
         }
      }
   };

   const handleDeletePhoto = async () => {
      if (!avatarUrl) return;
      try {
         setSuccessMsg('Deleting profile photo...');
         await api.deleteProfileImage();
         setAvatarUrl(undefined);
         onAvatarUpdate?.('');
         setSuccessMsg('Profile photo deleted successfully!');
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
         const errorMessage = err.response?.data?.message || err.message || "Failed to delete photo";
         alert(errorMessage);
         setSuccessMsg('');
      }
   };


   return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* Page Header */}
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
               <p className="text-sm text-gray-500">Manage your account settings and preferences.</p>
            </div>
            <button
               onClick={onLogout}
               className="flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm text-sm font-medium"
            >
               <LogOut size={16} className="mr-2" /> Sign Out
            </button>
         </div>

         {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center shadow-sm">
               <CheckCircle size={18} className="mr-2" />
               {successMsg}
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1">
               <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
                  <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                     {/* Decorative Circles */}
                     <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  </div>

                  <div className="px-6 pb-6 text-center relative">
                     <div className="relative inline-block -mt-16 mb-3">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold relative group">
                           {avatarUrl ? (
                              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                              formData.name.charAt(0).toUpperCase()
                           )}
                        </div>
                        <input
                           type="file"
                           ref={fileInputRef}
                           className="hidden"
                           accept="image/*"
                           onChange={handleFileChange}
                        />
                        <button
                           onClick={handlePhotoUpdate}
                           className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-sm transition-colors border-2 border-white"
                           title="Update Photo"
                        >
                           <Camera size={14} />
                        </button>
                        {avatarUrl && (
                           <button
                              onClick={handleDeletePhoto}
                              className="absolute top-1 right-1 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm transition-colors border-2 border-white"
                              title="Delete Photo"
                           >
                              <Trash2 size={14} />
                           </button>
                        )}

                     </div>

                     <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                     <p className="text-indigo-600 font-medium text-sm mb-6">{user.role}</p>

                     <div className="space-y-4 text-left">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                           <div className="p-2 bg-white rounded-full text-gray-400 mr-3 shadow-sm">
                              <Mail size={16} />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                              <p className="text-sm font-medium text-gray-900 truncate w-48">{formData.email}</p>
                           </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                           <div className="p-2 bg-white rounded-full text-gray-400 mr-3 shadow-sm">
                              <Phone size={16} />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Mobile</p>
                              <p className="text-sm font-medium text-gray-900">{formData.mobile || 'Not Set'}</p>
                           </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                           <div className="p-2 bg-white rounded-full text-gray-400 mr-3 shadow-sm">
                              <Clock size={16} />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Last Login</p>
                              <p className="text-sm font-medium text-gray-900">{user.lastLogin}</p>
                           </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                           <div className="p-2 bg-white rounded-full text-gray-400 mr-3 shadow-sm">
                              <Calendar size={16} />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Member Since</p>
                              <p className="text-sm font-medium text-gray-900">{user.createdOn || 'N/A'}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Settings */}
            <div className="lg:col-span-2 space-y-6">

               {/* Account Settings */}
               <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <User size={20} className="mr-2 text-indigo-600" /> Account Settings
                     </h3>
                     {!isEditing && (
                        <button
                           onClick={() => setIsEditing(true)}
                           className="text-sm text-indigo-600 font-medium hover:underline"
                        >
                           Edit Details
                        </button>
                     )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                           <input
                              type="text"
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                           <input
                              type="text"
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                              value={formData.mobile}
                              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                              placeholder="+1 (555) 000-0000"
                           />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                           <input
                              type="email"
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                           />
                        </div>
                     </div>

                     {isEditing && (
                        <div className="flex justify-end gap-3 pt-4">
                           <button
                              type="button"
                              onClick={() => { setIsEditing(false); setFormData({ name: user.name, email: user.email, mobile: user.mobile || '' }); }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                           >
                              Save Changes
                           </button>
                        </div>
                     )}
                  </form>
               </div>

               {/* Security Settings */}
               <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                     <Shield size={20} className="mr-2 text-indigo-600" /> Security
                  </h3>

                  <div className="space-y-6">
                     {/* Password Change */}
                     <div className="pb-6 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h4 className="font-medium text-gray-900">Password</h4>
                              <p className="text-sm text-gray-500">Regularly updating your password improves security.</p>
                           </div>
                           {!isChangingPassword && (
                              <button
                                 onClick={() => setIsChangingPassword(true)}
                                 className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                 Change Password
                              </button>
                           )}
                        </div>

                        {isChangingPassword && (
                           <form onSubmit={handleSavePassword} className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                              <div className="space-y-3">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                                    <input
                                       type="password"
                                       className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                       value={passwordData.current}
                                       onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                       required
                                    />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                       <input
                                          type="password"
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                          value={passwordData.new}
                                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                          required
                                       />
                                    </div>
                                    <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                                       <input
                                          type="password"
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                          value={passwordData.confirm}
                                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                          required
                                       />
                                    </div>
                                 </div>
                                 <div className="flex justify-end gap-3 pt-2">
                                    <button
                                       type="button"
                                       onClick={() => setIsChangingPassword(false)}
                                       className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
                                    >
                                       Cancel
                                    </button>
                                    <button
                                       type="submit"
                                       className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                                    >
                                       Update Password
                                    </button>
                                 </div>
                              </div>
                           </form>
                        )}
                     </div>

                     {/* 2FA Toggle */}
                     <div className="flex justify-between items-center">
                        <div>
                           <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                           <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                        </div>
                        <button
                           onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                              }`}
                        >
                           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                        </button>
                     </div>

                     {/* Reset Button (Danger Zoneish) */}
                     <div className="pt-6 border-t border-gray-100">
                        <button
                           className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center transition-colors"
                           onClick={() => alert("Password reset link sent to email.")}
                        >
                           <Lock size={14} className="mr-2" /> Send Password Reset Link
                        </button>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </div>
   );
};

export default AdminProfile;
