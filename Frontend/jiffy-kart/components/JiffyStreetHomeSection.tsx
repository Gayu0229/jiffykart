
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ImageIcon } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { Product } from '../types';

import { useNavigation } from '../hooks';

interface JiffyStreetHomeSectionProps {
  onVisit: () => void;
}

export const JiffyStreetHomeSection: React.FC<JiffyStreetHomeSectionProps> = ({ onVisit }) => {
  const { areaId } = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    ApiService.getJiffyStreetProducts(areaId)
      .then(setProducts)
      .finally(() => setIsLoading(false));
  }, [areaId]);

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const previewProducts = products.slice(0, 5);

  return (
    <div className="mb-16 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-[2.5rem] -z-10 transform rotate-1"></div>

      <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-white/50 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-violet-500/20">
                    Sunday Special
                </span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                Jiffy Street <Sparkles className="text-fuchsia-500 fill-fuchsia-500" size={24}/>
            </h3>
            <p className="text-slate-500 mt-2 font-medium max-w-lg">
                Exclusive deals on Baby Products, Fashion, and Home Essentials available only on Sundays.
            </p>
            </div>
            <button 
            onClick={onVisit}
            className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full hover:bg-primary transition-all shadow-xl flex items-center gap-2 group"
            >
            Visit Street <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </button>
        </div>

        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
            {isLoading ? [1,2,3].map(i => <div key={i} className="min-w-[260px] h-64 bg-white/40 rounded-3xl animate-pulse" />) : 
            previewProducts.map((product) => (
            <div 
                key={product.id}
                onClick={onVisit}
                className="min-w-[220px] md:min-w-[260px] bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group border border-slate-100 snap-start flex flex-col"
            >
                <div className="h-48 overflow-hidden relative rounded-2xl mb-3 bg-slate-50 flex items-center justify-center p-4">
                {imageErrors[product.id] ? (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon size={32} strokeWidth={1} />
                    <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Preview Unavailable</span>
                  </div>
                ) : (
                  <img src={product.image} alt={product.name} onError={() => handleImageError(product.id)} className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-700 drop-shadow-md" />
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-fuchsia-600 text-[10px] font-black px-2 py-1 rounded shadow-sm">DEAL</div>
                </div>
                <div className="px-1 flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{product.name}</h4>
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex flex-col">
                            {product.original_price && <span className="text-xs text-slate-400 line-through">₹{product.original_price}</span>}
                            <span className="font-black text-lg text-primary">₹{product.price}</span>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors"><ArrowRight size={16} /></button>
                    </div>
                </div>
            </div>
            ))}
            
            <div onClick={onVisit} className="min-w-[140px] bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer group border-2 border-white shadow-inner snap-start shrink-0">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition text-fuchsia-600"><ArrowRight size={24} /></div>
                <span className="font-black text-fuchsia-800 text-sm">View All Deals</span>
            </div>
        </div>
      </div>
    </div>
  );
};
