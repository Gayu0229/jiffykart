
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Plus, History, Wallet as WalletIcon, ChevronRight, Zap, 
  ShieldCheck, ArrowUpRight, ArrowDownLeft, Clock, ShoppingBag, 
  X, CheckCircle, Loader2, CreditCard
} from 'lucide-react';
import { useNavigation, useAuth } from '../hooks';
import { ApiService } from '../services/apiService';
import { Wallet, Transaction } from '../types';
import { Skeleton } from './Skeleton';

export const WalletPage: React.FC = () => {
  const { navigate, goBack } = useNavigation();
  const { user, isLoggedIn } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState<string>('500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchWallet = async () => {
    if (!user) return;
    try {
      const data = await ApiService.getWallet(user.id);
      setWallet(data);
    } catch (error) {
      console.error("Wallet fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('login', { redirect: 'wallet' });
      return;
    }
    fetchWallet();
  }, [user, isLoggedIn, navigate]);

  const handleOpenAddMoney = () => {
    setAddAmount('500');
    setShowAddMoneyModal(true);
    setShowSuccess(false);
  };

  const handleConfirmAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(addAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (user) {
        const updatedWallet = await ApiService.updateWallet(
          user.id, 
          amount, 
          'credit', 
          `Added money to wallet`
        );
        setWallet(updatedWallet);
        setShowSuccess(true);
        setTimeout(() => {
          setShowAddMoneyModal(false);
          setShowSuccess(false);
        }, 2000);
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-[2.5rem]" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24 min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 px-2">
         <button 
           onClick={goBack}
           className="p-2.5 hover:bg-slate-100 rounded-full transition text-slate-600 bg-white shadow-sm border border-slate-100"
         >
           <ArrowLeft size={22} />
         </button>
         <div>
            <h1 className="text-3xl font-black text-dark tracking-tighter">Jiffy Wallet</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Manage Your Jiffy Credits</p>
         </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8 px-4 md:px-0">
        
        {/* Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-secondary to-dark rounded-[3rem] p-10 text-white shadow-2xl shadow-secondary/20 border border-white/10 group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

           <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-8">
                 <Zap size={14} className="text-amber-400" fill="currentColor" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Instant Checkout Active</span>
              </div>
              
              <div className="mb-10">
                 <p className="text-accent text-xs font-black uppercase tracking-[0.2em] mb-3">Available Balance</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-black tracking-tighter">₹{wallet?.balance.toLocaleString() || '0'}</span>
                    <span className="text-accent font-bold text-lg">.00</span>
                 </div>
              </div>

              <div className="w-full h-px bg-white/10 mb-8"></div>

              <div className="flex flex-wrap items-center gap-4 w-full">
                 <button 
                   onClick={handleOpenAddMoney}
                   className="flex-1 min-w-[140px] bg-white text-dark py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                   <Plus size={18} strokeWidth={3} /> Add Money
                 </button>
                 <button 
                   onClick={() => navigate('home')}
                   className="flex-1 min-w-[140px] bg-white/10 backdrop-blur-md text-white border border-white/20 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                   <ShoppingBag size={18} /> Shop Now
                 </button>
              </div>
           </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-dark tracking-tight flex items-center gap-2">
                 <History size={20} className="text-primary" /> Recent Activity
              </h3>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</button>
           </div>

           <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
              {wallet?.transactions && wallet.transactions.length > 0 ? (
                <div className="divide-y divide-slate-50">
                   {wallet.transactions.map((tx) => (
                      <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition group">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               {tx.type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                            </div>
                            <div>
                               <h4 className="font-black text-dark text-sm leading-tight mb-1">{tx.description}</h4>
                               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  <Clock size={12} /> {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={`text-lg font-black tracking-tight ${tx.type === 'credit' ? 'text-emerald-600' : 'text-dark'}`}>
                               {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </p>
                         </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                      <WalletIcon size={32} />
                   </div>
                   <h4 className="text-lg font-black text-dark mb-2">No Transactions Yet</h4>
                   <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                      Any money you add or spend using your Jiffy Wallet will show up here.
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Security Assurance */}
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 flex items-start gap-4">
           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
              <ShieldCheck size={20} />
           </div>
           <div>
              <h4 className="font-black text-dark text-sm">Secure Eclipse Pay</h4>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Your wallet balance is encrypted and protected by bank-grade security protocols. 
                Refunds for cancelled orders are instantly credited to your Jiffy Wallet.
              </p>
           </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/80 backdrop-blur-md animate-fade-in" onClick={() => !isProcessing && setShowAddMoneyModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden relative z-10 shadow-2xl animate-slide-up flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-2xl text-dark">Add Money</h3>
              {!isProcessing && (
                <button onClick={() => setShowAddMoneyModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition text-slate-400">
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="p-8 flex flex-col items-center">
              {showSuccess ? (
                <div className="text-center py-10 animate-zoom-in">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle size={48} />
                  </div>
                  <h4 className="text-2xl font-black text-dark mb-2">Money Added!</h4>
                  <p className="text-slate-500 font-bold">Your balance has been updated.</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmAddMoney} className="w-full space-y-8">
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Enter Amount</p>
                    <div className="relative inline-block w-full">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">₹</span>
                       <input 
                         type="number" 
                         value={addAmount}
                         onChange={(e) => setAddAmount(e.target.value)}
                         className="w-full text-center text-5xl font-black tracking-tight py-4 bg-slate-50 rounded-3xl border-2 border-slate-100 focus:border-primary outline-none transition" 
                         placeholder="0"
                         autoFocus
                         required
                         disabled={isProcessing}
                       />
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['100', '500', '1000', '2000'].map(amt => (
                      <button 
                        key={amt}
                        type="button"
                        onClick={() => setAddAmount(amt)}
                        disabled={isProcessing}
                        className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all border-2 shrink-0 ${addAmount === amt ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/20'}`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary">
                          <CreditCard size={20} />
                       </div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paying via</p>
                          <p className="text-sm font-bold text-dark">UPI / Saved Card</p>
                       </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing || !addAmount || parseInt(addAmount) <= 0}
                    className="w-full bg-secondary text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-dark transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <><Loader2 size={20} className="animate-spin" /> Securing Payment...</>
                    ) : (
                      <>Add ₹{addAmount || '0'} to Wallet</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
