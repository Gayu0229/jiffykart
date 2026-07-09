
import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit3, X,
  AlertTriangle, Loader2, Hash, Save, BarChart3, Clock
} from 'lucide-react';
import { api } from '../vendor.api.ts';

interface Discount {
  id: number;
  code: string;
  discountType: string;
  value: number;
  usageCount: number;
  maxUsage?: number;
  isActive: boolean;
  validity: string;
}

const Discounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'Percentage',
    value: '',
    minOrderValue: '0',
    validity: ''
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchCoupons();
      setDiscounts(data);
    } catch (error) {
      console.error("Failed to load coupons", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (discount?: Discount) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        discountType: discount.discountType,
        value: discount.value.toString(),
        minOrderValue: '0', // Adjust if you add minOrderValue to Discount interface
        validity: discount.validity
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        discountType: 'Percentage',
        value: '',
        minOrderValue: '0',
        validity: new Date().toISOString().split('T')[0]
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        value: parseFloat(formData.value),
        validity: formData.validity,
        isActive: true
      };

      await api.createCoupon(payload);
      await loadCoupons();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to save coupon", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteCoupon(deleteTarget.id);
      await loadCoupons();
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete coupon", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-brand-900" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 relative">
      {/* Header precisely matching the image with updated button color */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-4xl font-black text-[#10002B] tracking-tight uppercase leading-none">Discounts & Offers</h2>
          <p className="text-base text-gray-500 font-medium mt-3">Create and manage high-conversion promotional campaigns</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center space-x-3 bg-brand-900 text-white px-10 py-5 rounded-[22px] text-[13px] font-black uppercase tracking-[0.15em] hover:bg-black hover:scale-[1.02] transition-all shadow-lg shadow-brand-900/20"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Active Promo</p>
          <div className="flex items-center space-x-4">
            <h3 className="text-5xl font-black text-[#10002B]">{discounts.length}</h3>
            {discounts.length > 0 && <span className="text-[11px] font-black text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl uppercase tracking-wider">Running</span>}
          </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">Total Redemptions</p>
          <h3 className="text-5xl font-black text-[#10002B]">{discounts.reduce((sum, d) => sum + d.usage, 0)}</h3>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">Limit Capacity</p>
          <h3 className="text-5xl font-black text-[#10002B]">{discounts.length > 0 ? `${Math.round((discounts.reduce((sum, d) => sum + d.usage, 0) / discounts.reduce((sum, d) => sum + d.maxUsage, 0)) * 100)}%` : '0%'}</h3>
        </div>
      </div>

      {/* List Grid matching the visual layout of the provided screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {discounts.map((d) => {
          const usagePercent = d.maxUsage ? (d.usageCount / d.maxUsage) * 100 : 0;
          const isFull = d.maxUsage ? d.usageCount >= d.maxUsage : false;
          const displayValue = d.discountType === 'Percentage' ? `${d.value}%` : `&#8377;${d.value}`;

          return (
            <div key={d.id} className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm relative group transition-all hover:shadow-2xl hover:-translate-y-2">
              {/* Background accent bubble updated to brand lavender */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${isFull ? 'bg-red-50' : 'bg-brand-50'} -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>

              <div className="flex justify-between items-start relative z-10">
                <div className="bg-brand-900 text-white px-6 py-2.5 rounded-[20px] text-[13px] font-black tracking-[0.1em] shadow-xl group-hover:scale-105 transition-transform">
                  {d.code}
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleOpenForm(d)} className="p-3 bg-gray-50 text-gray-500 hover:text-brand-900 hover:bg-brand-50 rounded-2xl transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(d)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-12 space-y-8 relative z-10">
                <div>
                  <h3 className={`text-6xl font-black ${isFull ? 'text-gray-400' : 'text-brand-900'} tracking-tighter`} dangerouslySetInnerHTML={{ __html: displayValue }}></h3>
                  <div className="flex items-center space-x-3 mt-3">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{d.discountType === 'Shipping' ? 'Shipping Tier' : d.discountType === 'Fixed Amount' ? 'Fixed Amount Tier' : 'Percentage Tier'}</p>
                    {isFull && <span className="bg-red-50 text-red-500 text-[9px] font-black uppercase px-3 py-1 rounded-lg">Limit Reached</span>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-[11px] font-black uppercase tracking-[0.15em]">Usage Velocity</span>
                    </div>
                    <span className="text-[13px] font-black text-brand-900">{d.usageCount} {d.maxUsage ? `/ ${d.maxUsage}` : ''}</span>
                  </div>
                  <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-red-500' : 'bg-brand-500'}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em]">Expires {d.validity}</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isFull ? 'bg-red-500 animate-pulse' : 'bg-brand-500'}`}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] p-12 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-brand-900"></div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-8 right-8 p-3 text-gray-400 hover:text-brand-900 transition-all hover:bg-brand-50 rounded-2xl"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-12">
              <h3 className="text-3xl font-black text-brand-900 tracking-tight uppercase">
                {editingDiscount ? 'Modify Campaign' : 'New Promo Campaign'}
              </h3>
              <p className="text-base font-medium text-gray-500 mt-2">Configure your coupon parameters below</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Coupon Code</label>
                  <div className="relative">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. FLASH50"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-base font-black text-brand-900 placeholder:text-gray-300 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-base font-bold text-brand-900 outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
                    >
                      <option>Percentage</option>
                      <option>Fixed Amount</option>
                      <option>Shipping</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Value</label>
                    <input
                      required
                      type="number"
                      placeholder="0"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-base font-black text-brand-900 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Max Usages</label>
                    <input
                      required
                      type="number"
                      value={formData.maxUsage}
                      onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-base font-black text-brand-900 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Expiry Date</label>
                    <input
                      required
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm font-black text-brand-900 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-brand-900 text-white py-6 rounded-[28px] text-[13px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-2xl disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>{editingDiscount ? 'Update Campaign' : 'Confirm Launch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] p-12 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-10 relative">
            <div className="absolute top-0 left-0 w-full h-3 bg-red-500"></div>
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-brand-900 uppercase tracking-tight">Deactivate Promo?</h3>
              <p className="text-base font-medium text-gray-500 leading-relaxed">
                This will immediately stop <span className="font-black text-brand-900">{deleteTarget.code}</span> from working.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full bg-red-500 text-white py-5 rounded-3xl text-[13px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete Campaign'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="w-full bg-gray-50 text-gray-500 py-5 rounded-3xl text-[13px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discounts;
