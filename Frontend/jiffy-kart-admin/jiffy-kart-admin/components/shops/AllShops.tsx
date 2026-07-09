import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Ban, Store, CheckCircle, AlertTriangle, Clock, Star, Unlock, X, Save, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { VendorFull } from '../../types';
import StatCard from '../StatCard';

interface AllShopsProps {
  onViewShop: (shop: VendorFull) => void;
  allowedPincodes?: string[];
}

const AllShops: React.FC<AllShopsProps> = ({ onViewShop, allowedPincodes }) => {
  const [shops, setShops] = useState<VendorFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRating, setFilterRating] = useState('All');

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<VendorFull | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'block' | 'unblock' | null;
    shop: VendorFull | null;
  }>({ isOpen: false, action: null, shop: null });

  const fetchShops = async () => {
    setLoading(true);
    try {
      const data = await api.getVendors();
      setShops(data);
    } catch (err) {
      console.error("Failed to fetch shops", err);
      setToast({ message: 'Failed to load shops data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter by Franchise Territory if applicable
  const availableShops = allowedPincodes
    ? shops.filter(shop => allowedPincodes.includes(shop.pincode))
    : shops;

  const filteredShops = availableShops.filter(shop => {
    const matchesSearch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.phone.includes(searchTerm) ||
      shop.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'All' || shop.status === filterStatus;

    const matchesRating = filterRating === 'All'
      || (filterRating === '4+' && shop.rating >= 4)
      || (filterRating === '3+' && shop.rating >= 3)
      || (filterRating === 'Low' && shop.rating < 3);

    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleEditShop = (shop: VendorFull) => {
    setEditingShop({ ...shop });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;

    setIsSubmitting(true);
    try {
      await api.updateVendor(editingShop.id, editingShop);
      setShops(prev => prev.map(s => s.id === editingShop.id ? editingShop : s));
      setIsEditModalOpen(false);
      setEditingShop(null);
      setToast({ message: 'Shop details updated successfully', type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to update shop details.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateToggleBlock = (shop: VendorFull) => {
    const action = shop.status === 'Blocked' ? 'unblock' : 'block';
    setConfirmModal({ isOpen: true, action, shop });
  };

  const confirmBlockAction = async () => {
    if (confirmModal.shop && confirmModal.action) {
      setIsSubmitting(true);
      try {
        const isEnabling = confirmModal.action === 'unblock';
        if (isEnabling) {
          await api.unblockVendor(confirmModal.shop.id);
        } else {
          await api.blockVendor(confirmModal.shop.id);
        }
        const newStatus = confirmModal.action === 'block' ? 'Blocked' : 'Active';
        setShops(prev => prev.map(s => s.id === confirmModal.shop!.id ? { ...s, status: newStatus as any } : s));
        setToast({
          message: `Shop "${confirmModal.shop.shopName}" has been ${confirmModal.action}ed.`,
          type: 'success'
        });
      } catch (e) {
        setToast({ message: `Failed to ${confirmModal.action} shop.`, type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
    setConfirmModal({ isOpen: false, action: null, shop: null });
  };

  // Calculate Summary Stats based on filtered view
  const totalShops = availableShops.length;
  const activeShops = availableShops.filter(s => s.status === 'Active').length;
  const pendingShops = availableShops.filter(s => s.kycStatus === 'Pending').length;
  const suspendedShops = availableShops.filter(s => s.status === 'Blocked').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium font-serif italic text-lg text-center px-4">Loading real-time shop profiles from the JiffyKart network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Shops"
          value={totalShops}
          description="Registered shops"
          icon={Store}
          colorClass="text-indigo-600 bg-indigo-100"
        />
        <StatCard
          title="Active Shops"
          value={activeShops}
          description="Currently selling"
          icon={CheckCircle}
          colorClass="text-green-600 bg-green-100"
        />
        <StatCard
          title="Pending Approval"
          value={pendingShops}
          description="Waiting for KYC"
          icon={Clock}
          colorClass="text-yellow-600 bg-yellow-100"
        />
        <StatCard
          title="Shops Suspended"
          value={suspendedShops}
          description="Blocked due to issues"
          icon={Ban}
          colorClass="text-red-600 bg-red-100"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search shop by name, ID, phone..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex wrap items-center gap-3 w-full sm:w-auto">
          <select
            className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>
          <select
            className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="All">All Ratings</option>
            <option value="4+">4 Stars & Up</option>
            <option value="3+">3 Stars & Up</option>
            <option value="Low">Low Rating (&lt;3)</option>
          </select>
        </div>
      </div>

      {/* Shop List Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-lg object-cover mr-3 border border-gray-200" src={shop.avatarUrl} alt={shop.shopName} />
                      <div>
                        <div className="text-sm font-bold text-gray-900">{shop.shopName}</div>
                        <div className="text-xs text-gray-400">ID: {shop.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{shop.ownerName}</div>
                    <div className="text-xs text-gray-500">{shop.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit">{shop.pincode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-gray-900 mr-1">{shop.rating}</span>
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {shop.productsLive} Live
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`flex items-center text-xs font-medium ${shop.kycStatus === 'Verified' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                      {shop.kycStatus === 'Verified' ? <CheckCircle size={14} className="mr-1" /> : <AlertTriangle size={14} className="mr-1" />}
                      {shop.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shop.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' :
                      shop.status === 'Inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewShop(shop)}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditShop(shop)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => initiateToggleBlock(shop)}
                        className={`p-1.5 rounded transition-colors ${shop.status === 'Blocked' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        title={shop.status === 'Blocked' ? 'Unblock' : 'Block'}
                      >
                        {shop.status === 'Blocked' ? <Unlock size={16} /> : <Ban size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredShops.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No shops found matching your criteria.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Edit Shop Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={editingShop.shopName}
                  onChange={(e) => setEditingShop({ ...editingShop, shopName: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={editingShop.ownerName}
                  onChange={(e) => setEditingShop({ ...editingShop, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingShop.phone}
                  onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingShop.email}
                  onChange={(e) => setEditingShop({ ...editingShop, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingShop.status}
                  onChange={(e) => setEditingShop({ ...editingShop, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center"
                >
                  <Save size={18} className="mr-2" /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block/Unblock Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.shop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.action === 'block' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                {confirmModal.action === 'block' ? <Ban size={24} /> : <Unlock size={24} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {confirmModal.action === 'block' ? 'Block Shop?' : 'Unblock Shop?'}
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to {confirmModal.action} <span className="font-bold">{confirmModal.shop.shopName}</span>?
                {confirmModal.action === 'block' && ' This will hide all products and prevent new orders.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, shop: null })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockAction}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium shadow-sm ${confirmModal.action === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
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

export default AllShops;
