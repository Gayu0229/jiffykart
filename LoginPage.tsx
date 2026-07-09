
import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Store, AlertCircle } from 'lucide-react';
import { AdminUser } from '../../types';
import { api } from '../../services/api';

interface LoginPageProps {
   onLogin: (user: AdminUser) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [loginType, setLoginType] = useState<'Admin' | 'Field Manager'>('Admin');
   const [isForceChange, setIsForceChange] = useState(false);
   const [tempUser, setTempUser] = useState<AdminUser | null>(null);
   const [tempPassword, setTempPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
         // Real backend login
         const { token, user } = await api.login(email, password);

         // Role check based on selected toggle
         if (loginType === 'Admin' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            setError("Invalid access. Please use the Field Manager login portal.");
            setIsLoading(false);
            return;
         }

         if (loginType === 'Field Manager' && user.role !== 'FRANCHISE_OWNER' && user.role !== 'FIELD_MANAGER') {
            setError("Invalid access. Please use the HQ Admin login portal.");
            setIsLoading(false);
            return;
         }

         // Map backend user to AdminUser type for the dashboard
         const adminUser: AdminUser = {
            id: user.id?.toString() || '1',
            name: user.name || (loginType === 'Admin' ? 'HQ Admin' : 'Field Manager'),
            email: user.email || email,
            role: user.role === 'ADMIN' ? 'Super Admin' : 'Franchise Owner',
            status: 'Active',
            avatarUrl: user.avatar || '',
            lastLogin: new Date().toLocaleString(),
            forcePasswordChange: user.forcePasswordChange
         };

         if (user.forcePasswordChange) {
            setIsForceChange(true);
            setTempUser(adminUser);
            setTempPassword(password);
         } else {
            onLogin(adminUser);
         }
      } catch (err: any) {
         console.error("Login failed:", err);
         const message = err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.';
         setError(message);
      } finally {
         setIsLoading(false);
      }
   };


   const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
         setError('Passwords do not match.');
         return;
      }
      if (newPassword.length < 8) {
         setError('Password must be at least 8 characters.');
         return;
      }

      setIsLoading(true);
      setError(null);
      try {
         await api.changePassword(tempPassword, newPassword);
         if (tempUser) {
            onLogin({ ...tempUser, forcePasswordChange: false });
         }
      } catch (err: any) {
         setError(err.response?.data?.message || 'Failed to update password');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-indigo-900 to-indigo-950 flex items-center justify-center p-4 font-sans">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden min-h-[600px] animate-in fade-in zoom-in duration-300">

            {/* Left Side - Visual Branding */}
            <div className="w-1/2 bg-indigo-700 p-12 hidden lg:flex flex-col justify-between relative overflow-hidden transition-colors duration-500">
               {/* Decorative Background Elements */}
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-overlay filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
               </div>

               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     {/* JiffyKart Logo Icon */}
                     {/* <div className="w-12 h-12">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                     </div> */}
                     <div className="flex flex-col">
                        <span className="text-white text-3xl font-bold tracking-tight leading-none">JiffyKart</span>
                        <span className="text-indigo-200 text-[10px] tracking-wider uppercase mt-1 font-medium">Anywhere. Anytime. On The Dot.</span>
                     </div>
                  </div>

                  <div className="mb-6">
                     <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 ${loginType === 'Admin' ? 'bg-white/20 text-white' : 'bg-indigo-500/30 text-indigo-100 border border-indigo-400/30'
                        }`}>
                        {loginType === 'Admin' ? 'HQ Access' : 'Field Access'}
                     </span>
                     <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                        {loginType === 'Admin' ? 'Master Control Panel' : 'Field Manager Panel'}
                     </h2>
                     <p className="text-indigo-100 leading-relaxed opacity-90 text-sm">
                        {loginType === 'Admin'
                           ? 'Manage vendors, track global sales, oversee system-wide operations, and handle field networks from a single centralized dashboard.'
                           : 'Monitor your territory performance, manage local shops, approve vendor KYC, and track your field earnings in real-time.'
                        }
                     </p>
                  </div>
               </div>

               <div className="relative z-10 text-indigo-200 text-xs border-t border-white/10 pt-4">
                  © 2023 JiffyKart Inc. Secure System. <br />
                  Authorized Personnel Only.
               </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
               {/* Role Toggle */}
               <div className="mb-8 flex justify-center lg:justify-start">
                  <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                     <button
                        type="button"
                        onClick={() => setLoginType('Admin')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${loginType === 'Admin' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'
                           }`}
                     >
                        HQ Admin
                     </button>
                     <button
                        type="button"
                        onClick={() => setLoginType('Field Manager')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${loginType === 'Field Manager' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'
                           }`}
                     >
                        Field Manager
                     </button>
                  </div>
               </div>

               <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                  <p className="text-gray-500 text-sm">
                     Please sign in to your <span className="font-medium text-gray-700">{loginType.toLowerCase()} account</span>.
                  </p>
               </div>

               {/* Error Message */}
               {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm animate-in fade-in duration-200">
                     <AlertCircle size={16} className="flex-shrink-0" />
                     <span>{error}</span>
                  </div>
               )}

               {isForceChange ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-5">
                     <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                        <ShieldCheck size={20} className="mb-2" />
                        <strong>Security Mandate:</strong> Please set a permanent password to secure your administrative terminal.
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative group">
                           <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                           <input
                              type="password"
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all text-gray-900 placeholder-gray-400"
                              placeholder="New permanent password"
                              value={newPassword}
                              onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                              required
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative group">
                           <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                           <input
                              type="password"
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all text-gray-900 placeholder-gray-400"
                              placeholder="Verify new password"
                              value={confirmPassword}
                              onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                              required
                           />
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg bg-indigo-700 hover:bg-indigo-800 shadow-indigo-200 flex items-center justify-center transition-all transform active:scale-[0.98]"
                     >
                        {isLoading ? (
                           <span className="flex items-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Updating...</span>
                        ) : (
                           <>
                              Update & Enter <ArrowRight size={18} className="ml-2" />
                           </>
                        )}
                     </button>
                  </form>
               ) : (
                  <form onSubmit={handleLogin} className="space-y-5">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative group">
                           <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                           <input
                              type="email"
                              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all text-gray-900 placeholder-gray-400"
                              // placeholder="admin@jiffykart.com"
                              value={email}
                              onChange={(e) => { setEmail(e.target.value); setError(null); }}
                              required
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative group">
                           <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                           <input
                              type={showPassword ? "text" : "password"}
                              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all text-gray-900 placeholder-gray-400"
                              // placeholder="••••••••"
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setError(null); }}
                              required
                           />
                           <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                           >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                           </button>
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg bg-indigo-700 hover:bg-indigo-800 shadow-indigo-200 flex items-center justify-center transition-all transform active:scale-[0.98]"
                     >
                        {isLoading ? (
                           <span className="flex items-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Authenticating...</span>
                        ) : (
                           <>
                              Sign In <ArrowRight size={18} className="ml-2" />
                           </>
                        )}
                     </button>
                  </form>
               )}


            </div>
         </div>
      </div>
   );
};

export default LoginPage;