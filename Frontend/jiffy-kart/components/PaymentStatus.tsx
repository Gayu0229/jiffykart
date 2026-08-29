import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { useNavigation } from '../hooks';

export const PaymentStatus: React.FC = () => {
    const { params, navigate } = useNavigation();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
    const [orderData, setOrderData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // PhonePe redirects with merchantTransactionId in our case (we specified it in the redirect URL)
        // Actually, usually PhonePe doesn't append it to the path unless we do.
        // In our application.properties: http://localhost:3000/payment-status
        // We should expect query params if we modified the redirect URL, 
        // but PhonePe also sends a POST callback.
        // For the redirect (GET), we might need to parse the transaction ID from the URL.

        const queryParams = new URLSearchParams(window.location.search);
        const txnId = queryParams.get('id'); // We should ensure our backend appends this or we look for it.

        const verifyPayment = async () => {
            if (!txnId) {
                setStatus('error');
                setErrorMessage('Transaction ID missing. Please check your orders.');
                return;
            }

            try {
                const response = await ApiService.checkPhonePeStatus(txnId);
                if (response.success && (response.code === 'PAYMENT_SUCCESS' || response.data?.state === 'COMPLETED')) {
                    setStatus('success');
                    setOrderData(response.data);
                } else {
                    setStatus('failed');
                    setErrorMessage(response.message || 'Payment was not successful.');
                }
            } catch (err) {
                setStatus('error');
                setErrorMessage('Unable to verify payment status. Please check your email or orders.');
            }
        };

        verifyPayment();
    }, []);

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                navigate('home');
            }, 5000); // 5 seconds to let them read the success message
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 text-center space-y-8">

                {status === 'loading' && (
                    <div className="space-y-6">
                        <div className="w-24 h-24 bg-indigo-50 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto animate-pulse">
                            <Loader2 size={48} className="animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Verifying Payment</h2>
                            <p className="text-sm font-medium text-slate-400 mt-2">Please wait while we confirm your transaction with PhonePe...</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <CheckCircle2 size={48} />
                        </div>
                        {orderData?.merchantTransactionId?.startsWith('SUB-') ? (
                            <>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Subscription Activated 🎉</h2>
                                    <p className="text-sm font-medium text-slate-400 mt-2">Welcome to the premium club! Your benefits are now active.</p>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6 text-left border border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
                                        <span className="text-[10px] font-black text-slate-900">{orderData?.merchantTransactionId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                                        <span className="text-sm font-black text-primary">₹{(orderData?.amount / 100 || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('home')}
                                    className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-secondary transition-all active:scale-95"
                                >
                                    Continue Shopping <ArrowRight size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payment Successful!</h2>
                                    <p className="text-sm font-medium text-slate-400 mt-2">Your order has been placed successfully. Get ready to receive your items!</p>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6 text-left border border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</span>
                                        <span className="text-[10px] font-black text-slate-900">{orderData?.merchantTransactionId || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                                        <span className="text-sm font-black text-primary">₹{(orderData?.amount / 100 || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('track-orders')}
                                    className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-secondary transition-all active:scale-95"
                                >
                                    Track My Orders <ArrowRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {status === 'failed' && (
                    <div className="space-y-6">
                        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <XCircle size={48} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Payment Failed</h2>
                            <p className="text-sm font-medium text-slate-400 mt-2">{errorMessage}</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('checkout')}
                                className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                            >
                                Retry
                            </button>
                            <button
                                onClick={() => navigate('home')}
                                className="flex-1 border-2 border-slate-100 text-slate-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Home
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <AlertCircle size={48} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Verification Error</h2>
                            <p className="text-sm font-medium text-slate-400 mt-2">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => navigate('home')}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Go to Homepage
                        </button>
                    </div>
                )}

                <div className="pt-4 flex items-center justify-center gap-2 text-slate-300">
                    <ShoppingBag size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Jiffy Kart Local Checkout</span>
                </div>
            </div>
        </div>
    );
};
