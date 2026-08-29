
import React from 'react';
import { Search, Filter, MoreVertical, Mail, Phone, MapPin } from 'lucide-react';

import { api } from '../vendor.api';
import { Loader2 } from 'lucide-react';

const Customers: React.FC = () => {
  const [customersList, setCustomersList] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await api.fetchCustomers();
        setCustomersList(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCustomers();
  }, []);

  const filteredCustomers = customersList.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Customer Management</h2>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#72EB6C] outline-none shadow-sm"
            />
          </div>
          <button className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-gray-600 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">No customers found</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-8 py-6">Customer</th>
                <th className="px-8 py-6 text-center">Orders</th>
                <th className="px-8 py-6 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <img src={c.avatar || `https://picsum.photos/id/${(c.id % 50) + 100}/100/100`} className="w-10 h-10 rounded-2xl object-cover" alt="" />
                      <span className="text-sm font-bold text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-gray-700 text-center">{c.orderCount}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-4">
                      <span className="text-sm font-black text-gray-900">₹{c.totalSpent.toLocaleString()}</span>
                      <button className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Customers;
