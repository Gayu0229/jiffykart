
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, X, Search, UserPlus, Store, RefreshCw, Eye, FileText, Landmark, MapPin } from 'lucide-react';
import { PendingVendor, SellerApplication } from '../../types';
import { api } from '../../services/api';

interface PendingVendorsProps {
  onStartOnboarding?: (vendor: PendingVendor) => void;
  onViewShop?: (vendor: any) => void;
}

const PendingVendors: React.FC<PendingVendorsProps> = ({ onStartOnboarding }) => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; app: SellerApplication | null; reason: string }>({
    isOpen: false, app: null, reason: ''
  });

  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; app: SellerApplication | null }>({
    isOpen: false, app: null
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getSellerApplications(statusFilter);
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      showToast('Failed to load applications. Check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: 'success', visible: false }), 3000);
  };

  const handleApprove = async (app: SellerApplication) => {
    try {
      await api.approveApplication(app.id);
      setApplications(prev => prev.filter(a => a.id !== app.id));
      setDetailsModal({ isOpen: false, app: null });
      showToast(`${app.user?.name || 'Applicant'}'s application approved! Shop "${app.shopName}" created.`, 'success');
    } catch (err) {
      showToast('Failed to approve application.', 'error');
    }
  };

  const confirmReject = async () => {
    if (!rejectModal.app) return;
    try {
      await api.rejectApplication(rejectModal.app.id, rejectModal.reason || 'No reason provided');
      const appName = rejectModal.app.user?.name || 'Applicant';
      setApplications(prev => prev.filter(a => a.id !== rejectModal.app!.id));
      setRejectModal({ isOpen: false, app: null, reason: '' });
      setDetailsModal({ isOpen: false, app: null });
      showToast(`${appName}'s application rejected.`, 'success');
    } catch (err) {
      showToast('Failed to reject application.', 'error');
    }
  };

  const filteredApps = applications.filter(a =>
    a.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] ${toast.type === 'success' ? 'bg-gray-800' : 'bg-red-600'} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2`}>
          <CheckCircle size={18} className={toast.type === 'success' ? 'text-green-400' : 'text-white'} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Seller Applications</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage partner registration requests from the user website.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchApplications} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-100 text-sm font-medium flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {applications.length} {statusFilter} Requests
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or shop..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-400" />
                    <p className="text-sm">Loading applications...</p>
                  </td>
                </tr>
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {app.user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{app.user.name}</div>
                          <div className="text-xs text-gray-400">{app.user.phone || app.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <Store size={14} className="text-gray-400" /> {app.shopName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center w-fit ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        <Clock size={12} className="mr-1" /> {app.status}
                      </span>
                      <span className={`mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded flex items-center w-fit ${app.vendorType === 'FOOD' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {app.vendorType || 'ECOMMERCE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailsModal({ isOpen: true, app })}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {statusFilter === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(app)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => setRejectModal({ isOpen: true, app, reason: '' })}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p>No applications found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.app && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                <p className="text-sm text-gray-500">Applied by {detailsModal.app.user?.name || 'Unknown'}</p>
              </div>
              <button onClick={() => setDetailsModal({ isOpen: false, app: null })} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Business Info */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Store size={14} /> Business Information
                </h4>
                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Shop Name</span>
                    <p className="text-gray-900 font-semibold">{detailsModal.app.shopName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Type</span>
                      <p className="text-gray-900">{detailsModal.app.businessType}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Category</span>
                      <p className="text-gray-900">{detailsModal.app.category}</p>
                    </div>
                  </div>
                  {detailsModal.app.vendorType === 'FOOD' && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase block mb-0.5">Cuisine</span>
                        <p className="text-sm font-bold text-orange-900">{detailsModal.app.cuisineType || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase block mb-0.5">FSSAI License</span>
                        <p className="text-sm font-bold text-orange-900 font-mono">{detailsModal.app.fssaiNumber || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 flex gap-4 pt-1 border-t border-orange-100 mt-1">
                        <div>
                          <span className="text-[10px] font-bold text-orange-400 uppercase block">Opens At</span>
                          <p className="text-xs font-bold text-orange-800">{detailsModal.app.openingTime || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-orange-400 uppercase block">Closes At</span>
                          <p className="text-xs font-bold text-orange-800">{detailsModal.app.closingTime || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Description</span>
                    <p className="text-gray-700 text-sm leading-relaxed">{detailsModal.app.businessDescription}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1 flex items-center gap-1"><MapPin size={10} /> Address</span>
                    <p className="text-gray-700 text-sm">{detailsModal.app.address}, {detailsModal.app.city}, {detailsModal.app.state} - {detailsModal.app.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Legal & Financial */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Legal & Financial
                </h4>
                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase block mb-1">GST Number</span>
                      <p className="text-gray-900 font-mono text-sm">{detailsModal.app.gstNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase block mb-1">PAN Number</span>
                      <p className="text-gray-900 font-mono text-sm">{detailsModal.app.panNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Landmark size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase">Bank Details</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Account Holder</span>
                        <span className="text-xs font-bold text-gray-900">{detailsModal.app.accountHolderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Account Number</span>
                        <span className="text-xs font-bold text-gray-900 font-mono">{detailsModal.app.bankAccountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">IFSC Code</span>
                        <span className="text-xs font-bold text-gray-900 font-mono">{detailsModal.app.ifscCode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="px-8 pb-8">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <FileText size={14} /> Attached Documents
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'ID Proof', url: detailsModal.app.idProofUrl },
                  { label: 'Business Proof', url: detailsModal.app.businessProofUrl },
                  { label: 'Address Proof', url: detailsModal.app.addressProofUrl },
                  { label: 'Cancelled Cheque', url: detailsModal.app.cancelledChequeUrl },
                ].map((doc, i) => doc.url ? (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="aspect-[4/3] bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-50 transition-all">
                      <FileText className="text-gray-400 group-hover:text-indigo-500 mb-2" />
                      <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600">{doc.label}</span>
                    </div>
                  </a>
                ) : (
                  <div key={i} className="aspect-[4/3] bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center justify-center opacity-50">
                    <span className="text-xs font-medium text-gray-400">{doc.label} Missing</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            {detailsModal.app.status === 'PENDING' && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => {
                    setRejectModal({ isOpen: true, app: detailsModal.app!, reason: '' });
                  }}
                  className="px-6 py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleApprove(detailsModal.app!)}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Approve & Onboard Vendor
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reject Application</h3>
              <button onClick={() => setRejectModal({ isOpen: false, app: null, reason: '' })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                You are about to reject <span className="font-bold text-gray-900">{rejectModal.app?.user.name}</span>'s application for <span className="font-bold text-gray-900">"{rejectModal.app?.shopName}"</span>. Please provide a reason.
              </p>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                rows={3}
                placeholder="e.g., Incomplete information, duplicate application..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ isOpen: false, app: null, reason: '' })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingVendors;
