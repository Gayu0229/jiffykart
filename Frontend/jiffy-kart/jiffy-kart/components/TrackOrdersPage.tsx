
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Package, MapPin, ChevronRight, Star,
  Bike, RotateCw, CheckCircle, Clock, ShoppingBag,
  Search, ExternalLink, Filter, HelpCircle, AlertCircle, RotateCcw, AlertTriangle
} from 'lucide-react';
import { useNavigation, useAuth, useCart } from '../hooks';
import { ApiService } from '../services/apiService';
import { Order } from '../types';
import { Skeleton } from './Skeleton';
import { ComplaintModal } from './ComplaintModal';
import { OrderDetailModal } from './OrderDetailModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { createSocketClient } from '../services/socket';

export const TrackOrdersPage: React.FC = () => {
  const { navigate, goBack } = useNavigation();
  const { user, isLoggedIn } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Delivered' | 'Cancelled'>('All');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedOrderIdForHelp, setSelectedOrderIdForHelp] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [returnOrderTarget, setReturnOrderTarget] = useState<Order | null>(null);

  const handleGetHelp = (orderId: string) => {
    setSelectedOrderIdForHelp(orderId);
    setIsHelpModalOpen(true);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
  };

  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('login', { redirect: 'track-orders' });
      return;
    }

    const fetchOrders = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await ApiService.getOrders();
        setOrders(data);
      } catch (error) {
        console.error("Orders fetch error", error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    fetchOrders();

    // Listen for real-time status updates
    const socketClient = createSocketClient((topic) => {
      if (topic.includes('/queue/notifications')) {
        console.log('Real-time order update received, refreshing list...');
        fetchOrders(false); // Refresh without showing full-page loader
      }
    });

    return () => {
      socketClient.deactivate();
    };
  }, [user, isLoggedIn, navigate]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Active') return matchesSearch && ['Order Received', 'Order Confirmed', 'Packed & Ready', 'Out for Delivery'].includes(o.status);
    return matchesSearch && o.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Out for Delivery': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Packed & Ready': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Order Confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Order Received': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return <CheckCircle size={14} className="stroke-[2.5px]" />;
      case 'Out for Delivery': return <Bike size={14} className="animate-bounce" />;
      case 'Cancelled': return <AlertCircle size={14} />;
      case 'Packed & Ready': return <Package size={14} />;
      case 'Order Confirmed': return <Clock size={14} />;
      case 'Order Received': return <ShoppingBag size={14} />;
      default: return <Package size={14} />;
    }
  };

  const renderReturnStatus = (order: Order) => {
    if (!order.returnRequest) return null;
    const rr = order.returnRequest;

    const getStatusStyle = (status: string) => {
      switch (status.toUpperCase()) {
        case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'COMPLETED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
      }
    };

    return (
      <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 animate-fade-in relative overflow-hidden group/return">
        <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover/return:opacity-10 transition-opacity">
            <RotateCw size={60} strokeWidth={4} />
        </div>
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover/return:rotate-12">
              <RotateCw size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Return Tracker</p>
              <h5 className="text-sm font-black text-slate-900 tracking-tight">{rr.type} Request</h5>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(rr.status)}`}>
            {rr.status}
          </span>
        </div>
        
        <div className="space-y-3 relative z-10">
           <div className="flex items-center gap-3 py-2.5 px-3 bg-white/50 rounded-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <p className="text-xs text-slate-600 font-bold">Reason: <span className="text-slate-500 ml-1 font-medium">{rr.reason}</span></p>
           </div>
           
           {rr.rejectionReason && (
             <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 animate-slide-up">
               <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle size={14} className="text-rose-500" />
                 <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Rejection Note</p>
               </div>
               <p className="text-xs text-rose-700 font-medium leading-relaxed italic">"{rr.rejectionReason}"</p>
             </div>
           )}
           
           <div className="pt-4 border-t border-slate-200/50 flex flex-col gap-3">
             {rr.status !== 'COMPLETED' && (
               <button
                 onClick={() => navigate('tracking', { order })}
                 className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary transition shadow-xl shadow-slate-900/10 active:scale-95"
               >
                 <Bike size={18} /> Track Return Progress
               </button>
             )}
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-right">Requested on: {new Date(rr.createdAt).toLocaleDateString()}</p>
           </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        <Skeleton className="h-12 w-48 mb-4" />
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full" />)}
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-[2.5rem]" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-32 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm md:static md:bg-transparent md:border-none md:shadow-none">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={goBack}
                className="p-2.5 hover:bg-slate-100 rounded-full transition text-slate-600 bg-white shadow-sm border border-slate-100"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Orders</h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Purchase History & Status</p>
              </div>
            </div>

            <div className="relative group w-full md:w-80">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search for items or shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {['All', 'Active', 'Delivered', 'Cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={`shrink-0 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${activeFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-primary'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-soft flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner relative">
              <Package size={48} className="text-slate-200" />
              <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                <Filter size={16} className="text-primary" />
              </div>
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">No orders found</h4>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed max-w-xs mx-auto">
              {searchQuery || activeFilter !== 'All'
                ? "Try changing your filters or search terms to see results."
                : "You haven't placed any orders yet. Time to explore local stores!"}
            </p>
            <button
              onClick={() => navigate('home')}
              className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase transition shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 tracking-widest"
            >
              Find Stores
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 group-hover:scale-105 transition-transform duration-500">
                        <img
                          src={order.shop_image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80'}
                          alt={order.shop_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-2xl group-hover:text-primary transition-colors tracking-tight truncate">{order.shop_name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                          <MapPin size={14} className="text-primary" /> {order.shop_location}
                        </p>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] mt-2">#{order.id}</p>
                      </div>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                      <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full border shadow-sm ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-4 font-black tracking-widest uppercase flex items-center md:justify-end gap-1.5">
                        <Clock size={12} /> {order.date}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100 flex flex-col gap-4">
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-600">
                          <span className="truncate pr-4">{typeof item === 'string' ? item : item.product.name}</span>
                          <span className="text-[10px] text-slate-300 uppercase shrink-0">Qty: {typeof item === 'string' ? 1 : item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-slate-100/50 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                      <span className="font-black text-xl text-slate-900">₹{order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleGetHelp(order.id)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-indigo-50 px-4 py-2 rounded-xl transition"
                      >
                        <HelpCircle size={14} /> Get Help
                      </button>
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 px-4 py-2 rounded-xl transition"
                      >
                        <ExternalLink size={14} /> View Details
                      </button>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      {['Order Confirmed', 'Packed & Ready', 'Out for Delivery'].includes(order.status) ? (
                        <button
                          onClick={() => navigate('tracking', { order })}
                          className="px-10 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary transition shadow-xl shadow-slate-900/10 flex items-center gap-3 active:scale-95"
                        >
                          <Bike size={20} className="animate-pulse" /> Track Live
                        </button>
                      ) : (order.status === 'Delivered' || order.status === 'Completed') && !order.returnRequest ? (
                        <>
                          <button
                            onClick={() => setReturnOrderTarget(order)}
                            className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 font-black text-xs uppercase tracking-widest rounded-2xl hover:border-rose-300 hover:text-rose-600 transition shadow-sm flex items-center gap-2.5 active:scale-95"
                          >
                            <RotateCcw size={18} /> Return
                          </button>
                          <button
                            onClick={() => navigate('details', { shopId: order.shop_id })}
                            className="px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition shadow-xl shadow-primary/20 flex items-center gap-2.5 active:scale-95"
                          >
                            <RotateCw size={18} /> Reorder
                          </button>
                        </>
                      ) : order.status === 'Cancelled' ? (
                        <button
                          onClick={() => navigate('details', { shopId: order.shop_id })}
                          className="px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95"
                        >
                          <RotateCw size={20} /> Reorder
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {renderReturnStatus(order)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isHelpModalOpen && (
        <ComplaintModal
          onClose={() => setIsHelpModalOpen(false)}
          initialOrderId={selectedOrderIdForHelp || undefined}
        />
      )}

      {selectedOrderForDetails && (
        <OrderDetailModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {returnOrderTarget && (
        <ReturnRequestModal
          order={returnOrderTarget}
          onClose={() => setReturnOrderTarget(null)}
          onSuccess={() => setReturnOrderTarget(null)}
        />
      )}
    </div>
  );
};
