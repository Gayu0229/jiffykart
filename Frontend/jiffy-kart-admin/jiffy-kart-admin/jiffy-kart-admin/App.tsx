
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Shield,
  ChevronDown,
  X
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LoginPage from './components/auth/LoginPage';
import AllVendors from './components/vendors/AllVendors';
import PendingVendors from './components/vendors/PendingVendors';
import VendorProfile from './components/vendors/VendorProfile';
import VendorKYC from './components/vendors/VendorKYC';
import KYCDetails from './components/vendors/KYCDetails';
import VendorPerformance from './components/vendors/VendorPerformance';
import VendorOnboardingWizard from './components/vendors/VendorOnboardingWizard';
import AllOrders from './components/orders/AllOrders';
import OrderDetail from './components/orders/OrderDetail';
import Returns from './components/orders/Returns';
import DeliveryPartners from './components/delivery/DeliveryPartners';
import LiveTracking from './components/delivery/LiveTracking';
import DeliveryZones from './components/delivery/DeliveryZones';
import GeoLocations from './components/delivery/GeoLocations';
import VendorPayouts from './components/payments/VendorPayouts';
import VendorPayoutDetails from './components/payments/VendorPayoutDetails';
import DeliveryPartnerPayouts from './components/payments/DeliveryPartnerPayouts';
import DeliveryPartnerPayoutDetails, { DeliveryPartnerFinancial } from './components/payments/DeliveryPartnerPayoutDetails';
import Refunds from './components/payments/Refunds';
import CommissionSettings from './components/payments/CommissionSettings';
import TransactionReports from './components/payments/TransactionReports';
import { UpiVerification } from './components/payments/UpiVerification';
import BannerManager from './components/marketing/BannerManager';
import Coupons from './components/marketing/Coupons';
import FlashSales from './components/marketing/FlashSales';
import NotificationManager from './components/marketing/NotificationManager';
import AdManager from './components/marketing/AdManager';
import AllCustomers from './components/customers/AllCustomers';
import CustomerIssues from './components/customers/CustomerIssues';
import AllShops from './components/shops/AllShops';
import ShopDetails from './components/shops/ShopDetails';
import BlacklistedShops from './components/shops/BlacklistedShops';
import PendingShops from './components/shops/PendingShops';
import SupportTickets from './components/support/SupportTickets';
import TicketDetail from './components/support/TicketDetail';
import AdminAccounts from './components/settings/AdminAccounts';
import RolesPermissions from './components/settings/RolesPermissions';
import AllFranchises from './components/franchise/AllFranchises';
import FranchiseRequests from './components/franchise/FranchiseRequests';
import FranchiseTerritories from './components/franchise/FranchiseTerritories';
import FranchisePayouts from './components/franchise/FranchisePayouts';
import FranchiseIssues from './components/franchise/FranchiseIssues';
import FranchiseDetails from './components/franchise/FranchiseDetails';
import FranchiseDashboard from './components/franchise/FranchiseDashboard';
import CreateFranchiseLogin from './components/users/CreateFranchiseLogin';
// import CreateSellerLogin from './components/users/CreateSellerLogin';
import ManageLogins from './components/users/ManageLogins';
import AdminProfile from './components/profile/AdminProfile';
import ProductList from './components/products/ProductList';
import AddProduct from './components/products/AddProduct';
import Categories from './components/products/Categories';
import Reviews from './components/products/Reviews';
import JiffyStreetManager from './components/products/JiffyStreetManager';
import PendingProducts from './components/products/PendingProducts';
import { NotificationBell } from './components/NotificationBell';
import SubscriptionManager from './components/subscriptions/SubscriptionManager';
import { VendorFull, Franchise, AdminUser, VendorPaymentProfile, PendingVendor, KYCRequest, Product } from './types';
import { api } from './services/api';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const savedUser = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_jwt_token');
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        // Map backend roles to frontend roles if needed (for legacy/raw storage)
        if (user.role === 'ADMIN') user.role = 'Super Admin';
        if (user.role === 'FRANCHISE_OWNER') user.role = 'Franchise Owner';

        // Ensure avatarUrl is populated from backend avatar field
        if (user.avatar && !user.avatarUrl) {
          user.avatarUrl = user.avatar;
        }

        return user;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role === 'Franchise Owner' ? 'Field Manager Dashboard' : 'Overview';
      } catch (e) {
        return 'Overview';
      }
    }
    return 'Overview';
  });

  // Data State (Lifted Up)
  const [vendorPayments, setVendorPayments] = useState<VendorPaymentProfile[]>([]);

  // Selection States
  const [selectedVendor, setSelectedVendor] = useState<VendorFull | null>(null);
  const [selectedShop, setSelectedShop] = useState<VendorFull | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [selectedVendorPayout, setSelectedVendorPayout] = useState<VendorPaymentProfile | null>(null);
  const [selectedDeliveryPartnerPayout, setSelectedDeliveryPartnerPayout] = useState<DeliveryPartnerFinancial | null>(null);
  const [selectedKYCRequest, setSelectedKYCRequest] = useState<KYCRequest | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Onboarding State
  const [onboardingVendor, setOnboardingVendor] = useState<PendingVendor | null>(null);

  // Auth Handlers
  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    // Ensure the mapped user is stored in localStorage for persistence
    localStorage.setItem('admin_user', JSON.stringify(user));
    if (user.role === 'Franchise Owner') {
      setCurrentPage('Field Manager Dashboard');
    } else {
      setCurrentPage('Overview');
    }
  };

  const handleLogout = () => {
    api.logout(); // Clear JWT token
    setCurrentUser(null);
    setCurrentPage('Overview');
  };

  const isFranchise = currentUser?.role === 'Franchise Owner';

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation Handlers
  const handleViewVendor = (vendor: VendorFull) => {
    setSelectedVendor(vendor);
    setCurrentPage('Vendor Profile');
  };

  useEffect(() => {
    if (currentUser) {
      const fetchPayments = async () => {
        try {
          const data = await api.getVendorPayouts();
          setVendorPayments(data);
        } catch (err) {
          console.error("Failed to fetch payout data", err);
        }
      };
      fetchPayments();
    }
  }, [currentUser]);

  const handleViewShop = (shop: VendorFull) => {
    setSelectedShop(shop);
    setCurrentPage('Shop Details');
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentPage('Order Details');
  };

  const handleViewFranchise = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    setCurrentPage('Field Manager Details');
  };

  const handleViewVendorPayout = (vendor: VendorPaymentProfile) => {
    setSelectedVendorPayout(vendor);
    setCurrentPage('Vendor Payout Details');
  };

  const handleUpdateVendorPayment = (updatedVendor: VendorPaymentProfile) => {
    setVendorPayments(prev => prev.map(p => p.vendorId === updatedVendor.vendorId ? updatedVendor : p));
    setSelectedVendorPayout(updatedVendor);
  };

  const handleViewDeliveryPartnerPayout = (partner: DeliveryPartnerFinancial) => {
    setSelectedDeliveryPartnerPayout(partner);
    setCurrentPage('Delivery Partner Payout Details');
  };

  const handleViewKYCRequest = (request: KYCRequest) => {
    setSelectedKYCRequest(request);
    setCurrentPage('KYC Request Details');
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setCurrentPage('Ticket Details');
  };

  const handleStartOnboarding = (vendor: PendingVendor) => {
    setOnboardingVendor(vendor);
    setCurrentPage('Vendor Onboarding');
  };

  const handleCompleteOnboarding = (finalData: Partial<VendorFull>) => {
    if (onboardingVendor) {
      const newActiveVendor: VendorFull = {
        id: onboardingVendor.id,
        shopName: onboardingVendor.vendorName,
        ownerName: 'Unknown',
        phone: 'N/A',
        email: 'N/A',
        kycStatus: 'Verified',
        productsLive: 0,
        ordersHandled: 0,
        rating: 0,
        status: 'Active',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(onboardingVendor.vendorName)}&background=random`,
        bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        address: 'N/A',
        pincode: 'N/A',
        businessType: onboardingVendor.businessType,
        joinedDate: new Date().toLocaleDateString(),
        totalRevenue: 0
      };
      setSelectedVendor(newActiveVendor);
      setOnboardingVendor(null);
      setCurrentPage('Vendor Profile');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setCurrentPage('Edit Product');
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setCurrentPage('Add Product to Jiffy Street');
  };

  const renderContent = () => {
    const listProps = {
      allowedPincodes: isFranchise ? currentUser?.assignedTerritory : undefined
    };

    switch (currentPage) {
      // Dashboard
      case 'Overview':
        return isFranchise ? <FranchiseDashboard /> : <Dashboard onNavigate={handleNavigate} />;
      case 'Profile':
        return <AdminProfile user={currentUser!} onLogout={handleLogout} onAvatarUpdate={(newUrl) => {
          setCurrentUser(prev => prev ? { ...prev, avatarUrl: newUrl } : prev);
        }} />;

      // User Accounts
      case 'Create Field Manager Login': return <CreateFranchiseLogin />;
      // case 'Create Seller Login': return <CreateSellerLogin />;
      case 'Login Credentials': return <ManageLogins />;

      // Field Manager Module
      case 'Field Manager Dashboard': return <FranchiseDashboard />;
      case 'All Field Managers': return <AllFranchises onViewFranchise={handleViewFranchise} />;
      case 'Field Manager Requests': return <FranchiseRequests />;
      case 'Field Manager Territories': return <FranchiseTerritories />;
      case 'Field Manager Payouts': return <FranchisePayouts />;
      case 'Field Manager Issues': return <FranchiseIssues />;
      case 'Field Manager Details':
        if (selectedFranchise) return <FranchiseDetails franchise={selectedFranchise} onBack={() => setCurrentPage('All Field Managers')} />;
        return <AllFranchises onViewFranchise={handleViewFranchise} />;

      // Vendors
      case 'All Vendors': return <AllVendors onViewVendor={handleViewVendor} {...listProps} />;
      case 'Pending Vendor Approvals': return <PendingVendors onStartOnboarding={handleStartOnboarding} />;
      case 'Vendor Performance': return <VendorPerformance onViewVendor={handleViewVendor} />;
      case 'Vendor Onboarding':
        if (onboardingVendor) return <VendorOnboardingWizard pendingVendor={onboardingVendor} onComplete={handleCompleteOnboarding} onCancel={() => setCurrentPage('Pending Vendor Approvals')} />;
        return <PendingVendors onStartOnboarding={handleStartOnboarding} />;
      case 'Vendor KYC Documents': return <VendorKYC onViewDetails={handleViewKYCRequest} />;
      case 'KYC Request Details':
        if (selectedKYCRequest) return <KYCDetails request={selectedKYCRequest} onBack={() => setCurrentPage('Vendor KYC Documents')} />;
        return <VendorKYC onViewDetails={handleViewKYCRequest} />;
      case 'Vendor Payments': return <VendorPayouts payments={vendorPayments} onViewDetails={handleViewVendorPayout} />;
      case 'Vendor Payout Details':
        if (selectedVendorPayout) return <VendorPayoutDetails vendor={selectedVendorPayout} onBack={() => setCurrentPage('Vendor Payouts')} onUpdate={handleUpdateVendorPayment} />;
        return <VendorPayouts payments={vendorPayments} onViewDetails={handleViewVendorPayout} />;
      case 'Vendor Profile':
        if (selectedVendor) return <VendorProfile vendor={selectedVendor} onBack={() => setCurrentPage('All Vendors')} />;
        return <AllVendors onViewVendor={handleViewVendor} {...listProps} />;

      // Shops
      case 'All Shops': return <AllShops onViewShop={handleViewShop} {...listProps} />;
      case 'Pending Shop Approval': return <PendingShops onViewShop={handleViewShop} />;
      case 'Blacklisted Shops': return <BlacklistedShops onViewShop={handleViewShop} />;
      case 'Shop Details':
        if (selectedShop) return <ShopDetails shop={selectedShop} onBack={() => setCurrentPage('All Shops')} />;
        return <AllShops onViewShop={handleViewShop} {...listProps} />;

      // Products
      case 'Jiffy Street': return <JiffyStreetManager onAddProduct={() => setCurrentPage('Add Jiffy Street Product')} />;
      case 'Pending Product Approval': return <PendingProducts />;
      case 'All Products': return <ProductList onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} />;
      case 'Add Jiffy Street Product': return <AddProduct onBack={() => setCurrentPage('Jiffy Street')} fixedFlags={{ isJiffyStreet: true, isJiffyCafe: false }} />;
      case 'Edit Product': return <AddProduct onBack={() => setCurrentPage('All Products')} editProduct={editingProduct} />;
      case 'Categories': return <Categories />;
      case 'Reviews': return <Reviews />;

      // Orders
      case 'All Orders': return <AllOrders onViewOrder={handleViewOrder} {...listProps} />;
      case 'Live Orders': return <AllOrders onViewOrder={handleViewOrder} filterStatus="PROCESSING" {...listProps} />;
      case 'Cancelled Orders': return <AllOrders onViewOrder={handleViewOrder} filterStatus="CANCELLED" {...listProps} />;
      case 'Order Details':
        if (selectedOrderId) return <OrderDetail orderId={selectedOrderId} onBack={() => setCurrentPage('All Orders')} />;
        return <AllOrders onViewOrder={handleViewOrder} {...listProps} />;

      case 'Returned Orders': return <Returns filterType="Return" />;
      case 'Replacement Requests': return <Returns filterType="Replacement" />;

      // Delivery
      case 'Delivery Partners': return <DeliveryPartners {...listProps} onNavigate={handleNavigate} />;
      case 'Live Tracking': return <LiveTracking />;
      case 'Delivery Zones': return <DeliveryZones />;
      case 'Geo Locations': return <GeoLocations />;
      case 'Assign Delivery Partner': return <AllOrders onViewOrder={handleViewOrder} filterStatus="PROCESSING" {...listProps} />;

      // Payments & Finance
      case 'Vendor Payouts': return <VendorPayouts payments={vendorPayments} onViewDetails={handleViewVendorPayout} />;
      case 'Delivery Partner Payouts': return <DeliveryPartnerPayouts onViewDetails={handleViewDeliveryPartnerPayout} />;
      case 'Delivery Partner Payout Details':
        if (selectedDeliveryPartnerPayout) return <DeliveryPartnerPayoutDetails partner={selectedDeliveryPartnerPayout} onBack={() => setCurrentPage('Delivery Partner Payouts')} />;
        return <DeliveryPartnerPayouts onViewDetails={handleViewDeliveryPartnerPayout} />;
      case 'Refunds': return <Refunds />;
      case 'Commission Settings': return <CommissionSettings />;
      case 'Transaction Reports': return <TransactionReports />;
      case 'UPI Payment Verification': return <UpiVerification />;

      // Marketing & CMS
      case 'Offer Banners': return <BannerManager defaultTab="Shop" />;
      case 'Homepage Banners': return <BannerManager defaultTab="Homepage" />;
      case 'Category Banners': return <BannerManager defaultTab="Category" />;
      case 'Coupons': return <Coupons />;
      case 'Flash Sales': return <FlashSales />;
      case 'Notification Manager': return <NotificationManager />;

      // Advertisements
      case 'All Ads': return <AdManager />;
      case 'Add New Ad': return <AdManager initialMode="create" />;
      case 'Homepage Ads': return <AdManager filterPlacement="Homepage" />;
      case 'Category Page Ads': return <AdManager filterPlacement="Category Page" />;
      case 'Product Page Ads': return <AdManager filterPlacement="Product Page" />;
      case 'Checkout Page Ads': return <AdManager filterPlacement="Checkout Page" />;
      case 'Order Tracking Ads': return <AdManager filterPlacement="Order Tracking" />;

      // Customers
      case 'All Customers': return <AllCustomers />;
      case 'Complaints': return <CustomerIssues />;

      // Support
      case 'Support Tickets': return <SupportTickets key="support-all" onViewTicket={handleViewTicket} />;
      case 'Ticket Details':
        if (selectedTicketId) return <TicketDetail ticketId={selectedTicketId} onBack={() => setCurrentPage('Support Tickets')} />;
        return <SupportTickets onViewTicket={handleViewTicket} />;

      // Settings
      case 'Admin Accounts': return <AdminAccounts />;
      case 'Roles & Permissions': return <RolesPermissions />;

      // Subscriptions
      case 'Subscription Plans': return <SubscriptionManager defaultTab="plans" />;
      case 'Subscription Users': return <SubscriptionManager defaultTab="subscribers" />;
      case 'Subscription Analytics': return <SubscriptionManager defaultTab="analytics" />;

      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Restricted or Unavailable</h2>
            <p>The "{currentPage}" page is currently under development or restricted.</p>
            <button
              onClick={() => handleNavigate(isFranchise ? 'Field Manager Dashboard' : 'Overview')}
              className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        );
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      <div
        className={`${isMobileMenuOpen ? 'block fixed inset-0 z-50 bg-gray-900/50' : 'hidden'} lg:block lg:static lg:bg-transparent`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`h-full ${isMobileMenuOpen ? 'bg-gray-900 w-64' : ''} transition-all duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-4 right-4 text-white cursor-pointer hover:bg-white/10 p-1 rounded-full transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </div>
          )}
          <Sidebar activePage={currentPage} onNavigate={handleNavigate} userRole={currentUser.role} onSignOut={handleLogout} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {currentPage === 'Overview' ? (isFranchise ? 'Field Manager Dashboard' : 'Admin Dashboard — Overview') : currentPage}
              </h1>
            </div>

            <div className="flex items-center gap-4">

              <NotificationBell />
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg" onClick={() => handleNavigate('Profile')}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden border border-gray-200">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {isFranchise && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2 text-xs text-indigo-800 flex items-center justify-center">
            <Shield size={14} className="mr-2" />
            Territory Mode: {currentUser.assignedTerritory?.join(', ')}
          </div>
        )}

        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
