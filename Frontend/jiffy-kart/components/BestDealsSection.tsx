import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigation } from '../hooks';
import { BannerService } from '../services/bannerService';
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080/api';
  }
  return 'https://api.jiffykart.in/api';
};

const BACKEND_URL = getBaseUrl().replace(/\/api$/, '');

const resolveImg = (url: string | null | undefined): string => {
  if (!url) return '';
  let finalUrl = url;
  if (finalUrl.includes('localhost:8080/uploads/')) {
    finalUrl = finalUrl.replace('http://localhost:8080', BACKEND_URL);
  }
  if (finalUrl.startsWith('http')) return finalUrl;
  return BACKEND_URL + (finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl);
};

interface DealStore {
  id: number;
  rank: number;
  name: string;
  type: string;
  discount: string;
  scope: string;
  bgStyle: React.CSSProperties; // Custom inline style for background color to support full color range
  textClass: string; // Subtitle text color class
  image: string; // Product showcase image
  shopUrl: string;
}

export const BestDealsSection: React.FC = () => {
  const { navigate } = useNavigation();
  const [stores, setStores] = useState<DealStore[]>([]);

  // 5 Premium Dummy Banners fallback
  const DUMMY_STORES: DealStore[] = [
    {
      id: 1,
      rank: 1,
      name: 'TechWorld',
      type: 'Electronics Store',
      discount: '40% OFF',
      scope: 'On Mobiles & Accessories',
      bgStyle: { backgroundColor: '#3b5998' }, // Deep Blue
      textClass: 'text-blue-100',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', // Premium Headphones
      shopUrl: 'shops'
    },
    {
      id: 2,
      rank: 2,
      name: 'Fashionista',
      type: 'Fashion Store',
      discount: '30% OFF',
      scope: 'On Entire Collection',
      bgStyle: { backgroundColor: '#ff6b6b' }, // Coral Pink
      textClass: 'text-rose-100',
      image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=500&q=80', // Ethnic/Modern wear model
      shopUrl: 'shops'
    },
    {
      id: 3,
      rank: 3,
      name: 'HomeStyle Mart',
      type: 'Home & Kitchen',
      discount: '35% OFF',
      scope: 'On Kitchen Essentials',
      bgStyle: { backgroundColor: '#a3d9c9' }, // Soft Mint Green
      textClass: 'text-emerald-800/80',
      image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&q=80', // Blender/Mixer appliances
      shopUrl: 'shops'
    },
    {
      id: 4,
      rank: 4,
      name: 'BeautyBliss',
      type: 'Beauty Store',
      discount: '25% OFF',
      scope: 'On Skincare & Makeup',
      bgStyle: { backgroundColor: '#ffccd5' }, // Pastel Pink
      textClass: 'text-pink-900/70',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80', // Skincare cosmetics
      shopUrl: 'shops'
    },
    {
      id: 5,
      rank: 5,
      name: 'BookNook',
      type: 'Book Store',
      discount: '30% OFF',
      scope: 'On Bestsellers',
      bgStyle: { backgroundColor: '#fce1b6' }, // Peach Orange
      textClass: 'text-amber-950/70',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80', // Stack of books
      shopUrl: 'shops'
    }
  ];

  // Static styling presets for database banners based on their index
  const presets = [
    { bgStyle: { backgroundColor: '#3b5998' }, textClass: 'text-blue-100' },
    { bgStyle: { backgroundColor: '#ff6b6b' }, textClass: 'text-rose-100' },
    { bgStyle: { backgroundColor: '#a3d9c9' }, textClass: 'text-emerald-800/80' },
    { bgStyle: { backgroundColor: '#ffccd5' }, textClass: 'text-pink-900/70' },
    { bgStyle: { backgroundColor: '#fce1b6' }, textClass: 'text-amber-950/70' }
  ];

  useEffect(() => {
    const fetchBanners = async () => {
      // Fetch banners specifically uploaded to the "Deals" position
      const fetchedBanners = await BannerService.getBanners('Deals');
      if (fetchedBanners && fetchedBanners.length > 0) {
        // Map database banners to the DealStore component structure
        const mappedStores: DealStore[] = fetchedBanners.map((banner, index) => {
          const preset = presets[index % presets.length];
          const imgUrl = resolveImg(banner.imageDesktopUrl || banner.imageMobileUrl);
          
          return {
            id: Number(banner.id) || index + 1,
            rank: index + 1,
            name: banner.title,
            type: banner.subtitle || 'Promo Partner',
            discount: banner.ctaText || 'Special Offer',
            scope: banner.ctaUrl || 'Check in-store details',
            bgStyle: preset.bgStyle,
            textClass: preset.textClass,
            image: imgUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
            shopUrl: 'shops'
          };
        });
        setStores(mappedStores);
      } else {
        // Fallback to beautiful mock banners if database has none
        setStores(DUMMY_STORES);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Best Deals Stores</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Premium curated offers near you</p>
        </div>
        <button 
          onClick={() => navigate('shops', { category: '' })}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid of curatable Store Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 pb-6">
        {stores.map((store) => (
          <div
            key={store.id}
            style={store.bgStyle}
            className="rounded-[2.5rem] p-5 flex flex-col justify-between aspect-[3/5] relative overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
          >
            {/* Header Content */}
            <div className="flex flex-col items-start w-full">
              {/* Rank indicator */}
              <span className="w-6 h-6 rounded-full bg-white text-slate-900 text-xs font-black flex items-center justify-center shadow-md mb-3">
                {store.rank}
              </span>
              
              {/* Store Details */}
              <h4 className="font-extrabold text-white text-base tracking-tight leading-tight truncate w-full">
                {store.name}
              </h4>
              <p className={`text-[9px] ${store.textClass} font-bold uppercase tracking-wider mt-0.5 truncate w-full`}>
                {store.type}
              </p>

              {/* Discount details */}
              <div className="mt-3">
                <p className="text-white text-xl font-black tracking-tight leading-none">
                  {store.discount}
                </p>
                <p className="text-[10px] text-white/90 font-semibold leading-tight mt-1 truncate w-full">
                  {store.scope}
                </p>
              </div>
            </div>

            {/* Showcase Image in center/bottom (using flex layout to dynamically fit without overlapping) */}
            <div className="flex-1 w-full my-2 flex items-center justify-center min-h-0 overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <img
                src={store.image}
                alt={store.name}
                className="max-w-full max-h-36 object-contain rounded-2xl shadow-md border border-white/10 bg-white p-2"
              />
            </div>

            {/* Shop Now Action Button at the very bottom */}
            <button
              onClick={() => navigate(store.shopUrl as any, { category: store.name })}
              className="w-full py-3 bg-white text-slate-900 font-black text-xs rounded-2xl shadow-md border border-slate-100 hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-1 shrink-0"
            >
              Shop Now <ChevronRight size={14} className="stroke-[3]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
