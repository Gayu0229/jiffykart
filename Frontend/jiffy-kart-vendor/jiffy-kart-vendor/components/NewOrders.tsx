
import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Package
} from 'lucide-react';
import { Order, View } from '../types';

interface NewOrdersProps {
  orders: Order[];
  onAcceptOrder: (id: string) => void;
  onRejectOrder: (id: string) => void;
  onSelectOrder: (id: string) => void;
  onViewChange: (view: View) => void;
}

const NewOrders: React.FC<NewOrdersProps> = ({ orders, onAcceptOrder, onRejectOrder, onSelectOrder, onViewChange }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ msg: string, type: 'success' | 'reject' } | null>(null);

  const handleAccept = (id: string) => {
    setProcessingId(id);
    setTimeout(() => {
      onAcceptOrder(id);
      setProcessingId(null);
      setLastAction({ msg: `Order ${id} accepted and moved to processing.`, type: 'success' });
      // Automatically navigate to order history to see the accepted order
      setTimeout(() => {
        onViewChange(View.ORDERS);
      }, 800);
    }, 1200);
  };

  const handleReject = (id: string) => {
    if (confirm('Are you sure you want to decline this order?')) {
      onRejectOrder(id);
      setLastAction({ msg: `Order ${id} has been declined.`, type: 'reject' });
    }
  };

  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {lastAction && (
        <div className={`fixed top-24 right-8 z-[60] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 ${lastAction.type === 'success' ? 'bg-brand-900 text-white border-l-4 border-brand-500' : 'bg-red-50 text-red-900 border-l-4 border-red-500'
          }`}>
          {lastAction.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-brand-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-bold">{lastAction.msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Live Incoming Feed</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">New Orders</h2>
          <p className="text-sm text-gray-500 font-medium">Respond within 5 minutes to maintain your ranking.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Awaiting</p>
            <p className="text-xl font-black text-gray-900 leading-none mt-1">{orders.length}</p>
          </div>
          <div className="w-px h-8 bg-gray-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Avg. Time</p>
            <p className="text-xl font-black text-gray-900 leading-none mt-1">1.4m</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 border border-dashed border-gray-200 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900">All caught up!</h3>
              <p className="text-sm text-gray-500 font-medium">No pending orders at the moment. Good job!</p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden transition-all duration-500 flex flex-col md:flex-row relative group hover:shadow-xl hover:border-gray-200 ${processingId === order.id ? 'opacity-50 pointer-events-none scale-[0.98]' : ''
                }`}
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500"></div>
              <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.id}</span>
                    <div className="flex items-center space-x-1 text-[10px] font-black text-orange-500 uppercase"><Clock className="w-3 h-3" /><span>Just now</span></div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-brand-600 transition-colors">{order.customerName}</h3>
                  <div className="flex items-center space-x-1.5 mt-2 text-xs text-gray-500 font-medium"><MapPin className="w-3.5 h-3.5" /><span>{order.address}</span></div>
                </div>
              </div>
              <div className="p-8 flex-1 bg-gray-50/30 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ordered Items</h4>
                  <p className="text-xs font-bold text-gray-700">
                    {order.items && order.items.length > 0 ? order.items[0].name : 'Generic Store Items'}
                    {order.itemsCount > 1 ? ` (+${order.itemsCount - 1} more)` : ''}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-black text-gray-900">₹{order.totalPrice.toLocaleString()}</p>
                  <button onClick={() => onSelectOrder(order.id)} className="text-xs font-black text-gray-400 hover:text-gray-900 uppercase">Details →</button>
                </div>
              </div>
              <div className="p-8 md:w-1/4 bg-white flex flex-col justify-center space-y-3">
                <button
                  onClick={() => handleAccept(order.id)}
                  disabled={!!processingId}
                  className="w-full bg-brand-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Accept Order</span>
                </button>
                <button onClick={() => handleReject(order.id)} className="w-full bg-gray-50 text-gray-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-500">Decline</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewOrders;
