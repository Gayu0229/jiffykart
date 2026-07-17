import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldCheck, ChevronRight, Loader2, Info, Mail } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface VerifyOtpPageProps {
    email: string;
    onBack: () => void;
    onVerificationSuccess: () => void;
}

export const VerifyOtpPage: React.FC<VerifyOtpPageProps> = ({ email, onBack, onVerificationSuccess }) => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 4) {
            setError('Please enter the 4-digit verification code.');
            return;
        }

        setError('');
        setIsLoading(true);
        console.log("🛡️ [VerifyOtp] Verifying Email OTP for:", email);

        try {
            await ApiService.verifyEmailOtp(email, otp);
            console.log("✅ [VerifyOtp] Email verification successful");
            setSuccess('Account activated successfully! Redirecting to login...');

            setTimeout(() => {
                onVerificationSuccess();
            }, 2000);
        } catch (err: any) {
            console.error("❌ [VerifyOtp] Verification failed:", err);
            setError(err.response?.data?.message || 'Invalid code. Please check and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;

        setIsLoading(true);
        setError('');
        try {
            await ApiService.resendEmailOtp(email);
            setOtp('');
            setSuccess('A new code has been sent to your email.');
            setTimer(30);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6 animate-fade-in relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-md space-y-8 relative z-10 animate-slide-up">
                {/* Header */}
                <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Mail size={40} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Verify Your Email</h2>
                    <p className="text-slate-500 font-medium">We've sent a 4-digit code to <span className="text-slate-900 font-bold">{email}</span></p>
                </div>

                {/* Feedback Messages */}
                {error && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-100 flex items-center gap-3 font-bold text-sm animate-shake">
                        <Info size={18} className="shrink-0" /> {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 font-bold text-sm">
                        <CheckCircle size={18} className="shrink-0" /> {success}
                    </div>
                )}

                {/* OTP Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                    <div className="space-y-4">
                        <input
                            type="text"
                            maxLength={4}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full py-6 text-center text-5xl font-black tracking-[0.5em] bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                            placeholder="0000"
                            autoFocus
                            required
                        />

                        <div className="flex justify-between items-center px-2">
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
                            >
                                <ArrowLeft size={12} /> Back to Signup
                            </button>

                            {timer > 0 ? (
                                <span className="text-[10px] font-black uppercase text-slate-300">Resend in {timer}s</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-[10px] font-black uppercase text-primary hover:underline transition"
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || otp.length < 4}
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Verify Email <ChevronRight size={22} /></>}
                    </button>
                </form>

                <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pt-4">
                    Secure Email Verification
                </p>
            </div>
        </div>
    );
};
