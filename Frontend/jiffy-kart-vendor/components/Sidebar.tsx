
import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  CreditCard,
  Tag,
  Settings,
  Zap,
  MapPin,
  LifeBuoy,
  Brain,
  Calendar,
  ListOrdered
} from 'lucide-react';
import { Check } from "lucide-react";
import { View } from '../types';
import logo from '../assets/images/logo.png';


interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  newOrdersCount: number;
  returnRequestsCount?: number;
  shopName?: string;
  vendorType?: string;
  foodBusinessType?: string;
}



const JiffyLogo: React.FC<{ className?: string; shopName?: string }> = ({ className, shopName }) => (
  <div className={`flex items-center ${className}`}>
    <div className="relative mr-3">
      <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
    </div>
    <div className="flex flex-col -space-y-1 overflow-hidden">
      <span className="text-lg font-black text-white tracking-tighter truncate uppercase">{shopName || 'JIFFY'}</span>
      <span className="text-[10px] font-black text-brand-500 tracking-[0.3em] uppercase opacity-80">Vendor Panel</span>
    </div>
  </div>
);

interface MenuItem {
  id: View;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | null;
  badgeColor?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, newOrdersCount, returnRequestsCount, shopName, vendorType, foodBusinessType }) => {
  const getMenuItems = (): MenuItem[] => {
    // Normal items:
    const home: MenuItem = { id: View.DASHBOARD, label: 'Home', icon: LayoutDashboard };
    const newOrders: MenuItem = { id: View.NEW_ORDERS, label: 'New Orders', icon: Zap, badge: newOrdersCount > 0 ? newOrdersCount.toString() : null, badgeColor: 'bg-brand-500 text-white' };
    const orderHistory: MenuItem = { id: View.ORDERS, label: 'Order History', icon: ShoppingCart };
    const returnedOrders: MenuItem = { id: View.RETURNS, label: 'Returned Orders', icon: Package, badge: returnRequestsCount && returnRequestsCount > 0 ? returnRequestsCount.toString() : null, badgeColor: 'bg-rose-500 text-white' };
    const products: MenuItem = { id: View.PRODUCTS, label: 'Products', icon: Package };
    const floorPlan: MenuItem = { id: View.TABLES, label: 'Seat Management', icon: Calendar };
    const tableWaitlist: MenuItem = { id: View.WAITLIST, label: 'Table Waitlist', icon: ListOrdered };
    const analytics: MenuItem = { id: View.ANALYTICS, label: 'Analytics', icon: BarChart2 };
    const payments: MenuItem = { id: View.PAYMENTS, label: 'Payments', icon: CreditCard };
    const discounts: MenuItem = { id: View.DISCOUNTS, label: 'Discounts', icon: Tag };
    const customers: MenuItem = { id: View.CUSTOMERS, label: 'Customer', icon: Users };
    const shopLocation: MenuItem = { id: View.SHOP_LOCATION, label: 'Shop Location', icon: MapPin };
    const support: MenuItem = { id: View.SUPPORT, label: 'Support', icon: LifeBuoy };
    const aiAssistant: MenuItem = { id: View.AI_ASSISTANT, label: 'AI Assistant', icon: Brain, badge: 'NEW', badgeColor: 'bg-indigo-500 text-white' };

    // New Food/Dineout items:
    const kitchen: MenuItem = { id: View.KITCHEN, label: 'Kitchen Feed', icon: Zap };
    const reservations: MenuItem = { id: View.RESERVATIONS, label: 'Reservations', icon: Calendar };
    const qrCheckIn: MenuItem = { id: View.QR_CHECKIN, label: 'QR Check-In', icon: Check };

    if (vendorType === 'FOOD_VENDOR') {
      if (foodBusinessType === 'ONLINE_FOOD') {
        return [
          { ...home, label: 'Food Dashboard' },
          newOrders,
          orderHistory,
          returnedOrders,
          { ...products, label: 'Products & Inventory' },
          kitchen,
          analytics,
          payments,
          discounts,
          support,
          aiAssistant
        ];
      } else if (foodBusinessType === 'RESTAURANT_BOOKING') {
        return [
          { ...home, label: 'Restaurant Dashboard' },
          reservations,
          floorPlan,
          tableWaitlist,
          qrCheckIn,
          analytics,
          payments,
          support,
          aiAssistant
        ];
      } else if (foodBusinessType === 'BOTH') {
        return [
          { ...home, label: 'Dine & Order Home' },
          newOrders,
          orderHistory,
          returnedOrders,
          { ...products, label: 'Products & Inventory' },
          kitchen,
          reservations,
          floorPlan,
          tableWaitlist,
          qrCheckIn,
          analytics,
          payments,
          discounts,
          customers,
          shopLocation,
          support,
          aiAssistant
        ];
      }
    }

    // Default E-commerce or Street Hub:
    return [
      home,
      newOrders,
      orderHistory,
      returnedOrders,
      products,
      ...(vendorType === 'FOOD' || vendorType === 'FOOD_VENDOR' ? [floorPlan, tableWaitlist] : []),
      analytics,
      payments,
      discounts,
      customers,
      shopLocation,
      support,
      aiAssistant
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-brand-900 text-gray-300 flex flex-col h-full overflow-hidden shrink-0 border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <JiffyLogo shopName={shopName} />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1 mt-6">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group relative ${activeView === item.id
              ? 'bg-white/5 text-white font-bold'
              : 'hover:bg-white/5 hover:text-white'
              }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className={`w-4 h-4 transition-colors ${activeView === item.id ? 'text-brand-500' : 'text-slate-500 group-hover:text-brand-500'}`} />
              <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
            </div>
            {item.badge && <span className={`${item.badgeColor} text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm`}>{item.badge}</span>}
            
            {activeView === item.id && <div className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full"></div>}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Nexus Node Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-white">Live Data Stream</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
