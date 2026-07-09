
import React, { useState, useEffect, useCallback } from 'react';
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
import LoginPage from './components/LoginPage';
import { View, Order, OrderItem, Ticket, UserProfile, Shop, VendorProfile, ReturnRequest } from './types';
import { api } from './vendor.api';
import { createSocketClient } from './socket';
import { Client } from '@stomp/stompjs';

const MOCK_ITEMS: OrderItem[] = [
  { id: '1', name: 'Organic Arabica Beans', price: 1200, quantity: 1, sku: 'JK-001', image: 'https://picsum.photos/id/10/200/200' },
  { id: '2', name: 'Dark Roast Ground Coffee', price: 850, quantity: 2, sku: 'JK-002', image: 'https://picsum.photos/id/20/200/200' },
  { id: '3', name: 'Premium Honey Crisp Apples', price: 180, quantity: 5, sku: 'JK-004', image: 'https://picsum.photos/id/40/200/200' },
];

interface AppNotification {
  id: number;
  message: string;
  type: 'info' | 'success';
  time: string;
  read: boolean;
  relatedId?: string;
  targetView?: View;
}

const App: React.FC = () => {
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

  // Shop State (The Store Entity)
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

  // Vendor Profile State (read-only business details from application)
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [vendorProfileLoading, setVendorProfileLoading] = useState(true);
  const [vendorProfileError, setVendorProfileError] = useState<string | null>(null);

  // Fetch initial data via API
  useEffect(() => {
    if (!isLoggedIn) return;

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

        // profileData contains { user, vendorProfile }
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
            // Sync shop data from vendor profile
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

            // Fetch return requests initially
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

      // Handle Instant Logout
      if (topic === '/user/queue/notifications') {
        if (body.type === 'ACCOUNT_BLOCKED' || body.type === 'ACCOUNT_INACTIVE') {
          // Show alert and force logout
          alert(body.message || "Your account has been deactivated. Logging out...");
          handleLogout();
          return;
        }

        // Add to standard notifications if not a logout trigger
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
          // Check if there are truly new orders to avoid unnecessary re-renders
          if (JSON.stringify(ordersData) !== JSON.stringify(prev)) {
            // If new orders are found, we could trigger a notification toast here
            const newCount = ordersData.filter(o => o.orderStatus === 'ORDER_RECEIVED').length;
            const oldCount = prev.filter(o => o.orderStatus === 'ORDER_RECEIVED').length;
            if (newCount > oldCount) {
              addNotification('New incoming order received!', 'success', undefined, View.NEW_ORDERS);
            }
            return ordersData;
          }
          return prev;
        });

        // Poll return requests
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
    }, 15000); // Poll every 15 seconds for demo purposes

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

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    setIsLoggedIn(false);
    setActiveView(View.DASHBOARD);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    api.updateAvailability(true); // Sync with API
  };

  const handleUpdateShop = async (newShop: any) => {
    setShopData(newShop);
    try {
      const response = await api.updateShop(newShop) as any;
      if (response && response.shop) {
        const savedShop = response.shop;
        console.log('[App] Shop updated successfully:', savedShop);
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
        // Show success message if Company.tsx handles it or via another mechanism
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

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Initializing Secure Session...</p>
        </div>
      );
    }

    switch (activeView) {
      case View.DASHBOARD:
        return <Dashboard onViewChange={setActiveView} totalOrdersCount={orders.length} />;
      case View.NEW_ORDERS:
        return <NewOrders orders={orders.filter(o => o.orderStatus === 'ORDER_RECEIVED')} onViewChange={setActiveView} onAcceptOrder={handleAcceptOrder} onRejectOrder={handleRejectOrder} onSelectOrder={handleSelectOrder} />;
      case View.ORDERS:
        return <Orders orders={orders} onSelectOrder={handleSelectOrder} />;
      case View.ORDER_DETAILS:
        const selectedOrder = orders.find(o => o.id === selectedOrderId);
        return <OrderDetails
          order={selectedOrder!}
          onBack={() => setActiveView(View.ORDERS)}
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
      default:
        return <div>Module under development.</div>;
    }
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[110] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`
        fixed inset-y-0 left-0 z-[120] lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            setIsSidebarOpen(false);
          }}
          newOrdersCount={orders.filter(o => o.orderStatus === 'ORDER_RECEIVED').length}
          returnRequestsCount={returnRequests.filter(r => r.status === 'APPROVED').length}
          shopName={shopData.title}
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
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
