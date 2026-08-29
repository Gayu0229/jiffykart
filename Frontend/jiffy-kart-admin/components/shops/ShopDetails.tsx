
import React, { useState, useEffect } from 'react';
import {
   ArrowLeft, MapPin, Mail, Phone, Calendar, ShieldCheck, AlertTriangle,
   ExternalLink, Ban, CheckCircle, Package, ShoppingBag,
   DollarSign, TrendingUp, BarChart2, PieChart
} from 'lucide-react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { VendorFull, Product, Order } from '../../types';
import { api } from '../../services/api';

interface ShopDetailsProps {
   shop: VendorFull;
   onBack: () => void;
}

const ShopDetails: React.FC<ShopDetailsProps> = ({ shop: initialShop, onBack }) => {
   const [currentShop, setCurrentShop] = useState<VendorFull>(initialShop);
   const [activeTab, setActiveTab] = useState<'Overview' | 'Analytics' | 'Products' | 'Orders' | 'Financials'>('Overview');
   const [shopProducts, setShopProducts] = useState<Product[]>([]);
   const [shopOrders, setShopOrders] = useState<Order[]>([]);
   const salesChartData: any[] = []; // No historical chart data from backend yet

   useEffect(() => {
      const fetchShopData = async () => {
         try {
            const [allProducts, allOrders] = await Promise.all([
               api.getAllProducts(),
               api.getOrders()
            ]);
            setShopProducts(allProducts.filter((p: Product) => p.shopName === currentShop.shopName || p.vendorId === currentShop.id));
            setShopOrders(allOrders.filter((o: Order) => o.vendorName === currentShop.shopName));
         } catch (e) {
            console.error('Failed to load shop details data:', e);
         }
      };
      fetchShopData();
   }, [currentShop.id]);

   const handleApprove = async () => {
      if (window.confirm(`Approve shop "${currentShop.shopName}" and make it Live?`)) {
         try {
            await api.approveShop(currentShop.id);
            setCurrentShop(prev => ({ ...prev, status: 'Active' }));
            alert("Shop approved successfully.");
         } catch (error) {
            alert("Failed to approve shop.");
         }
      }
   };

   const handleHold = async () => {
      const reason = window.prompt(`Put shop "${currentShop.shopName}" on Hold? Reason:`, "Performance issues");
      if (reason !== null) {
         try {
            await api.rejectShop(currentShop.id, reason);
            setCurrentShop(prev => ({ ...prev, status: 'Inactive' }));
            alert("Shop put on hold.");
         } catch (error) {
            alert("Failed to update status.");
         }
      }
   };

   const handleBlock = async () => {
      if (window.confirm(`Are you sure you want to BLOCK "${currentShop.shopName}"? This allows no operations.`)) {
         try {
            await api.blockVendor(currentShop.id);
            setCurrentShop(prev => ({ ...prev, status: 'Blocked' }));
            alert("Shop blocked successfully.");
         } catch (error) {
            alert("Failed to block shop.");
         }
      }
   };

   const handleUnblock = async () => {
      if (window.confirm(`Unblock shop "${currentShop.shopName}" and restore access?`)) {
         try {
            await api.unblockVendor(currentShop.id);
            setCurrentShop(prev => ({ ...prev, status: 'Active' }));
            alert("Shop unblocked successfully.");
         } catch (error) {
            alert("Failed to unblock shop.");
         }
      }
   };

   const handleDownloadStatement = () => {
      if (shopOrders.length === 0) {
         alert("No orders found to generate statement.");
         return;
      }

      const headers = ['Order ID', 'Customer', 'Amount', 'Status', 'Date'];
      const rows = shopOrders.map(o => [
         o.id,
         o.customerName,
         o.totalAmount.toString(),
         o.status,
         o.orderDate
      ]);

      const csvContent = [
         headers.join(','),
         ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `statement_${currentShop.shopName.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleReleasePayout = () => {
      alert("Manual payout release initiated. This will be processed within 24-48 hours.");
   };

   const renderOverview = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 w-full relative">
               <img src={currentShop.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
               <div className="absolute top-4 right-4">
                  <button className="px-3 py-1 bg-white/90 backdrop-blur rounded text-xs font-medium text-gray-700 shadow-sm hover:bg-white flex items-center">
                     Visit Live Store <ExternalLink size={12} className="ml-1" />
                  </button>
               </div>
            </div>
            <div className="px-6 pb-6 relative">
               <div className="flex flex-col md:flex-row items-start md:items-end -mt-10 mb-4">
                  <img src={currentShop.avatarUrl} alt={currentShop.shopName} className="w-20 h-20 rounded-xl border-4 border-white shadow-md bg-white object-cover" />
                  <div className="md:ml-4 mt-2 md:mt-0 flex-1">
                     <h2 className="text-2xl font-bold text-gray-900">{currentShop.shopName}</h2>
                     <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>ID: {currentShop.id}</span>
                        <span>•</span>
                        <span>{currentShop.businessType}</span>
                     </div>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                     <button
                        onClick={handleApprove}
                        disabled={currentShop.status === 'Active'}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center transition-colors ${currentShop.status === 'Active'
                           ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                           : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                           }`}
                     >
                        <CheckCircle size={16} className="mr-2" /> {currentShop.status === 'Active' ? 'Live' : 'Approve'}
                     </button>
                     <button
                        onClick={handleHold}
                        className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-100 flex items-center transition-colors"
                     >
                        <AlertTriangle size={16} className="mr-2" /> Hold
                     </button>
                     {currentShop.status === 'Blocked' ? (
                        <button
                           onClick={handleUnblock}
                           className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center transition-colors"
                        >
                           <ShieldCheck size={16} className="mr-2" /> Unblock
                        </button>
                     ) : (
                        <button
                           onClick={handleBlock}
                           className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center transition-colors"
                        >
                           <Ban size={16} className="mr-2" /> Block
                        </button>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div className="space-y-3">
                     <h3 className="text-xs font-bold text-gray-500 uppercase">Contact Information</h3>
                     <div className="flex items-center text-sm text-gray-700">
                        <ShieldCheck size={16} className="mr-3 text-gray-400" />
                        {currentShop.ownerName} (Owner)
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                        <Phone size={16} className="mr-3 text-gray-400" />
                        {currentShop.phone}
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                        <Mail size={16} className="mr-3 text-gray-400" />
                        {currentShop.email}
                     </div>
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-xs font-bold text-gray-500 uppercase">Shop Details</h3>
                     <div className="flex items-center text-sm text-gray-700">
                        <MapPin size={16} className="mr-3 text-gray-400" />
                        {currentShop.address}
                     </div>
                     <div className="flex items-center text-sm text-gray-700">
                        <Calendar size={16} className="mr-3 text-gray-400" />
                        Joined {currentShop.joinedDate}
                     </div>
                     <div className="flex items-center text-sm">
                        <div className={`px-2 py-0.5 rounded text-xs font-medium border ${currentShop.kycStatus === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                           }`}>
                           KYC: {currentShop.kycStatus}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Quick Stats Row */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
               <div className="text-gray-500 text-xs font-bold uppercase mb-1">Products</div>
               <div className="text-2xl font-bold text-gray-900">{currentShop.productsLive}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
               <div className="text-gray-500 text-xs font-bold uppercase mb-1">Orders</div>
               <div className="text-2xl font-bold text-gray-900">{currentShop.ordersHandled}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
               <div className="text-gray-500 text-xs font-bold uppercase mb-1">Rating</div>
               <div className="text-2xl font-bold text-gray-900 flex items-center">
                  {currentShop.rating} <span className="text-yellow-400 text-lg ml-1">★</span>
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
               <div className="text-gray-500 text-xs font-bold uppercase mb-1">Revenue</div>
               <div className="text-2xl font-bold text-gray-900">${currentShop.totalRevenue.toLocaleString()}</div>
            </div>
         </div>
      </div>
   );

   const renderAnalytics = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-primary" /> Sales Trend
               </h3>
               <div className="h-64 flex items-center justify-center">
                  {salesChartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesChartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                           <Tooltip />
                           <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.1} />
                        </AreaChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="text-gray-400 text-sm italic text-center"><p>No sales data yet</p><p className="text-xs mt-1">Data will populate as orders are placed</p></div>
                  )}
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart2 size={20} className="mr-2 text-green-600" /> Orders Trend
               </h3>
               <div className="h-64 flex items-center justify-center">
                  {salesChartData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesChartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                           <Tooltip />
                           <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="text-gray-400 text-sm italic text-center"><p>No order data yet</p><p className="text-xs mt-1">Data will populate as orders are placed</p></div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );

   const renderProducts = () => (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Products Listed ({shopProducts.length})</h3>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {shopProducts.map((p) => (
                     <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 flex items-center">
                           <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover border border-gray-200 mr-3" />
                           <div>
                              <div className="text-sm font-medium text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500">ID: {p.id}</div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">${p.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.stock}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 text-xs rounded-full font-medium ${p.status === 'Live' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>{p.status}</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );

   const renderOrders = () => (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Recent Orders</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {shopOrders.length > 0 ? shopOrders.map((o) => (
                     <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-primary">{o.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{o.customerName}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">${o.totalAmount}</td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{o.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{o.orderDate}</td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent orders found.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );

   const renderFinancials = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
               <DollarSign size={20} className="mr-2 text-green-600" /> Financial Summary
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Total Earnings</span>
                  <span className="text-lg font-bold text-gray-900">${currentShop.totalRevenue.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Pending Payout</span>
                  <span className="text-lg font-bold text-orange-600">$1,250.00</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Commission Paid</span>
                  <span className="text-lg font-bold text-gray-900">$12,400.00</span>
               </div>
               <button
                  onClick={handleDownloadStatement}
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium mt-4 hover:bg-indigo-700 transition-colors"
               >
                  View Detailed Statement
               </button>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bank Account</h3>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
               <div className="font-bold text-blue-900">{currentShop.bankDetails?.bankName}</div>
               <div className="font-mono text-blue-800 mt-1">{currentShop.bankDetails?.accountNumber}</div>
               <div className="text-xs text-blue-600 mt-2">IFSC: {currentShop.bankDetails?.ifsc}</div>
               <div className="text-xs text-blue-600">Holder: {currentShop.bankDetails?.accountName}</div>
            </div>
            <button
               onClick={handleReleasePayout}
               className="mt-4 text-sm text-primary font-medium hover:underline"
            >
               Release Next Payout
            </button>
         </div>
      </div>
   );

   return (
      <div className="space-y-6">
         {/* Nav */}
         <div className="flex items-center gap-4 mb-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Shop Details</h1>
         </div>

         {/* Tabs */}
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-2">
            <div className="flex overflow-x-auto">
               {(['Overview', 'Analytics', 'Products', 'Orders', 'Financials'] as const).map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                  >
                     {tab}
                  </button>
               ))}
            </div>
         </div>

         {/* Content */}
         <div className="min-h-[400px]">
            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'Analytics' && renderAnalytics()}
            {activeTab === 'Products' && renderProducts()}
            {activeTab === 'Orders' && renderOrders()}
            {activeTab === 'Financials' && renderFinancials()}
         </div>
      </div>
   );
};

export default ShopDetails;
