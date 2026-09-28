
import React, { useEffect, useState } from 'react';
import { CATEGORIES } from './constants';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AdBanner } from './AdBanner';
import { BannerService } from '../services/bannerService';
import { Banner } from '../types';

interface CollectionsPageProps {
  onCategoryClick: (id: string) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ onCategoryClick }) => {
  const [collectionBanners, setCollectionBanners] = useState<Banner[]>([]);

  // Fix: Added async wrapper to properly await Promise<Banner[]> from BannerService
  useEffect(() => {
    const fetchBanners = async () => {
      const allBanners = await BannerService.getActiveBanners();
      const banners = allBanners.filter(b => b.position === 'Collections');
      setCollectionBanners(banners);
    };
    fetchBanners();
  }, []);

  const primaryCollectionBanner = collectionBanners.length > 0 ? collectionBanners[0] : null;

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="bg-[#115e59] pt-12 pb-20 px-4 rounded-b-[2.5rem] relative overflow-hidden shadow-lg mb-10">
         {/* Background Elements */}
         <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#f59e0b] opacity-20 blur-3xl"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#ccfbf1] opacity-10 blur-3xl"></div>
         
         <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-teal-100 mb-6 border border-white/10">
               <Sparkles size={12} className="text-yellow-400" /> Curated Collections
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Explore Categories
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto opacity-80">
              Find exactly what you need from our wide range of premium local stores.
            </p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
         {/* Categories Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {CATEGORIES.map((cat, index) => (
               <button 
                  key={cat.id}
                  onClick={() => onCategoryClick(cat.id)}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left flex flex-col h-full relative overflow-hidden"
               >
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
                       index % 3 === 0 ? 'bg-teal-50 text-primary group-hover:bg-primary group-hover:text-white' :
                       index % 3 === 1 ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                       'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                   }`}>
                       {cat.iconComponent}
                   </div>
                   
                   <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                       {cat.name}
                   </h3>
                   <p className="text-xs text-gray-400 font-medium mb-6">View Products</p>
                   
                   <div className="mt-auto flex items-center gap-2 text-sm font-bold text-gray-300 group-hover:text-gray-900 transition-colors">
                       Explore <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                   </div>

                   {/* Hover Effect BG */}
                   <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"></div>
               </button>
            ))}
         </div>

         {/* Ad Banner */}
         {primaryCollectionBanner && (
            <div className="mb-12">
                <AdBanner 
                   variant="middle"
                   title={primaryCollectionBanner.title}
                   subtitle={primaryCollectionBanner.subtitle}
                   // Fix: Property 'ctaText' does not exist on type 'Banner'. Did you mean 'cta_text'?
                   ctaText={primaryCollectionBanner.cta_text}
                   gradient="from-[#333] to-[#000]"
                   onClick={() => {
                        if (primaryCollectionBanner.link) {
                            window.open(primaryCollectionBanner.link, '_blank');
                        } else {
                            document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
                        }
                   }}
                />
            </div>
         )}
      </div>
    </div>
  );
};