
import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, ShieldCheck, RefreshCcw, Loader2, ChevronLeft,
  Zap, Globe, Lock, Cpu, Clock, Sparkles, ChevronRight,
  Fingerprint, Mail, Eye, EyeOff
} from 'lucide-react';
import { VendorAuthApi } from '../vendor.api';
import logo from '../assets/images/logo.png';


interface LoginPageProps {
  onLogin: () => void;
}

const JiffyLogoLarge: React.FC = () => (
  <div className="flex flex-col items-center group cursor-default">
    <div className="relative mb-4">
      <div className="absolute -inset-8 bg-brand-500/10 rounded-full blur-3xl "></div>
      <img
        src={logo}
        alt="Logo"
        className="relative w-70 h-25 object-contain"
      />
    </div>
  </div>
);

type LoginMode = 'OTP' | 'PASSWORD';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<LoginMode>(() => {
    return (localStorage.getItem('login_mode') as LoginMode) || 'OTP';
  });
  const [step, setStep] = useState<'ID' | 'VERIFY'>('ID');
  const [isResetMode, setIsResetMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForceChange, setIsForceChange] = useState(false);
  const [tempPassword, setTempPassword] = useState(''); // Stores the current password for change

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    localStorage.setItem('login_mode', mode);
  }, [mode]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes('@')) {
      setError('Please enter a valid business email.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await VendorAuthApi.sendEmailOtp(otpEmail);
      setStep('VERIFY');
      setCountdown(30);
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response.data?.message || 'Failed to send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 4) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await VendorAuthApi.verifyEmailOtp(otpEmail, otpValue);
      if (res.forcePasswordChange) {
        setIsForceChange(true);
        setTempPassword(''); // OTP mode doesn't have a "password" to reuse, but the user might need to set one
      } else if (res.token) {
        onLogin();
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response.data?.message || 'Invalid OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await VendorAuthApi.passwordLogin(emailOrPhone, password);
      if (res.forcePasswordChange) {
        setIsForceChange(true);
        setTempPassword(password);
      } else if (res.token) {
        onLogin();
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response.data?.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetPassword || !confirmResetPassword) return;

    if (resetPassword.length > 6) {
      setError('Password must be 6 characters or less.');
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await VendorAuthApi.resetPassword(resetEmail, resetPassword);
      setSuccessMessage('Password changed successfully! You can now login.');
      setIsResetMode(false);
      setResetEmail('');
      setResetPassword('');
      setConfirmResetPassword('');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(err.response.data?.message || 'Failed to reset password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== confirmResetPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await VendorAuthApi.changePassword(tempPassword, resetPassword);
      setSuccessMessage('Security updated! Launching terminal...');
      setTimeout(() => onLogin(), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update security credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-['Inter'] selection:bg-brand-100 overflow-hidden">
      {/* Left Pane - Cinematic Hyper-growth Visuals */}
      <div className="hidden lg:flex lg:w-3/5 bg-[#020617] items-center justify-center p-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover opacity-20 mix-blend-screen scale-110 blur-sm animate-[pulse_15s_infinite]"
            alt="Logistics Motion"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/90 to-transparent"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6366F1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[160px]"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[140px]"></div>
        </div>

        <div className="max-w-2xl relative z-10 space-y-16">
          <div className="space-y-8">
            <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="w-16 h-1 bg-brand-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              <span className="text-brand-500 text-xs font-black uppercase tracking-[0.6em]">Enterprise Console</span>
            </div>

            <h1 className="text-[130px] font-black tracking-tighter leading-[0.75] flex flex-col italic select-none">
              <span className="text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-default">JIFFY</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-indigo-600">VENDOR...</span>
            </h1>
          </div>

          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-transparent"></div>
              <p className="text-slate-400 font-medium text-3xl max-w-lg leading-tight pl-2">
                Accelerating <span className="text-white font-black italic">India's Quick-Commerce</span> revolution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="space-y-3 group cursor-default">
                <div className="flex items-center space-x-2 text-brand-400 mb-1">
                  <Zap className="w-4 h-4 fill-brand-400/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Rate</span>
                </div>
                <span className="text-white text-5xl font-black tabular-nums tracking-tighter">99.8%</span>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">Automated Fulfillment</p>
              </div>

              <div className="space-y-3 group cursor-default">
                <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Network Load</span>
                </div>
                <span className="text-white text-5xl font-black tabular-nums tracking-tighter">80ms</span>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">Global Latency Avg.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Modern Authentication Flow */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 bg-white relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(135deg, #6366F1 10%, transparent 10%), linear-gradient(225deg, #6366F1 10%, transparent 10%)', backgroundSize: '100px 100px' }}></div>

        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex flex-col items-center">
            <JiffyLogoLarge />
          </div>

          <div className="space-y-6">
            <div className="flex p-1.5 bg-slate-100 rounded-3xl">
              <button
                onClick={() => { setMode('OTP'); setStep('ID'); setError(''); setIsResetMode(false); }}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-[22px] ${mode === 'OTP' && !isResetMode ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                OTP Login
              </button>
              <button
                onClick={() => { setMode('PASSWORD'); setError(''); setIsResetMode(false); }}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all rounded-[22px] ${mode === 'PASSWORD' && !isResetMode ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Password Login
              </button>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                {isResetMode ? 'Security Reset' : (mode === 'OTP' ? (step === 'ID' ? 'Vendor Access' : 'Security Check') : 'Credentials')}
              </h2>
              <p className="text-[12px] font-medium text-slate-500">
                {isResetMode
                  ? 'Change your security settings to restore access.'
                  : (mode === 'OTP'
                    ? (step === 'ID' ? 'Verify your identity to launch.' : `Sent pulse code to ${otpEmail}`)
                    : 'Enter your account keys to enter the terminal.')}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-600 animate-in fade-in zoom-in-95 duration-300">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3 text-emerald-600 animate-in fade-in zoom-in-95 duration-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">{successMessage}</p>
            </div>
          )}

          <div className="relative bg-white p-10 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(15,23,42,0.12)] border border-slate-100">
            {isForceChange ? (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Initialize New Key</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type="password" placeholder="New Secret Password"
                        value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Confirm New Key</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type="password" placeholder="Verify Password"
                        value={confirmResetPassword} onChange={(e) => setConfirmResetPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !resetPassword}
                  className="w-full bg-brand-600 text-white font-black py-5 rounded-3xl shadow-[0_15px_30px_-10px_rgba(99,102,241,0.4)] hover:bg-brand-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[11px]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Setup Permanent Access</span><Sparkles className="w-4 h-4" /></>}
                </button>
              </form>
            ) : isResetMode ? (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Registered Email</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type="email" 
                        value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">New Secret Key (Max 6)</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type="password"  maxLength={6}
                        value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Confirm Secret Key</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type="password"  maxLength={6}
                        value={confirmResetPassword} onChange={(e) => setConfirmResetPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !resetEmail || resetPassword.length === 0}
                    className="w-full bg-brand-600 text-white font-black py-5 rounded-3xl shadow-[0_15px_30px_-10px_rgba(99,102,241,0.4)] hover:bg-brand-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[11px]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Restore Access</span><RefreshCcw className="w-4 h-4" /></>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(false); setError(''); }}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
                  >
                    Back to Connection
                  </button>
                </div>
              </form>
            ) : mode === 'OTP' ? (
              step === 'ID' ? (
                <form onSubmit={handleSendOtp} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Registered Email</label>
                    <div className="relative group/input">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center space-x-3 text-slate-300 group-focus-within/input:text-brand-500 transition-all">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        required autoFocus type="email"
                        placeholder="your@email.com" value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-300 rounded-3xl text-lg font-black text-slate-900 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 shadow-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !otpEmail || !otpEmail.includes('@')}
                    className="w-full bg-[#0F172A] text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[11px]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Initialize Connection</span><ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passcode Entry</label>
                      <button type="button" onClick={() => setStep('ID')} className="text-[9px] font-black text-brand-500 uppercase hover:underline">Change Email</button>
                    </div>
                    <div className="flex justify-center gap-3">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx} ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className={`w-14 h-18 text-center border-2 rounded-2xl text-2xl font-black transition-all outline-none ${digit ? 'text-brand-600 border-brand-500 bg-white shadow-lg' : 'text-slate-400 bg-white border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center space-x-2">
                        <Clock className="w-3 h-3" /> <span>Retry in {countdown}s</span>
                      </p>
                    ) : (
                      <button type="button" onClick={handleSendOtp} className="text-[10px] font-black text-brand-500 uppercase flex items-center mx-auto space-x-2 hover:text-brand-700 transition-colors">
                        <RefreshCcw className="w-3 h-3" /> <span>Resend Transmission</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 4}
                    className="w-full bg-brand-600 text-white font-black py-5 rounded-3xl shadow-[0_15px_30px_-10px_rgba(99,102,241,0.4)] hover:bg-brand-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[11px]"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Authorize Access</span><ShieldCheck className="w-4 h-4" /></>}
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Email Id</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type="text" 
                        value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PassWord</label>
                      <button
                        type="button"
                        onClick={() => { setIsResetMode(true); setError(''); }}
                        className="text-[9px] font-black text-brand-500 uppercase hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative group/input">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-brand-500" />
                      <input
                        required type={showPassword ? "text" : "password"} 
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-14 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-[15px] font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !emailOrPhone || password.length < 6}
                  className="w-full bg-[#0F172A] text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[11px]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Decipher & Enter</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col items-center space-y-6">
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              By entering, you confirm access to <br />
              <span className="text-slate-900 font-extrabold underline decoration-brand-500 underline-offset-4">JiffyKart Merchant Protocols</span>
            </p>
            <div className="flex items-center space-x-3 text-[10px] font-black text-slate-200 uppercase tracking-[0.5em] select-none">
              <div className="h-px w-6 bg-slate-100"></div>
              <span>v4.2.0-secure</span>
              <div className="h-px w-6 bg-slate-100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

export default LoginPage;
