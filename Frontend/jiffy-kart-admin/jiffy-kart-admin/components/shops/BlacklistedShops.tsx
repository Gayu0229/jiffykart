
import React, { useState, useEffect } from 'react';
import { Search, Eye, Unlock, AlertOctagon, ShieldAlert, Calendar, AlertTriangle, Ban, CheckCircle, X } from 'lucide-react';
import { VendorFull } from '../../types';
import { api } from '../../services/api';

interface BlacklistedShopsProps {
  onViewShop: (shop: VendorFull) => void;
}

const BlacklistedShops: React.FC<BlacklistedShopsProps> = ({ onViewShop }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blockedShops, setBlockedShops] = useState<VendorFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, shop: VendorFull | null }>({ isOpen: false, shop: null });

  useEffect(() => {
    const fetchBlockedShops = async () => {
      setIsLoading(true);
      try {
        const allShops = await api.getVendors();
        setBlockedShops(allShops.filter(shop => shop.status === 'Blocked'));
      } catch (e) {
        console.error('Failed to fetch blacklisted shops:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlockedShops();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredShops = blockedShops.filter(shop =>
    shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateUnblock = (shop: VendorFull) => {
    setConfirmModal({ isOpen: true, shop });
  };

  const confirmUnblock = async () => {
    if (confirmModal.shop) {
      try {
        await api.unblockVendor(confirmModal.shop.id);

        setBlockedShops(prev => prev.filter(s => s.id !== confirmModal.shop!.id));
        setToast({ message: `Shop "${confirmModal.shop.shopName}" unblocked successfully.`, type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to unblock shop.', type: 'error' });
      } finally {
        setConfirmModal({ isOpen: false, shop: null });
      }
    }
  };

  // Mock data generator for block context since it's not in the main type
  const getBlockDetails = (id: string) => {
    const reasons = [
      "Repeated Policy Violations (Counterfeit items)",
      "High Customer Dispute Rate (>5%)",
      "Failed KYC Verification Audit",
      "Suspicious Activity Detected"
    ];
    // Deterministic mock based on ID char code
    const index = id.charCodeAt(id.length - 1) % reasons.length;
    return {
      reason: reasons[index],
      date: '2023-10-15',
      blockedBy: 'Admin System'
    };
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
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
            <ShieldAlert className="text-red-600" /> Blacklisted Shops
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage suspended vendors and review violation details.</p>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-red-800 text-sm font-medium flex items-center">
          <AlertOctagon size={16} className="mr-2" />
          {blockedShops.length} Shops Currently Blocked
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Shop Name, ID or Owner..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Violation Reason</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Blocked</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Financials Held</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShops.map((shop) => {
                const details = getBlockDetails(shop.id);
                return (
                  <tr key={shop.id} className="hover:bg-red-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <img className="h-10 w-10 rounded-lg object-cover mr-3 border border-gray-200 grayscale" src={shop.avatarUrl} alt={shop.shopName} />
                          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-white">
                            <Ban size={10} className="text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{shop.shopName}</div>
                          <div className="text-xs text-gray-500">ID: {shop.id} • {shop.ownerName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start max-w-xs">
                        <AlertTriangle size={14} className="text-red-500 mt-0.5 mr-2 shrink-0" />
                        <span className="text-sm font-medium text-red-700">{details.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1.5 text-gray-400" />
                        {details.date}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">by {details.blockedBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${shop.totalRevenue.toLocaleString()}
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
                          onClick={() => initiateUnblock(shop)}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs shadow-sm"
                        >
                          <Unlock size={14} className="mr-1.5" /> Unblock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredShops.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <ShieldAlert size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Blacklisted Shops Found</h3>
            <p className="text-sm text-gray-400 mt-1">There are no shops matching the current blocked criteria.</p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.isOpen && confirmModal.shop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <Unlock size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Unblock Shop?</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to unblock <span className="font-bold">{confirmModal.shop.shopName}</span>?
                This will restore access and make their products live again.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, shop: null })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnblock}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm"
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

export default BlacklistedShops;
