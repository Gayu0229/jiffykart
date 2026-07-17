import React, { useState, useEffect } from 'react';
import { Address, Wallet } from '../types';
import {
  Briefcase, Home, CreditCard, Banknote, ArrowLeft,
  ShoppingCart, ShieldCheck, MapPin, CheckCircle2, Wallet as WalletIcon,
  Check, AlertCircle, ChevronRight, Smartphone, Loader2, Sparkles
} from 'lucide-react';
import { useCart, useAuth, useNavigation } from '../hooks';
import { ApiService } from '../services/apiService';
import { Skeleton } from './Skeleton';
import { getGstRateForCategory } from './CartPage';

interface CheckoutProps {
  onBack: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onBack }) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { navigate, cityObj, areaId } = useNavigation();

  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [subStatus, setSubStatus] = useState<any>({ active: false, planName: 'Free', freeDeliveryAll: false, freeDeliveryAbove: null, cashbackPercent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('cod');

  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [upiPaymentData, setUpiPaymentData] = useState<any>(null);
  const [userTxnId, setUserTxnId] = useState('');
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      navigate('login', { redirect: 'checkout' });
      return;
    }

    const loadData = async () => {
      try {
        const [addrs, walletData, subData] = await Promise.all([
          ApiService.getAddresses(user.id),
          ApiService.getWallet(user.id),
          ApiService.getSubscriptionStatus()
        ]);
        setUserAddresses(addrs);
        if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
        setWallet(walletData);
        if (subData) setSubStatus(subData);
      } catch (e) {
        console.error("Failed to load checkout data", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isLoggedIn, navigate]);

  let deliveryFee = cartTotal > 500 ? 0 : 40;
  if (subStatus.active) {
    if (subStatus.freeDeliveryAll) deliveryFee = 0;
    else if (subStatus.freeDeliveryAbove && cartTotal >= subStatus.freeDeliveryAbove) deliveryFee = 0;
  }

  const platformFee = 10;
  const rawGst = cartItems.reduce((acc, item) => {
    const rate = getGstRateForCategory(item.product.category);
    return acc + ((item.product.price * rate) * item.quantity);
  }, 0);
  const gst = Math.round(rawGst);
  const subPayable = cartTotal + deliveryFee + platformFee + gst;
  const expectedCashback = subStatus.active && subStatus.cashbackPercent > 0
    ? Math.floor(cartTotal * (subStatus.cashbackPercent / 100))
    : 0;

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate('home');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  const handlePlaceOrder = async () => {
    if (!cityObj) {
      setError("Please select a delivery location from the header first.");
      return;
    }
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }

    setIsPlacing(true);
    setError(null);

    if (selectedPaymentId === 'wallet' || selectedPaymentId === 'cod') {
      try {
        const orderPayload = {
          user_id: user?.id,
          address_id: selectedAddressId,
          payment_method: selectedPaymentId,
          shop_id: cartItems[0]?.product.shop_id,
          shop_name: "Local Partner",
          items: cartItems.map(i => `${i.product.name} (x${i.quantity})`),
          total: subPayable,
          cart_data: cartItems,
          zone_id: areaId
        };

        await ApiService.placeOrder(orderPayload);

        if (selectedPaymentId === 'wallet' && user) {
          await ApiService.updateWallet(user.id, subPayable, 'debit', `Order Checkout`);
        }

        clearCart();
        setShowSuccess(true);
      } catch (e) {
        setError("Error placing order. Please try again.");
      } finally {
        setIsPlacing(false);
      }
    } else if (selectedPaymentId === 'upi' || selectedPaymentId === 'card') {
      try {
        const orderPayload = {
          shop_id: cartItems[0]?.product.shop_id,
          cart_data: cartItems
        };
        const response = await ApiService.initiatePhonePePayment(orderPayload);
        if (response.success && response.data?.instrumentResponse?.redirectInfo?.url) {
          window.location.href = response.data.instrumentResponse.redirectInfo.url;
        } else {
          setError("Payment initiation failed.");
          setIsPlacing(false);
        }
      } catch (e) {
        setError("Error connecting to payment gateway.");
        setIsPlacing(false);
      }
    } else if (selectedPaymentId === 'upi_qr') {
      try {
        const derivedShopId = cartItems.find(item => item.product.shop_id)?.product.shop_id || cartItems[0]?.product.shop_id;
        const orderPayload = {
          shop_id: derivedShopId,
          shipping_address: selectedAddressId,
          cart_data: cartItems,
          zone_id: areaId
        };
        const response = await ApiService.initiateUpiPayment(orderPayload);
        setUpiPaymentData(response);
      } catch (e: any) {
        console.error("UPI QR Payment Initiation Error:", e);
        const errorMsg = e.response?.data?.message || e.message || "UPI Payment initiation failed.";
        setError(errorMsg);
      } finally {
        setIsPlacing(false);
      }
    }
  };

  const getButtonText = () => {
    if (isPlacing) return <Loader2 className="mx-auto animate-spin" size={24} />;
    if (userAddresses.length === 0) return 'ADD ADDRESS';
    if (!selectedAddressId) return 'SELECT ADDRESS';
    return 'PLACE ORDER';
  };

  const handleButtonClick = () => {
    if (userAddresses.length === 0) {
      navigate('profile', { tab: 'addresses' });
      return;
    }
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }
    handlePlaceOrder();
  };

  const handleSubmitTxnId = async () => {
    if (!userTxnId || userTxnId.length < 5) {
      setError("Please enter a valid Transaction ID");
      return;
    }
    setIsSubmittingTxn(true);
    try {
      await ApiService.submitUpiTransactionId(upiPaymentData.merchantTransactionId, userTxnId);
      clearCart();
      setShowSuccess(true);
    } catch (e) {
      setError("Failed to submit transaction ID.");
    } finally {
      setIsSubmittingTxn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition text-slate-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Address Section */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-primary" /> Delivery Address
            </h3>
            {userAddresses.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-bold mb-4">No saved addresses found</p>
                <button 
                  onClick={() => navigate('profile', { tab: 'addresses' })}
                  className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Click to Add Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAddresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition relative ${selectedAddressId === addr.id ? 'border-primary bg-indigo-50/20' : 'border-slate-50 hover:border-slate-100'}`}
                  >
                    <div className="flex gap-3">
                      <div className={selectedAddressId === addr.id ? 'text-primary' : 'text-slate-400'}>
                        {addr.type === 'Home' ? <Home size={20} /> : <Briefcase size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{addr.type}</h4>
                        <p className="text-xs text-slate-500 leading-tight mt-1">{addr.address_line1}, {addr.address_line2}</p>
                      </div>
                    </div>
                    {selectedAddressId === addr.id && (
                      <CheckCircle2 size={16} className="absolute top-4 right-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Payment Section */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" /> Payment Method
            </h3>
            <div className="space-y-3">
              {[
                { id: 'upi_qr', label: 'Scan & Pay (UPI QR)', icon: <Smartphone size={20} />, sub: 'Verification via UTR' },
                { id: 'upi', label: 'UPI (GPay / PhonePe)', icon: <Smartphone size={20} />, disabled: true, msg: 'Maintenance' },
                { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard size={20} />, disabled: true, msg: 'Coming Soon' },
                { id: 'wallet', label: 'Jiffy Wallet', icon: <WalletIcon size={20} />, sub: `Bal: ₹${wallet?.balance || 0}`, disabled: true, msg: 'Maintenance' },
                { id: 'cod', label: 'Cash on Delivery', icon: <Banknote size={20} /> }
              ].map(method => (
                <div
                  key={method.id}
                  onClick={() => !method.disabled && setSelectedPaymentId(method.id)}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between transition ${method.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:border-primary/20'} ${selectedPaymentId === method.id ? 'border-primary bg-indigo-50/20' : 'border-slate-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={selectedPaymentId === method.id ? 'text-primary' : 'text-slate-400'}>{method.icon}</div>
                    <div>
                      <span className="text-sm font-bold text-slate-900">{method.label}</span>
                      {method.sub && <p className="text-[10px] text-slate-500">{method.sub}</p>}
                    </div>
                  </div>
                  {method.disabled ? (
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">{method.msg}</span>
                  ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentId === method.id ? 'border-primary bg-primary' : 'border-slate-200'}`}>
                      {selectedPaymentId === method.id && <Check size={12} className="text-white" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Amount Sidebar */}
        <aside className="w-full lg:w-96 space-y-4 lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-wider">Order Summary</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Item Total</span>
                <span className="font-bold">₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-500">Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <div className="text-right">
                    <span className="text-emerald-500 font-bold block">FREE</span>
                    {subStatus.active && (subStatus.freeDeliveryAll || (subStatus.freeDeliveryAbove && cartTotal >= subStatus.freeDeliveryAbove)) && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        <Sparkles size={10} className="inline mr-1" />{subStatus.planName} Benefit
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="font-bold">₹{deliveryFee}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Taxes & Charges</span>
                <span className="font-bold">₹{(platformFee + gst).toLocaleString()}</span>
              </div>
            </div>

            {expectedCashback > 0 && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 mt-0.5">
                  <Banknote size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Earn ₹{expectedCashback} Cashback!</p>
                  <p className="text-[10px] text-amber-700 leading-tight">Will be added to Jiffy Wallet on delivery ({subStatus.cashbackPercent}% via {subStatus.planName})</p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-50 pt-4 mb-8 flex justify-between items-center">
              <span className="font-bold text-lg">Total Amount</span>
              <span className="text-2xl font-bold text-slate-900">₹{subPayable.toLocaleString()}</span>
            </div>

            <button
              onClick={handleButtonClick}
              disabled={isPlacing || (userAddresses.length > 0 && !selectedAddressId)}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold transition disabled:bg-slate-200 active:scale-[0.98]"
            >
              {getButtonText()}
            </button>

            {error && <p className="text-xs text-rose-500 font-bold mt-4 text-center flex items-center justify-center gap-2"><AlertCircle size={14} /> {error}</p>}

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-emerald-500" /> Secure Transaction
            </div>
          </div>
        </aside>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Confirmed!</h2>
          <p className="text-slate-500 mb-8 max-w-xs">Your order has been placed successfully and will be delivered shortly.</p>
          <button
            onClick={() => navigate('track-orders')}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition hover:bg-slate-800"
          >
            Track My Order
          </button>
        </div>
      )}

      {/* UPI QR Modal */}
      {upiPaymentData && !showSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="bg-slate-900 p-6 text-center text-white">
                 <h2 className="text-xl font-bold mb-1">Scan & Pay</h2>
                 <p className="text-slate-400 text-xs">Complete payment to place order</p>
              </div>
              
              <div className="p-8 flex flex-col items-center">
                 <div className="bg-white p-3 rounded-2xl border-4 border-slate-50 mb-6">
                    <img src={`data:image/png;base64,${upiPaymentData.qrCode}`} alt="UPI QR" className="w-48 h-48" />
                 </div>
                 
                 <div className="text-center mb-8">
                    <p className="text-2xl font-black text-slate-900 mb-1">₹{upiPaymentData.amount.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payable Amount</p>
                 </div>

                 <div className="w-full space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Transaction ID / UTR</label>
                           <span className="text-[9px] text-primary font-bold cursor-help hover:underline">Help me find it</span>
                        </div>
                        <input 
                           type="text" 
                           placeholder="Enter 12-digit transaction ID"
                           value={userTxnId}
                           onChange={(e) => setUserTxnId(e.target.value.replace(/[^0-9]/g, ''))}
                           maxLength={12}
                           className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary focus:ring-0 transition outline-none"
                        />
                    </div>

                    <button
                      onClick={handleSubmitTxnId}
                      disabled={isSubmittingTxn || !userTxnId}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold transition disabled:bg-slate-200 flex items-center justify-center gap-2"
                    >
                      {isSubmittingTxn ? <Loader2 size={18} className="animate-spin" /> : 'I HAVE PAID'}
                    </button>
                    
                    <button 
                       onClick={() => setUpiPaymentData(null)}
                       className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition py-2"
                    >
                       CANCEL
                    </button>
                 </div>
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-100">
                 <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    Open your UPI app (GPay, PhonePe, etc.), scan the QR code, pay the exact amount, and enter the transaction ID here.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};