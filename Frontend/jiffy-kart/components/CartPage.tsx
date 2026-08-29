import React from 'react';
import {
   ArrowLeft, ShoppingBag, Plus, Minus, Trash2,
   ChevronRight, Info, ShieldCheck, Tag, Ticket,
   MapPin, Clock, AlertCircle, ShoppingCart, CheckCircle, ArrowRight, X
} from 'lucide-react';
import { useCart, useNavigation, useAuth } from '../hooks';
import { Skeleton } from './Skeleton';
import { ApiService } from '../services/apiService';

export const getGstRateForCategory = (category: string) => {
   switch (category) {
      case 'Groceries': return 0.28;
      case 'Electronics': return 0.28;
      case 'Fashion': return 0.12;
      case 'Home & Kitchen': return 0.28;
      case 'Beauty & Health': return 0.18;
      case 'Sports': return 0.28;
      case 'Books': return 0.05;
      case 'Toys': return 0.18;
      case 'Auto Parts': return 0.28;
      case 'Stationery': return 0.18;
      case 'Pet Supplies': return 0.18;
      case 'Food': return 0.28;
      default: return 0.18;
   }
};

export const CartPage: React.FC = () => {
   const { cartItems, updateQuantity, cartTotal, cartCount, isLoading } = useCart();
   const { navigate, goBack, city } = useNavigation();
   const { isLoggedIn } = useAuth();

   const [couponCode, setCouponCode] = React.useState('');
   const [appliedCoupon, setAppliedCoupon] = React.useState<any>(null);
   const [availableCoupons, setAvailableCoupons] = React.useState<any[]>([]);
   const [couponError, setCouponError] = React.useState('');
   const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
   const [isCouponModalOpen, setIsCouponModalOpen] = React.useState(false);

   const shopId = cartItems[0]?.product.shop_id;

   React.useEffect(() => {
      if (shopId) {
         fetchAvailableCoupons(shopId);
      }
   }, [shopId]);

   const fetchAvailableCoupons = async (sid: string) => {
      try {
         const coupons = await ApiService.getShopCoupons(sid);
         setAvailableCoupons(coupons);
      } catch (e) {
         console.error("Failed to fetch shop coupons", e);
      }
   };

   const handleApplyCoupon = async (codeToApply?: string) => {
      const code = codeToApply || couponCode;
      if (!code.trim()) return;
      setIsApplyingCoupon(true);
      setCouponError('');
      try {
         const validCoupon = await ApiService.validateCoupon(code, cartTotal, shopId);
         setAppliedCoupon(validCoupon);
         setCouponCode('');
         setIsCouponModalOpen(false);
      } catch (e: any) {
         setCouponError(e.message || 'Invalid coupon');
         if (!codeToApply) setAppliedCoupon(null);
      } finally {
         setIsApplyingCoupon(false);
      }
   };

   const removeCoupon = () => {
      setAppliedCoupon(null);
      setCouponError('');
   };

   const handleProceed = () => {
      if (!isLoggedIn) {
         navigate('login', {
            redirect: 'checkout',
            message: "Sign in to place your order."
         });
         return;
      }
      navigate('checkout');
   };

   if (isLoading) {
      return (
         <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
               </div>
               <div className="lg:col-span-4">
                  <Skeleton className="h-64 w-full rounded-xl" />
               </div>
            </div>
         </div>
      );
   }

   if (cartItems.length === 0) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <ShoppingBag size={64} className="text-slate-200 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-8 max-w-sm">Explore our stores and add items to your cart.</p>
            <button
               onClick={() => navigate('home')}
               className="bg-primary text-white px-8 py-3 rounded-xl font-bold transition hover:bg-indigo-600"
            >
               Browse Shops
            </button>
         </div>
      );
   }

   const deliveryFee = cartTotal > 500 ? 0 : 40;
   const platformFee = 10;

   let discountAmount = 0;
   if (appliedCoupon) {
      if (appliedCoupon.discountType === 'Percentage') {
         discountAmount = (cartTotal * appliedCoupon.value) / 100;
      } else {
         discountAmount = appliedCoupon.value;
      }
   }

   const rawGst = cartItems.reduce((acc, item) => {
      const rate = getGstRateForCategory(item.product.category);
      return acc + ((item.product.price * rate) * item.quantity);
   }, 0);
   
   // Apply proportional discount to GST to match previous logic style, though backend calculates purely on item totals.
   const gstDiscountRatio = cartTotal > 0 ? (cartTotal - discountAmount) / cartTotal : 1;
   const gst = Math.round(rawGst * gstDiscountRatio);

   const netTotal = Math.max(0, cartTotal - discountAmount + deliveryFee + platformFee + gst);

   return (
      <div className="bg-slate-50 min-h-screen pb-20">
         <div className="bg-white border-b border-slate-100">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
               <button onClick={goBack} className="p-2 hover:bg-slate-50 rounded-full transition text-slate-600">
                  <ArrowLeft size={24} />
               </button>
               <h1 className="text-xl font-bold text-slate-900">Your Cart</h1>
            </div>
         </div>

         <main className="max-w-4xl mx-auto px-4 mt-8">
            <div className="flex flex-col lg:flex-row gap-8">
               {/* Left Column: Items */}
               <div className="flex-1 space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                     <h3 className="font-bold text-lg text-slate-900 mb-6">Cart Items ({cartCount})</h3>
                     <div className="divide-y divide-slate-50">
                        {cartItems.map((item) => (
                           <div key={item.product.id} className="py-6 first:pt-0 last:pb-0">
                              <div className="flex gap-4">
                                 <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden p-2 flex-shrink-0 border border-slate-100">
                                    <img src={item.product.image} className="w-full h-full object-contain" alt="" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                       <h4 className="font-semibold text-slate-900">{item.product.name}</h4>
                                       <p className="font-bold text-slate-900">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">{item.product.category}</p>
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
                                          <button
                                             onClick={() => updateQuantity(item.product.id, -1)}
                                             className="p-1 text-slate-400 hover:text-primary transition"
                                          >
                                             {item.quantity === 1 ? <Trash2 size={16} className="text-rose-400" /> : <Minus size={16} />}
                                          </button>
                                          <span className="w-4 text-center font-bold text-slate-900">{item.quantity}</span>
                                          <button
                                             onClick={() => updateQuantity(item.product.id, 1)}
                                             className="p-1 text-slate-400 hover:text-primary transition"
                                          >
                                             <Plus size={16} />
                                          </button>
                                       </div>
                                       <p className="text-xs text-slate-400">₹{item.product.price.toLocaleString()} / unit</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Column: Order Summary */}
               <div className="w-full lg:w-96 space-y-4 lg:sticky lg:top-8">
                  {/* Coupon Section */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Tag size={18} className="text-primary" /> Apply Coupon
                     </h4>

                     {appliedCoupon ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                           <div>
                              <p className="text-xs font-bold text-emerald-800 tracking-tight">{appliedCoupon.code} APPLIED</p>
                              <p className="text-[10px] text-emerald-600 font-medium">₹{discountAmount.toLocaleString()} saved on this order</p>
                           </div>
                           <button onClick={removeCoupon} className="text-xs font-bold text-rose-500 hover:underline">Remove</button>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           <div className="flex gap-2">
                              <input
                                 type="text"
                                 placeholder="Enter code"
                                 value={couponCode}
                                 onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition uppercase"
                              />
                              <button
                                 onClick={() => handleApplyCoupon()}
                                 disabled={!couponCode || isApplyingCoupon}
                                 className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold disabled:bg-slate-200 transition active:scale-95"
                              >
                                 Apply
                              </button>
                           </div>
                           <button
                              onClick={() => setIsCouponModalOpen(true)}
                              className="w-full text-center text-xs font-bold text-primary hover:underline border border-dashed border-primary/20 p-2 rounded-xl"
                           >
                              View Available Coupons
                           </button>
                        </div>
                     )}
                     {couponError && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{couponError}</p>}
                  </div>

                  {/* Bill Details */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                     <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Bill Details</h4>
                     <div className="space-y-3 pb-4 border-b border-slate-50">
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Item Total</span>
                           <span className="font-bold text-slate-900">₹{cartTotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                           <div className="flex justify-between text-sm text-emerald-600">
                              <span className="font-medium">Coupon Discount</span>
                              <span className="font-bold">-₹{discountAmount.toLocaleString()}</span>
                           </div>
                        )}
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Delivery Fee</span>
                           <span className={deliveryFee === 0 ? 'text-emerald-500 font-bold' : 'text-slate-900 font-bold'}>
                              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                           </span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Platform Fee</span>
                           <span className="font-bold text-slate-900">₹{platformFee}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">GST & Taxes</span>
                           <span className="font-bold text-slate-900">₹{gst.toLocaleString()}</span>
                        </div>
                     </div>
                     <div className="pt-4 flex justify-between items-center mb-6">
                        <span className="font-bold text-slate-900">To Pay</span>
                        <span className="text-xl font-bold text-slate-900">₹{netTotal.toLocaleString()}</span>
                     </div>
                     <button
                        onClick={handleProceed}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm transition hover:bg-slate-800 active:scale-[0.98]"
                     >
                        Proceed to Checkout
                     </button>
                  </div>
               </div>
            </div>
         </main>

         {/* Simple Coupon Modal */}
         {isCouponModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCouponModalOpen(false)}></div>
               <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                     <h3 className="font-bold text-lg text-slate-900">Available Coupons</h3>
                     <button onClick={() => setIsCouponModalOpen(false)} className="p-1 hover:bg-slate-50 rounded-full transition text-slate-400">
                        <X size={20} />
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     {availableCoupons.length > 0 ? availableCoupons.map((coupon) => (
                        <div key={coupon.id} className="border border-slate-100 rounded-xl p-4 hover:border-primary/20 transition group">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">{coupon.code}</span>
                                 <h5 className="font-bold text-slate-900">{coupon.discountType === 'Percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}</h5>
                              </div>
                              <button
                                 onClick={() => handleApplyCoupon(coupon.code)}
                                 className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 transition"
                              >
                                 APPLY
                              </button>
                           </div>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              {coupon.description || `Get ${coupon.discountType === 'Percentage' ? `${coupon.value}%` : `₹${coupon.value}`} off on orders above ₹${coupon.minOrderValue || 0}`}
                           </p>
                        </div>
                     )) : (
                        <div className="text-center py-10">
                           <Ticket size={40} className="mx-auto text-slate-200 mb-3" />
                           <p className="text-slate-400 text-sm font-medium">No coupons available at the moment</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};