
import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Star, Phone, MapPin, Briefcase, Wallet, Plus, X, CheckCircle, Unlock, Ban, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryPartner } from '../../types';

interface DeliveryPartnersProps {
  allowedPincodes?: string[];
  onNavigate?: (page: string) => void;
}

const DeliveryPartners: React.FC<DeliveryPartnersProps> = ({ allowedPincodes, onNavigate }) => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await api.getDeliveryPartners();
      setPartners(data);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      alert('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  // Action Confirm Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    partner: DeliveryPartner | null;
    type: 'block' | 'activate' | null;
  }>({ isOpen: false, partner: null, type: null });

  // New Partner Form State
  const [newPartner, setNewPartner] = useState<Partial<DeliveryPartner>>({
    name: '',
    phone: '',
    zone: '',
    pincode: '',
    franchiseName: '',
    status: 'Available'
  });

  const availablePartners = allowedPincodes
    ? partners.filter(p => allowedPincodes.includes(p.pincode))
    : partners;

  const filteredPartners = availablePartners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPartner = () => {
    setNewPartner({
      name: '',
      phone: '',
      zone: '',
      pincode: '',
      franchiseName: '',
      status: 'Available'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPartner.name || !newPartner.phone || !newPartner.zone) {
      setFormError("Please fill in all required fields (Name, Phone, Zone).");
      return;
    }

    try {
      // Mock API Call: POST/PUT /api/v1/delivery/partners
      // const url = newPartner.id ? `/api/v1/delivery/partners/${newPartner.id}` : '/api/v1/delivery/partners';
      // const method = newPartner.id ? 'PUT' : 'POST';
      // await fetch(url, {
      //   method,
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newPartner),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      // If ID exists, it's an edit (simulated logic)
      const partner: DeliveryPartner = {
        id: newPartner.id || `DP${Math.floor(Math.random() * 10000)}`,
        name: newPartner.name || '',
        phone: newPartner.phone || '',
        zone: newPartner.zone || '',
        pincode: newPartner.pincode || '000000',
        status: (newPartner.status as any) || 'Available',
        activeOrders: 0,
        completedDeliveries: 0,
        rating: 5.0,
        avatarUrl: `https://ui-avatars.com/api/?name=${newPartner.name}&background=random`,
        franchiseName: newPartner.franchiseName,
        walletBalance: 0
      };

      setPartners(prev => [partner, ...prev.filter(p => p.id !== partner.id)]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to save partner", error);
      setFormError("Failed to save partner.");
    }
  };

  const handleEdit = (partner: DeliveryPartner) => {
    setNewPartner(partner);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const initiateStatusToggle = (partner: DeliveryPartner) => {
    const isBlocked = partner.status === 'Offline';
    setActionModal({
      isOpen: true,
      partner,
      type: isBlocked ? 'activate' : 'block'
    });
  };

  const confirmStatusToggle = async () => {
    if (actionModal.partner && actionModal.type) {
      try {
        const enabled = actionModal.type === 'activate';
        await api.toggleAdminUserStatus(actionModal.partner.id, enabled);
        alert(`Partner ${actionModal.type === 'activate' ? 'activated' : 'blocked'} successfully`);
        fetchPartners();
      } catch (error) {
        console.error("Failed to update status", error);
        alert('Failed to update partner status');
      }
    }
    setActionModal({ isOpen: false, partner: null, type: null });
  };

  return (
    <div className="space-y-6 relative">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name or Zone..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('Delivery Partner Payouts')}
              className="flex items-center bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Wallet size={16} className="mr-2" />
              Manage Payouts
            </button>
          )}
          <button
            onClick={handleAddPartner}
            className="flex items-center bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={18} className="mr-2" />
            Add Partner
          </button>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Field Manager</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200" src={partner.avatarUrl} alt={partner.name} />
                      <div className="text-sm font-bold text-gray-900">{partner.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {partner.franchiseName ? (
                      <div className="flex items-center text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
                        <Briefcase size={10} className="mr-1" /> {partner.franchiseName}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center"><Phone size={14} className="mr-2 text-gray-400" /> {partner.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center"><MapPin size={14} className="mr-2 text-gray-400" /> {partner.zone}</div>
                    <div className="text-xs text-gray-400 mt-1 pl-6">PIN: {partner.pincode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${partner.status === 'Available' ? 'bg-green-100 text-green-800' :
                        partner.status === 'Busy' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {partner.status}
                    </span>
                    {partner.activeOrders > 0 && (
                      <span className="ml-2 text-xs text-gray-500">({partner.activeOrders} active)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <span className="text-yellow-400 mr-1 flex"><Star size={12} fill="currentColor" /></span>
                      <span className="font-medium text-gray-900">{partner.rating}</span>
                    </div>
                    <div className="text-xs text-gray-500">{partner.completedDeliveries} deliveries</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(partner)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => initiateStatusToggle(partner)}
                        className={`p-1.5 rounded transition-colors ${partner.status === 'Offline' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        title={partner.status === 'Offline' ? "Activate" : "Block"}
                      >
                        {partner.status === 'Offline' ? <Unlock size={16} /> : <Ban size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPartners.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No delivery partners found matching criteria.
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${actionModal.type === 'activate' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {actionModal.type === 'activate' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{actionModal.type === 'activate' ? 'Activate Partner?' : 'Block Partner?'}</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to {actionModal.type} <span className="font-bold">{actionModal.partner?.name}</span>?
                {actionModal.type === 'block' && ' They will not receive new orders.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActionModal({ isOpen: false, partner: null, type: null })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusToggle}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium hover:opacity-90 transition-colors shadow-sm ${actionModal.type === 'activate' ? 'bg-green-600' : 'bg-red-600'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{newPartner.id ? 'Edit Partner' : 'Add New Delivery Partner'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePartner} className="p-6 space-y-4">

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-600 text-sm">
                  <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div><label className="block text-sm font-medium mb-1">Full Name</label><input type="text" className="w-full border p-2 rounded bg-white text-gray-900" value={newPartner.name} onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" className="w-full border p-2 rounded bg-white text-gray-900" value={newPartner.phone} onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Zone</label><input type="text" className="w-full border p-2 rounded bg-white text-gray-900" value={newPartner.zone} onChange={e => setNewPartner({ ...newPartner, zone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Pincode</label><input type="text" className="w-full border p-2 rounded bg-white text-gray-900" value={newPartner.pincode} onChange={e => setNewPartner({ ...newPartner, pincode: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Field Manager</label><input type="text" className="w-full border p-2 rounded bg-white text-gray-900" value={newPartner.franchiseName} onChange={e => setNewPartner({ ...newPartner, franchiseName: e.target.value })} /></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 border py-2 rounded">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPartners;
