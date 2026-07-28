import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import {
   TrendingUp, Users, ShoppingBag, Star,
   ArrowUpRight, ArrowDownRight, Search, Filter, Download, Calendar,
   Award, Zap, Clock, ChevronDown, Eye, Loader2
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from '../../services/api';
import { VendorFull } from '../../types';

const getVendorTier = (revenue: number) => {
   if (revenue > 1000000) return { label: 'Elite', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Award };
   if (revenue > 100000) return { label: 'Pro', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Zap };
   return { label: 'Starter', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users };
};

const CustomTooltip = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl text-sm z-50">
            <p className="font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100">{label || payload[0].payload.name || payload[0].payload.shopName}</p>
            {payload.map((entry: any, index: number) => (
               <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                  <span className="text-gray-500 capitalize">{entry.name}:</span>
                  <span className="font-bold text-gray-700">
                     {entry.name.includes('Revenue') ? `₹${entry.value.toLocaleString()}` : entry.value}
                  </span>
               </div>
            ))}
         </div>
      );
   }
   return null;
};

interface VendorPerformanceProps {
   onViewVendor?: (vendor: VendorFull) => void;
}

const VendorPerformance: React.FC<VendorPerformanceProps> = ({ onViewVendor }) => {
   const [vendors, setVendors] = useState<VendorFull[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'rating'>('revenue');
   const [selectedCategory, setSelectedCategory] = useState('All');
   const [timeRange, setTimeRange] = useState('This Month');
   const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const fetchVendors = async () => {
         setLoading(true);
         try {
            const data = await api.getVendors();
            setVendors(data);
         } catch (err) {
            console.error("Failed to fetch vendors for performance", err);
         } finally {
            setLoading(false);
         }
      };
      fetchVendors();
   }, []);

   useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsTimeDropdownOpen(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const enrichedVendors = useMemo(() => {
      return vendors.map(v => ({
         ...v,
         growthRate: 0, // Backend currently doesn't provide growth
         deliverySuccess: 100, // Placeholder
         fulfillmentTime: 0
      }));
   }, [vendors]);

   const filteredVendors = useMemo(() => {
      return enrichedVendors.filter(v => {
         const matchesSearch = v.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
         return matchesSearch;
      }).sort((a, b) => {
         if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
         if (sortBy === 'orders') return b.ordersHandled - a.ordersHandled;
         return b.rating - a.rating;
      });
   }, [enrichedVendors, searchTerm, sortBy]);

   const timeScale = 1; // Real data doesn't need scaling yet

   // Aggregate Stats
   const totalRevenue = enrichedVendors.reduce((acc, v) => acc + v.totalRevenue, 0) * timeScale;
   const totalOrders = Math.floor(enrichedVendors.reduce((acc, v) => acc + v.ordersHandled, 0) * timeScale);
   const avgRating = enrichedVendors.reduce((acc, v) => acc + v.rating, 0) / enrichedVendors.length;
   const avgFulfillment = enrichedVendors.reduce((acc, v) => acc + v.fulfillmentTime, 0) / enrichedVendors.length;

   // Data for Scatter Chart
   const scatterData = enrichedVendors.map(v => ({
      x: Math.floor(v.ordersHandled * timeScale),
      y: v.rating,
      z: v.totalRevenue * timeScale,
      name: v.shopName,
      deliverySuccess: v.deliverySuccess, // Passed for tooltip
      fill: v.rating >= 4.5 ? '#10B981' : v.rating >= 4.0 ? '#4F46E5' : '#F59E0B'
   }));

   const handleExportReport = () => {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text(`Vendor Performance Report - ${timeRange}`, 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Summary
      doc.setFontSize(10);
      doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, 40);
      doc.text(`Total Orders: ${totalOrders.toLocaleString()}`, 80, 40);
      doc.text(`Avg Rating: ${avgRating.toFixed(1)}/5.0`, 140, 40);

      const tableColumn = ["Vendor", "Category", "Revenue", "Orders", "Rating", "Del. Rate", "Growth"];
      const tableRows = filteredVendors.map(v => [
         v.shopName,
         (v as any).category || 'N/A',
         `₹${(v.totalRevenue * timeScale).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
         Math.floor(v.ordersHandled * timeScale),
         v.rating,
         `${v.deliverySuccess.toFixed(1)}%`,
         `${v.growthRate > 0 ? '+' : ''}${v.growthRate.toFixed(1)}%`
      ]);

      autoTable(doc, {
         head: [tableColumn],
         body: tableRows,
         startY: 50,
         theme: 'grid',
         headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`vendor_performance_${new Date().toISOString().split('T')[0]}.pdf`);
   };

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-gray-500 font-medium font-serif italic text-lg">Analyzing real-time vendor metrics...</p>
         </div>
      );
   }

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-2xl font-bold text-gray-900">Vendor Performance</h1>
               <p className="text-sm text-gray-500 mt-1">Analyze partner metrics, revenue streams, and operational quality.</p>
            </div>
            <div className="flex gap-3 relative" ref={dropdownRef}>
               <div className="relative">
                  <button
                     onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                     className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                  >
                     <Calendar size={16} className="text-gray-500" />
                     <span>{timeRange}</span>
                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isTimeDropdownOpen && (
                     <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in duration-200">
                        {['This Week', 'This Month', 'This Quarter', 'This Year'].map((range) => (
                           <button
                              key={range}
                              onClick={() => {
                                 setTimeRange(range);
                                 setIsTimeDropdownOpen(false);
                              }}
                              className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${timeRange === range ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-700'
                                 }`}
                           >
                              {range}
                           </button>
                        ))}
                     </div>
                  )}
               </div>
               <button
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-md shadow-indigo-200 active:scale-95"
               >
                  <Download size={16} /> Export Report
               </button>
            </div>
         </div>

         {/* KPI Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Revenue */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                     <TrendingUp size={22} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                     <ArrowUpRight size={12} className="mr-1" /> +12.5%
                  </span>
               </div>
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Revenue</h3>
               <div className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>

            {/* Orders */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <ShoppingBag size={22} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                     <ArrowUpRight size={12} className="mr-1" /> +8.2%
                  </span>
               </div>
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Orders</h3>
               <div className="text-2xl font-bold text-gray-900 mt-1">{totalOrders.toLocaleString()}</div>
            </div>

            {/* Rating */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                     <Star size={22} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                     Avg
                  </span>
               </div>
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Quality Score</h3>
               <div className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
                  {avgRating.toFixed(1)} <span className="text-sm text-gray-400 font-normal ml-1">/ 5.0</span>
               </div>
            </div>

            {/* Fulfillment */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                     <Clock size={22} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                     <ArrowDownRight size={12} className="mr-1" /> -4.1%
                  </span>
               </div>
               <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg Fulfillment</h3>
               <div className="text-2xl font-bold text-gray-900 mt-1">{avgFulfillment.toFixed(1)} Days</div>
            </div>
         </div>

         {/* Charts Row */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top Vendors Chart */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Top Earners</h3>
                  <button className="text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-1 rounded transition-colors">View All</button>
               </div>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={filteredVendors.slice(0, 5).map(v => ({ ...v, scaledRevenue: v.totalRevenue * timeScale }))} layout="vertical" margin={{ left: 0, right: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis
                           dataKey="shopName"
                           type="category"
                           width={100}
                           tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                           axisLine={false}
                           tickLine={false}
                        />
                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                        <Bar dataKey="scaledRevenue" radius={[0, 4, 4, 0]} barSize={20} name="Revenue">
                           {filteredVendors.slice(0, 5).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : index === 1 ? '#6366F1' : '#818CF8'} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Performance Matrix */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Volume vs. Quality Matrix</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                     <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> High Perf</div>
                     <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></span> Stable</div>
                     <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Attention</div>
                  </div>
               </div>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="x" name="Orders" tick={{ fontSize: 12, fill: '#94a3b8' }} label={{ value: 'Order Volume', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis type="number" dataKey="y" name="Rating" domain={[3, 5]} tick={{ fontSize: 12, fill: '#94a3b8' }} label={{ value: 'Rating', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                        <ZAxis type="number" dataKey="z" range={[100, 800]} name="Revenue" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <Scatter name="Vendors" data={scatterData} shape="circle" />
                     </ScatterChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Main Data Table */}
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="relative flex-1 w-full sm:max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                     type="text"
                     placeholder="Search vendors by name or owner..."
                     className="w-full pl-10 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex gap-3 items-center w-full sm:w-auto overflow-x-auto">
                  <div className="relative">
                     <select
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm cursor-pointer"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                     >
                        <option value="All">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home">Home</option>
                     </select>
                     <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
                  <div className="relative">
                     <select
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm cursor-pointer font-medium"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                     >
                        <option value="revenue">Sort: Revenue</option>
                        <option value="orders">Sort: Orders</option>
                        <option value="rating">Sort: Rating</option>
                     </select>
                     <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                     <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tier</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfillment</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Growth</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredVendors.map((vendor) => {
                        const scaledRevenue = vendor.totalRevenue * timeScale;
                        const scaledOrders = Math.floor(vendor.ordersHandled * timeScale);
                        const tier = getVendorTier(scaledRevenue);
                        const TierIcon = tier.icon;
                        return (
                           <tr key={vendor.id} className="hover:bg-gray-50/80 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                    <div className="relative">
                                       <img src={vendor.avatarUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm group-hover:border-indigo-300 transition-colors" />
                                       <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${vendor.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                    </div>
                                    <div className="ml-3">
                                       <div className="text-sm font-bold text-gray-900">{vendor.shopName}</div>
                                       <div className="text-xs text-gray-500">{vendor.ownerName}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wide ${tier.color}`}>
                                    <TierIcon size={10} className="mr-1" />
                                    {tier.label}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                    {(vendor as any).category || 'General'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-900">
                                 ₹{scaledRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                 {scaledOrders.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                    <span className="text-sm font-bold text-gray-900 mr-1">{vendor.rating}</span>
                                    <div className="flex text-amber-400">
                                       <Star size={12} fill="currentColor" />
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="w-full max-w-[100px] group/tooltip relative">
                                    <div className="flex justify-between text-xs mb-1">
                                       <span className="font-medium text-gray-700">{vendor.deliverySuccess.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                       <div
                                          className={`h-1.5 rounded-full ${vendor.deliverySuccess > 95 ? 'bg-emerald-500' : vendor.deliverySuccess > 90 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                          style={{ width: `${vendor.deliverySuccess}%` }}
                                       ></div>
                                    </div>
                                    {/* Simple CSS Tooltip for quick feedback */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                       Delivery Rate: {vendor.deliverySuccess.toFixed(1)}%
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex items-center text-xs font-bold ${vendor.growthRate >= 0 ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded' : 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded'
                                    }`}>
                                    {vendor.growthRate >= 0 ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                                    {Math.abs(vendor.growthRate).toFixed(1)}%
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                 <button
                                    onClick={() => onViewVendor?.(vendor)}
                                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                                    title="View Details"
                                 >
                                    <Eye size={18} />
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>

            {/* Empty State */}
            {filteredVendors.length === 0 && (
               <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <Search size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No vendors found</h3>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria.</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default VendorPerformance;
