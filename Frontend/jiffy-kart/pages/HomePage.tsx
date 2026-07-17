
import React, { useEffect, useState, useMemo } from 'react';
import { HeroSection } from '../components/HeroSection';
import { CategoryGrid } from '../components/CategoryGrid';
import { HomeShopSection } from '../components/HomeShopSection';
import { JiffyStreetHomeSection } from '../components/JiffyStreetHomeSection';
import { JiffyCafeHomeSection } from '../components/JiffyCafeHomeSection';
import { CATEGORIES } from '../components/constants';
import { useNavigation, useCart } from '../hooks';
import { ApiService } from '../services/apiService';
import { Shop } from '../types';
import { ShopSkeleton } from '../components/Skeleton';
import { SlidersHorizontal, Sparkles, CheckCircle2, X, Store, Coffee, ArrowRight } from 'lucide-react';
import { BlogSection } from '../components/BlogSection';


export const HomePage: React.FC = () => {
  const { navigate, city, cityObj, area } = useNavigation();
  const { addToCart } = useCart();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [activeFilters, setActiveFilters] = useState({
    rating4Plus: false,
    fastDelivery: false,
  });

  useEffect(() => {
    loadInitialData();
  }, [city, area]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const fetchedShops = await ApiService.getShops({
        city,
        area: area === 'All Areas' ? undefined : area
      });
      setShops(fetchedShops);
    } catch (error) {
      console.error("Failed to load home page data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (id: string) => {
    const category = CATEGORIES.find(c => c.id === id);
    if (category) {
      navigate('shops', { category: category.name });
    }
  };

  // Memoized Filtered Shops
  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      if (activeFilters.rating4Plus && shop.rating < 4.0) return false;
      if (activeFilters.fastDelivery) {
        const minTime = parseInt(shop.delivery_time.split('-')[0]);
        if (minTime > 30) return false;
      }
      return true;
    });
  }, [shops, activeFilters]);

  const ecommerceShops = useMemo(() => {
    return filteredShops.filter(s => s.vendorType === 'ECOMMERCE' || !s.vendorType);
  }, [filteredShops]);

  const restaurantShops = useMemo(() => {
    return filteredShops.filter(s => s.vendorType === 'FOOD');
  }, [filteredShops]);

  const toggleFilter = (filterKey: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      rating4Plus: false,
      fastDelivery: false,
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v);

  return (
    <div className="animate-fade-in bg-white min-h-screen pb-24">
      {/* 1. Hero */}
      <HeroSection onShopNowClick={() => navigate('shops', { category: '' })} />

      {/* 2. Category Discovery Grid (What's on your mind?) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        <CategoryGrid onCategoryClick={handleCategoryClick} />
      </div>

      {/* 3. Category Promotional Banner */}
      <div className="mt-8">
        <HeroSection position="Category" />
      </div>

      {/* 4. Sunday Jiffy Street Promo */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <JiffyStreetHomeSection onVisit={() => navigate('jiffy-street')} />
      </div>

      {/* 4a. Street Hub Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <JiffyCafeHomeSection onVisit={() => navigate('jiffy-cafe')} />
      </div>

      {/* 5. Main Store listings (Filters first) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 mb-8">
         <div className="flex items-center justify-between">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Verified partners in {area && area !== 'All Areas' ? `${area}, ${city}` : city}</p>
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={clearFilters}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-xl active:scale-95 ${hasActiveFilters ? 'bg-slate-900 text-white shadow-slate-900/10' : 'bg-slate-100 text-slate-400 cursor-default'}`}
              >
                <SlidersHorizontal size={14} /> {hasActiveFilters ? 'Clear' : 'Filters'}
              </button>

              <button
                onClick={() => toggleFilter('rating4Plus')}
                className={`px-5 py-2.5 border rounded-2xl text-xs font-black uppercase tracking-widest transition active:scale-95 flex items-center gap-2 ${activeFilters.rating4Plus ? 'bg-indigo-50 border-primary text-primary shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}`}
              >
                {activeFilters.rating4Plus && <CheckCircle2 size={14} />} 4.0+ Rating
              </button>

              <button
                onClick={() => toggleFilter('fastDelivery')}
                className={`px-5 py-2.5 border rounded-2xl text-xs font-black uppercase tracking-widest transition active:scale-95 flex items-center gap-2 ${activeFilters.fastDelivery ? 'bg-indigo-50 border-primary text-primary shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}`}
              >
                {activeFilters.fastDelivery && <CheckCircle2 size={14} />} Under 30 Mins
              </button>
            </div>
         </div>
      </div>

      {/* 5. Shop Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ShopSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-24">
            {/* Ecommerce Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full shadow-sm shadow-primary/20"></div>
                  <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Ecommerce Stores</h4>
                </div>
                <button 
                  onClick={() => navigate('shops', { category: '', vendorType: 'ECOMMERCE' })}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-50 hover:bg-indigo-50 text-primary border border-slate-200 hover:border-primary/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  View All Stores <ArrowRight size={14} />
                </button>
              </div>
              
              {ecommerceShops.length > 0 ? (
                <HomeShopSection shops={ecommerceShops} onShopClick={(id) => navigate('details', { shopId: id })} />
              ) : (
                <div className="py-16 bg-slate-50 rounded-[2.5rem] text-center border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300">
                    <Store size={32} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No Ecommerce stores available in this area</p>
                  <p className="text-xs text-slate-400 font-medium">Try changing your location or check back later!</p>
                </div>
              )}
            </div>

            {/* Restaurant Section */}
            <div className="relative group">
              <div className={`transition-all duration-500 ${restaurantShops.length === 0 ? 'blur-[1.5px] opacity-80 select-none' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/20"></div>
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Restaurants & Food</h4>
                  </div>
                  <button 
                    onClick={() => navigate('shops', { category: '', vendorType: 'FOOD' })}
                    disabled={restaurantShops.length === 0}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${restaurantShops.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100' : 'bg-slate-50 hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-500/30'}`}
                  >
                    View All Food <ArrowRight size={14} />
                  </button>
                </div>
                
                {restaurantShops.length > 0 ? (
                  <HomeShopSection shops={restaurantShops} onShopClick={(id) => navigate('details', { shopId: id })} />
                ) : (
                  <div className="py-16 bg-emerald-50/30 rounded-[2.5rem] text-center border-2 border-dashed border-emerald-100 flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-300">
                      <Coffee size={32} />
                    </div>
                    <p className="text-emerald-600/50 font-bold text-sm uppercase tracking-widest">No restaurants available in this area</p>
                    <p className="text-xs text-emerald-600/40 font-medium">Try changing your location or explore other categories!</p>
                  </div>
                )}
              </div>

              {restaurantShops.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                   <div className="bg-white/80 backdrop-blur-md border border-emerald-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transform rotate-1">
                     <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                       <Coffee size={20} />
                     </div>
                     <div>
                       <p className="text-emerald-900 font-black uppercase text-xs tracking-widest">Coming Soon</p>
                       <p className="text-emerald-600 text-[10px] font-bold">Bringing local flavors to you...</p>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Local Blogs */}
      <div className="mt-24">
        <BlogSection />
      </div>


    </div>
  );
};
