
import React, { useState, useEffect } from 'react';
import { Search, Tag, Plus, Calendar, Copy, X, Save, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { Coupon } from '../../types';
import { api } from '../../services/api';

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch from backend
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const data = await api.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error("Failed to load coupons", err);
    }
  };

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'Percentage',
    value: 0,
    minOrderValue: 0,
    validity: '',
    applicableTo: 'All',
    status: 'Active'
  });

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setNewCoupon({
      code: '',
      discountType: 'Percentage',
      value: 0,
      minOrderValue: 0,
      validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applicableTo: 'All',
      status: 'Active'
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newCoupon.code || !newCoupon.value || !newCoupon.validity) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      const created = await api.createCoupon({
        code: newCoupon.code,
        discountType: newCoupon.discountType,
        value: Number(newCoupon.value),
        minOrderValue: Number(newCoupon.minOrderValue),
        validity: newCoupon.validity,
        applicableTo: newCoupon.applicableTo,
        status: 'Active'
      });

      setCoupons([created, ...coupons]);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error("Failed to create coupon", error);
      setFormError(error.response?.data?.message || "Failed to create coupon. Please try again.");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.deleteCoupon(id);
        setCoupons(coupons.filter(c => c.id !== id));
      } catch (err) {
        console.error("Error deleting coupon", err);
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Coupons & Offers</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount codes.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Coupon Code..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Coupon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative hover:shadow-md transition-shadow">
            {/* Status Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${coupon.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {coupon.status}
            </div>

            <div className="p-6 border-b border-dashed border-gray-200 relative">
              {/* Left Cutout */}
              <div className="absolute bottom-[-10px] left-[-10px] w-5 h-5 bg-gray-50 rounded-full border-r border-t border-gray-200"></div>
              {/* Right Cutout */}
              <div className="absolute bottom-[-10px] right-[-10px] w-5 h-5 bg-gray-50 rounded-full border-l border-t border-gray-200"></div>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Tag size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-mono font-bold text-lg text-gray-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {coupon.code}
                      <button className="text-gray-400 hover:text-gray-600" title="Copy Code"><Copy size={12} /></button>
                    </div>
                    <button onClick={() => handleDelete(coupon.id)} className="text-red-400 hover:text-red-600" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">{coupon.discountType}</div>
                </div>
              </div>

              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {coupon.discountType === 'Percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
              </div>
              <p className="text-xs text-gray-500">Min Order: ₹{coupon.minOrderValue}</p>
            </div>

            <div className="p-4 bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                <span className="flex items-center"><Calendar size={14} className="mr-1.5" /> Expires:</span>
                <span className="font-medium">{coupon.validity}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Usage Count:</span>
                <span className="font-medium">{coupon.usageCount}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Applicable to: <span className="font-medium text-gray-700">{coupon.applicableTo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Create New Coupon</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-600 text-sm">
                  <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder-gray-400 font-mono uppercase"
                  placeholder="e.g. SUMMER2024"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed Amount">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    placeholder={newCoupon.discountType === 'Percentage' ? 'e.g. 20' : 'e.g. 500'}
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    value={newCoupon.minOrderValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    value={newCoupon.validity}
                    onChange={(e) => setNewCoupon({ ...newCoupon, validity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicable To</label>
                <select
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  value={newCoupon.applicableTo}
                  onChange={(e) => setNewCoupon({ ...newCoupon, applicableTo: e.target.value as any })}
                >
                  <option value="All">All Products</option>
                  <option value="Specific Vendors">Specific Vendors</option>
                  <option value="Specific Categories">Specific Categories</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center shadow-sm transition-colors"
                >
                  <Save size={18} className="mr-2" /> Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
