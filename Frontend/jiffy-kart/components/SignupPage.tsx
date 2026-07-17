import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Smartphone, Lock, CheckCircle, ChevronRight, Sparkles, ShieldCheck, ShoppingBag, Info, Loader2 } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface SignupPageProps {
  onBack: () => void;
  onLoginClick: () => void;
  onSignupSuccess: (userData: any) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBack, onLoginClick, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.password || (!formData.email && !formData.mobile)) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    console.log("🚀 [Signup] Starting signup process for:", formData.fullName);

    try {
      const data = await ApiService.signup({
        name: formData.fullName,
        email: formData.email,
        phone: formData.mobile,
        password: formData.password
      });

      console.log("✅ [Signup] Success response received:", data);
      // setCreatedUser(data.user);
      // Robustly identify the user object (it might be data.user or data itself)
      const userObj = data.user || (data.id ? data : null);
      setCreatedUser(userObj || { email: formData.email, name: formData.fullName });
      setShowSuccess(true);

      console.log("⏱️ [Signup] Redirecting in 1.5s...");
      setTimeout(async () => {
        try {
    
          const finalUser = userObj || { email: formData.email, name: formData.fullName };
          console.log("👉 [Signup] Triggering onSignupSuccess with:", finalUser);
          await onSignupSuccess(finalUser);
          console.log("✅ [Signup] onSignupSuccess completed");
          
        } catch (err) {
          console.error("❌ [Signup] Error during success callback:", err);
        }
      }, 1500);
    } catch (err: any) {
      console.error("❌ [Signup] error:", err);
      setError(err.response?.data?.message || 'Signup failed. Please ensure the backend is running and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center border border-slate-50 relative z-10 animate-zoom-in">
          <div className="w-28 h-28 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner relative">
            <div className="absolute inset-0 bg-emerald-200/20 rounded-[2.5rem] animate-ping opacity-20"></div>
            <CheckCircle size={56} className="text-emerald-500 relative z-10" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">Welcome <br /> to Jiffy Kart!</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
            Your account for <b>{formData.fullName}</b> has been created. <br /> Please verify your email to start shopping.
          </p>

          <button
            onClick={() => {
              console.log("👆 [Signup] Navigating to OTP Verification");
              onSignupSuccess(createdUser);
            }}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-95"
          >
            Verify Email <ShieldCheck size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex animate-fade-in relative overflow-hidden">
      {/* Left Branding Panel (Blue Eclipse Mode) */}
      <div className="hidden lg:flex lg:w-5/12 bg-secondary text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent opacity-10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

        <div className="relative z-10">
          <div className="mb-20 cursor-pointer group" onClick={onBack}>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline">
                <span className="text-6xl font-black tracking-tighter uppercase">Jiffy</span>
                <span className="text-6xl font-black ml-1 text-highlight tracking-tighter uppercase">Kart</span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.5em] text-accent mt-3 opacity-60">Eclipse Protocol Active</p>
            </div>
          </div>

          <div className="space-y-12">
            <h1 className="text-6xl font-black leading-[1.1] tracking-tighter">
              Unleash <br />
              <span className="text-highlight">Hyperlocal</span> <br />
              Speed.
            </h1>

            <div className="space-y-6">
              {[
                { icon: <Sparkles size={20} />, text: "Curated neighborhood favorites." },
                { icon: <ShieldCheck size={20} />, text: "Elite member protection active." },
                { icon: <ShoppingBag size={20} />, text: "Fastest delivery network in city." }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-slate-100 font-bold text-lg">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-[0.2em] bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          Member Access Open
        </div>
      </div>

      {/* Right Signup Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative bg-white">
        <button onClick={onBack} className="absolute top-8 left-8 lg:hidden p-3 bg-slate-50 rounded-full text-slate-600">
          <ArrowLeft size={24} />
        </button>

        <div className="w-full max-w-md space-y-10 animate-slide-up">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Create Account</h2>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Join our hyperlocal network</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 font-bold text-sm flex items-center gap-3 animate-fade-in">
              <Info size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Aditya Kumar"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                <div className="relative group">
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="name@email.com"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Set Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  aria-label="Set the password to be used for authenticating."
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-secondary text-white font-black py-5 rounded-2xl shadow-xl shadow-secondary/20 hover:bg-dark disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>Create Account <ChevronRight size={22} /></>
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              Already a member?
              <button
                onClick={onLoginClick}
                className="text-primary ml-2 hover:underline decoration-2 underline-offset-4 font-black"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};