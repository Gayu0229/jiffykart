import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ApiService } from '../services/apiService';
import { Shop, Product, Banner } from '../types';
import {
  Star, Clock, MapPin, ArrowLeft, Filter, ChevronDown,
  CheckCircle2, CheckCircle, Loader2, AlertCircle, RefreshCw,
  Search, X, Share2, Send, Layers, Check, SlidersHorizontal, Plus, Shield
} from 'lucide-react';
import { AdBanner } from './AdBanner';
import { BannerService } from '../services/bannerService';
import { ShopSkeleton } from './Skeleton';
import { HeroSection } from './HeroSection';

interface ShopListingProps {
  category: string;
  city?: string;
  initialArea?: string;
  searchQuery?: string;
  onBack: () => void;
  onShopClick: (shopId: string) => void;
  vendorType?: string;
}

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Rating: High to Low', value: 'rating' },
  { label: 'Delivery Time: Fastest', value: 'time' },
  { label: 'Cost: Low to High', value: 'price_low_high' },
  { label: 'Cost: High to Low', value: 'price_high_low' },
  { label: 'Cost: Low to Medium', value: 'price_low_med' },
  { label: 'Cost: Medium to High', value: 'price_med_high' }
];

export const ShopListing: React.FC<ShopListingProps> = ({ category, city, initialArea, searchQuery, onBack, onShopClick, vendorType }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState<Shop | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [filters, setFilters] = useState({
    offers: false,
    rating4Plus: false,
    fastDelivery: false,
    newlyAdded: false,
    openNow: false,
  });

  const [sortBy, setSortBy] = useState('relevance');
  const [selectedArea, setSelectedArea] = useState(initialArea || 'All');
  const [categoryBanners, setCategoryBanners] = useState<Banner[]>([]);
  const [inlineBanners, setInlineBanners] = useState<Banner[]>([]);

  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'area' | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const fetchBanners = async () => {
      const allBanners = await BannerService.getActiveBanners('');
      setCategoryBanners(allBanners.filter(b => b.position === 'Category'));
      setInlineBanners(allBanners.filter(b => b.position === 'Inline'));
    };
    fetchBanners();
  }, []);

  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: { city?: string; area?: string; category?: string; vendorType?: string } = {};
      if (city) apiFilters.city = city;
      if (selectedArea && selectedArea !== 'All') apiFilters.area = selectedArea;
      if (category && category.trim() !== '') apiFilters.category = category;
      if (vendorType) apiFilters.vendorType = vendorType;

      const data = await ApiService.getShops(apiFilters);
      // Ensure we have data or mock defaults
      setShops(data && data.length > 0 ? data : []);
    } catch (err) {
      // In mock mode, the service should catch this, but just in case:
      setError("Unable to connect to our servers. Showing offline catalog.");
    } finally {
      setIsLoading(false);
    }
  }, [city, selectedArea, category, vendorType]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortRef.current && !sortRef.current.contains(event.target as Node) &&
        areaRef.current && !areaRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const CHENNAI_AREAS = [
    "T. Nagar", "Velachery", "Anna Nagar", "Porur", "Tambaram",
    "Adyar", "Kodambakkam", "Perambur", "Guindy", "Triplicane",
    "Medavakkam", "Egmore", "Nungambakkam", "Saidapet", "Royapuram", "Chrompet"
  ];

  const filteredShops = useMemo(() => {
    let result = shops || [];

    if (vendorType) {
      result = result.filter(shop => {
        if (vendorType === 'ECOMMERCE') return shop.vendorType === 'ECOMMERCE' || !shop.vendorType;
        if (vendorType === 'FOOD') return shop.vendorType === 'FOOD';
        return shop.vendorType === vendorType;
      });
    }

    if (localSearch) {
      const query = localSearch.toLowerCase();
      result = result.filter(shop => {
        const matchesName = shop.name.toLowerCase().includes(query);
        const matchesTags = shop.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesLocation = shop.location.toLowerCase().includes(query);
        return matchesName || matchesTags || matchesLocation;
      });
    }

    return result.filter(shop => {
      if (filters.rating4Plus && shop.rating < 4.0) return false;
      if (filters.offers && (!shop.offers || shop.offers.length === 0)) return false;
      if (filters.fastDelivery) {
        const minTime = parseInt(shop.delivery_time?.split('-')[0] || '60');
        if (minTime > 30) return false;
      }
      if (filters.newlyAdded && !shop.id.includes('1')) return false;
      if (filters.openNow && shop.rating < 3.5) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'time') {
        const timeA = parseInt(a.delivery_time?.split('-')[0] || '60');
        const timeB = parseInt(b.delivery_time?.split('-')[0] || '60');
        return timeA - timeB;
      }
      const getCost = (s: Shop) => parseInt(s.cost_for_two?.replace(/\D/g, '') || '0');
      if (sortBy === 'price_low_high') return getCost(a) - getCost(b);
      if (sortBy === 'price_high_low') return getCost(b) - getCost(a);
      if (sortBy === 'price_low_med') {
        // Show items up to ₹500 first, sorted low to high
        const ca = getCost(a), cb = getCost(b);
        const aInRange = ca <= 500 ? 0 : 1;
        const bInRange = cb <= 500 ? 0 : 1;
        if (aInRange !== bInRange) return aInRange - bInRange;
        return ca - cb;
      }
      if (sortBy === 'price_med_high') {
        // Show items above ₹200 first, sorted low to high
        const ca = getCost(a), cb = getCost(b);
        const aInRange = ca >= 200 ? 0 : 1;
        const bInRange = cb >= 200 ? 0 : 1;
        if (aInRange !== bInRange) return aInRange - bInRange;
        return ca - cb;
      }
      return 0;
    });
  }, [shops, filters, sortBy, localSearch]);

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80";
  const getAreaName = (location: string) => location?.split(',')[0] || 'Unknown';
  const toggleDropdown = (name: 'sort' | 'area') => setActiveDropdown(prev => prev === name ? null : name);

  const handleShareShop = (e: React.MouseEvent, shop: Shop) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + '?shopId=' + shop.id;
    if (navigator.share) {
      navigator.share({
        title: shop.name,
        text: `Shop electronics and fashion from ${shop.name} on Jiffy Kart!`,
        url: shareUrl
      }).catch(console.error);
    } else {
      setShowShareOptions(shop);
    }
  };

  const clearFilters = () => {
    setFilters({
      offers: false,
      rating4Plus: false,
      fastDelivery: false,
      newlyAdded: false,
      openNow: false,
    });
    setSortBy('relevance');
    setSelectedArea('All');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const primaryCategoryBanner = categoryBanners.length > 0 ? categoryBanners[0] : null;

  return (
    <div className="animate-fade-in pb-12 bg-background min-h-screen">
      {/* Toast */}
      {toastMessage && createPortal(
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[250] w-[90%] max-w-sm pointer-events-none">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-md">
            <div className="bg-emerald-500 rounded-full p-1.5 shrink-0">
              <Check size={16} strokeWidth={4} className="text-white" />
            </div>
            <p className="font-bold text-sm tracking-tight flex-1">{toastMessage}</p>
          </div>
        </div>,
        document.body
      )}

      {/* Promotional Banner (Street Position) */}
      <HeroSection position="Street" />

      {/* HEADER SECTION */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none truncate">
                  {vendorType === 'ECOMMERCE' ? 'Ecommerce Stores' : vendorType === 'FOOD' ? 'Restaurants & Food' : (category || "Explore Shops")} 
                  <span className="text-slate-400 font-medium text-base md:text-lg ml-1">in {selectedArea !== 'All' ? selectedArea : city}</span>
                </h1>
              </div>
            </div>

            <div className="relative w-full md:w-96 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search store by name or tags..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-12 pr-10 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all font-bold text-slate-900 shadow-inner"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* FILTER BAR and Pills - Hidden for Food and Groceries */}
          {!(category === 'Food' || category === 'Groceries' || vendorType === 'FOOD') && (
            <>
              {/* FILTER BAR — Primary Controls (no overflow so dropdowns work) */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {/* Master Filter Button */}
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition shadow-sm border whitespace-nowrap ${activeFilterCount > 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}
                >
                  <SlidersHorizontal size={14} />
                  Filter {activeFilterCount > 0 && <span className="ml-1 bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{activeFilterCount}</span>}
                </button>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => toggleDropdown('sort')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition border whitespace-nowrap ${sortBy !== 'relevance' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}
                  >
                    Sort By <ChevronDown size={12} className={`transition-transform duration-300 ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeDropdown === 'sort' && (
                    <div className="absolute top-full left-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up p-1.5">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition flex items-center justify-between ${sortBy === opt.value ? 'text-primary bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          {opt.label}
                          {sortBy === opt.value && <CheckCircle2 size={16} className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Area Dropdown */}
                {city === 'Chennai' && (
                  <div className="relative" ref={areaRef}>
                    <button
                      onClick={() => toggleDropdown('area')}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition border whitespace-nowrap ${selectedArea !== 'All' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}
                    >
                      <span className="truncate max-w-[80px] md:max-w-[100px]">{selectedArea === 'All' ? 'Area' : selectedArea}</span> <ChevronDown size={12} className={`transition-transform duration-300 ${activeDropdown === 'area' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'area' && (
                      <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-[400px] overflow-y-auto animate-slide-up p-1.5 custom-scrollbar">
                        <button onClick={() => { setSelectedArea('All'); setActiveDropdown(null); }} className="w-full text-left px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 border-b border-slate-50 text-primary flex items-center justify-between mb-1">
                          All Locations <MapPin size={14} />
                        </button>
                        {CHENNAI_AREAS.map(area => (
                          <button key={area} onClick={() => { setSelectedArea(area); setActiveDropdown(null); }} className={`w-full text-left px-4 py-3 text-xs font-bold rounded-xl transition flex items-center justify-between ${selectedArea === area ? 'text-primary bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {area}
                            {selectedArea === area && <Check size={14} className="text-primary" strokeWidth={4} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Filter Pills — scrollable row */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 mt-2">
                {[
                  { key: 'fastDelivery', label: 'Fast Delivery' },
                  { key: 'rating4Plus', label: 'Rating 4.0+' },
                  { key: 'offers', label: 'Offers' },
                  { key: 'newlyAdded', label: 'Newly Added' },
                  { key: 'openNow', label: 'Open Now' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilters(p => ({ ...p, [filter.key]: !p[filter.key as keyof typeof filters] }))}
                    className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 border shadow-sm whitespace-nowrap ${filters[filter.key as keyof typeof filters] ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary'}`}
                  >
                    {filter.label}
                    {filters[filter.key as keyof typeof filters] && <CheckCircle2 size={12} className="text-emerald-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SHOP GRID */}
      <div className="max-w-7xl mx-auto px-4">
        {error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-100 animate-fade-in shadow-sm px-6 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl shadow-sm flex items-center justify-center text-rose-500 mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Notice</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">{error}</p>
            <button
              onClick={fetchShops}
              className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest"
            >
              <RefreshCw size={18} /> Refresh Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map(i => <ShopSkeleton key={i} />)
            ) : (
              filteredShops.map((shop, index) => {
                const showInlineAd = (index + 1) % 6 === 0 && inlineBanners.length > 0;
                const currentInlineBanner = inlineBanners.length > 0 ? inlineBanners[Math.floor(index / 6) % inlineBanners.length] : null;

                return (
                  <React.Fragment key={shop.id}>
                    <div
                      className="bg-white rounded-[2.5rem] overflow-hidden shadow-soft hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 group cursor-pointer border border-transparent hover:border-primary/10 flex flex-col h-full"
                      onClick={() => onShopClick(shop.id)}
                    >
                      <div className="relative h-64 overflow-hidden shrink-0">
                        <img
                          src={shop.banner_url || shop.image || PLACEHOLDER_IMAGE}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80"></div>

                        <div className="absolute top-5 left-5 flex gap-2">
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl backdrop-blur-md ${shop.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-200 animate-pulse' : 'bg-red-200'}`}></span>
                            {shop.isOpen ? 'Open' : 'Closed'}
                          </div>
                        </div>

                        <div className="absolute top-5 right-5 flex gap-2 flex-col items-end">
                          {shop.active_coupons && shop.active_coupons.length > 0 ? (
                            <div className="bg-primary/95 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                              {shop.active_coupons[0].description}
                            </div>
                          ) : (
                            shop.offers && shop.offers.length > 0 && (
                              <div className="bg-primary/95 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                {shop.offers[0].description.split(' ')[0]}
                              </div>
                            )
                          )}
                        </div>

                        <div className="absolute bottom-5 right-5 flex items-center gap-2">
                          <button
                            onClick={(e) => handleShareShop(e, shop)}
                            className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full text-slate-700 transition shadow-lg border border-white/20 active:scale-90"
                            title="Share Store"
                          >
                            <Share2 size={16} />
                          </button>
                          <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black text-white shadow-xl flex items-center gap-1.5 border border-white/10">
                            <Clock size={12} className="text-primary" /> {shop.delivery_time}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 md:p-8 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-black text-xl md:text-2xl text-slate-900 leading-tight group-hover:text-primary transition-colors tracking-tight">{shop.name}</h3>
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-xs md:text-sm font-black shadow-inner shrink-0">
                            {shop.rating} <Star size={12} fill="currentColor" />
                          </div>
                        </div>

                        <p className="text-slate-400 font-bold text-[10px] md:text-sm mb-4 line-clamp-1 uppercase tracking-wider">{shop.tags?.join(' • ')}</p>

                        <div className="mt-auto pt-4 md:pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-primary" />
                              <span>{getAreaName(shop.location)}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span>{shop.distance}</span>
                          </div>
                          <span className="bg-indigo-50 text-primary font-black px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            View
                          </span>
                        </div>
                      </div>
                    </div>

                    {showInlineAd && currentInlineBanner && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <AdBanner
                          variant="inline"
                          title={currentInlineBanner.title}
                          subtitle={currentInlineBanner.subtitle}
                          ctaText={currentInlineBanner.ctaText}
                          gradient="from-[#4f46e5] to-[#818cf8]"
                          onClick={() => { if (currentInlineBanner.ctaUrl) window.open(currentInlineBanner.ctaUrl, '_blank'); }}
                          className="!h-auto shadow-2xl"
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        )}

        {!isLoading && !error && filteredShops.length === 0 && (
          (category === 'Food' || category === 'Groceries' || vendorType === 'FOOD') ? (
            <div className="flex flex-col items-center justify-center mt-8 animate-fade-in text-center">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
                Launching <br/><span className="text-primary">Soon</span>
              </h2>
              <img 
                src={`/assets/images/${category === 'Groceries' ? 'groceries_poster.png' : 'food_poster.png'}`} 
                alt={`${category} Coming Soon`}
                className="w-full max-w-xl h-auto rounded-[3rem] shadow-2xl border border-slate-200/50 object-contain blur-sm hover:blur-none transition-all duration-500"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-4 text-center animate-fade-in bg-slate-50 rounded-[3rem] border border-slate-100 mt-8 shadow-inner">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <Filter size={40} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Stores Found</h3>
              <p className="text-slate-500 mt-3 font-medium max-w-md mx-auto leading-relaxed text-sm">
                We couldn't find any stores matching your current criteria in this area. Try adjusting your filters or selecting a different location.
              </p>
              <button
                onClick={clearFilters}
                className="mt-8 text-white bg-slate-900 px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-lg hover:bg-primary transition-all active:scale-95 text-xs flex items-center gap-2"
              >
                <RefreshCw size={16} /> Reset All Filters
              </button>
            </div>
          )
        )}
      </div>

      {/* FILTER MODAL */}
      {
        showFilterModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilterModal(false)}></div>
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-primary">
                    <SlidersHorizontal size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Filters</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Refine your store results</p>
                  </div>
                </div>
                <button onClick={() => setShowFilterModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition text-slate-400">
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-12 bg-white">
                <div className="space-y-10">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Sort By</h4>
                    <div className="space-y-3">
                      {SORT_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all group hover:border-primary/30 has-[:checked]:border-primary has-[:checked]:bg-indigo-50/30">
                          <input
                            type="radio"
                            name="modal-sort"
                            value={opt.value}
                            checked={sortBy === opt.value}
                            onChange={() => setSortBy(opt.value)}
                            className="w-5 h-5 accent-primary"
                          />
                          <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Preferences</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'fastDelivery', label: 'Under 30 Mins', icon: <Clock size={16} /> },
                        { key: 'rating4Plus', label: 'Rating 4.0+', icon: <Star size={16} /> },
                        { key: 'offers', label: 'Great Offers', icon: <Layers size={16} /> },
                        { key: 'openNow', label: 'Open Now', icon: <CheckCircle size={16} /> },
                        { key: 'newlyAdded', label: 'Newly Added', icon: <Plus size={16} /> },
                      ].map((f) => (
                        <label key={f.key} className="flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all group hover:border-primary/30 has-[:checked]:border-primary has-[:checked]:bg-indigo-50/30">
                          <input
                            type="checkbox"
                            checked={filters[f.key as keyof typeof filters]}
                            onChange={() => setFilters(prev => ({ ...prev, [f.key]: !prev[f.key as keyof typeof filters] }))}
                            className="w-5 h-5 accent-primary rounded-lg"
                          />
                          <span className="flex-1 text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-slate-400">{f.icon}</span> {f.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <button
                  onClick={clearFilters}
                  className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors px-6 py-4"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-primary transition-all active:scale-95"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* SHARE MODAL */}
      {
        showShareOptions && createPortal(
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={() => setShowShareOptions(null)}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-slide-up p-10 text-center">
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Share Store</h3>
              <p className="text-slate-500 font-bold text-sm mb-10 uppercase tracking-widest">Spread the word</p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <a
                  href={`https://wa.me/?text=Check out ${showShareOptions.name} on Jiffy Kart! ${window.location.origin}?shopId=${showShareOptions.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-3 p-6 bg-emerald-50 rounded-3xl hover:bg-emerald-100 transition group"
                >
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                    <Send size={24} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">WhatsApp</span>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '?shopId=' + showShareOptions.id);
                    showToast("Shop link copied!");
                    setShowShareOptions(null);
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-3xl hover:bg-slate-100 transition group"
                >
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-900/20">
                    <Layers size={24} />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Copy Link</span>
                </button>
              </div>

              <button onClick={() => setShowShareOptions(null)} className="w-full py-5 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition uppercase text-xs tracking-widest">Close</button>
            </div>
          </div>,
          document.body
        )
      }
    </div >
  );
};