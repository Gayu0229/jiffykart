import React, { useEffect, useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useNavigation, useAuth, useCart, useComparison } from '../hooks';
import { Navbar } from '../components/Navbar';
import { GeminiChat } from '../components/GeminiChat';
import { CATEGORIES } from '../components/constants';
import { ApiService } from '../services/apiService';
import { Shop } from '../types';
import { Scale, ArrowRight, X, Plus, User, Package, Wallet, Store } from 'lucide-react';

// Core pages (loaded eagerly — needed on first visit)
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../components/LoginPage';

// Lazy-loaded pages (loaded on demand — reduces initial bundle)
const ShopListing = lazy(() => import('../components/ShopListing').then(m => ({ default: m.ShopListing })));
const ShopDetails = lazy(() => import('../components/ShopDetails').then(m => ({ default: m.ShopDetails })));
const ProductDetailPage = lazy(() => import('../components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('../components/CartPage').then(m => ({ default: m.CartPage })));
const UserProfile = lazy(() => import('../components/UserProfile').then(m => ({ default: m.UserProfile })));
const Checkout = lazy(() => import('../components/Checkout').then(m => ({ default: m.Checkout })));
const OrderTracking = lazy(() => import('../components/OrderTracking').then(m => ({ default: m.OrderTracking })));
const JiffyStreetPage = lazy(() => import('../components/JiffyStreetPage').then(m => ({ default: m.JiffyStreetPage })));
const JiffyCafePage = lazy(() => import('../components/JiffyCafePage').then(m => ({ default: m.JiffyCafePage })));
const SignupPage = lazy(() => import('../components/SignupPage').then(m => ({ default: m.SignupPage })));
const VerifyOtpPage = lazy(() => import('../components/VerifyOtpPage').then(m => ({ default: m.VerifyOtpPage })));
const BecomeSeller = lazy(() => import('../components/BecomeSeller').then(m => ({ default: m.BecomeSeller })));
const SellerRegistration = lazy(() => import('../components/SellerRegistration').then(m => ({ default: m.SellerRegistration })));
const PrivacyPolicy = lazy(() => import('../components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsAndConditions = lazy(() => import('../components/TermsAndConditions').then(m => ({ default: m.TermsAndConditions })));
const CancellationRefund = lazy(() => import('../components/CancellationRefund').then(m => ({ default: m.CancellationRefund })));
const CollectionsPage = lazy(() => import('../components/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const WishlistPage = lazy(() => import('../components/WishlistPage').then(m => ({ default: m.WishlistPage })));
const WalletPage = lazy(() => import('../components/WalletPage').then(m => ({ default: m.WalletPage })));
const TrackOrdersPage = lazy(() => import('../components/TrackOrdersPage').then(m => ({ default: m.TrackOrdersPage })));
const ComparisonPage = lazy(() => import('../pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const PaymentStatus = lazy(() => import('../components/PaymentStatus').then(m => ({ default: m.PaymentStatus })));
const SubscriptionPlansPage = lazy(() => import('../components/SubscriptionPlansPage').then(m => ({ default: m.SubscriptionPlansPage })));


export const AppRouter: React.FC = () => {
  const { view, params, navigate, goBack, city } = useNavigation();
  const { isLoggedIn, user, login, logout } = useAuth();

  useEffect(() => {
    console.log("📺 [AppRouter] Current View:", view, "Params:", params, "isLoggedIn:", isLoggedIn);

    const hasToken = ApiService.getAuthToken();

    // Auth Redirection Guard: Only redirect if fully authenticated (user + token)
    // BUT skip redirect if user was intentionally sent to login (e.g., after OTP verification with a message)
    if (isLoggedIn && hasToken && (view === 'login' || view === 'signup' || view === 'verify-otp')) {
      // If there's a message param, the user was sent here intentionally (e.g., after OTP verify)
      // Clear the stale session so they can login fresh
      if (view === 'login' && params.message) {
        console.log("🔄 [AppRouter] User sent to login with message — clearing stale session for fresh login.");
        logout();
        return;
      }

      console.log("🛡️ [AppRouter] Auth Guard: User is fully authenticated. Navigating to profile.");

      // If there was a pending redirect, use it, otherwise go to profile.
      if (params.redirect) {
        navigate(params.redirect, params.redirectParams);
      } else {
        navigate('profile');
      }
    }
  }, [view, params, isLoggedIn]);
  const { cartItems, cartCount, cartTotal, addToCart } = useCart();
  const { compareList, removeFromCompare } = useComparison();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (params.shopId) {
      ApiService.getShopById(params.shopId).then(setSelectedShop).catch(() => setSelectedShop(null));
    } else if (cartItems.length > 0) {
      const firstItemShopId = cartItems[0].product.shop_id;
      if (firstItemShopId) {
        ApiService.getShopById(firstItemShopId).then(setSelectedShop).catch(() => setSelectedShop(null));
      }
    } else {
      setSelectedShop(null);
    }
  }, [params.shopId, cartItems]);

  const isFullWidthView = ['tracking', 'checkout', 'login', 'signup', 'verify-otp', 'seller', 'seller-registration', 'privacy-policy', 'terms-and-conditions', 'cancellation-refund', 'admin-banners', 'payment-status', 'subscription'].includes(view);

  useEffect(() => {
    const baseTitle = "Jiffy Kart";
    let pageTitle = "";
    switch (view) {
      case 'home': pageTitle = "Hyperlocal Electronics & Fashion"; break;
      case 'shops': pageTitle = "Nearby Stores"; break;
      case 'details': pageTitle = selectedShop?.name || "Store Details"; break;
      case 'product-detail': pageTitle = "Product Details"; break;
      case 'cart': pageTitle = "My Shopping Cart"; break;
      case 'profile': pageTitle = "My Account"; break;
      case 'checkout': pageTitle = "Secure Checkout"; break;
      case 'tracking': pageTitle = "Track Order"; break;
      case 'jiffy-street': pageTitle = "Jiffy Street Deals"; break;
      case 'jiffy-cafe': pageTitle = "Jiffy Cafe | Hot & Fresh"; break;
      case 'wishlist': pageTitle = "My Wishlist"; break;
      case 'wallet': pageTitle = "Jiffy Wallet"; break;
      case 'track-orders': pageTitle = "My Orders"; break;
      case 'comparison': pageTitle = "Product Comparison"; break;
      default: pageTitle = "Shop Local";
    }
    document.title = `${pageTitle} | ${baseTitle}`;
  }, [view, city, selectedShop]);

  const renderView = () => {
    switch (view) {
      case 'home': return <HomePage />;
      case 'collections':
        return <CollectionsPage onCategoryClick={(id) => {
          const category = CATEGORIES.find(c => c.id === id);
          if (category) navigate('shops', { category: category.name });
        }} />;
      case 'shops':
        return <ShopListing
          category={params.category}
          searchQuery={params.searchQuery}
          city={city}
          initialArea={params.area}
          onBack={goBack}
          onShopClick={(id) => navigate('details', { shopId: id })}
          vendorType={params.vendorType}
        />;
      case 'details':
        return selectedShop ? (
          <ShopDetails shop={selectedShop} onBack={goBack} onAddToCart={addToCart} />
        ) : <div className="h-screen flex items-center justify-center">Loading Store...</div>;
      case 'product-detail':
        return <ProductDetailPage />;
      case 'cart':
        return <CartPage />;
      case 'profile':
        return <UserProfile onLogout={logout} onTrackOrder={(order) => navigate('tracking', { order })} initialTab={params.tab} />;
      case 'wishlist': return <WishlistPage />;
      case 'wallet': return <WalletPage />;
      case 'track-orders': return <TrackOrdersPage />;
      case 'checkout': return <Checkout onBack={goBack} />;
      case 'tracking':
        return <OrderTracking order={params.order} orderId={params.orderId} onBack={goBack} />;
      case 'jiffy-street': return <JiffyStreetPage onBack={goBack} onAddToCart={addToCart} />;
      case 'jiffy-cafe': return <JiffyCafePage onBack={goBack} onAddToCart={addToCart} />;
      case 'login':
        return <LoginPage
          onBack={goBack}
          onLoginSuccess={(user) => login(params.redirect, params.redirectParams, null, user)}
          onSignupClick={() => navigate('signup')}
          onPrivacyClick={() => navigate('privacy-policy')}
          onTermsClick={() => navigate('terms-and-conditions')}
          onCancellationClick={() => navigate('cancellation-refund')}
          message={params.message}
        />;
      case 'signup':
        return <SignupPage
          onBack={goBack}
          onLoginClick={() => navigate('login')}
          onSignupSuccess={(userData) => {
            console.log("👉 [AppRouter] Signup success callback received:", userData);
            const email = userData?.email;
            if (email) {
              navigate('verify-otp', { email });
            } else {
              console.error("❌ [AppRouter] No email found in signup success data!");
              navigate('login', { message: 'Signup successful! Please sign in.' });
            }
          }}
        />;
      case 'verify-otp':
        return <VerifyOtpPage
          email={params.email}
          onBack={() => navigate('signup')}
          onVerificationSuccess={() => navigate('login', { message: 'Account verified! Please sign in.' })}
        />;
      case 'seller': return <BecomeSeller onBack={() => navigate('home')} onRegisterClick={() => navigate('seller-registration')} />;
      case 'seller-registration': return <SellerRegistration onBack={() => navigate('seller')} onPrivacyClick={() => navigate('privacy-policy')} />;
      case 'privacy-policy': return <PrivacyPolicy onBack={goBack} />;
      case 'terms-and-conditions': return <TermsAndConditions onBack={goBack} />;
      case 'cancellation-refund': return <CancellationRefund onBack={goBack} />;
      case 'comparison': return <ComparisonPage />;
      case 'payment-status': return <PaymentStatus />;
      case 'subscription': return <SubscriptionPlansPage onBack={() => navigate('home')} isLoggedIn={isLoggedIn} onLoginRequired={() => navigate('login', { redirect: 'subscription' })} />;
      default: return <HomePage />;
    }
  };

  return (
    <>
      {!isFullWidthView && (
        <Navbar
          onAccountClick={() => isLoggedIn ? navigate('profile') : navigate('login')}
          onCartClick={() => navigate('cart')}
          onHomeClick={() => navigate('home')}
          onTrackClick={() => isLoggedIn ? navigate('track-orders') : navigate('login', { redirect: 'track-orders' })}
          onBecomeSellerClick={() => navigate('seller')}
          onSearch={(query) => navigate('shops', { searchQuery: query, category: '' })}
          cartCount={cartCount}
          isLoggedIn={isLoggedIn}
          onMenuOpen={() => setIsMenuOpen(true)}
        />
      )}

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 transition-opacity" />

          {/* Drawer Content */}
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 animate-in slide-in-from-right duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-black text-dark tracking-tighter uppercase">Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-dark transition"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                onClick={() => { navigate('home'); setIsMenuOpen(false); }}
                className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition ${view === 'home' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ArrowRight size={18} /> Home
              </button>

              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => { navigate('profile'); setIsMenuOpen(false); }}
                    className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition ${view === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <User size={18} /> My Account
                  </button>
                  <button
                    onClick={() => { navigate('track-orders'); setIsMenuOpen(false); }}
                    className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition ${view === 'track-orders' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Package size={18} /> My Orders
                  </button>
                  <button
                    onClick={() => { navigate('wallet'); setIsMenuOpen(false); }}
                    className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition ${view === 'wallet' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Wallet size={18} /> Jiffy Wallet
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { navigate('login'); setIsMenuOpen(false); }}
                  className="flex items-center gap-4 p-4 rounded-2xl font-bold text-primary bg-primary/5 hover:bg-primary/10 transition"
                >
                  <User size={18} /> Sign In
                </button>
              )}

              <div className="h-px bg-slate-100 my-2" />

              <button
                onClick={() => { navigate('seller'); setIsMenuOpen(false); }}
                className="flex items-center gap-4 p-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                <Store size={18} /> Become a Partner
              </button>
            </nav>

            <div className="mt-auto p-4 bg-slate-50 rounded-3xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Support</p>
              <p className="text-xs font-bold text-slate-600">Need help? Chat with Gemini AI or visit our Help Center.</p>
            </div>
          </div>
        </div>
      )}
      <main className={!isFullWidthView && view !== 'home' ? 'max-w-7xl mx-auto px-4 py-6' : ''}>
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        }>
          {renderView()}
        </Suspense>
      </main>

      {!isFullWidthView && compareList.length > 0 && view !== 'comparison' && createPortal(
        <div className="fixed bottom-20 left-0 right-0 z-[9999] flex justify-center px-3 md:px-4 animate-slide-up pointer-events-none">
          <div className="bg-slate-900 text-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 md:gap-4 border border-white/10 backdrop-blur-md w-full max-w-2xl pointer-events-auto">
            <div className="flex items-center gap-2 md:gap-3 py-1 w-full sm:w-auto">
              <div className="bg-primary/20 p-1.5 md:p-2 rounded-xl border border-primary/30 shrink-0">
                <Scale className="text-primary" size={16} />
              </div>
              {compareList.map(p => (
                <div key={p.id} className="relative group shrink-0">
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden bg-white border border-white/20 p-0.5">
                    <img src={p.image} className="w-full h-full object-contain" alt="" />
                  </div>
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {compareList.length < 3 && (
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 shrink-0">
                  <Plus size={12} />
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('comparison')}
              className="w-full sm:w-auto px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-xl active:scale-95 bg-primary text-white shadow-primary/20 hover:bg-indigo-600 whitespace-nowrap shrink-0"
            >
              Compare <ArrowRight size={14} />
            </button>
          </div>
        </div>,
        document.body
      )}



      {!isFullWidthView && (
        <GeminiChat
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          onBrowse={() => { navigate('shops', { category: '' }); setIsChatOpen(false); }}
          onJiffyStreet={() => { navigate('jiffy-street'); setIsChatOpen(false); }}
          onTrackOrder={() => { navigate('track-orders'); setIsChatOpen(false); }}
          view={view}
        />
      )}
    </>
  );
};