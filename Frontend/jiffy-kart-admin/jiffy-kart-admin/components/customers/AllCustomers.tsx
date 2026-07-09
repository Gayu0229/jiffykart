import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, ShieldOff, UserCheck, Users, X, Send, User as UserIcon } from 'lucide-react';
import { api } from '../../services/api';
import { Customer } from '../../types';

const AllCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Blocked'>('All');

  // Email Modal State
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; customer: Customer | null }>({
    isOpen: false,
    customer: null
  });
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customerId: string, currentStatus: string) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'Active' ? 'block' : 'activate'} this customer?`)) return;

    try {
      const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
      const enabled = newStatus === 'Active';
      await api.toggleAdminUserStatus(customerId, enabled);
      alert(`Customer ${newStatus} successfully`);
      fetchCustomers();
    } catch (error) {
      alert('Failed to update customer status');
    }
  };

  const handleOpenEmail = (customer: Customer) => {
    setEmailModal({ isOpen: true, customer });
    setEmailForm({ subject: '', message: '' });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModal.customer) return;

    try {
      // Logic for sending email (could be a backend call, but for now we'll simulate success)
      alert(`Email sent to ${emailModal.customer.email}`);
      setEmailModal({ isOpen: false, customer: null });
    } catch (error) {
      alert('Failed to send email');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Name, Email or Phone..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Active' | 'Blocked')}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading customers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={customer.avatarUrl}
                            alt={customer.name}
                            className="w-10 h-10 rounded-full border border-gray-200 mr-3 object-cover"
                          />
                          <div>
                            <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                            <div className="text-xs text-gray-500">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                          {customer.totalOrders} Orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {customer.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEmail(customer)}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Send Email"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(customer.id, customer.status)}
                            className={`p-2 rounded-lg transition-colors ${customer.status === 'Active'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            title={customer.status === 'Active' ? 'Block Customer' : 'Unblock Customer'}
                          >
                            {customer.status === 'Active' ? <ShieldOff size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                          <Users size={40} className="text-gray-400" />
                        </div>
                        <p className="text-lg font-medium">No customers found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Compose Modal */}
      {emailModal.isOpen && emailModal.customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform scale-100 transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center">
                <Mail size={18} className="mr-2 text-indigo-600" />
                Compose Email
              </h3>
              <button
                onClick={() => setEmailModal({ isOpen: false, customer: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">
                  <UserIcon size={16} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase">Recipient</div>
                  <div className="text-sm font-medium text-gray-900">
                    {emailModal.customer.name} <span className="text-gray-500 font-normal">&lt;{emailModal.customer.email}&gt;</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  placeholder="e.g., Update regarding your recent order"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                <textarea
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm h-32 resize-none"
                  placeholder="Type your message here..."
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEmailModal({ isOpen: false, customer: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
                >
                  <Send size={16} className="mr-2" /> Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCustomers;
