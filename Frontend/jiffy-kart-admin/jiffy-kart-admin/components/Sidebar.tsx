
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Settings,
  LogOut,
  Store,
  Truck,
  Wallet,
  UserCheck,
  Megaphone,
  Headphones,
  ChevronDown,
  ChevronRight,
  Circle,
  Briefcase,
  UserPlus,
  MonitorPlay,
  Zap,
  Crown,
  Coffee,
  CalendarDays
} from 'lucide-react';

interface NavItem {
  title: string;
  icon: React.ElementType;
  items?: string[];
  path?: string;
  allowedRoles?: string[]; // New: Filter visibility
}

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  userRole?: string;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, userRole = 'Super Admin', onSignOut }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Vendors': true,
    'Field Managers': true,
    'User Accounts': true,
    'Payments': true,
    'Products': true,
    'System Settings': true
  });

  const isFranchise = userRole.includes('Franchise');

  useEffect(() => {
    // Auto-expand section if activePage is within it
    menuStructure.forEach(section => {
      if (section.items && section.items.includes(activePage)) {
        setExpandedSections(prev => ({ ...prev, [section.title]: true }));
      }
    });
  }, [activePage]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const menuStructure: NavItem[] = [
    {
      title: isFranchise ? 'Field Manager Dashboard' : 'Dashboard',
      icon: LayoutDashboard,
      path: isFranchise ? 'Field Manager Dashboard' : 'Overview',
      allowedRoles: ['Super Admin', 'Manager', 'Editor', 'Support Agent', 'Franchise Owner', 'Franchise Staff']
    },
    {
      title: 'User Accounts',
      icon: UserPlus,
      allowedRoles: ['Super Admin'],
      items: [
        'Create Field Manager Login',
        'Login Credentials'
      ]
    },
    {
      title: 'Field Managers',
      icon: Briefcase,
      allowedRoles: ['Super Admin', 'Manager'], // Hidden from Field Manager (they have their own dash)
      items: [
        'All Field Managers',
        'Field Manager Requests',
        'Field Manager Territories',
        'Field Manager Payouts',
        'Field Manager Issues'
      ]
    },
    {
      title: 'Vendors',
      icon: Users,
      allowedRoles: ['Super Admin', 'Manager', 'Franchise Owner'],
      items: [
        'All Vendors',
        'Pending Vendor Approvals',
        'Vendor KYC Documents',
        'Vendor Performance',
        'Vendor Payments'
      ]
    },
    {
      title: 'Shops',
      icon: Store,
      allowedRoles: ['Super Admin', 'Manager', 'Franchise Owner'],
      items: [
        'All Shops',
        'Pending Shop Approval',
        'Blacklisted Shops'
      ]
    },
    {
      title: 'Products',
      icon: Package,
      allowedRoles: ['Super Admin', 'Manager', 'Editor', 'Franchise Owner'],
      items: [
        'Jiffy Street',
        'Add Jiffy Street Product',
        'All Products',
        'Pending Product Approval',
        'Reviews'
      ]
    },
    {
      title: 'Orders',
      icon: ShoppingBag,
      allowedRoles: ['Super Admin', 'Manager', 'Support Agent', 'Franchise Owner'],
      items: [
        'All Orders',
        'Live Orders',
        'Cancelled Orders',
        'Returned Orders',
        'Replacement Requests'
      ]
    },
    {
      title: 'Delivery',
      icon: Truck,
      allowedRoles: ['Super Admin', 'Manager', 'Franchise Owner'],
      items: [
        'Delivery Partners',
        'Delivery Zones',
        'Geo Locations',
        'Assign Delivery Partner',
        'Live Tracking'
      ]
    },
    {
      title: 'Payments',
      icon: Wallet,
      allowedRoles: ['Super Admin', 'Manager', 'Franchise Owner'],
      items: [
        'Vendor Payouts',
        'Delivery Partner Payouts',
        'UPI Payment Verification',
        'Refunds',
        'Commission Settings',
        'Transaction Reports'
      ]
    },
    {
      title: 'Customers',
      icon: UserCheck,
      allowedRoles: ['Super Admin', 'Manager', 'Support Agent'], // Franchise typically handles shops, not direct customers globally
      items: [
        'All Customers',
        // 'Complaints',
        // 'JiffyStreet Reviews'
      ]
    },
    // {
    //   title: 'Advertisements',
    //   icon: MonitorPlay,
    //   allowedRoles: ['Super Admin', 'Manager', 'Editor'],
    //   path: 'All Ads'
    // },~
    {
      title: 'Marketing',
      icon: Megaphone,
      allowedRoles: ['Super Admin', 'Manager', 'Editor'], // Franchise usually restricted
      items: [
        'Offer Banners',
        'Coupons',
        // 'Notification Manager'
      ]
    },
    {
      title: 'Subscriptions',
      icon: Crown,
      allowedRoles: ['Super Admin', 'Manager'],
      items: [
        'Subscription Plans',
        'Subscription Users',
        'Subscription Analytics'
      ]
    },
    {
      title: 'Support',
      icon: Headphones,
      allowedRoles: ['Super Admin', 'Manager', 'Support Agent', 'Franchise Owner'],
      items: [
        'Support Tickets'
      ]
    },
    {
      title: 'Restaurant Bookings',
      icon: CalendarDays,
      allowedRoles: ['Super Admin', 'Manager'],
      items: [
        'Live Reservations'
      ]
    }
    // ,
    // {
    //   title: 'System Settings',
    //   icon: Settings,
    //   allowedRoles: ['Super Admin'], // Hidden from Franchise
    //   items: [
    //     'Admin Accounts',
    //     'Roles & Permissions'
    //   ]
    // }
  ];

  return (
    <aside className="flex flex-col w-64 bg-dark text-white h-screen sticky top-0 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-800 scrollbar-track-transparent">
      <div className="p-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(isFranchise ? 'Field Manager Dashboard' : 'Overview')}>
          {/* JiffyKart Logo Icon */}
          {/* <div className="relative w-8 h-8 flex items-center justify-center">
            <img src="/logo2.png" alt="Logo" className="w-full h-full object-contain" />
          </div> */}
          <span className="text-xl font-bold tracking-tight text-white">JiffyKart</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuStructure.map((section) => {
          // Check Permissions
          if (section.allowedRoles && !section.allowedRoles.includes(userRole) && !section.allowedRoles.includes('All')) {
            return null;
          }

          const isExpanded = expandedSections[section.title];
          const isActive = activePage === (section.path || section.title);

          return (
            <div key={section.title} className="mb-1">
              {section.items ? (
                // Group with sub-items
                <div>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200 ${isExpanded ? 'text-white bg-indigo-900/50' : 'text-accent hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center">
                      <section.icon size={20} className="mr-3" />
                      <span className="font-medium text-sm">{section.title}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => onNavigate(item)}
                          className={`flex items-center w-full px-4 py-2 text-sm rounded-md transition-colors ${activePage === item
                            ? 'text-white bg-indigo-500/30'
                            : 'text-accent/80 hover:text-white'
                            }`}
                        >
                          <Circle size={6} className={`mr-3 ${activePage === item ? 'fill-accent text-accent' : 'fill-white/20 text-white/20'}`} />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single Item
                <button
                  onClick={() => onNavigate(section.path || section.title)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-accent hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <section.icon size={20} className="mr-3" />
                  <span className="font-medium text-sm">{section.title}</span>
                </button>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onSignOut}
          className="flex items-center w-full px-4 py-3 text-accent hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
