
import React, { useState, useEffect, useMemo } from 'react';
import { Order, Banner } from '../types';
import {
  ArrowLeft, Phone, MessageCircle, MapPin,
  CheckCircle, Clock, AlertTriangle,
  Bike, ShieldCheck, Home, Store, Navigation, Maximize2, Star,
  Circle, Package
} from 'lucide-react';
import { AdBanner } from './AdBanner';
import { ComplaintModal } from './ComplaintModal';
import { ApiService } from '../services/apiService';
import { BannerService } from '../services/bannerService';
import { createSocketClient } from '../services/socket';

interface OrderTrackingProps {
  order?: Order;
  orderId?: string;
  onBack: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ order: initialOrder, orderId, onBack }) => {
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [trackingBanners, setTrackingBanners] = useState<Banner[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(!initialOrder);

  // Sync state if props change (e.g. parent refreshes list)
  useEffect(() => {
    if (initialOrder) {
      const isRet = !!initialOrder.returnRequest || (initialOrder.orderStatus?.toUpperCase().includes('RETURN') || initialOrder.orderStatus?.toUpperCase().includes('REPLACEMENT'));
      setOrder(initialOrder);
      setProgress(getProgressFromStatus(initialOrder.orderStatus, isRet));
      setIsInitialLoading(false);
    } else if (orderId) {
      fetchInitialOrder(orderId);
    }
  }, [initialOrder, orderId]);

  const fetchInitialOrder = async (id: string) => {
    try {
      setIsInitialLoading(true);
      setError(null);
      const data = await ApiService.getOrder(id);
      if (data) {
        setOrder(data);
        const isRet = !!data.returnRequest || (data.orderStatus?.toUpperCase().includes('RETURN') || data.orderStatus?.toUpperCase().includes('REPLACEMENT'));
        setProgress(getProgressFromStatus(data.orderStatus, isRet));
      } else {
        setError("Order not found.");
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
      setError("Failed to load order tracking details.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Status mapping to progress percentage
  const getProgressFromStatus = (status: string | undefined, isReturn: boolean = false): number => {
    if (!status) return 0;
    const s = status.toUpperCase();

    if (isReturn) {
      if (s.includes('PENDING')) return 25;
      if (s.includes('APPROVED')) return 60;
      if (s.includes('COMPLETED') || s.includes('REJECTED')) return 100;
      return 25;
    }

    switch (s) {
      case 'ORDER_PLACED':
      case 'ORDER_RECEIVED': return 20;
      case 'ORDER_CONFIRMED': return 40;
      case 'PACKED_READY': return 65;
      case 'OUT_FOR_DELIVERY': return 85;
      case 'DELIVERED': return 100;
      default: return 20;
    }
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const allBanners = await BannerService.getActiveBanners();
        const banners = allBanners.filter(b => b.position === 'Tracking');
        setTrackingBanners(banners);
      } catch (err) {
        console.error("Banner fetch failed", err);
      }
    };
    fetchBanners();

    // ─── WebSocket Listener (Real-Time) ───
    const userData = JSON.parse(localStorage.getItem('jiffykart_user') || '{}');
    const userId = userData.id;
    let socketClient: any = null;

    if (userId) {
      socketClient = createSocketClient((topic, body) => {
        // The backend sends NotificationDTO with orderId in metadata string: {"orderId": 123}
        let orderIdFromMetadata = null;
        if (body.metadata) {
          try {
            const meta = JSON.parse(body.metadata);
            orderIdFromMetadata = meta.orderId?.toString();
          } catch (e) {
            console.error("Failed to parse notification metadata", e);
          }
        }

        // Listen for status updates on the notifications queue
        if (topic.includes(`/queue/notifications`) && (orderIdFromMetadata === order.id || body.relatedId === order.id)) {
          console.log('Real-time status update received via WebSocket');
          pollOrder();
        }
      });

      // Custom subscribe logic for user-specific queue
      // Note: createSocketClient may need to be adjusted to return the client before activation
      // or we can just rely on the sync profile if the backend pushes there too.
      // For now, we assume the backend sends to /user/{userId}/queue/orders
    }

    // ─── Polling Fallback (Alternative/Simple) ───
    async function pollOrder() {
      try {
        const updatedOrder = await ApiService.getOrder(order.id);
        if (updatedOrder) {
          setOrder(updatedOrder);
          const isRet = !!updatedOrder.returnRequest || (updatedOrder.orderStatus?.toUpperCase().includes('RETURN') || updatedOrder.orderStatus?.toUpperCase().includes('REPLACEMENT'));
          const targetProgress = getProgressFromStatus(updatedOrder.orderStatus, isRet);
          setProgress(targetProgress);
        }
      } catch (err) {
        console.error("Polling failed", err);
      }
    };

    pollOrder();
    const interval = setInterval(pollOrder, 10000); // Poll every 10 seconds as backup

    return () => {
      clearInterval(interval);
      if (socketClient) {
        socketClient.deactivate();
      }
    };
  }, [order?.id, orderId]);

  const etaMins = Math.max(1, Math.floor(12 * (1 - progress / 100)));

  const isReturnMode = useMemo(() => {
    const s = order.orderStatus?.toUpperCase() || '';
    return s.includes('RETURN') || s.includes('REPLACEMENT') || !!order.returnRequest;
  }, [order.orderStatus, order.returnRequest]);

  const returnType = order.returnRequest?.type || (order.orderStatus?.toUpperCase().includes('REPLACEMENT') ? 'Replacement' : 'Return');

  const returnSteps = useMemo(() => [
    {
      id: 1,
      label: `${returnType} Requested`,
      time: 'Recently',
      status: progress >= 25 ? 'completed' : 'active'
    },
    {
      id: 2,
      label: 'Admin Reviewing',
      subtext: 'Our specialized team is verifying your request details.',
      status: progress >= 60 ? 'completed' : (progress >= 25 ? 'active' : 'pending')
    },
    {
      id: 3,
      label: order.returnRequest?.status === 'REJECTED' ? 'Request Rejected' : 'Resolution Processed',
      subtext: order.returnRequest?.status === 'REJECTED'
        ? (order.returnRequest.rejectionReason || 'Your request could not be approved at this time.')
        : (returnType === 'REPLACEMENT' ? 'Replacement item is being prepared for dispatch.' : 'Refund has been successfully initiated.'),
      status: progress >= 100 ? 'completed' : (progress >= 60 ? 'active' : 'pending')
    }
  ], [progress, order.returnRequest, returnType]);

  const timelineSteps = useMemo(() => {
    if (isReturnMode) return returnSteps;

    return [
      {
        id: 1,
        label: 'Order Received',
        time: 'Just now',
        status: progress >= 20 ? 'completed' : 'active'
      },
      {
        id: 2,
        label: 'Order Confirmed',
        time: (order.orderStatus === 'ORDER_CONFIRMED') ? 'Recently' : '',
        status: progress >= 40 ? 'completed' : (progress >= 20 ? 'active' : 'pending')
      },
      {
        id: 3,
        label: 'Packed & Ready',
        subtext: 'Your order is packed and waiting for pickup.',
        status: progress >= 65 ? 'completed' : (progress >= 40 ? 'active' : 'pending')
      },
      {
        id: 4,
        label: 'Out for Delivery',
        subtext: 'Delivery partner is navigating to your location.',
        status: progress >= 85 ? 'completed' : (progress >= 65 ? 'active' : 'pending')
      },
      {
        id: 5,
        label: 'Delivered',
        subtext: 'Order hand over completed.',
        status: progress >= 100 ? 'completed' : (progress >= 85 ? 'active' : 'pending')
      },
    ];
  }, [isReturnMode, returnSteps, progress, order.orderStatus]);

  const primaryTrackingBanner = trackingBanners.length > 0 ? trackingBanners[0] : null;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-soft animate-pulse">
           <Package size={48} className="text-slate-200" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Loading Tracker</h3>
        <p className="text-slate-500 font-bold text-sm max-w-xs uppercase tracking-widest opacity-60">Synchronizing live delivery data...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-soft">
           <AlertTriangle size={48} className="text-rose-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Tracking Error</h3>
        <p className="text-slate-500 font-bold text-sm max-w-xs uppercase tracking-widest opacity-60 mb-8">{error || "Order details not found."}</p>
        <button
          onClick={onBack}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-800 animate-fade-in relative pb-24">
      <style>{`
        @keyframes bikeMove {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        .driver-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 5s linear infinite;
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* 1. PAGE HEADER */}
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-100">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-600 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-secondary leading-tight uppercase tracking-tight">Track Order</h1>
              <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">#{order.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full px-4 py-6 space-y-6">

        {/* 2. LIVE DELIVERY CARD */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 mb-2">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80"
                  alt="Driver"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Arun Kumar</h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span className="text-secondary font-black flex items-center gap-0.5"><Star size={10} fill="currentColor" /> 4.8</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{isReturnMode ? (progress > 60 ? 'Pickup en route' : 'Assigning Agent') : (progress > 60 ? 'En route' : 'At store')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert("Support chat is opening...")}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition active:scale-95 shadow-sm"
              >
                <MessageCircle size={18} />
              </button>
              <a
                href="tel:+919876543210"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white hover:bg-dark transition active:scale-95 shadow-lg shadow-secondary/20"
                title="Call Driver"
              >
                <Phone size={18} />
              </a>
            </div>
          </div>

          <div className="h-72 bg-slate-100 relative w-full overflow-hidden">
            <div
              className="absolute inset-0 opacity-40 grayscale-[0.5]"
              style={{
                backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/lonlat:80.22,12.97,14/600x300?access_token=pk.eyJ1IjoiZGVhbGl0IiwiYSI6ImNrcW8yNXFvYjAxeXgyb21zZzRnd3RxYjkifQ.0_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z_Z')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm">
              <path
                id="routePath"
                d="M 60 220 Q 150 180 180 120 T 320 60"
                stroke="#e2e8f0"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 60 220 Q 150 180 180 120 T 320 60"
                stroke="#505081"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="10 10"
                className="driver-path"
                style={{ strokeDashoffset: 1000 - (progress * 10) }}
              />
            </svg>

            <div className="absolute left-[40px] top-[200px] flex flex-col items-center">
              <div className="w-10 h-10 bg-white rounded-full p-2 shadow-lg border-2 border-indigo-100 flex items-center justify-center relative">
                <Store size={18} className="text-primary" />
              </div>
              <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[8px] font-black uppercase mt-1 shadow-sm text-primary tracking-widest">{isReturnMode ? 'JH HUB' : 'STORE'}</span>
            </div>

            <div className="absolute left-[300px] top-[40px] flex flex-col items-center">
              <div className="w-10 h-10 bg-secondary rounded-full p-2 shadow-lg border-2 border-white flex items-center justify-center relative">
                <Home size={18} className="text-white" />
              </div>
              <span className="bg-secondary text-white px-2 py-0.5 rounded text-[8px] font-black uppercase mt-1 shadow-sm tracking-widest">HOME</span>
            </div>

            <div
              className="absolute z-20 flex flex-col items-center transition-all duration-300 ease-linear"
              style={{
                offsetPath: 'path("M 60 220 Q 150 180 180 120 T 320 60")',
                offsetDistance: `${progress}%`,
                marginTop: '-24px',
                marginLeft: '-24px'
              }}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full p-1 shadow-2xl border-4 border-primary flex items-center justify-center z-20">
                  <Bike size={24} className="text-secondary" />
                </div>
                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-30 z-10"></div>
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-30">
              <div className="bg-indigo-50 p-1.5 rounded-xl text-primary">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{isReturnMode ? 'Pickup in' : 'Arriving in'}</p>
                <p className="text-xs font-black text-slate-900">{etaMins} mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PROGRESS TRACKER */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="font-black text-lg text-secondary mb-8 flex items-center gap-2 uppercase tracking-tight">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            {isReturnMode ? `${returnType} Progress` : 'Order Progress'}
          </h3>

          <div className="relative space-y-10">
            <div className="absolute top-3 left-[13px] bottom-3 w-0.5 bg-slate-100"></div>

            {timelineSteps.map((step, index) => (
              <div key={step.id} className="relative flex gap-6">
                <div className="relative z-10 shrink-0">
                  {step.status === 'completed' && (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <CheckCircle size={16} strokeWidth={3} />
                    </div>
                  )}
                  {step.status === 'active' && (
                    <div className="relative w-7 h-7 flex items-center justify-center">
                      <div className="absolute inset-0 bg-primary opacity-20 rounded-full animate-ping"></div>
                      <div className="w-7 h-7 rounded-full border-[3px] border-primary bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-300">
                      <Circle size={10} fill="currentColor" className="opacity-20" />
                    </div>
                  )}
                  {step.status === 'locked' && (
                    <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </div>

                <div className={`flex-1 transition-all duration-500 ${step.status === 'locked' ? 'opacity-30' : 'opacity-100'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className={`font-black text-sm tracking-tight ${step.status === 'active' ? 'text-primary' : 'text-slate-800'}`}>
                      {step.label}
                    </h4>
                    {step.time && <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{step.time}</span>}
                  </div>
                  {step.subtext && <p className="text-xs text-slate-500 mt-1 leading-relaxed font-bold">{step.subtext}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ORDER SUMMARY CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Store Details</p>
              <p className="font-black text-slate-900 text-lg">{order.shop_name}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} /> Prepaid
            </div>
          </div>

          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">{typeof item === 'string' ? item : item.product?.name || 'Item'}</span>
                <span className="text-slate-400 font-black">x {typeof item === 'string' ? 1 : item.quantity}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
              <span className="font-black text-xl text-primary">₹{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. BOTTOM CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
          <div className="shrink-0">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">ETA</p>
            <p className="text-lg font-black text-secondary flex items-center gap-2">
              <Clock size={20} className="text-primary" /> {isReturnMode ? 'Pickup in ' : ''}{etaMins} mins
            </p>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex-1 bg-secondary text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-secondary/20 hover:bg-dark transition-all flex items-center justify-center gap-3 active:scale-[0.98] uppercase text-xs tracking-widest"
          >
            <MessageCircle size={20} /> Support Help
          </button>
        </div>
      </div>

      {showHelpModal && <ComplaintModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
};