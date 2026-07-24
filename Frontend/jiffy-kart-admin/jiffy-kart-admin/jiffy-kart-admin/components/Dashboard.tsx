
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Clock,
  AlertCircle,
  ClipboardList,
  Headphones,
  Loader2,
  Plus,
  UserPlus,
  Settings,
  ArrowRight,
  IndianRupee
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import StatCard from './StatCard';
import AIInsightsPanel from './AIInsightsPanel';
import { TOP_CATEGORIES_LIST } from '../constants';
import {
  TimeRange, DashboardStats, SalesDataPoint,
  CategoryDataPoint, TrafficSource, Vendor
} from '../types';
import { api } from '../services/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.WEEK);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficSource[]>([]);
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      setLoading(true);
      try {
        const [
          dashboardStats,
          sData,
          cData,
          tData,
          vData
        ] = await Promise.all([
          api.getStats(),
          api.getSalesData(),
          api.getCategoryData(),
          api.getTrafficData(),
          api.getTopVendors()
        ]);

        setStats(dashboardStats);
        setSalesData(sData);
        setCategoryData(cData);
        setTrafficData(tData);
        setTopVendors(vData);
      } catch (error) {
        console.error("Failed to load dashboard components", error);
        setStats({
          totalOrders: 0, totalRevenue: 0, activeVendors: 0, activeProducts: 0,
          pendingVendors: 0, pendingProducts: 0, ordersProcessing: 0,
          supportTickets: 0, totalCustomers: 0, totalDeliveryPartners: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAllDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">Synchronizing platform data...</p>
      </div>
    );
  }

  return (
    <>
      {/* AI Insights Section */}
      <AIInsightsPanel stats={stats} topVendors={topVendors} />

      {/* Quick Actions Bar */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('Add Product')}
            className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all group"
          >
            <div className="flex items-center">
              <div className="p-2 bg-white/10 rounded-lg mr-3">
                <Plus size={20} />
              </div>
              <span className="font-bold text-sm">Add New Product</span>
            </div>
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </button>

          <button
            onClick={() => onNavigate('Pending Vendor Approvals')}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 text-gray-800 rounded-xl hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mr-3">
                <UserPlus size={20} />
              </div>
              <span className="font-bold text-sm">Invite Vendor</span>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => onNavigate('Vendor Payouts')}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 text-gray-800 rounded-xl hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg mr-3">
                <IndianRupee size={20} />
              </div>
              <span className="font-bold text-sm">Release Payouts</span>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => onNavigate('Admin Accounts')}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 text-gray-800 rounded-xl hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center">
              <div className="p-2 bg-gray-50 text-gray-600 rounded-lg mr-3">
                <Settings size={20} />
              </div>
              <span className="font-bold text-sm">System Settings</span>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
        <StatCard
          title="Total Orders Today"
          value={stats.totalOrders}
          description="Orders received across all vendors"
          icon={ShoppingCart}
          colorClass="text-blue-600 bg-blue-100"
        />
        <StatCard
          title="Total Revenue Today"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          description="Revenue generated today"
          icon={IndianRupee}
          colorClass="text-green-600 bg-green-100"
        />
        <StatCard
          title="Active Vendors"
          value={stats.activeVendors}
          description="Total verified sellers on the platform"
          icon={Users}
          colorClass="text-purple-600 bg-purple-100"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          description="Total registered users"
          icon={Users}
          colorClass="text-indigo-600 bg-indigo-100"
        />
        <StatCard
          title="Delivery Partners"
          value={stats.totalDeliveryPartners.toLocaleString()}
          description="Active fleet members"
          icon={Package}
          colorClass="text-orange-600 bg-orange-100"
        />
        <StatCard
          title="Total Products Live"
          value={stats.activeProducts.toLocaleString()}
          description="All approved products active"
          icon={Package}
          colorClass="text-orange-600 bg-orange-100"
        />
        <StatCard
          title="Pending Vendor Approvals"
          value={stats.pendingVendors}
          description="Vendors waiting review"
          icon={Clock}
          colorClass="text-yellow-600 bg-yellow-100"
        />
        <StatCard
          title="Pending Product Approvals"
          value={stats.pendingProducts}
          description="Products waiting quality review"
          icon={ClipboardList}
          colorClass="text-pink-600 bg-pink-100"
        />
        <StatCard
          title="Orders in Processing"
          value={stats.ordersProcessing}
          description="Orders awaiting dispatch"
          icon={AlertCircle}
          colorClass="text-cyan-600 bg-cyan-100"
        />
        <StatCard
          title="Support Tickets Pending"
          value={stats.supportTickets}
          description="Support issues"
          icon={Headphones}
          colorClass="text-red-600 bg-red-100"
        />
      </div>

      {/* Analytics Section Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Sales Analytics</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {Object.values(TimeRange).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                  <Area type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm italic">No sales data available for this period</div>
            )}
          </div>
        </div>

        {/* Category Contribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Category Share</h2>
          <div className="h-[220px] w-full relative flex items-center justify-center">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-sm text-gray-500">Total</span>
                  <div className="font-bold text-xl text-gray-800">100%</div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm italic">No category data</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 3).map((cat) => (
              <div key={cat.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="font-medium text-gray-800">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Traffic & Top Cats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Traffic Sources</h2>
          <div className="h-[200px] w-full flex items-center justify-center">
            {trafficData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="source" type="category" axisLine={false} tickLine={false} width={60} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm italic">No traffic data recorded</div>
            )}
          </div>
        </div>

        {/* Marketplace Status */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Live Marketplace Data</h2>
          <p className="text-gray-600 max-w-sm">
            All dashboard metrics are now synchronizing in real-time with the central JiffyKart backend.
            Historical data and category performance will populate as the platform gathers more traffic.
          </p>
        </div>
      </div>

      {/* Bottom: Best Vendors Table */}
      {topVendors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">Best Performing Vendors</h2>
            <button
              onClick={() => onNavigate('All Vendors')}
              className="text-sm text-primary font-medium hover:text-primary/80"
            >
              View All Vendors &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Successful Deliveries %</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-8 w-8 rounded-full object-cover mr-3 border border-gray-200" src={vendor.avatarUrl} alt={vendor.name} />
                        <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {vendor.orders.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <span className="text-yellow-400 mr-1">★</span>
                        {vendor.rating}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2.5 mr-2 inline-block align-middle">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${vendor.deliverySuccess}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{vendor.deliverySuccess}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
