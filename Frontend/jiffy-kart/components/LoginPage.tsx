import React, { useState, useEffect } from 'react';
import { ArrowLeft, Smartphone, CheckCircle, Zap, ShieldCheck, ShoppingBag, ChevronRight, Lock, Eye, EyeOff, Info, Mail, Sparkles, Wand2, Loader2, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (user?: any) => void;
  onSignupClick: () => void;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onCancellationClick: () => void;
  message?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBack,
  onLoginSuccess,
  onSignupClick,
  onPrivacyClick,
  onTermsClick,
  onCancellationClick,
  message
}) => {
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await ApiService.sendEmailLoginOtp(email);
      setSuccess('Verification code sent to your email.');
      setStep(2);
      setTimer(30);
    } catch (err: any) {
      console.error("OTP send failed:", err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email/phone and password.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const data = await ApiService.login({
        username: email, // Backend might expect 'username' which can be email or phone
        password: password
      });
      setSuccess('Login successful! Welcome back.');
      // Small delay for visual feedback
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const data = await ApiService.verifyEmailLoginOtp(email, otp);
      setSuccess('Verification successful! Welcome back.');
      // Small delay for visual feedback
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const resetFlow = () => {
    setStep(1);
    setOtp('');
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-white flex animate-fade-in relative overflow-hidden">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-dark text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[80px]"></div>

        <div className="relative z-10">
          <div className="mb-20 cursor-pointer group" onClick={onBack}>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline">
                <span className="text-6xl font-black tracking-tighter uppercase">Jiffy</span>
                <span className="text-6xl font-black ml-1 text-highlight tracking-tighter uppercase">Kart</span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.5em] text-accent mt-3 opacity-60">Instant Neighborhood Commerce</p>
            </div>
          </div>

          <div className="space-y-10">
            <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tighter">
              Fresh <br />
              <span className="text-highlight">Neighborhood</span> <br />
              Favorites.
            </h1>

            <div className="space-y-6">
              {[
                { icon: <Zap size={20} className="text-amber-400" />, text: "30-min lightning delivery." },
                { icon: <ShieldCheck size={20} className="text-emerald-400" />, text: "Verified local sellers only." },
                { icon: <Smartphone size={20} className="text-blue-400" />, text: "Real-time order tracking." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-slate-100 font-semibold text-lg">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Secure Authentication Channel
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-12 relative bg-white overflow-y-auto">
        <div className="flex w-full items-center justify-between absolute top-6 px-6 lg:hidden">
          <button onClick={onBack} className="p-2 bg-slate-50 rounded-full text-slate-600 active:scale-95 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-1 group">
            {/* Logo handled in the form below for better mobile/desktop consistency */}
          </div>
          <div className="w-10"></div> {/* Spacer to center logo */}
        </div>

        <div className="w-full max-w-md space-y-8 animate-slide-up py-10">
          <div className="text-center">
            <div className="mb-8 flex justify-center lg:hidden">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-56 h-20 object-contain" 
              />
            </div>
            <h2 className="text-4xl font-black text-dark mb-2 tracking-tight">Login</h2>
            <p className="text-slate-500 font-medium">
              {loginMethod === 'otp'
                ? 'Enter your registered email to get started.'
                : 'Enter your credentials to access your account.'}
            </p>
          </div>

          {message && !error && !success && (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 font-bold text-sm">
              <Info size={18} /> {message}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 font-bold text-sm animate-fade-in">
              <CheckCircle size={18} /> {success}
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 flex items-center gap-3 font-bold text-sm animate-fade-in">
              <Info size={18} className="shrink-0" /> <span className="flex-1">{error}</span>
            </div>
          )}

          {loginMethod === 'otp' ? (
            step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-dark outline-none focus:border-primary focus:bg-white transition-all shadow-sm text-lg"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !email.includes('@')}
                  className="w-full bg-dark text-white font-black py-5 rounded-2xl shadow-xl hover:bg-primary disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Send OTP <ArrowRight size={22} /></>}
                </button>

               {/* <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setError('');
                    }}
                    className="text-xs font-black uppercase text-slate-400 hover:text-primary transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <Lock size={14} /> Login with Password
                  </button>
                </div>  */}
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
                <div className="space-y-2 text-center">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enter 4-digit code sent to {email}</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-6 text-center text-4xl font-black tracking-[0.5em] bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                    placeholder="0000"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex justify-between items-center px-1">
                  <button type="button" onClick={resetFlow} className="text-[10px] font-black uppercase text-slate-400 hover:text-dark transition">Change Email</button>
                  {timer > 0 ? (
                    <span className="text-[10px] font-black uppercase text-slate-400">Resend in {timer}s</span>
                  ) : (
                    <button type="button" onClick={handleSendOtp} className="text-[10px] font-black uppercase text-primary hover:underline transition">Resend OTP</button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full bg-secondary text-white font-black py-5 rounded-2xl shadow-xl hover:bg-dark disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Verify & Login <ChevronRight size={22} /></>}
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Phone</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email or Mobile"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-dark outline-none focus:border-primary focus:bg-white transition-all shadow-sm text-lg"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your Password"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-dark outline-none focus:border-primary focus:bg-white transition-all shadow-sm text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-dark text-white font-black py-5 rounded-2xl shadow-xl hover:bg-primary disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Login <ChevronRight size={22} /></>}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setError('');
                  }}
                  className="text-xs font-black uppercase text-slate-400 hover:text-primary transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <Smartphone size={14} /> Login with OTP
                </button>
              </div>
            </form>
          )}



          <div className="text-center">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              New to Jiffy Kart?
              <button
                type="button"
                onClick={onSignupClick}
                className="text-primary ml-2 hover:underline decoration-2 underline-offset-4 font-black"
              >
                Register Now
              </button>
            </p>
          </div>

          <div className="pt-8 text-center space-x-4">
            <button onClick={onTermsClick} className="text-[9px] font-black uppercase text-slate-300 hover:text-slate-500">Terms</button>
            <button onClick={onPrivacyClick} className="text-[9px] font-black uppercase text-slate-300 hover:text-slate-500">Privacy</button>
          </div>
        </div>
      </div>
    </div>
  );
};