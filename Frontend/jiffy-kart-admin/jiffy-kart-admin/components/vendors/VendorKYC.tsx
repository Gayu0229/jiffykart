import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { KYCRequest } from '../../types';

interface VendorKYCProps {
  onViewDetails: (request: KYCRequest) => void;
}

const VendorKYC: React.FC<VendorKYCProps> = ({ onViewDetails }) => {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchKYCRequests = async () => {
    setLoading(true);
    try {
      // In JiffyKart, Seller Applications serve as KYC requests
      const apps = await api.getSellerApplications('PENDING');
      const mapped: KYCRequest[] = apps.map((app: any) => ({
        id: app.id.toString(),
        vendorId: app.id.toString(),
        vendorName: app.shopName,
        ownerName: app.user?.name || 'Unknown',
        email: app.user?.email || 'N/A',
        phone: app.user?.phone || 'N/A',
        businessType: app.businessType as any || 'Individual',
        vendorCategory: app.category || 'General',
        submittedDate: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A',
        status: 'Pending Verification',
        address: app.address || 'N/A',
        pickupAddress: app.address || 'N/A',
        documents: [
          { id: 'id-proof', type: 'ID Proof', category: 'Identity', fileName: 'id_proof.jpg', url: app.idProofUrl || '', fileType: 'image', status: 'Pending' },
          { id: 'business-proof', type: 'Business Proof', category: 'Business', fileName: 'business_proof.jpg', url: app.businessProofUrl || '', fileType: 'image', status: 'Pending' },
          { id: 'address-proof', type: 'Address Proof', category: 'Address', fileName: 'address_proof.jpg', url: app.addressProofUrl || '', fileType: 'image', status: 'Pending' },
          { id: 'cheque', type: 'Cancelled Cheque', category: 'Bank', fileName: 'cheque.jpg', url: app.cancelledChequeUrl || '', fileType: 'image', status: 'Pending' }
        ],
        bankDetails: {
          bankName: app.bankName || 'N/A',
          accountNumber: app.bankAccountNumber || 'N/A',
          ifsc: app.ifscCode || 'N/A',
          accountName: app.accountHolderName || 'N/A'
        }
      }));
      setRequests(mapped);
    } catch (err) {
      console.error("Failed to fetch KYC requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCRequests();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Resubmitted': return 'bg-blue-100 text-blue-800';
      case 'Awaiting Vendor Action': return 'bg-orange-100 text-orange-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium font-serif italic">Loading KYC applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
          }`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name, ID or Email..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <select
            className="w-full sm:w-auto appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all hover:border-primary/50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending Verification">Pending</option>
            <option value="Resubmitted">Resubmitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Awaiting Vendor Action">Awaiting Action</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  onClick={() => onViewDetails(req)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{req.vendorName}</div>
                    <div className="text-xs text-gray-500 font-medium">ID: {req.vendorId} • {req.ownerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="font-semibold">{req.businessType}</span>
                    <div className="text-xs text-gray-400 font-medium">{req.vendorCategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {req.submittedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(req.status)} shadow-sm border border-black/5`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      className="text-primary bg-primary/5 hover:bg-primary hover:text-white p-2 rounded-lg transition-all transform active:scale-95 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(req);
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                <XCircle size={40} />
              </div>
              <p className="text-gray-500 font-semibold text-lg italic font-serif">Deep silence... no KYC applications found.</p>
              <button
                onClick={fetchKYCRequests}
                className="text-primary text-sm font-bold hover:underline"
              >
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorKYC;
