
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Printer, MessageCircle, User,
  Truck, CheckCircle2, MapPin, Phone, Mail, Package,
  CreditCard, ExternalLink, Search, Tag,
  Clock, Info, ShieldCheck, ChevronRight,
  Loader2, X, ReceiptText, Bell, AlertTriangle
} from 'lucide-react';
import { Order } from '../types';

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
  onAccept: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
}



const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onBack, onAccept, onUpdateStatus }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Lazy Loading States
  const [hasLoadedItems, setHasLoadedItems] = useState(false);
  const [isItemsSectionVisible, setIsItemsSectionVisible] = useState(false);
  const itemsRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoadedItems) {
          setIsItemsSectionVisible(true);
          // Simulate a network delay for loading items
          setTimeout(() => {
            setHasLoadedItems(true);
          }, 800);
        }
      },
      { threshold: 0.1 }
    );

    if (itemsRef.current) {
      observer.observe(itemsRef.current);
    }

    return () => {
      if (itemsRef.current) {
        observer.unobserve(itemsRef.current);
      }
    };
  }, [hasLoadedItems]);

  const handleRejectOrder = async () => {
    setIsLoading(true);
    try {
      await onUpdateStatus('REJECTED');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error("Failed to reject order", e);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    setIsLoading(true);
    try {
      await onUpdateStatus(status);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error("Failed to update status", e);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals from items
  const items = order.items || [];
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = order.totalPrice || subtotal;
  const tax = subtotal * 0.18; // 18% GST
  const otherFees = total > (subtotal + tax) ? total - subtotal - tax : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-24 right-8 z-[100] bg-emerald-600 text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center space-x-4 border-l-4 border-white animate-in slide-in-from-right duration-500">
          <div className="bg-white/20 p-2 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">Action Complete</p>
            <p className="text-[10px] font-bold text-emerald-50 mt-0.5">Order status has been updated successfully.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="ml-4 text-emerald-100 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showErrorToast && (
        <div className="fixed top-24 right-8 z-[100] bg-rose-600 text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center space-x-4 border-l-4 border-white animate-in slide-in-from-right duration-500">
          <div className="bg-white/20 p-2 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">Update Failed</p>
            <p className="text-[10px] font-bold text-rose-50 mt-0.5">There was an error updating the order status.</p>
          </div>
          <button onClick={() => setShowErrorToast(false)} className="ml-4 text-rose-100 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Actions - Hidden on Print */}
      <div className="flex items-center justify-between print-hidden">
        <button onClick={onBack} className="flex items-center space-x-2 text-gray-800 hover:text-black font-bold transition-all group">
          <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-lg">Back to list</span>
        </button>
        <div className="flex items-center space-x-3">
          <a
            href="tel:+919876543210"
            className="flex items-center space-x-2 bg-white border border-gray-100 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Phone className="w-4 h-4 text-brand-500" />
            <span>Call Customer</span>
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-brand-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="invoice-container bg-white rounded-[40px] shadow-xl border border-gray-100 p-10 space-y-12 relative overflow-hidden">
        {order.orderStatus === 'ORDER_RECEIVED' && (
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-1.5 rounded-lg animate-pulse">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Action Required: New Order Received</span>
            </div>
            <div className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Please review and confirm to proceed</div>
          </div>
        )}
        {/* Status Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-gray-50 pb-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order #{order.id}</h2>
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                order.orderStatus === 'ORDER_RECEIVED' ? 'bg-orange-100 text-orange-700 animate-pulse border border-orange-200' :
                  order.orderStatus === 'ORDER_CONFIRMED' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    order.orderStatus === 'PACKED_READY' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      order.orderStatus === 'OUT_FOR_DELIVERY' ? 'bg-brand-100 text-brand-700 border border-brand-200' :
                        'bg-gray-100 text-gray-700'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-500' :
                  order.orderStatus === 'ORDER_RECEIVED' ? 'bg-orange-500' :
                    order.orderStatus === 'ORDER_CONFIRMED' ? 'bg-blue-500' :
                      order.orderStatus === 'PACKED_READY' ? 'bg-purple-500' :
                        order.orderStatus === 'OUT_FOR_DELIVERY' ? 'bg-brand-500' :
                          'bg-gray-500'
                  }`} />
                {order.orderStatus?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Placed on {order.date} at 14:24 PM</p>
          </div>

          <div className="flex flex-col items-end gap-3 print-hidden">
            {order.orderStatus === 'ORDER_RECEIVED' && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleStatusUpdate('ORDER_CONFIRMED')}
                  disabled={isLoading}
                  className="bg-brand-500 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-100 min-w-[240px] flex items-center justify-center space-x-2 border-b-4 border-brand-700 active:border-b-0 active:translate-y-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Order</span>}
                </button>
                <button
                  onClick={handleRejectOrder}
                  disabled={isLoading}
                  className="text-red-500 px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all min-w-[240px]"
                >
                  Reject Order
                </button>
              </div>
            )}

            {order.orderStatus === 'ORDER_CONFIRMED' && (
              <button
                onClick={() => handleStatusUpdate('PACKED_READY')}
                disabled={isLoading}
                className="bg-blue-600 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 min-w-[240px] flex items-center justify-center space-x-2 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Mark as Packed</span>}
              </button>
            )}

            {order.orderStatus === 'PACKED_READY' && (
              <button
                onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}
                disabled={isLoading}
                className="bg-purple-600 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 min-w-[240px] flex items-center justify-center space-x-2 border-b-4 border-purple-800 active:border-b-0 active:translate-y-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Out for Delivery</span>}
              </button>
            )}

            {order.orderStatus === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleStatusUpdate('DELIVERED')}
                disabled={isLoading}
                className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 min-w-[240px] flex items-center justify-center space-x-2 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Mark as Delivered</span>}
              </button>
            )}

            {order.orderStatus === 'DELIVERED' && (
              <div className="flex items-center space-x-3 bg-emerald-50 px-8 py-4 rounded-3xl border border-emerald-100 shadow-sm">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">Order Delivered</span>
                  <span className="text-[10px] font-bold text-emerald-600 opacity-80 uppercase tracking-tight">Process Completed</span>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Customer & Address Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <User className="w-3.5 h-3.5" />
              <span>Customer identity</span>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-900 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                  {order.customerAvatar ? (
                    <img src={order.customerAvatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-black text-white">{order.customerName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{order.customerName}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{order.customerId}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{order.customerPhone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5" />
              <span>Shipping destination</span>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl min-h-[140px] flex flex-col justify-center">
              <p className="text-sm font-bold text-gray-800 leading-relaxed">{order.address}</p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Verified Address</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Financial Data</span>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Method</span>
                <span className="text-xs font-black text-gray-900 uppercase">{order.paymentProvider}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${order.paymentStatus === 'Paid' ? 'bg-brand-50 text-brand-700' : 'bg-red-100 text-red-700'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">TXN ID</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{order.transactionId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Inventory List (Lazy Loaded Section) */}
        <div className="space-y-6" ref={itemsRef}>
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Package className="w-3.5 h-3.5" />
              <span>Inventory List ({items.length} unique SKUs)</span>
            </div>
            {isItemsSectionVisible && !hasLoadedItems && (
              <div className="flex items-center space-x-2 text-brand-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Syncing Hub...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {hasLoadedItems ? (
              items.map((item, idx) => (
                <div key={item.id + idx} className="flex flex-col md:flex-row md:items-center bg-gray-50/30 p-5 rounded-3xl border border-gray-100 hover:border-brand-500 hover:bg-white transition-all group animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center space-x-5 flex-1">
                    <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-black text-gray-900">{item.name}</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-2 py-0.5 rounded-md border border-gray-50">SKU: {item.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center justify-between md:space-x-10 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                    <div className="text-center md:text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Price</p>
                      <p className="text-xs font-black text-gray-900">₹{item.price.toLocaleString()}</p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Quantity</p>
                      <p className="text-xs font-black text-gray-900">×{item.quantity}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Line Total</p>
                      <p className="text-base font-black text-brand-600">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Skeleton Loaders
              [1, 2, 3].map((n) => (
                <div key={n} className="flex flex-col md:flex-row md:items-center bg-gray-50/20 p-5 rounded-3xl border border-gray-100 animate-pulse">
                  <div className="flex items-center space-x-5 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl shrink-0"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-gray-100 rounded-md"></div>
                      <div className="h-3 w-24 bg-gray-100 rounded-md"></div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center justify-between md:space-x-10 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                    <div className="h-8 w-16 bg-gray-100 rounded-md"></div>
                    <div className="h-8 w-16 bg-gray-100 rounded-md"></div>
                    <div className="h-8 w-24 bg-gray-100 rounded-md"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col md:flex-row justify-between pt-10 border-t border-gray-50 gap-8">


          <div className="w-full max-w-sm space-y-3 bg-gray-50/50 p-8 rounded-[40px] border border-gray-100">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-gray-900 font-black">₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span>GST (18%)</span>
              <span className="text-gray-900 font-black">₹{tax.toLocaleString()}</span>
            </div>

            {otherFees > 0 && (
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Shipping & Handling</span>
                <span className="text-gray-900 font-black">₹{otherFees.toLocaleString()}</span>
              </div>
            )}
            <div className="h-px bg-gray-200 w-full my-2"></div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Grand Total</span>
              <div className="text-right">
                <span className="text-4xl font-black text-gray-900 tracking-tight">₹{total.toLocaleString()}</span>
                <p className="text-[10px] font-black text-brand-600 uppercase mt-1 tracking-[0.2em]">Authorized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer for print */}
        <div className="hidden print:block pt-10 text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
          Thank you for choosing JiffyKart • This is a computer generated invoice.
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
