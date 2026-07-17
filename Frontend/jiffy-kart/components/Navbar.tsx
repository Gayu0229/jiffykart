import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, MapPin, Store, User, ChevronDown, Package, Wallet, Menu } from 'lucide-react';
import { useNavigation, useAuth } from '../hooks';
import { LocationPicker } from './LocationPicker';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  onAccountClick?: () => void;
  onCartClick?: () => void;
  onHomeClick?: () => void;
  onBecomeSellerClick?: () => void;
  onTrackClick?: () => void;
  onSearch?: (query: string) => void;
  cartCount?: number;
  isLoggedIn?: boolean;
  onMenuOpen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onAccountClick,
  onCartClick,
  onHomeClick,
  onBecomeSellerClick,
  onTrackClick,
  onSearch,
  cartCount = 0,
  isLoggedIn,
  onMenuOpen
}) => {
  const { city, area, navigate } = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[60] bg-white border-b border-slate-200 py-3 lg:h-20 lg:py-0 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 lg:gap-x-8">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer shrink-0 group order-1 h-10 sm:h-12 w-[110px] sm:w-[140px] overflow-visible"
              onClick={onHomeClick}
            >
              <img
                src="/assets/images/logo.jpg"
                alt="Jiffy Kart"
                className="h-full w-auto object-contain group-hover:opacity-80 transition-all origin-left scale-[1.8] sm:scale-[1.6] mix-blend-multiply"
              />
            </div>

            {/* Location & Search - Stays full width on mobile/tablet, merges on laptop+ */}
            <div className="w-full lg:flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:max-w-xl order-3 lg:order-2">
              <div
                onClick={() => setIsLocationPickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition border border-slate-100 shrink-0 shadow-sm sm:w-auto"
              >
                <MapPin size={16} className="text-primary shrink-0" />
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-700 truncate max-w-none sm:max-w-[100px] md:max-w-[120px]">
                  {area !== 'All Areas' ? area : city}
                </span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </div>

              <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search stores or items..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold text-slate-900 shadow-inner"
                />
              </div>
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 lg:gap-6 order-2 lg:order-3">
              {isLoggedIn && (
                <button
                  onClick={() => navigate('wallet')}
                  className="hidden sm:flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-primary transition px-2 py-2 rounded-xl hover:bg-slate-50"
                >
                  <Wallet size={18} />
                  <span className="hidden xl:inline">Wallet</span>
                </button>
              )}

              {isLoggedIn && onTrackClick && (
                <button
                  onClick={onTrackClick}
                  className="hidden md:flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-primary transition px-2 py-2 rounded-xl hover:bg-slate-50"
                >
                  <Package size={18} />
                  <span className="hidden xl:inline">Orders</span>
                </button>
              )}

              <button
                onClick={onBecomeSellerClick}
                className="hidden md:flex items-center gap-2 text-slate-600 font-bold text-sm hover:text-primary transition px-2 py-2 rounded-xl hover:bg-slate-50"
              >
                <Store size={18} />
                <span className="hidden xl:inline">Partner</span>
              </button>
              {isLoggedIn && <NotificationBell />}

              <button
                onClick={onAccountClick}
                className="bg-slate-50 text-slate-600 hover:text-primary hover:bg-white rounded-2xl border border-slate-100 transition shadow-sm overflow-hidden flex items-center justify-center p-0"
                style={{ width: '40px', height: '40px' }}
              >
                {isLoggedIn && user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : isLoggedIn && user?.name ? (
                  <span className="font-black text-sm uppercase">{user.name.charAt(0)}</span>
                ) : (
                  <User size={18} />
                )}
              </button>

              <button
                onClick={onCartClick}
                className="p-2.5 bg-slate-900 text-white rounded-2xl transition shadow-xl shadow-slate-900/10 relative group active:scale-95"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-highlight text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={onMenuOpen}
                className="lg:hidden p-2.5 bg-slate-50 text-slate-600 hover:text-primary rounded-2xl border border-slate-100 transition active:scale-95"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <LocationPicker isOpen={isLocationPickerOpen} onClose={() => setIsLocationPickerOpen(false)} />
    </>
  );
};