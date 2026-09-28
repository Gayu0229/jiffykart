import React from 'react';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useNavigation } from '../hooks';

// Razorpay Standard Checkout is verified immediately by Checkout.tsx + Spring Boot.
// This legacy route is retained so old bookmarks do not crash the application.
export const PaymentStatus: React.FC = () => {
  const { navigate } = useNavigation();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 text-center space-y-6">
        <CreditCard size={56} className="mx-auto text-slate-700" />
        <div>
          <h2 className="text-2xl font-black text-slate-900">Payment Status</h2>
          <p className="text-sm text-slate-500 mt-2">Razorpay payments are verified securely during checkout. Open My Orders to view the latest order status.</p>
        </div>
        <button onClick={() => navigate('track-orders')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3">
          View My Orders <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
