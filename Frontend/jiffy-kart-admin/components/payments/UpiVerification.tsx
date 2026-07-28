import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Loader2, 
  ExternalLink, 
  AlertCircle,
  Clock,
  User,
  ShoppingBag,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface PendingOrder {
  id: number;
  merchantTransactionId: string;
  transactionId: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
  user?: {
    name: string;
    phone: string;
  };
}

export const UpiVerification: React.FC = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPendingUpiOrders();
      setOrders(data);
    } catch (e) {
      setError('Failed to fetch pending UPI payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const handleVerify = async (orderId: number, approve: boolean) => {
    setProcessingId(orderId);
    try {
      await api.verifyUpiPayment(orderId, approve);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e) {
      setError('Verification action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.merchantTransactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">UPI Payment Verification</h1>
          <p className="text-slate-500 text-sm mt-1">Manual verification of scannable QR payments</p>
        </div>
        <button 
          onClick={fetchPendingOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm font-medium text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Txn ID, name or Order ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Transaction ID (UTR)</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                    <p className="text-slate-500 text-sm">Loading pending payments...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="text-slate-300" size={24} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No pending UPI payments for verification</p>
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition duration-200">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        #{order.merchantTransactionId}
                        <ExternalLink size={12} className="text-slate-400 cursor-pointer" />
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {order.user?.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 text-sm">{order.user?.name}</span>
                        <span className="text-xs text-slate-500">{order.user?.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-bold text-slate-600">
                      {order.transactionId || 'NOT SUBMITTED'}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">₹{order.total.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                      Pending Verification
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleVerify(order.id, true)}
                        disabled={processingId === order.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Approve Payment"
                      >
                        {processingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        onClick={() => handleVerify(order.id, false)}
                        disabled={processingId === order.id}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Reject Payment"
                      >
                        {processingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[10px] text-slate-500 font-medium">Showing {filteredOrders.length} pending requests</p>
           <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> User Paid</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Approved</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Rejected</span>
           </div>
        </div>
      </div>
    </div>
  );
};
