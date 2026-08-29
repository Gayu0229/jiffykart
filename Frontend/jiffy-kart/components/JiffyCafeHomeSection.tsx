
import React, { useState, useEffect } from 'react';
import { ArrowRight, Coffee, Sparkles, ImageIcon, UtensilsCrossed } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { Product } from '../types';
import { useNavigation } from '../hooks';

interface JiffyCafeHomeSectionProps {
  onVisit: () => void;
}

export const JiffyCafeHomeSection: React.FC<JiffyCafeHomeSectionProps> = ({ onVisit }) => {
  const { areaId } = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    ApiService.getJiffyCafeProducts(areaId)
      .then(setProducts)
      .finally(() => setIsLoading(false));
  }, [areaId]);

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const previewProducts = products.slice(0, 5);

  return (
    <div className="mb-16 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-amber-50 rounded-[2.5rem] -z-10 transform -rotate-1"></div>

      <div className={`bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-white/50 shadow-soft transition-all duration-500 ${products.length === 0 ? 'blur-[1.5px] opacity-80 select-none' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center gap-1">
                    <UtensilsCrossed size={12}/> Hot & Fresh
                </span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                Street Hub <Coffee className="text-orange-500 fill-orange-500" size={24}/>
            </h3>
            <p className="text-slate-500 mt-2 font-medium max-w-lg">
                Freshly prepared meals, beverages, and snacks from top cafes, delivered in a jiffy.
            </p>
            </div>
            <button 
            onClick={onVisit}
            disabled={products.length === 0}
            className={`font-bold py-3 px-8 rounded-full transition-all shadow-xl flex items-center gap-2 group ${products.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
            >
            Visit Street Hub <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </button>
        </div>

        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
            {isLoading ? [1,2,3].map(i => <div key={i} className="min-w-[260px] h-64 bg-white/40 rounded-3xl animate-pulse" />) : 
             products.length > 0 ? (
               <>
                {previewProducts.map((product) => (
                    <div 
                        key={product.id}
                        onClick={onVisit}
                        className="min-w-[220px] md:min-w-[260px] bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group border border-slate-100 snap-start flex flex-col"
                    >
                        <div className="h-48 overflow-hidden relative rounded-2xl mb-3 bg-orange-50/30 flex items-center justify-center p-4">
                        {imageErrors[product.id] ? (
                        <div className="flex flex-col items-center justify-center text-orange-200">
                            <ImageIcon size={32} strokeWidth={1} />
                            <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Preview Unavailable</span>
                        </div>
                        ) : (
                        <img src={product.image} alt={product.name} onError={() => handleImageError(product.id)} className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-700 drop-shadow-md" />
                        )}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-orange-600 text-[10px] font-black px-2 py-1 rounded shadow-sm">STREET HUB</div>
                        </div>
                        <div className="px-1 flex-1 flex flex-col">
                            <h4 className="font-bold text-slate-900 text-sm truncate mb-1">{product.name}</h4>
                            <div className="flex items-center justify-between mt-auto pt-2">
                                <div className="flex flex-col">
                                    {product.original_price && <span className="text-xs text-slate-400 line-through">₹{product.original_price}</span>}
                                    <span className="font-black text-lg text-orange-600">₹{product.price}</span>
                                </div>
                                <button className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors"><ArrowRight size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
                
                <div onClick={onVisit} className="min-w-[140px] bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer group border-2 border-white shadow-inner snap-start shrink-0">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition text-orange-600"><ArrowRight size={24} /></div>
                    <span className="font-black text-orange-800 text-sm">View Menu</span>
                </div>
               </>
             ) : (
               <div className="w-full py-12 flex flex-col items-center justify-center bg-orange-50/50 rounded-3xl border border-dashed border-orange-200">
                 <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-orange-400 mb-4 shadow-sm">
                   <Sparkles size={32} />
                 </div>
                 <h4 className="font-bold text-orange-900">Street Hub Menu coming soon!</h4>
                 <p className="text-sm text-orange-600/70 font-medium">Curating the best meals for you...</p>
               </div>
             )
            }
        </div>
      </div>

      {products.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <div className="bg-white/80 backdrop-blur-md border border-orange-100 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 transform -rotate-1">
             <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
               <Sparkles size={20} />
             </div>
             <div>
               <p className="text-orange-900 font-black uppercase text-xs tracking-widest">Coming Soon</p>
               <p className="text-orange-600 text-[10px] font-bold">Unlocking something special...</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
