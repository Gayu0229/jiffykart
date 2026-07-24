
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Phone, Mail, MapPin, Calendar, Shield, Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { FranchiseRequest } from '../../types';

// Extended type for local state management to include granular KYC details
export interface ExtendedRequest extends FranchiseRequest {
  assignedTerritory?: string;
  pincodes?: string[];
  kycDocs: { name: string; status: 'Pending' | 'Verified' | 'Rejected'; url: string; type: 'image' | 'pdf' }[];
  territoryNotes?: string;
}

interface FranchiseRequestsProps {
  onViewDetails?: (request: ExtendedRequest) => void;
}

const FranchiseRequests: React.FC<FranchiseRequestsProps> = ({ onViewDetails }) => {
  const [requests, setRequests] = useState<ExtendedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [kycFilter, setKycFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const data = await api.getFranchiseRequests();
        // Even if empty, we map it to our extended type if needed
        const enhanced = data.map((req: any, index: number) => ({
          ...req,
          assignedTerritory: req.status === 'Approved' ? 'Assigned' : undefined,
          pincodes: [],
          kycDocs: [] // Real data would have docs
        }));
        setRequests(enhanced);
      } catch (err) {
        console.error("Failed to load franchise requests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // --- Logic ---

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch =
        req.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.phone.includes(searchTerm);

      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      const matchesKyc = kycFilter === 'All' || req.kycStatus === kycFilter;
      const matchesLocation = locationFilter === 'All' || req.city === locationFilter;

      return matchesSearch && matchesStatus && matchesKyc && matchesLocation;
    });
  }, [requests, searchTerm, statusFilter, kycFilter, locationFilter]);

  // Get unique locations for filter
  const locations = Array.from(new Set(requests.map(r => r.city)));

  // --- Render Helpers ---

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Approved</span>;
      case 'Rejected': return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Rejected</span>;
      default: return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Pending</span>;
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'Verified': return <span className="flex items-center text-xs text-green-600 font-medium"><Shield size={12} className="mr-1" /> Verified</span>;
      case 'Rejected': return <span className="flex items-center text-xs text-red-600 font-medium"><Shield size={12} className="mr-1" /> Rejected</span>;
      default: return <span className="flex items-center text-xs text-orange-600 font-medium"><Shield size={12} className="mr-1" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6 relative min-h-[600px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Field Manager Requests</h2>
        <p className="text-sm text-gray-500 mt-1">View, verify, and approve new Field Manager applications before onboarding.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name, Phone, or Email..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none cursor-pointer"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="All">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none cursor-pointer"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
          >
            <option value="All">KYC Status</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium">Synchronizing requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Field Manager</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">KYC</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Territory</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm text-gray-900">{req.applicantName}</div>
                      <div className="text-xs text-gray-500">ID: {req.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 flex items-center mb-1"><Phone size={12} className="mr-1" /> {req.phone}</div>
                      <div className="text-xs text-gray-500 flex items-center"><Mail size={12} className="mr-1" /> {req.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center"><MapPin size={12} className="mr-1" /> {req.city}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center"><Calendar size={12} className="mr-1" /> {req.applicationDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getKycBadge(req.kycStatus)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {req.assignedTerritory ? (
                        <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded text-xs">
                          {req.assignedTerritory}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewDetails && onViewDetails(req)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No requests found matching the selected filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseRequests;
