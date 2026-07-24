
import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Ban, Plus, Briefcase, X, Save, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { Franchise } from '../../types';

interface AllFranchisesProps {
  onViewFranchise: (franchise: Franchise) => void;
}

const AllFranchises: React.FC<AllFranchisesProps> = ({ onViewFranchise }) => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [newFranchise, setNewFranchise] = useState<Partial<Franchise>>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    territory: [],
    pincodes: [],
    address: '',
    status: 'Active'
  });
  const [territoryInput, setTerritoryInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');

  // Modal State for Block/Activate
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'disable' | 'activate' | null;
    franchiseId: string | null;
    franchiseName: string;
  }>({ isOpen: false, action: null, franchiseId: null, franchiseName: '' });

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const data = await api.getFranchises();
      setFranchises(data);
    } catch (err) {
      setToast({ message: "Failed to load franchises", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredFranchises = franchises.filter(f =>
    f.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFranchise = () => {
    setModalMode('add');
    setNewFranchise({
      businessName: '',
      ownerName: '',
      email: '',
      phone: '',
      territory: [],
      pincodes: [],
      address: '',
      status: 'Active'
    });
    setTerritoryInput('');
    setPincodeInput('');
    setIsModalOpen(true);
  };

  const handleEditFranchise = (f: Franchise) => {
    setModalMode('edit');
    setNewFranchise(f);
    setTerritoryInput(f.territory.join(', '));
    setPincodeInput(f.pincodes.join(', '));
    setIsModalOpen(true);
  };

  const handleSaveFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFranchise.businessName || !newFranchise.ownerName || !newFranchise.email) {
      setToast({ message: "Please fill in required fields", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const territories = territoryInput.split(',').map(t => t.trim()).filter(t => t);
      const pincodes = pincodeInput.split(',').map(p => p.trim()).filter(p => p);

      if (modalMode === 'add') {
        await api.createAdminUser({
          name: newFranchise.ownerName,
          email: newFranchise.email,
          mobile: newFranchise.phone,
          role: 'Franchise Owner',
          username: newFranchise.businessName,
          status: 'Active'
        });
        await fetchFranchises();
        setToast({ message: 'New Field Manager added successfully', type: 'success' });
      } else {
        await api.toggleAdminUserStatus(newFranchise.id!, newFranchise.status === 'Active');
        setFranchises(prev => prev.map(f => f.id === newFranchise.id ? {
          ...f,
          ...newFranchise,
          territory: territories,
          pincodes: pincodes
        } as Franchise : f));
        setToast({ message: 'Field Manager updated', type: 'success' });
      }

      setIsModalOpen(false);
    } catch (error) {
      setToast({ message: 'Operation failed.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateBlockAction = (f: Franchise) => {
    const action = f.status === 'Active' ? 'disable' : 'activate';
    setConfirmModal({
      isOpen: true,
      action,
      franchiseId: f.id,
      franchiseName: f.businessName
    });
  };

  const confirmBlockAction = async () => {
    if (confirmModal.franchiseId && confirmModal.action) {
      setIsSubmitting(true);
      try {
        await api.toggleAdminUserStatus(confirmModal.franchiseId, confirmModal.action === 'activate');
        setFranchises(prev => prev.map(f =>
          f.id === confirmModal.franchiseId ? { ...f, status: confirmModal.action === 'activate' ? 'Active' : 'Disabled' } : f
        ));
        setToast({
          message: `${confirmModal.franchiseName} updated.`,
          type: 'success'
        });
      } catch (e) {
        setToast({ message: 'Action failed.', type: 'error' });
      } finally {
        setIsSubmitting(false);
        setConfirmModal({ isOpen: false, action: null, franchiseId: null, franchiseName: '' });
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Field Manager Management</h2>
          <p className="text-sm text-gray-500 mt-1">Oversee field managers and territories.</p>
        </div>
        <button
          onClick={handleAddFranchise}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Add Field Manager
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name, Business or ID..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium">Synchronizing field managers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Field Manager Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Territory</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Shops</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Performance</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFranchises.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={f.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-gray-200 mr-3 border border-gray-200" />
                        <div>
                          <div className="font-bold text-sm text-gray-900">{f.businessName}</div>
                          <div className="text-xs text-gray-500">{f.ownerName} • {f.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {f.territory.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs border border-gray-200">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {f.totalShops} Active Shops
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{f.totalOrders.toLocaleString()} Orders</div>
                      <div className="text-xs text-gray-500">${f.earnings.toLocaleString()} Revenue</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${f.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onViewFranchise(f)}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditFranchise(f)}
                          className="p-1.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => initiateBlockAction(f)}
                          className={`p-1.5 rounded transition-colors ${f.status === 'Active' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'
                            }`}
                          title={f.status === 'Active' ? "Disable" : "Activate"}
                        >
                          {f.status === 'Active' ? <Ban size={16} /> : <Briefcase size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Franchise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{modalMode === 'add' ? 'Add New Field Manager' : 'Edit Field Manager'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveFranchise} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. North City Ops"
                  value={newFranchise.businessName}
                  onChange={e => setNewFranchise({ ...newFranchise, businessName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. John Doe"
                  value={newFranchise.ownerName}
                  onChange={e => setNewFranchise({ ...newFranchise, ownerName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="email@example.com"
                    value={newFranchise.email}
                    onChange={e => setNewFranchise({ ...newFranchise, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="+1 234..."
                    value={newFranchise.phone}
                    onChange={e => setNewFranchise({ ...newFranchise, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Office Address"
                  value={newFranchise.address}
                  onChange={e => setNewFranchise({ ...newFranchise, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Territory Names</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="Comma separated"
                    value={territoryInput}
                    onChange={e => setTerritoryInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincodes</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="Comma separated"
                    value={pincodeInput}
                    onChange={e => setPincodeInput(e.target.value)}
                  />
                </div>
              </div>
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white text-gray-900"
                    value={newFranchise.status}
                    onChange={(e) => setNewFranchise({ ...newFranchise, status: e.target.value as any })}
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center"
                >
                  <Save size={18} className="mr-2" /> {modalMode === 'add' ? 'Save' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block/Activate Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${confirmModal.action === 'disable' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                {confirmModal.action === 'disable' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {confirmModal.action === 'disable' ? 'Disable Field Manager?' : 'Activate Field Manager?'}
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to {confirmModal.action} <span className="font-bold">{confirmModal.franchiseName}</span>?
                {confirmModal.action === 'disable' ? ' They will lose access to the dashboard immediately.' : ' They will regain access to the dashboard.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, franchiseId: null, franchiseName: '' })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockAction}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors shadow-sm ${confirmModal.action === 'disable' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
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

export default AllFranchises;
