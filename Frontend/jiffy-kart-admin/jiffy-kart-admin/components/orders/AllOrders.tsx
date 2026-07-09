
import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Truck, MapPin, CheckCircle, X, Save, User, Package, Loader2 } from 'lucide-react';
import { Order, DeliveryPartner } from '../../types';
import { api } from '../../services/api';

interface AllOrdersProps {
  onViewOrder: (orderId: string) => void;
  filterStatus?: string;
  allowedPincodes?: string[];
}

const AllOrders: React.FC<AllOrdersProps> = ({ onViewOrder, filterStatus, allowedPincodes }) => {
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filterStatus || 'All');

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [editForm, setEditForm] = useState({ status: '', paymentStatus: '' });
  const [assignForm, setAssignForm] = useState({ partnerId: '' });

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, []);

  useEffect(() => {
    if (filterStatus) {
      setStatusFilter(filterStatus);
    } else {
      setStatusFilter('All');
    }
  }, [filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      setToast({ message: "Failed to load orders", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const data = await api.getDeliveryPartners();
      setPartners(data || []);
    } catch (err) {
      console.error("Failed to load partners", err);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const availableOrders = allowedPincodes
    ? orders.filter(order => allowedPincodes.includes(order.pincode))
    : orders;

  const filteredOrders = availableOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({ status: order.status, paymentStatus: order.paymentMode });
    setIsEditModalOpen(true);
  };

  const handleAssignDelivery = (order: Order) => {
    setSelectedOrder(order);
    setAssignForm({ partnerId: '' });
    setIsAssignModalOpen(true);
  };

  const saveOrderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      setIsSubmitting(true);
      try {
        await api.updateOrderStatus(selectedOrder.id, editForm.status as any);
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: editForm.status as any } : o));
        setToast({ message: `Order ${selectedOrder.id} updated successfully.`, type: 'success' });
        setIsEditModalOpen(false);
      } catch (e) {
        setToast({ message: 'Failed to update order.', type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const saveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder && assignForm.partnerId) {
      setIsSubmitting(true);
      try {
        // Mocking the assignment as we don't have a specific backend endpoint for it yet
        // but it will update status to Processing if it was Pending.
        if (selectedOrder.status === 'Pending') {
          await api.updateOrderStatus(selectedOrder.id, 'Processing');
          setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'Processing' } : o));
        }

        const partner = partners.find(p => p.id === assignForm.partnerId);
        setToast({ message: `Order assigned to ${partner?.name || 'Partner'}.`, type: 'success' });
        setIsAssignModalOpen(false);
      } catch (e) {
        setToast({ message: 'Failed to assign partner.', type: 'error' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
      case 'ORDER_CONFIRMED':
      case 'PACKED_READY': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'RETURNED': return 'bg-purple-100 text-purple-800';
      case 'ORDER_RECEIVED':
      case 'ORDER_PLACED':
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <X size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Order ID, Customer or Vendor..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              className="w-full md:w-auto appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="ORDER_RECEIVED">Pending</option>
              <option value="ORDER_CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKED_READY">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium">Retrieving orders...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pincode</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit">
                          <MapPin size={10} className="mr-1" /> {order.pincode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.orderDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewOrder(order.id)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            title="Modify Status"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleAssignDelivery(order)}
                            className="p-1.5 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors"
                            title="Assign Delivery"
                          >
                            <Truck size={16} />
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
              {filteredOrders.map((order) => (
                <div key={order.id} className="py-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-sm font-black text-indigo-600 block">#{order.id}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{order.orderDate}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Customer</p>
                      <p className="text-xs font-bold text-slate-800">{order.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Vendor</p>
                      <p className="text-xs font-bold text-slate-800">{order.vendorName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Pincode</p>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <MapPin size={10} /> {order.pincode}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Amount</p>
                      <p className="text-sm font-black text-slate-900">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onViewOrder(order.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                    >
                      <Eye size={14} /> Details
                    </button>
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleAssignDelivery(order)}
                      className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
                    >
                      <Truck size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No orders found matching your criteria.
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Status Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Update Order Status</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveOrderUpdate} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Status:</span>
                  <span className={`font-medium px-2 py-0.5 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                </div>
              </div>

              {selectedOrder.status?.toUpperCase() !== 'CANCELLED' && selectedOrder.status?.toUpperCase() !== 'DELIVERED' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ORDER_RECEIVED">Pending (Received)</option>
                    <option value="ORDER_CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="PACKED_READY">Packed & Ready</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                  <X size={14} />
                  This order is in a terminal state ({selectedOrder.status}) and cannot be modified further.
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedOrder.status?.toUpperCase() === 'CANCELLED' || selectedOrder.status?.toUpperCase() === 'DELIVERED'}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium flex items-center justify-center shadow-sm transition-opacity ${selectedOrder.status?.toUpperCase() === 'CANCELLED' || selectedOrder.status?.toUpperCase() === 'DELIVERED' ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-primary hover:bg-indigo-700'}`}
                >
                  <Save size={18} className="mr-2" /> Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Delivery Modal */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Assign Delivery Partner</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveAssignment} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Package size={20} className="text-blue-600" />
                <div>
                  <div className="text-sm font-bold text-blue-900">{selectedOrder.id}</div>
                  <div className="text-xs text-blue-700">{selectedOrder.customerName} • {selectedOrder.pincode}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Partner</label>
                <div className="relative">
                  <select
                    value={assignForm.partnerId}
                    onChange={(e) => setAssignForm({ ...assignForm, partnerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Partner</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} ({partner.status}) - {partner.zone}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Only showing partners in related zones.</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center shadow-sm"
                >
                  <Truck size={18} className="mr-2" /> Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOrders;
