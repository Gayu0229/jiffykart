
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, ChevronRight, User, Eye, MapPin, Phone
} from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryPartner } from '../../types';
import { DeliveryPartnerFinancial } from './DeliveryPartnerPayoutDetails';

interface DeliveryPartnerPayoutsProps {
  onViewDetails?: (partner: DeliveryPartnerFinancial) => void;
}

const DeliveryPartnerPayouts: React.FC<DeliveryPartnerPayoutsProps> = ({ onViewDetails }) => {
  const [partners, setPartners] = useState<DeliveryPartnerFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await api.getDeliveryPartners();
      const enrichedData = data.map(p => ({
        ...p,
        walletBalance: p.walletBalance || 0,
        totalEarningsMonth: 0,
        pendingPayout: 0,
        lastSettlementDate: 'N/A',
        fieldManager: p.franchiseName || 'N/A'
      }));
      setPartners(enrichedData);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      alert('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering ---
  const filteredPartners = useMemo(() => {
    return partners.filter(p =>
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.zone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partners, searchTerm]);

  return (
    <div className="flex flex-col space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Delivery Partner Payouts</h1>
        <p className="text-sm text-gray-500">Manage wallet balances, settlements, and incentives.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Partner Name or ID..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Full Width List View */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner Profile</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet Balance</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPartners.length > 0 ? (
                filteredPartners.map(partner => (
                  <tr
                    key={partner.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => onViewDetails && onViewDetails(partner)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={partner.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-200 mr-3" />
                        <div>
                          <div className="text-sm font-bold text-gray-900">{partner.name}</div>
                          <div className="text-xs text-gray-500">{partner.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center"><Phone size={14} className="mr-2 text-gray-400" /> {partner.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center"><MapPin size={14} className="mr-2 text-gray-400" /> {partner.zone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${partner.status === 'Available' ? 'bg-green-100 text-green-800' :
                          partner.status === 'Busy' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-indigo-600 text-sm bg-indigo-50 px-2 py-1 rounded w-fit">
                        ₹{partner.walletBalance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="p-2 bg-gray-50 text-indigo-600 rounded-full hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails && onViewDetails(partner);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <User size={32} className="mb-2 opacity-30" />
                      No partners found matching criteria.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnerPayouts;
