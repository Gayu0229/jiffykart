
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Eye, Edit, Ban, X, Save, Plus, 
  MapPin, AlertTriangle, CheckCircle, Unlock, 
  Loader2, Check, ShieldAlert, Trash2, Star
} from 'lucide-react';
import { VendorFull } from '../../types';
import { api } from '../../services/api';

interface AllVendorsProps {
  onViewVendor: (vendor: VendorFull) => void;
  allowedPincodes?: string[];
}

const AllVendors: React.FC<AllVendorsProps> = ({ onViewVendor, allowedPincodes }) => {
  const [vendors, setVendors] = useState<VendorFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Feedback State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<VendorFull | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Modal State (Handles Single and Bulk)
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    action: 'block' | 'unblock' | 'bulk_block' | 'bulk_activate' | null; 
    vendorName: string 
  }>({
    isOpen: false,
    action: null,
    vendorName: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await api.getVendors();
      setVendors(data);
    } catch (err) {
      setToast({ message: "Failed to load vendors", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const availableVendors = useMemo(() => {
    return allowedPincodes 
      ? vendors.filter(v => allowedPincodes.includes(v.pincode))
      : vendors;
  }, [vendors, allowedPincodes]);

  const filteredVendors = useMemo(() => {
    return availableVendors.filter(vendor => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = vendor.shopName.toLowerCase().includes(term) || 
                            vendor.ownerName.toLowerCase().includes(term) ||
                            vendor.id.toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'All' || vendor.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [availableVendors, searchTerm, filterStatus]);

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVendors.length && filteredVendors.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendors.map(v => v.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleEditVendor = (vendor: VendorFull) => {
    setCurrentVendor({ ...vendor });
    setIsEditModalOpen(true);
  };

  const initiateToggleBlock = (vendor: VendorFull) => {
    const isBlocked = vendor.status === 'Blocked';
    setCurrentVendor(vendor);
    setConfirmModal({
      isOpen: true,
      action: isBlocked ? 'unblock' : 'block',
      vendorName: vendor.shopName
    });
  };

  const initiateBulkAction = (action: 'bulk_block' | 'bulk_activate') => {
    setConfirmModal({
      isOpen: true,
      action,
      vendorName: `${selectedIds.size} selected vendors`
    });
  };

  const confirmAction = async () => {
    if (!confirmModal.action) return;
    
    setIsSubmitting(true);
    try {
      if (confirmModal.action === 'block' || confirmModal.action === 'unblock') {
        const newStatus = confirmModal.action === 'block' ? 'Blocked' : 'Active';
        await api.updateVendor(currentVendor!.id, { status: newStatus as any });
        setVendors(prev => prev.map(v => v.id === currentVendor!.id ? { ...v, status: newStatus as any } : v));
        setToast({ message: `${confirmModal.vendorName} updated.`, type: 'success' });
      } 
      else if (confirmModal.action === 'bulk_block' || confirmModal.action === 'bulk_activate') {
        const newStatus = confirmModal.action === 'bulk_block' ? 'Blocked' : 'Active';
        const idsToUpdate = Array.from(selectedIds);
        
        await Promise.all(idsToUpdate.map(id => api.updateVendor(id, { status: newStatus as any })));
        
        setVendors(prev => prev.map(v => idsToUpdate.includes(v.id) ? { ...v, status: newStatus as any } : v));
        setToast({ 
          message: `${idsToUpdate.length} vendors have been ${confirmModal.action === 'bulk_block' ? 'blocked' : 'activated'}.`, 
          type: 'success' 
        });
        setSelectedIds(new Set());
      }
    } catch (err) {
      setToast({ message: 'Action failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setConfirmModal({ isOpen: false, action: null, vendorName: '' });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) return;

    setIsSubmitting(true);
    try {
        await api.updateVendor(currentVendor.id, currentVendor);
        setVendors(prev => prev.map(v => v.id === currentVendor.id ? currentVendor : v));
        setIsEditModalOpen(false);
        setToast({ message: 'Updated successfully.', type: 'success' });
    } catch (err) {
        setToast({ message: 'Update failed.', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
           {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
           <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Filter vendors..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-900 border border-transparent rounded-xl focus:ring-2 focus:ring-primary/50 focus:bg-white outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="flex-1 md:flex-none bg-gray-50 border border-transparent text-gray-700 py-3 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
             <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
             <p className="text-gray-500 font-medium">Synchronizing records...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">
                      <button 
                        onClick={toggleSelectAll}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.size === filteredVendors.length && filteredVendors.length > 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 hover:border-indigo-400'}`}
                      >
                        {selectedIds.size === filteredVendors.length && filteredVendors.length > 0 && <Check size={16} className="text-white" />}
                        {selectedIds.size > 0 && selectedIds.size < filteredVendors.length && <div className="w-3 h-0.5 bg-indigo-600"></div>}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendor Profile</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Territory</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rating</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className={`transition-all group ${selectedIds.has(vendor.id) ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSelectOne(vendor.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(vendor.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 hover:border-indigo-400'}`}
                        >
                          {selectedIds.has(vendor.id) && <Check size={16} className="text-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                        {vendor.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img className="h-12 w-12 rounded-2xl object-cover shadow-sm border-2 border-white" src={vendor.avatarUrl} alt="" />
                          <div>
                            <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{vendor.shopName}</div>
                            <div className="text-xs text-gray-500">{vendor.ownerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full w-fit">
                          <MapPin size={12} className="mr-1 text-gray-400"/> {vendor.pincode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center font-bold text-gray-900 text-sm">
                          <Star size={14} className="text-amber-400 fill-amber-400 mr-1.5" />
                          {vendor.rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onViewVendor(vendor)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-none hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => initiateToggleBlock(vendor)}
                            className={`p-2 rounded-xl transition-all border border-transparent hover:shadow-sm ${
                              vendor.status === 'Blocked' 
                                ? 'text-green-600 hover:bg-green-50 hover:border-green-100' 
                                : 'text-red-600 hover:bg-red-50 hover:border-red-100'
                            }`}
                          >
                            {vendor.status === 'Blocked' ? <Unlock size={18} /> : <Ban size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 px-4">
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="py-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img className="h-10 w-10 rounded-xl object-cover shadow-sm" src={vendor.avatarUrl} alt="" />
                      <div>
                        <h4 className="text-sm font-black text-gray-900 leading-tight">{vendor.shopName}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{vendor.ownerName}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                      vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Vendor ID</p>
                      <p className="text-[10px] font-mono font-bold text-slate-500">{vendor.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Territory</p>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <MapPin size={10} /> {vendor.pincode}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Rating</p>
                      <div className="flex items-center text-xs font-black text-slate-900">
                        <Star size={12} className="text-amber-400 fill-amber-400 mr-1" />
                        {vendor.rating}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                       <button 
                        onClick={() => toggleSelectOne(vendor.id)}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedIds.has(vendor.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
                      >
                        {selectedIds.has(vendor.id) && <Check size={18} className="text-white" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onViewVendor(vendor)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                    >
                      <Eye size={14} /> Profile
                    </button>
                    <button
                      onClick={() => initiateToggleBlock(vendor)}
                      className={`p-2.5 rounded-xl transition-all border ${
                        vendor.status === 'Blocked' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}
                    >
                      {vendor.status === 'Blocked' ? <Unlock size={18} /> : <Ban size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
         <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-[2rem] shadow-2xl px-8 py-4 flex items-center gap-8 border border-white/10 ring-1 ring-black/5">
               <div className="flex items-center gap-4 pr-8 border-r border-white/10">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/20">
                     {selectedIds.size}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Selected</span>
               </div>
               
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => initiateBulkAction('bulk_activate')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-green-900/20"
                  >
                     <Unlock size={14} /> Activate
                  </button>
                  <button 
                    onClick={() => initiateBulkAction('bulk_block')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-900/20"
                  >
                     <Ban size={14} /> Block
                  </button>
               </div>

               <button 
                 onClick={() => setSelectedIds(new Set())}
                 className="p-3 hover:bg-white/10 rounded-full transition-colors ml-4 text-gray-400 hover:text-white"
               >
                  <X size={20} />
               </button>
            </div>
         </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 transform scale-100 transition-all text-center">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-8 shadow-inner ${
                 confirmModal.action?.includes('block') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
              }`}>
                 {confirmModal.action?.includes('block') ? <ShieldAlert size={40} /> : <CheckCircle size={40} />}
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                {confirmModal.action === 'block' && 'Block Vendor?'}
                {confirmModal.action === 'unblock' && 'Unblock Vendor?'}
                {confirmModal.action === 'bulk_block' && 'Bulk Block Vendors?'}
                {confirmModal.action === 'bulk_activate' && 'Bulk Activate Vendors?'}
              </h3>
              
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                 {confirmModal.action?.includes('block') 
                   ? `Are you sure you want to block ${confirmModal.vendorName}? This will revoke their platform access and hide all listed products.`
                   : `Are you sure you want to activate ${confirmModal.vendorName}? This will restore their full dashboard access.`
                 }
              </p>

              <div className="flex gap-4">
                 <button 
                   onClick={() => !isSubmitting && setConfirmModal({ isOpen: false, action: null, vendorName: '' })}
                   className="flex-1 py-4 border border-gray-200 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                   disabled={isSubmitting}
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={confirmAction}
                   className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                      confirmModal.action?.includes('block') ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                   }`}
                   disabled={isSubmitting}
                 >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirm'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AllVendors;
