import React, { useState, useEffect } from 'react';
import {
  User, Package, MapPin, Heart, CreditCard, HelpCircle, LogOut,
  Edit2, Home, Briefcase, CheckCircle, ArrowRight, Star, Bike, RotateCw,
  Save, X, PlusCircle, MinusCircle, Check, Loader2, Sparkles, Trash2, Plus,
  Smartphone, AlertTriangle, ShieldCheck, ShoppingCart
} from 'lucide-react';
import { Order, Address, PaymentMethod, Product } from './types';
import { useNavigation, useCart, useFavorites, useAuth } from './hooks';
import { ApiService } from './services/apiService';
import SupportDesk from './components/support/SupportDesk';

interface UserProfileProps {
  onLogout: () => void;
  onTrackOrder?: (order: Order) => void;
  onBuyAgain?: (order: Order) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogout, onTrackOrder, onBuyAgain }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { navigate } = useNavigation();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const [userData, setUserData] = useState({
    name: '', email: '', phone: '', gender: 'Not Specified'
  });

  const [dbAddresses, setDbAddresses] = useState<Address[]>([]);
  const [dbPayments, setDbPayments] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [profile, ordersData, addrs, payments] = await Promise.all([
          ApiService.getProfile(),
          ApiService.getOrders(),
          ApiService.getAddresses(user.id),
          ApiService.getPaymentMethods(user.id)
        ]);
        setUserData(profile);
        setOrders(ordersData);
        setDbAddresses(addrs);
        setDbPayments(payments as any);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [user]);

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={20} /> },
    { id: 'favorites', label: 'Favourites', icon: <Heart size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle size={20} /> },
  ];

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse">Syncing...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center font-black text-3xl uppercase text-primary">
                {userData.name.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{userData.name}</h2>
                <p className="text-slate-400 font-bold text-sm uppercase">{userData.phone}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-lg mb-6">Account Details</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Email</p>
                  <p className="font-bold text-slate-700">{userData.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Gender</p>
                  <p className="font-bold text-slate-700">{userData.gender}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-black text-2xl text-slate-900">Order History</h3>
            {orders.length === 0 ? (
              <p className="p-10 text-center text-slate-400 font-bold">No orders found.</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white border rounded-[2.5rem] p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-xl">{order.shop_name}</h4>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{order.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">{order.items.join(', ')}</p>
                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="font-black text-lg">₹{order.total}</span>
                    <div className="flex gap-2">
                      {order.status === 'On the way' && (
                        <button onClick={() => onTrackOrder?.(order)} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Track</button>
                      )}
                      <button onClick={() => onBuyAgain?.(order)} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase">Reorder</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case 'support':
        return <SupportDesk />;
      default: return <div className="p-10 text-center text-slate-300">Feature Syncing...</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-[2.5rem] shadow-sm border p-3">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-black uppercase rounded-2xl transition ${activeTab === item.id ? 'bg-indigo-50 text-primary' : 'text-slate-400 hover:bg-slate-50'}`}>
                {item.icon} {item.label}
              </button>
            ))}
            <div className="mt-4 pt-4 border-t">
              <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-4 text-sm font-black uppercase text-rose-400 hover:bg-rose-50 rounded-2xl transition"><LogOut size={20} /> Logout</button>
            </div>
          </div>
        </div>
        <div className="flex-1">{renderContent()}</div>
      </div>
    </div>
  );
};