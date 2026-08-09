
import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Download,
  Loader2,
  Calendar,
  X,
  CheckCircle2,
  Truck,
  RotateCcw,
  Package,
  Clock,
  Eye,
  FileText,
  Hash,
  RefreshCcw,
  CalendarDays,
  ChevronRight,
  IndianRupee,
  Zap
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../vendor.api';

interface OrdersProps {
  orders: Order[];
  onSelectOrder: (id: string) => void;
}

const Orders: React.FC<OrdersProps> = ({ orders, onSelectOrder }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await api.exportOrders();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'order_registry.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export registry:', error);
      alert('Failed to export order registry. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeQuickRange, setActiveQuickRange] = useState<string | null>(null);

  const startPickerRef = useRef<HTMLInputElement>(null);
  const endPickerRef = useRef<HTMLInputElement>(null);

  const applyQuickRange = (range: '7D' | 'THIS_MONTH' | 'LAST_MONTH') => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    let start = '';
    let end = formatDate(today);

    switch (range) {
      case '7D':
        start = formatDate(new Date(y, m, d - 7));
        setActiveQuickRange('7D');
        break;
      case 'THIS_MONTH':
        start = formatDate(new Date(y, m, 1));
        setActiveQuickRange('THIS_MONTH');
        break;
      case 'LAST_MONTH':
        start = formatDate(new Date(y, m - 1, 1));
        end = formatDate(new Date(y, m, 0));
        setActiveQuickRange('LAST_MONTH');
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const normalizeDateStr = (dateInput: string) => {
    if (!dateInput) return '';
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    try {
      const parts = dateInput.replace(',', '').split(/\s+/);
      if (parts.length === 3) {
        const m = months[parts[0].substring(0, 3)];
        const d = parts[1].padStart(2, '0');
        const y = parts[2];
        if (m && d && y) return `${y}-${m}-${d}`;
      }
    } catch (e) { }
    return '';
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(order => {
      const matchesTab = activeTab === 'All' || order.orderStatus === activeTab;
      if (!matchesTab) return false;
      const matchesSearch = order.id.toLowerCase().includes(q) || order.customerName.toLowerCase().includes(q);
      if (q && !matchesSearch) return false;
      const orderDateNormalized = normalizeDateStr(order.date);
      if (startDate && orderDateNormalized < startDate) return false;
      if (endDate && orderDateNormalized > endDate) return false;
      return true;
    });
  }, [orders, activeTab, searchQuery, startDate, endDate]);

  const clearAllFilters = () => {
    setActiveTab('All');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setActiveQuickRange(null);
  };

  const renderStatusBadge = (status: Order['orderStatus']) => {
    const config: any = {
      'DELIVERED': { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
      'OUT_FOR_DELIVERY': { color: 'bg-brand-50 text-brand-700 border-brand-100', icon: <Truck className="w-3.5 h-3.5" /> },
      'PACKED_READY': { color: 'bg-purple-50 text-purple-700 border-purple-100', icon: <Package className="w-3.5 h-3.5" /> },
      'ORDER_CONFIRMED': { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Zap className="w-3.5 h-3.5" /> },
      'ORDER_RECEIVED': { color: 'bg-orange-50 text-orange-700 border-orange-100 shadow-sm', icon: <Clock className="w-3.5 h-3.5" /> },
      'REJECTED': { color: 'bg-rose-50 text-rose-700 border-rose-100', icon: <RotateCcw className="w-3.5 h-3.5" /> },
      'Pending': { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: <Clock className="w-3.5 h-3.5" /> },
    };
    const current = config[status || 'Pending'] || config['Pending'];
    return (
      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${current.color}`}>
        {current.icon}
        <span>{status?.replace('_', ' ')}</span>
      </span>
    );
  };

  // Removed calculateTotal function as it was causing discrepancy by adding hardcoded tax/shipping.
  // We now use order.totalPrice directly from the data.

  const stats = {
    total: filteredOrders.length,
    delivered: filteredOrders.filter(o => o.orderStatus === 'DELIVERED').length,
    shipped: filteredOrders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length,
    returns: filteredOrders.filter(o => o.orderStatus === 'REJECTED' || o.orderStatus === 'CANCELLED').length
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory Archive</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-brand-900 tracking-tighter">Order History</h2>
          <p className="text-xs md:text-sm font-medium text-gray-500 mt-1">Review and manage past transactions.</p>
        </div>

        <div className="flex items-center gap-2 md:space-x-3">
          {(activeTab !== 'All' || searchQuery !== '' || startDate !== '') && (
            <button onClick={clearAllFilters} className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors group">
              <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 md:space-x-3 bg-white border border-gray-100 px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] text-brand-900 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isExporting ? 'Generating...' : 'Export Registry'}</span>
            <span className="sm:hidden">{isExporting ? '...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <MiniMetric label="Matches" value={stats.total.toString()} icon={<Hash className="w-4 h-4" />} color="bg-brand-900" />
        <MiniMetric label="Delivered" value={stats.delivered.toString()} icon={<CheckCircle2 className="w-4 h-4" />} color="bg-brand-600" />
        <MiniMetric label="Transit" value={stats.shipped.toString()} icon={<Truck className="w-4 h-4" />} color="bg-brand-400" />
        <MiniMetric label="Returns" value={stats.returns.toString()} icon={<RotateCcw className="w-4 h-4" />} color="bg-rose-500" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm space-y-4 md:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 md:gap-6">
          <div className="flex bg-gray-50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
            {['All', 'ORDER_RECEIVED', 'ORDER_CONFIRMED', 'PACKED_READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 md:px-6 py-2.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-brand-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'
                  }`}
              >
                {tab === 'All' ? tab : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Client, SKU..."
              className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-gray-50/50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <th className="px-8 py-5 border-b border-gray-100">Order Token</th>
                <th className="px-8 py-5 border-b border-gray-100">Timestamp</th>
                <th className="px-8 py-5 border-b border-gray-100">Client</th>
                <th className="px-8 py-5 border-b border-gray-100 text-right">Grand Total</th>
                <th className="px-8 py-5 border-b border-gray-100">Status</th>
                <th className="px-8 py-5 border-b border-gray-100">Payment</th>
                <th className="px-8 py-5 border-b border-gray-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group" onClick={() => onSelectOrder(order.id)}>
                  <td className="px-8 py-6">
                    <span className="text-xs font-black text-brand-900 whitespace-nowrap">#{order.id}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black text-gray-800 uppercase">{order.date}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-900 flex items-center justify-center overflow-hidden border border-gray-100">
                        {order.customerAvatar ? (
                          <img src={order.customerAvatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-[10px] font-black text-white">{order.customerName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-gray-900">{order.customerName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-black text-gray-900">₹{(order.totalPrice || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6">{renderStatusBadge(order.orderStatus)}</td>
                  <td className="px-8 py-6 text-[10px] font-black uppercase text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className={`w-1 h-1 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-brand-500' : 'bg-rose-500'}`}></div>
                      <span>{order.paymentStatus}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectOrder(order.id); }}
                      className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-900 hover:bg-white transition-all shadow-sm"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-black text-brand-900">#{order.id}</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{order.date}</p>
              </div>
              {renderStatusBadge(order.orderStatus)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-900 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                  {order.customerAvatar ? (
                    <img src={order.customerAvatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-[10px] font-black text-white">{order.customerName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-black text-gray-900">{order.customerName}</span>
              </div>
              <span className="text-base font-black text-gray-900">₹{(order.totalPrice || 0).toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 border-dashed">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-brand-500' : 'bg-rose-500'}`}></div>
                <span className="text-[10px] font-black uppercase text-gray-500">{order.paymentStatus}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-brand-600 uppercase tracking-wide">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-sm font-black text-gray-900">No orders found</h3>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MiniMetric: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-5 rounded-[24px] border border-gray-50 shadow-sm flex items-center space-x-5 group hover:shadow-lg transition-all">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <h4 className="text-2xl font-black text-brand-900 tracking-tighter">{value}</h4>
    </div>
  </div>
);

export default Orders;
