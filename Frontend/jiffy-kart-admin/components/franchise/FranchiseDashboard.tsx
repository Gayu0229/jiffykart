
import React, { useState, useMemo, useEffect } from 'react';
import { Store, Users, ShoppingBag, DollarSign, Clock, TrendingUp, Search, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatCard from '../StatCard';
import { VendorFull } from '../../types';
import { api } from '../../services/api';

const FranchiseDashboard: React.FC = () => {
  const [allShops, setAllShops] = useState<VendorFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const stats = {
    activeShops: allShops.filter(s => s.status === 'Active').length,
    totalVendors: allShops.length,
    ordersToday: 0,
    earningsToday: 0,
    pendingApprovals: 0
  };
  // No historical chart data from backend yet
  const salesChartData: any[] = [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState<keyof VendorFull>('ordersHandled');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchShops = async () => {
      setIsLoading(true);
      try {
        const shops = await api.getVendors();
        setAllShops(shops);
      } catch (e) {
        console.error('Failed to load shops:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShops();
  }, []);

  const franchiseShops = allShops;

  const filteredAndSortedShops = useMemo(() => {
    let result = franchiseShops.filter(shop => {
      const matchesSearch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || shop.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [franchiseShops, searchTerm, filterStatus, sortField, sortDirection]);

  const handleSort = (field: keyof VendorFull) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for metrics usually
    }
  };

  const SortIcon = ({ field }: { field: keyof VendorFull }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Welcome back, West Coast Distributors</h1>
        <p className="text-indigo-100 opacity-90">Here's what's happening in your territory today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Shops"
          value={stats.activeShops}
          description="Shops currently live"
          icon={Store}
          colorClass="text-blue-600 bg-blue-100"
        />
        <StatCard
          title="Vendors Managed"
          value={stats.totalVendors}
          description="Total vendors under you"
          icon={Users}
          colorClass="text-purple-600 bg-purple-100"
        />
        <StatCard
          title="Orders Today"
          value={stats.ordersToday}
          description="Processed in your region"
          icon={ShoppingBag}
          colorClass="text-green-600 bg-green-100"
        />
        <StatCard
          title="Earnings Today"
          value={`$${stats.earningsToday.toLocaleString()}`}
          description="Your commission share"
          icon={DollarSign}
          colorClass="text-indigo-600 bg-indigo-100"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          description="Shops/KYC waiting"
          icon={Clock}
          colorClass="text-orange-600 bg-orange-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-primary" /> Territory Revenue Trend
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fillOpacity={0.2} fill="#4F46E5" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm italic text-center"><p>No revenue data yet</p><p className="text-xs mt-1">Data will appear as orders are placed</p></div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <ShoppingBag size={20} className="mr-2 text-green-600" /> Orders by Day
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm italic text-center"><p>No order data yet</p><p className="text-xs mt-1">Data will appear as orders are placed</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Shops Under Franchise Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Store size={20} className="mr-2 text-indigo-600" /> Shops Under Field Manager
          </h3>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shops..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-gray-200 text-gray-900 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('shopName')}
                >
                  <div className="flex items-center gap-1">
                    Shop Name <SortIcon field="shopName" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('ownerName')}
                >
                  <div className="flex items-center gap-1">
                    Vendor Name <SortIcon field="ownerName" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('ordersHandled')}
                >
                  <div className="flex items-center gap-1">
                    Total Orders <SortIcon field="ordersHandled" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status <SortIcon field="status" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedShops.length > 0 ? filteredAndSortedShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={shop.avatarUrl} alt="" className="w-8 h-8 rounded-lg bg-gray-200 mr-3 object-cover" />
                      <span className="font-medium text-gray-900 text-sm">{shop.shopName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{shop.ownerName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{shop.ordersHandled.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${shop.status === 'Active' ? 'bg-green-100 text-green-800' :
                        shop.status === 'Blocked' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="View Details">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No shops found matching filters.
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

export default FranchiseDashboard;
