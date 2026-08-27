import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import NewOrders from './components/NewOrders';
import OrderDetails from './components/OrderDetails';
import Returns from './components/Returns';
import Products from './components/Products';
import Analytics from './components/Analytics';
import Customers from './components/Customers';
import Payments from './components/Payments';
import Discounts from './components/Discounts';
import Company from './components/Company';
import Support from './components/Support';
import Settings from './components/Settings';
import AIAssistant from './components/AIAssistant';
import { FloorPlan } from './components/FloorPlan';
import { LiveArrivals } from './components/LiveArrivals';
import LoginPage from './components/LoginPage';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { View, Order, OrderItem, UserProfile, VendorProfile, ReturnRequest } from './types';
import { api } from './vendor.api';
import { createSocketClient } from './socket';
import { Client } from '@stomp/stompjs';

interface AppNotification {
  id: number;
  message: string;
  type: 'info' | 'success';
  time: string;
  read: boolean;
  relatedId?: string;
  targetView?: View;
}

// --- TYPES & INTERFACES FOR EXTERNAL COMPONENTS ---

interface ProtectedRouteProps {
  allowedVendorType?: string;
  allowedBusinessModel?: string;
  vendorProfileLoading: boolean;
  vendorProfile: VendorProfile | null;
  getRedirectPath: (vendorType: string | undefined, businessModel: string | undefined) => string;
  children: React.ReactElement;
}

interface RootRedirectProps {
  vendorProfileLoading: boolean;
  vendorProfile: VendorProfile | null;
  getRedirectPath: (vendorType: string | undefined, businessModel: string | undefined) => string;
}

interface DashboardWorkspaceProps {
  sidebarVendorType: string;
  sidebarFoodBusinessType?: string;
  allowedViews: View[];
  activeView: View;
  setActiveView: (view: View) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  orders: Order[];
  returnRequests: ReturnRequest[];
  shopData: any;
  userProfile: UserProfile;
  handleLogout: () => void;
  setSelectedTicketId: (id: string | null) => void;
  renderView: (currentView: View, onViewChange: (v: View) => void) => React.ReactNode;
}

// --- PROTECTED ROUTE WRAPPER COMPONENT ---
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedVendorType,
  allowedBusinessModel,
  vendorProfileLoading,
  vendorProfile,
  getRedirectPath,
  children
}) => {
  const token = localStorage.getItem('vendor_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (vendorProfileLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!vendorProfile) {
    return <Navigate to="/login" replace />;
  }

  const vt = vendorProfile.vendorType?.toUpperCase();
  const bm = vendorProfile.businessModel?.toUpperCase();

  const allowedVT = allowedVendorType?.toUpperCase();
  const allowedBM = allowedBusinessModel?.toUpperCase();

  if (allowedVT && vt !== allowedVT) {
    const correctPath = getRedirectPath(vendorProfile.vendorType, vendorProfile.businessModel);
    return <Navigate to={correctPath} replace />;
  }

  if (allowedBM && bm !== allowedBM) {
    const correctPath = getRedirectPath(vendorProfile.vendorType, vendorProfile.businessModel);
    return <Navigate to={correctPath} replace />;
  }

  return children;
};

// --- ROOT REDIRECT COMPONENT ---
const RootRedirect: React.FC<RootRedirectProps> = ({
  vendorProfileLoading,
  vendorProfile,
  getRedirectPath
}) => {
  const token = localStorage.getItem('vendor_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (vendorProfileLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendorProfile) {
    return <Navigate to="/login" replace />;
  }

  const path = getRedirectPath(vendorProfile.vendorType, vendorProfile.businessModel);
  return <Navigate to={path} replace />;
};

// --- DASHBOARD WORKSPACE COMPONENT ---
const DashboardWorkspace: React.FC<DashboardWorkspaceProps> = ({
  sidebarVendorType,
  sidebarFoodBusinessType,
  allowedViews,
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  orders,
  returnRequests,
  shopData,
  userProfile,
  handleLogout,
  setSelectedTicketId,
  renderView
}) => {
  // Reset view if not permitted
  useEffect(() => {
    if (!allowedViews.includes(activeView)) {
      setActiveView(View.DASHBOARD);
    }
  }, [allowedViews, activeView, setActiveView]);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[110] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-[120] lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => {
            if (allowedViews.includes(view)) {
              setActiveView(view);
            }
            setIsSidebarOpen(false);
          }}
          newOrdersCount={orders.filter(o => o.orderStatus === 'ORDER_RECEIVED').length}
          returnRequestsCount={returnRequests.filter(r => r.status === 'APPROVED').length}
          shopName={shopData.title}
          vendorType={sidebarVendorType}
          foodBusinessType={sidebarFoodBusinessType}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] relative">
        <TopNav
          title={activeView}
          userProfile={userProfile}
          onViewChange={setActiveView}
          onLogout={handleLogout}
          onNavigateToTicket={(id) => { setSelectedTicketId(id); setActiveView(View.SUPPORT); }}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderView(activeView, setActiveView)}
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('vendor_token'));
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('vendor_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return { name: '', email: '', role: 'Store Admin', avatar: '' };
      }
    }
    return { name: '', email: '', role: 'Store Admin', avatar: '' };
  });

  const [shopData, setShopData] = useState<any>({
    title: '',
    tagline: 'Fresh from farm to your door',
    email: '',
    phone: '',
    bio: '',
    address: '',
    area: '',
    postalCode: '',
    pickupInstructions: 'Enter through the main glass door.',
    banner: '',
    logo: ''
  });

  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [vendorProfileLoading, setVendorProfileLoading] = useState(true);
  const [vendorProfileError, setVendorProfileError] = useState<string | null>(null);

  // Dynamic dashboard helper
  const getRedirectPath = (vendorType: string | undefined, businessModel: string | undefined): string => {
    const vt = vendorType?.toUpperCase();
    const bm = businessModel?.toUpperCase();

    if (vt === 'FOOD_VENDOR') {
      if (bm === 'ONLINE_FOOD') return '/food-dashboard';
      if (bm === 'RESTAURANT_BOOKING') return '/restaurant-dashboard';
      if (bm === 'BOTH') return '/food-restaurant-dashboard';
    }
    return '/vendor-dashboard';
  };

  const loadProfileData = async () => {
    setVendorProfileLoading(true);
    setVendorProfileError(null);
    try {
      const profileData = await api.getProfile();
      if (profileData) {
        setVendorProfile(profileData);
        setShopData({
          title: profileData.shopName || '',
          tagline: 'Fresh from farm to your door',
          email: profileData.email || '',
          phone: profileData.phone || '',
          bio: '',
          address: profileData.businessAddress || '',
          area: profileData.area || '',
          postalCode: profileData.pincode || '',
          pickupInstructions: 'Enter through the main glass door.',
          banner: profileData.bannerUrl || '',
          logo: profileData.logoUrl || ''
        });

        const savedUserStr = localStorage.getItem('vendor_user');
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            setUserProfile({
              name: parsed.name || profileData.shopName || '',
              email: parsed.email || profileData.email || '',
              role: 'Store Admin',
              avatar: parsed.avatar || ''
            });
          } catch (e) { }
        }

        return profileData;
      }
    } catch (e: any) {
      console.error('Failed to load vendor profile', e);
      setVendorProfileError(e?.message || 'Failed to load profile');
    } finally {
      setVendorProfileLoading(false);
    }
    return null;
  };

  // Fetch initial data via API
  useEffect(() => {
    if (!isLoggedIn) {
      setVendorProfileLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      setVendorProfileLoading(true);
      setVendorProfileError(null);
      try {
        const [ordersData, profileData] = await Promise.all([
          api.fetchOrders(),
          api.getProfile()
        ]);
        setOrders(ordersData);

        if (profileData) {
          const pData = profileData as any;
          if (pData.user) {
            setUserProfile(prev => ({
              ...prev,
              name: pData.user.name || prev.name,
              email: pData.user.email || prev.email,
              phone: pData.user.phone || prev.phone,
              avatar: pData.user.avatar || prev.avatar
            }));
          }
          if (pData.vendorProfile) {
            setVendorProfile(pData.vendorProfile);
            setShopData(prev => ({
              ...prev,
              title: pData.vendorProfile.shopName || prev.title,
              address: pData.vendorProfile.businessAddress || prev.address,
              email: pData.vendorProfile.email || prev.email,
              phone: pData.vendorProfile.phone || prev.phone,
              postalCode: pData.vendorProfile.pincode || prev.postalCode,
              area: pData.vendorProfile.area || prev.area,
              banner: pData.vendorProfile.bannerUrl || prev.banner,
              logo: pData.vendorProfile.logoUrl || prev.logo,
              deliveryTime: pData.vendorProfile.deliveryTime || prev.deliveryTime,
              costForTwo: pData.vendorProfile.costForTwo || prev.costForTwo,
              category: pData.vendorProfile.category || prev.category,
              businessType: pData.vendorProfile.businessType || prev.businessType,
              city: pData.vendorProfile.city || prev.city
            }));

            const vendorId = pData.vendorProfile.shopId || pData.vendorProfile.id || 1;
            api.fetchReturnRequests(vendorId)
              .then(returnsData => setReturnRequests(returnsData))
              .catch(err => console.error("Failed to load return requests", err));
          } else {
            setVendorProfileError('Vendor profile not completed');
          }
        }
      } catch (error: any) {
        console.error("Failed to load dashboard data", error);
        if (error?.response?.status === 403) {
          setVendorProfileError('Vendor not approved. Dashboard access is restricted.');
        } else if (error?.response?.status === 404) {
          setVendorProfileError('Vendor profile not completed');
        } else {
          setVendorProfileError('Failed to load vendor profile');
        }
      } finally {
        setIsLoading(false);
        setVendorProfileLoading(false);
      }
    };

    loadInitialData();
  }, [isLoggedIn]);

  // WebSocket for Instant Logout and Real-time notifications
  useEffect(() => {
    if (!isLoggedIn) {
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
      }
      return;
    }

    const handleSocketMessage = (topic: string, body: any) => {
      console.log('Real-time message received:', topic, body);

      if (topic === '/user/queue/notifications') {
        if (body.type === 'ACCOUNT_BLOCKED' || body.type === 'ACCOUNT_INACTIVE') {
          alert(body.message || "Your account has been deactivated. Logging out...");
          handleLogout();
          return;
        }
        addNotification(body.message, 'info');
      }

      if (topic === '/topic/notifications') {
        addNotification(body.message, 'info');
      }
    };

    const client = createSocketClient(handleSocketMessage);
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [isLoggedIn]);

  // Real-time polling for new orders (Live Feed)
  useEffect(() => {
    if (!isLoggedIn) return;

    const pollInterval = setInterval(async () => {
      try {
        const ordersData = await api.fetchOrders();
        setOrders(prev => {
          if (JSON.stringify(ordersData) !== JSON.stringify(prev)) {
            const newCount = ordersData.filter(o => o.orderStatus === 'ORDER_RECEIVED').length;
            const oldCount = prev.filter(o => o.orderStatus === 'ORDER_RECEIVED').length;
            if (newCount > oldCount) {
              addNotification('New incoming order received!', 'success', undefined, View.NEW_ORDERS);
            }
            return ordersData;
          }
          return prev;
        });

        let vId = 1;
        try {
          const savedUser = localStorage.getItem('vendor_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            vId = parsed.vendorId || parsed.shopId || parsed.id || 1;
          }
        } catch (e) { }
        const returnsData = await api.fetchReturnRequests(vendorProfile?.shopId || vId);
        setReturnRequests(returnsData);

      } catch (error) {
        console.error("Polling failed", error);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [isLoggedIn]);

  const addNotification = (message: string, type: 'info' | 'success', relatedId?: string, targetView?: View) => {
    const id = Date.now();
    const newNotif: AppNotification = {
      id, message, type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false, relatedId, targetView
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
    setToasts(prev => [newNotif, ...prev]);
    setTimeout(() => setToasts(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const handleLogin = async () => {
    setIsLoggedIn(true);
    const profile = await loadProfileData();
    if (profile) {
      const correctPath = getRedirectPath(profile.vendorType, profile.businessModel);
      navigate(correctPath, { replace: true });
    } else {
      navigate('/vendor-dashboard', { replace: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_user');
    setIsLoggedIn(false);
    setVendorProfile(null);
    setActiveView(View.DASHBOARD);
    navigate('/login', { replace: true });
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    api.updateAvailability(true);
  };

  const handleUpdateShop = async (newShop: any) => {
    setShopData(newShop);
    try {
      const response = await api.updateShop(newShop) as any;
      if (response && response.shop) {
        const savedShop = response.shop;
        setShopData((prev: any) => ({
          ...prev,
          title: savedShop.name,
          bio: savedShop.description,
          area: savedShop.area || prev.area,
          deliveryTime: savedShop.deliveryTime,
          costForTwo: savedShop.costForTwo,
          banner: savedShop.bannerUrl || savedShop.image || prev.banner,
          logo: savedShop.logoUrl || savedShop.image || prev.logo,
        }));
      }
    } catch (error) {
      console.error("Failed to update shop", error);
    }
  };

  const handleAcceptOrder = async (id: string) => {
    const success = await api.acceptOrder(id);
    if (success) {
      const ordersData = await api.fetchOrders();
      setOrders(ordersData);
    }
  };

  const handleRejectOrder = async (id: string) => {
    const success = await api.rejectOrder(id);
    if (success) {
      const ordersData = await api.fetchOrders();
      setOrders(ordersData);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    const success = await api.updateOrderStatus(id, status);
    if (success) {
      const ordersData = await api.fetchOrders();
      setOrders(ordersData);
    }
  };

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    setActiveView(View.ORDER_DETAILS);
  };

  const renderView = (currentView: View, onViewChange: (v: View) => void) => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onViewChange={onViewChange} totalOrdersCount={orders.length} />;
      case View.NEW_ORDERS:
        return <NewOrders orders={orders.filter(o => o.orderStatus === 'ORDER_RECEIVED')} onViewChange={onViewChange} onAcceptOrder={handleAcceptOrder} onRejectOrder={handleRejectOrder} onSelectOrder={handleSelectOrder} />;
      case View.ORDERS:
        return <Orders orders={orders} onSelectOrder={handleSelectOrder} />;
      case View.ORDER_DETAILS:
        const selectedOrder = orders.find(o => o.id === selectedOrderId);
        return <OrderDetails
          order={selectedOrder!}
          onBack={() => onViewChange(View.ORDERS)}
          onAccept={() => handleAcceptOrder(selectedOrderId!)}
          onUpdateStatus={(status) => handleUpdateOrderStatus(selectedOrderId!, status)}
          onUpdateTracking={() => { }}
        />;
      case View.RETURNS:
        return <Returns vendorProfile={vendorProfile} />;
      case View.PRODUCTS:
        return <Products />;
      case View.ANALYTICS:
        return <Analytics />;
      case View.CUSTOMERS:
        return <Customers />;
      case View.PAYMENTS:
        return <Payments />;
      case View.DISCOUNTS:
        return <Discounts />;
      case View.SHOP_LOCATION:
        return <Company shopData={shopData} onUpdateShop={handleUpdateShop} vendorProfile={vendorProfile} vendorProfileLoading={vendorProfileLoading} vendorProfileError={vendorProfileError} />;
      case View.SUPPORT:
        return <Support preSelectedTicketId={selectedTicketId} onClearPreSelected={() => setSelectedTicketId(null)} />;
      case View.SETTINGS:
        return <Settings userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />;
      case View.AI_ASSISTANT:
        return <AIAssistant />;
      case View.TABLES:
        return <FloorPlan shopId={vendorProfile?.shopId || 1} />;
      case View.WAITLIST:
        return <LiveArrivals shopId={vendorProfile?.shopId || 1} />;
      case View.KITCHEN:
        return (
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Kitchen Order Feed</h2>
                <p className="text-xs text-slate-400 mt-1">Live updates of food pre-orders for the kitchen staff</p>
              </div>
              <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">Live Connections</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-500">Order #1024</span><span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">PREPARING</span></div>
                <p className="text-sm font-black text-slate-800">Hyderabadi Chicken Biryani x2<br />Paneer Butter Masala x1</p>
                <div className="text-[10px] text-slate-400 font-semibold">Table 6 · 10 mins elapsed</div>
              </div>
            </div>
          </div>
        );
      case View.RESERVATIONS:
        return (
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">Restaurant Table Reservations</h2>
                <p className="text-xs text-slate-400 mt-1">Upcoming table reservations & guest check-ins</p>
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Rajesh Kumar (6 Guests)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Today, 7:30 PM · 6 Seater Table</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">CONFIRMED</span>
              </div>
            </div>
          </div>
        );
      case View.QR_CHECKIN:
        return (
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4 text-center max-w-md mx-auto">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">QR Code Check-In</h2>
            <p className="text-xs text-slate-400 font-semibold mb-2">Scan customer reservation QR code to mark attendance</p>
            <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 gap-4 mt-4">
              <span className="text-4xl">📸</span>
              <p className="text-xs text-slate-500 font-semibold">Camera scanner initializing...</p>
              <button onClick={() => alert('Check-in status: Mark checked-in!')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-xl transition min-h-0">Scan Demo QR</button>
            </div>
          </div>
        );
      default:
        return <div>Module under development.</div>;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      
      <Route path="/vendor-dashboard" element={
        <ProtectedRoute 
          allowedVendorType="VENDOR" 
          allowedBusinessModel="ONLINE_STORE"
          vendorProfileLoading={vendorProfileLoading}
          vendorProfile={vendorProfile}
          getRedirectPath={getRedirectPath}
        >
          <DashboardWorkspace
            sidebarVendorType="VENDOR"
            sidebarFoodBusinessType="ONLINE_STORE"
            allowedViews={[View.DASHBOARD, View.NEW_ORDERS, View.ORDERS, View.ORDER_DETAILS, View.RETURNS, View.PRODUCTS, View.ANALYTICS, View.PAYMENTS, View.DISCOUNTS, View.CUSTOMERS, View.SHOP_LOCATION, View.SETTINGS, View.SUPPORT, View.AI_ASSISTANT]}
            activeView={activeView}
            setActiveView={setActiveView}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            orders={orders}
            returnRequests={returnRequests}
            shopData={shopData}
            userProfile={userProfile}
            handleLogout={handleLogout}
            setSelectedTicketId={setSelectedTicketId}
            renderView={renderView}
          />
        </ProtectedRoute>
      } />
      
      <Route path="/food-dashboard" element={
        <ProtectedRoute 
          allowedVendorType="FOOD_VENDOR" 
          allowedBusinessModel="ONLINE_FOOD"
          vendorProfileLoading={vendorProfileLoading}
          vendorProfile={vendorProfile}
          getRedirectPath={getRedirectPath}
        >
          <DashboardWorkspace
            sidebarVendorType="FOOD_VENDOR"
            sidebarFoodBusinessType="ONLINE_FOOD"
            allowedViews={[View.DASHBOARD, View.PRODUCTS, View.NEW_ORDERS, View.ORDERS, View.ORDER_DETAILS, View.RETURNS, View.KITCHEN, View.ANALYTICS, View.PAYMENTS, View.DISCOUNTS, View.SUPPORT, View.AI_ASSISTANT]}
            activeView={activeView}
            setActiveView={setActiveView}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            orders={orders}
            returnRequests={returnRequests}
            shopData={shopData}
            userProfile={userProfile}
            handleLogout={handleLogout}
            setSelectedTicketId={setSelectedTicketId}
            renderView={renderView}
          />
        </ProtectedRoute>
      } />
      
      <Route path="/restaurant-dashboard" element={
        <ProtectedRoute 
          allowedVendorType="FOOD_VENDOR" 
          allowedBusinessModel="RESTAURANT_BOOKING"
          vendorProfileLoading={vendorProfileLoading}
          vendorProfile={vendorProfile}
          getRedirectPath={getRedirectPath}
        >
          <RestaurantDashboard onLogout={handleLogout} shopName={shopData.title} />
        </ProtectedRoute>
      } />
      
      <Route path="/food-restaurant-dashboard" element={
        <ProtectedRoute 
          allowedVendorType="FOOD_VENDOR" 
          allowedBusinessModel="BOTH"
          vendorProfileLoading={vendorProfileLoading}
          vendorProfile={vendorProfile}
          getRedirectPath={getRedirectPath}
        >
          <DashboardWorkspace
            sidebarVendorType="FOOD_VENDOR"
            sidebarFoodBusinessType="BOTH"
            allowedViews={[View.DASHBOARD, View.PRODUCTS, View.NEW_ORDERS, View.ORDERS, View.ORDER_DETAILS, View.RETURNS, View.KITCHEN, View.RESERVATIONS, View.TABLES, View.WAITLIST, View.QR_CHECKIN, View.ANALYTICS, View.PAYMENTS, View.DISCOUNTS, View.CUSTOMERS, View.SHOP_LOCATION, View.SUPPORT, View.AI_ASSISTANT, View.SETTINGS]}
            activeView={activeView}
            setActiveView={setActiveView}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            orders={orders}
            returnRequests={returnRequests}
            shopData={shopData}
            userProfile={userProfile}
            handleLogout={handleLogout}
            setSelectedTicketId={setSelectedTicketId}
            renderView={renderView}
          />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={
        <RootRedirect 
          vendorProfileLoading={vendorProfileLoading}
          vendorProfile={vendorProfile}
          getRedirectPath={getRedirectPath}
        />
      } />
    </Routes>
  );
};

export default App;
