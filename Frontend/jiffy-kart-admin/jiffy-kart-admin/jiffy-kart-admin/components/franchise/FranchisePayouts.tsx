import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, Search, Filter, X, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { FranchisePayout } from '../../types';

const FranchisePayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<FranchisePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal & Toast State
  const [selectedPayout, setSelectedPayout] = useState<{ data: FranchisePayout, type: 'release' | 'reject' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoading(true);
      try {
        const data = await api.getFranchisePayouts();
        setPayouts(data);
      } catch (err) {
        console.error("Failed to load payouts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = p.franchiseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.franchiseId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const initiateAction = (payout: FranchisePayout, type: 'release' | 'reject') => {
    setSelectedPayout({ data: payout, type });
    setRejectReason('');
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    if (selectedPayout) {
      try {
        // Mock API Call: POST /api/v1/franchise-payouts/:id
        // await fetch(`/api/v1/franchise-payouts/${selectedPayout.data.id}/${selectedPayout.type}`, {
        //   method: 'POST', body: JSON.stringify({ reason: rejectReason })
        // });
        await new Promise(resolve => setTimeout(resolve, 600));

        if (selectedPayout.type === 'release') {
          setPayouts(prev => prev.map(p =>
            p.id === selectedPayout.data.id ? { ...p, status: 'Paid' as const } : p
          ));
          setToast({
            message: `Payout of $${selectedPayout.data.netPayable.toLocaleString()} released to ${selectedPayout.data.franchiseName}`,
            type: 'success'
          });
        } else {
          setPayouts(prev => prev.map(p =>
            p.id === selectedPayout.data.id ? { ...p, status: 'Failed' as const } : p
          ));
          setToast({
            message: `Payout for ${selectedPayout.data.franchiseName} rejected.`,
            type: 'error'
          });
        }
      } catch (error) {
        setToast({ message: "Action failed", type: 'error' });
      }

      setIsModalOpen(false);
      setSelectedPayout(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-800">Field Manager Payouts</h2>
        <p className="text-sm text-gray-500 mt-1">Manage commission releases to field managers.</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Field Manager or ID..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium">Synchronizing payouts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Field Manager</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Total Earnings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Net Payable</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-gray-900">{p.franchiseName}</div>
                      <div className="text-xs text-gray-500">{p.franchiseId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">${p.totalEarnings.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-500">-${p.commissionDeducted.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${p.netPayable.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${p.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        p.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => initiateAction(p, 'release')}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                          >
                            Release
                          </button>
                          <button
                            onClick={() => initiateAction(p, 'reject')}
                            className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors shadow-sm active:scale-95"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center justify-end font-medium">
                          {p.status === 'Paid' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                          {p.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayouts.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No payouts found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedPayout.type === 'release' ? 'Confirm Payout' : 'Reject Payout'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${selectedPayout.type === 'release' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {selectedPayout.type === 'release' ? <DollarSign size={32} /> : <XCircle size={32} />}
              </div>
              {selectedPayout.type === 'release' ? (
                <>
                  <p className="text-gray-600 text-sm mb-2">You are about to release a payment of</p>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">${selectedPayout.data.netPayable.toLocaleString()}</h2>
                  <p className="text-gray-500 text-sm">to <span className="font-bold text-gray-800">{selectedPayout.data.franchiseName}</span></p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Are you sure you want to reject the payout for <span className="font-bold">{selectedPayout.data.franchiseName}</span>?
                  </p>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-red-500"
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </>
              )}
            </div>

            {selectedPayout.type === 'release' && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-6 flex items-start text-left">
                <AlertCircle size={16} className="text-yellow-600 mt-0.5 mr-2 shrink-0" />
                <p className="text-xs text-yellow-800">
                  This action will mark the payout as settled. Ensure funds are available.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors shadow-sm ${selectedPayout.type === 'release' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {selectedPayout.type === 'release' ? 'Confirm Release' : 'Reject Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchisePayouts;
