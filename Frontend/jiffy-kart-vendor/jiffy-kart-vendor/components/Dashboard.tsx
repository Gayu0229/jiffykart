
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShoppingBag,
  MessageSquare,
  Star,
  Package,
  TrendingUp,
  ChevronRight,
  Info,
  Activity,
  Zap,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layout,
  DollarSign,
  User,
  Star as StarIcon
} from 'lucide-react';
import { View } from '../types';
import { api } from '../vendor.api';

const revenueData: { name: string; value: number }[] = [];

const categoryData: { name: string; value: number; color: string }[] = [];

interface ActivityItem {
  id: string;
  type: 'order' | 'customer' | 'support' | 'payment' | 'stock';
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  iconBg: string;
  isLive?: boolean;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [];

interface DashboardProps {
  onViewChange: (view: View) => void;
  newOrdersCount?: number;
  activeOrdersCount?: number;
  openTicketsCount?: number;
  totalOrdersCount?: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  onViewChange,
  newOrdersCount = 0,
  activeOrdersCount = 0,
  openTicketsCount = 0,
  totalOrdersCount = 0
}) => {
  const [liveSales, setLiveSales] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const reviews = await api.fetchShopReviews();
        setRecentReviews(reviews.slice(0, 5).map(r => ({
          id: r.id,
          userName: r.userName || 'User',
          rating: r.rating || 0,
          comment: r.comment || '',
          productName: r.productName || r.product?.name || 'Product',
          date: r.date ? new Date(r.date).toLocaleDateString() : 'Recent'
        })));
      } catch (e) {
        console.error("Failed to load dashboard review data", e);
      }
    };
    loadData();
  }, []);


  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Overview</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Live Syncing Active</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Last 30 days</span>
          <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Sales Total"
          value={`₹${liveSales.toLocaleString()}`}
          change="+10.4%"
          isPositive={true}
          subtitle="Total revenue earned"
          badge="LIVE"
          pulsing={isPulsing}
        />
        <SummaryCard
          title="Average Order Value"
          value="₹0"
          change="0%"
          isPositive={true}
          subtitle="Value per transaction"
        />
        <SummaryCard
          title="Total Orders"
          value={totalOrdersCount.toString()}
          isPositive={true}
          change="+12%"
          subtitle="All-time transactions"
          badge="LIVE"
          pulsing={isPulsing}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-[32px] border border-gray-50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-2 bg-brand-50 rounded-xl">
                <Layout className="w-4 h-4 text-brand-500" />
              </div>
            </div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Revenue Analytics</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Performance index</p>
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-400 border border-gray-100 rounded-lg px-2 py-1 bg-gray-50/50">
                <span>Yearly</span>
                <ChevronRight className="w-3 h-3 rotate-90" />
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                  />
                  <Bar dataKey="value" fill="#0F172A" radius={[10, 10, 10, 10]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-gray-50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Product Matrix</h4>
              <button className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">Full Analytics</button>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="h-[220px] w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-4 pr-4">
                <div className="grid grid-cols-3 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2 mb-2">
                  <span>Category</span>
                  <span className="text-center">Units</span>
                  <span className="text-right">Revenue</span>
                </div>
                {categoryData.map((item) => (
                  <div key={item.name} className="grid grid-cols-3 items-center group cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-all">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[11px] font-bold text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 text-center">{item.value}</span>
                    <span className="text-[11px] font-black text-gray-900 text-right">₹{(item.value * 280).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Feedback Section */}
          <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-gray-50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Recent Feedback</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Direct customer sentiment</p>
              </div>
              <button className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">All Reviews</button>
            </div>

            <div className="space-y-4">
              {recentReviews.length === 0 ? (
                <div className="bg-gray-50/50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
                  <StarIcon className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No recent reviews yet</p>
                </div>
              ) : (
                recentReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50/30 rounded-2xl border border-gray-50 hover:border-brand-500/20 transition-all flex items-start space-x-4">
                    <div className="bg-brand-900 text-brand-500 p-2.5 rounded-xl flex flex-col items-center">
                      <span className="text-xs font-black leading-none">{review.rating}</span>
                      <StarIcon className="w-2.5 h-2.5 fill-current mt-1" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h5 className="text-[11px] font-black text-gray-900 uppercase">{review.productName}</h5>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{review.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium line-clamp-2 italic">"{review.comment}"</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">By {review.userName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Recent Activity Section */}
          <div className="bg-white p-5 sm:p-8 rounded-[32px] border border-gray-50 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-brand-900 rounded-2xl shadow-lg">
                  <Activity className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Recent Activity</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Global stream</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="space-y-6 relative">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <Activity className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No recent activity</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 group cursor-pointer animate-in slide-in-from-top-4 fade-in duration-500">
                    <div className={`p-3 rounded-2xl ${activity.iconBg} shrink-0 group-hover:scale-110 transition-all shadow-sm relative`}>
                      {activity.icon}
                      {activity.isLive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-bold text-gray-700 leading-tight group-hover:text-brand-900 transition-colors">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-brand-500 hover:text-brand-900 transition-all shadow-sm">
              View Activity Log
            </button>
          </div>

          <StatusCard
            title="Active Orders"
            subtitle="Current orders in processing flow."
            value={activeOrdersCount.toString()}
            label="Unfulfilled"
            icon={<ShoppingBag className="w-4 h-4 text-brand-600" />}
            iconBg="bg-brand-50"
            onClick={() => onViewChange(View.ORDERS)}
          />
          <StatusCard
            title="New Order"
            subtitle="Urgent incoming orders."
            value={newOrdersCount.toString()}
            label="Awaiting Action"
            icon={<Zap className={`w-4 h-4 ${newOrdersCount > 0 ? 'text-brand-600 animate-pulse' : 'text-gray-400'}`} />}
            iconBg={newOrdersCount > 0 ? 'bg-indigo-50' : 'bg-gray-50'}
            onClick={() => onViewChange(View.NEW_ORDERS)}
          />
          <StatusCard
            title="Support"
            subtitle="Customer queries queue."
            value={openTicketsCount.toString()}
            label="New Tickets"
            icon={<MessageSquare className="w-4 h-4 text-brand-700" />}
            iconBg="bg-indigo-50"
            onClick={() => onViewChange(View.SUPPORT)}
          />
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtitle: string;
  badge?: string;
  pulsing?: boolean;
}> = ({ title, value, change, isPositive, subtitle, badge, pulsing }) => (
  <div className={`bg-white p-6 sm:p-8 rounded-[32px] border border-gray-50 shadow-sm relative overflow-hidden transition-all duration-700 ${pulsing ? 'scale-[1.02] ring-2 ring-brand-500 shadow-xl' : 'hover:shadow-lg hover:-translate-y-1'}`}>
    <div className="flex justify-between items-start mb-6">
      <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{title}</span>
      {badge && (
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${badge === 'LIVE' ? 'bg-brand-500 text-white animate-pulse shadow-lg' : 'bg-gray-100 text-gray-500'
          }`}>
          {badge}
        </span>
      )}
    </div>
    <div className="flex items-baseline space-x-3">
      <h3 className={`text-3xl sm:text-4xl font-black text-gray-900 transition-colors ${pulsing ? 'text-brand-500' : ''}`}>{value}</h3>
    </div>
    <div className="flex items-center space-x-3 mt-4">
      <span className={`flex items-center text-[11px] font-black px-2 py-1 rounded-xl shadow-sm ${isPositive ? 'bg-indigo-50 text-brand-600' : 'bg-red-50 text-red-600'
        }`}>
        {change}
      </span>
      <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</span>
    </div>
  </div>
);

const StatusCard: React.FC<{
  title: string;
  subtitle: string;
  value: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick: () => void;
}> = ({ title, subtitle, value, label, icon, iconBg, onClick }) => (
  <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between h-[150px] md:h-[160px] group hover:shadow-xl hover:border-brand-500/20 transition-all cursor-pointer">
    <div className="flex items-start justify-between">
      <div className="flex space-x-4">
        <div className={`${iconBg} p-3 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
          {icon}
        </div>
        <div>
          <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">{title}</h5>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>
      <Info className="w-4 h-4 text-gray-200 group-hover:text-brand-500 transition-colors" />
    </div>
    <div className="flex items-end justify-between mt-4">
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl md:text-4xl font-black text-gray-900">{value}</span>
        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="text-[10px] font-black text-gray-900 uppercase flex items-center group/btn hover:text-brand-500 transition-colors tracking-widest"
      >
        Explore <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export default Dashboard;
