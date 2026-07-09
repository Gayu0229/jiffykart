
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, CreditCard, Filter, AlertTriangle, X, DollarSign } from 'lucide-react';
import { RefundTransaction } from '../../types';

const Refunds: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    refund: RefundTransaction | null;
  }>({ isOpen: false, type: null, refund: null });

  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredRefunds = refunds.filter(r =>
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateAction = (e: React.MouseEvent, refund: RefundTransaction, type: 'approve' | 'reject') => {
    e.stopPropagation();
    setModal({ isOpen: true, type, refund });
  };

  const confirmAction = async () => {
    if (!modal.refund || !modal.type) return;

    try {
      // Mock API Call: POST /api/v1/refunds/:id/action
      // await fetch(`/api/v1/refunds/${modal.refund.id}/${modal.type}`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));

      const newStatus = modal.type === 'approve' ? 'Approved' : 'Rejected';

      setRefunds(prev => prev.map(r =>
        r.id === modal.refund!.id ? { ...r, status: newStatus } : r
      ));

      setToast({
        message: `Refund ${newStatus} successfully for Order ${modal.refund.orderId}`,
        type: modal.type === 'approve' ? 'success' : 'error'
      });
    } catch (error) {
      setToast({ message: 'Action failed', type: 'error' });
    }

    setModal({ isOpen: false, type: null, refund: null });
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[70] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Refund Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Process financial refunds for cancelled or returned orders.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Refund ID or Order ID..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 transition-colors">
          <Filter size={16} />
          <span className="text-sm font-medium">Filter</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {refund.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-medium">
                    {refund.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {refund.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${refund.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                    {refund.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${refund.status === 'Approved' || refund.status === 'Processed' ? 'bg-green-100 text-green-800' :
                        refund.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {refund.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => initiateAction(e, refund, 'approve')}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors"
                          title="Approve"
                          type="button"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={(e) => initiateAction(e, refund, 'reject')}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="Reject"
                          type="button"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRefunds.length === 0 && (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <CreditCard size={32} className="mb-2 opacity-50" />
            <p>No refund transactions found.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal.isOpen && modal.refund && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {modal.type === 'approve' ? 'Approve Refund' : 'Reject Refund'}
              </h3>
              <button onClick={() => setModal({ isOpen: false, type: null, refund: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${modal.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                {modal.type === 'approve' ? <DollarSign size={28} /> : <AlertTriangle size={28} />}
              </div>
              <p className="text-gray-600 text-sm">
                {modal.type === 'approve'
                  ? <>Are you sure you want to approve the refund of <span className="font-bold text-gray-900">${modal.refund.amount.toFixed(2)}</span> for <span className="font-bold text-gray-900">{modal.refund.customerName}</span>?</>
                  : <>Are you sure you want to reject the refund request for <span className="font-bold text-gray-900">{modal.refund.id}</span>?</>
                }
              </p>
              {modal.type === 'approve' && (
                <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-3 py-1 rounded">
                  Amount will be deducted from vendor payout.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModal({ isOpen: false, type: null, refund: null })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium shadow-sm transition-colors ${modal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {modal.type === 'approve' ? 'Confirm' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Refunds;
