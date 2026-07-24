
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, Store, AlertCircle, X, AlertTriangle } from 'lucide-react';

import { VendorFull } from '../../types';
import { api } from '../../services/api';

interface PendingShopsProps {
  onViewShop: (shop: VendorFull) => void;
}

const PendingShops: React.FC<PendingShopsProps> = ({ onViewShop }) => {
  // Data State
  const [pendingShops, setPendingShops] = useState<VendorFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
    shop: VendorFull | null;
  }>({ isOpen: false, type: null, shop: null });
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingShops = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPendingShopsAsVendors();
      // Since getVendors now fetches real data with status=PENDING, we just use it
      setPendingShops(data);
    } catch (e) {
      console.error('Fetch error:', e);
      setToast({ message: 'Failed to load pending applications.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShops();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredShops = pendingShops.filter(shop =>
    shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateAction = (shop: VendorFull, type: 'approve' | 'reject') => {
    setActionModal({ isOpen: true, type, shop });
    setRejectReason('');
  };

  const confirmAction = async () => {
    if (!actionModal.shop || !actionModal.type) return;

    try {
      if (actionModal.type === 'approve') {
        await api.approveApplication(actionModal.shop.id);
        setToast({ message: `Shop "${actionModal.shop.shopName}" approved successfully!`, type: 'success' });
      } else {
        if (!rejectReason.trim()) {
          alert("Please provide a reason for rejection.");
          return;
        }
        await api.rejectApplication(actionModal.shop.id, rejectReason);
        setToast({ message: `Shop "${actionModal.shop.shopName}" rejected.`, type: 'error' });
      }
      // Refresh list
      fetchPendingShops();
    } catch (error) {
      console.error('Action failed:', error);
      setToast({ message: 'Action failed. Please try again.', type: 'error' });
    } finally {
      setActionModal({ isOpen: false, type: null, shop: null });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Store className="text-orange-600" /> Pending Shop Approvals
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review shop profiles before they go live on the marketplace.</p>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-100 text-orange-800 text-sm font-medium flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {pendingShops.length} Requests Waiting
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Shop Name, ID or Owner..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop Profile</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submission Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-orange-50/10 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-lg object-cover mr-3 border border-gray-200" src={shop.avatarUrl} alt={shop.shopName} />
                      <div>
                        <div className="text-sm font-bold text-gray-900">{shop.shopName}</div>
                        <div className="text-xs text-gray-500">ID: {shop.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{shop.ownerName}</div>
                    <div className="text-xs text-gray-500">{shop.email}</div>
                    <div className="text-xs text-gray-500">{shop.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {shop.businessType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {shop.joinedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewShop(shop)}
                        className="flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs"
                      >
                        <Eye size={14} className="mr-1.5" /> View
                      </button>
                      <button
                        onClick={() => initiateAction(shop, 'approve')}
                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs shadow-sm"
                      >
                        <CheckCircle size={14} className="mr-1.5" /> Approve
                      </button>
                      <button
                        onClick={() => initiateAction(shop, 'reject')}
                        className="flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-xs"
                      >
                        <XCircle size={14} className="mr-1.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredShops.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
            <p className="text-sm text-gray-400 mt-1">No pending shop approvals at the moment.</p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.shop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">
                {actionModal.type === 'approve' ? 'Approve Shop' : 'Reject Shop'}
              </h3>
              <button onClick={() => setActionModal({ isOpen: false, type: null, shop: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              {actionModal.type === 'approve' ? (
                <p className="text-gray-600 text-sm">
                  Are you sure you want to approve <span className="font-bold text-gray-900">{actionModal.shop.shopName}</span>? They will be live immediately.
                </p>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm mb-2">Please provide a reason for rejection:</p>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                    rows={3}
                    placeholder="e.g. Incomplete details, Policy violation..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal({ isOpen: false, type: null, shop: null })}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-2 text-white rounded-lg font-medium shadow-sm ${actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingShops;
