import React, { useState, useEffect } from 'react';
import {
  Package, Search, Filter, AlertCircle, CheckCircle, XCircle, Clock,
  Eye, X, ImageIcon, FileText, Calendar, User, ShoppingBag, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ReturnRequest, VendorProfile } from '../types';
import { api } from '../vendor.api';

interface ReturnsProps {
  vendorProfile: VendorProfile | null;
}

const Returns: React.FC<ReturnsProps> = ({ vendorProfile }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'RETURN' | 'REPLACEMENT'>('ALL');
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    let vendorId: string | number = 1;
    if (vendorProfile?.shopId) {
      vendorId = vendorProfile.shopId;
    } else {
      try {
        const storedUser = localStorage.getItem('vendor_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          vendorId = parsed.vendorId || parsed.shopId || parsed.id || 1;
        }
      } catch (e) { /* fallback */ }
    }

    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const data = await api.fetchReturnRequests(vendorId);
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch return requests', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [vendorProfile]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.updateReturnStatus(id, status);
      setRequests(requests.map(req => req.id === id ? { ...req, status: status as any } : req));
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: status as any });
      }
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update request status. Please try again.');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'ALL' || req.type === activeTab;
    const searchString = `${req.orderId} ${req.reason} ${req.status}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'APPROVED': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      case 'COMPLETED': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12} /> Completed</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="text-brand-500" />
            Returns & Replacements
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage customer return and replacement requests securely.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ALL' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Requests</button>
          <button onClick={() => setActiveTab('RETURN')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'RETURN' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Returns</button>
          <button onClick={() => setActiveTab('REPLACEMENT')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'REPLACEMENT' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Replacements</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Order ID or Reason..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">ID / Order</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Reason</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Images</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Loading requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium flex-col items-center">
                    <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                    No requests found matching your filters.
                  </td>
                </tr>
              ) : filteredRequests.map(req => (
                <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">REQ-{req.id}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">ORD-{req.orderId}</div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="font-bold text-slate-800 truncate">{req.reason}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">{req.details}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-black tracking-widest uppercase ${req.type === 'RETURN' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4">
                    {req.images && req.images.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          {req.images.slice(0, 3).map((img, i) => (
                            <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        {req.images.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400 ml-1">+{req.images.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 font-medium">No images</span>
                    )}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end items-center">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="p-2 bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {req.status === 'PENDING' && (
                        <span className="text-xs font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg">Awaiting Admin Approval</span>
                      )}
                      {req.status === 'APPROVED' && (
                        <button onClick={() => handleStatusUpdate(req.id, 'COMPLETED')} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors">Mark Completed</button>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="text-xs font-bold text-red-400">Rejected by Admin</span>
                      )}
                      {req.status === 'COMPLETED' && (
                        <span className="text-xs font-bold text-slate-400">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Return Request Details</h3>
                  <p className="text-xs text-white/60 font-bold uppercase tracking-widest mt-0.5">
                    REQ-{selectedRequest.id} • ORD-{selectedRequest.orderId}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1">

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <ShoppingBag size={12} /> Request Type
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase ${selectedRequest.type === 'RETURN' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                    {selectedRequest.type}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Clock size={12} /> Status
                  </div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <User size={12} /> Customer ID
                  </div>
                  <span className="font-bold text-slate-800 text-sm">USR-{selectedRequest.userId}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Calendar size={12} /> Submitted
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Reason & Details */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  <FileText size={12} /> Customer Reason
                </div>
                <h4 className="font-bold text-slate-900 text-base">{selectedRequest.reason}</h4>
                {selectedRequest.details && (
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed bg-white p-4 rounded-lg border border-slate-100 mt-3">{selectedRequest.details}</p>
                )}
              </div>

              {/* Customer Images */}
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  <ImageIcon size={12} /> Customer Evidence Photos
                  {selectedRequest.images && selectedRequest.images.length > 0 && (
                    <span className="bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full ml-1">{selectedRequest.images.length}</span>
                  )}
                </div>

                {selectedRequest.images && selectedRequest.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedRequest.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLightboxImage(img)}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 hover:border-brand-300 hover:shadow-lg transition-all group cursor-pointer relative"
                      >
                        <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                            <Eye size={16} className="text-brand-600" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-600 shadow-sm">
                          {idx + 1}/{selectedRequest.images.length}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-8 border border-dashed border-slate-200 text-center">
                    <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">No images uploaded by customer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center gap-3 justify-end shrink-0">
              {selectedRequest.status === 'PENDING' && (
                <span className="text-sm font-bold text-amber-500 bg-amber-50 px-4 py-2 rounded-xl">⏳ Awaiting Admin Approval</span>
              )}
              {selectedRequest.status === 'APPROVED' && (
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'COMPLETED')}
                  className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-green-600/20"
                >
                  Mark as Completed
                </button>
              )}
              {selectedRequest.status === 'REJECTED' && (
                <span className="text-sm font-bold text-red-400">❌ Rejected by Admin</span>
              )}
              {selectedRequest.status === 'COMPLETED' && (
                <span className="text-sm font-bold text-emerald-500">✅ Completed</span>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Lightbox ── */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative z-10 max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={lightboxImage} alt="Evidence" className="max-w-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
