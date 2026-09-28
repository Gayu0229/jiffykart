
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Coffee, UtensilsCrossed, Star, Plus, ShoppingBag, CheckCircle, ImageIcon, Heart, Sparkles } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { Product } from '../types';
import { useAuth, useNavigation, useFavorites } from '../hooks';
import { createPortal } from 'react-dom';

interface JiffyCafePageProps {
  onBack: () => void;
  onAddToCart: (product: Product) => void;
}

export const JiffyCafePage: React.FC<JiffyCafePageProps> = ({ onBack, onAddToCart }) => {
  const { isLoggedIn } = useAuth();
  const { navigate, areaId } = useNavigation();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'cart' | 'wishlist' } | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    ApiService.getJiffyCafeProducts(areaId)
      .then(setProducts)
      .finally(() => setIsLoading(false));
  }, [areaId]);

  const categories = ['All', 'Food', 'Groceries', 'Beverages', 'Meals'];

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory, products]);

  const handleAddToCart = (product: Product) => {
    if (!product.id) return;
    onAddToCart(product);
    setToastMessage({ text: `Added ${product.name} to cart`, type: 'cart' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFavorite = (product: Product) => {
    if (!isLoggedIn) {
      setToastMessage({ text: "Please sign in to save favorites.", type: 'wishlist' });
      setTimeout(() => navigate('login', { redirect: 'jiffy-cafe' }), 1500);
      return;
    }
    toggleFavorite(product);
    setToastMessage({ 
      text: isFavorite(product.id) ? `Removed from Favorites` : `Added to Favorites! ✨`, 
      type: 'wishlist' 
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-white pb-20 animate-fade-in relative">
      {toastMessage && createPortal(
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm pointer-events-none">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10 backdrop-blur-md">
            <div className={`${toastMessage.type === 'cart' ? 'bg-orange-500' : 'bg-rose-500'} rounded-full p-1.5 shrink-0 shadow-lg`}>
              {toastMessage.type === 'cart' ? <CheckCircle size={16} strokeWidth={4} className="text-white" /> : <Heart size={16} fill="white" className="text-white" />}
            </div>
            <p className="font-bold text-sm tracking-tight leading-tight flex-1">{toastMessage.text}</p>
          </div>
        </div>, document.body
      )}

      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-orange-50 rounded-full text-orange-600 transition"><ArrowLeft size={20} /></button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    Street Hub <Coffee className="text-orange-500 fill-orange-500" size={24}/>
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mt-1 flex items-center gap-1">
                    <UtensilsCrossed size={10}/> Hot & Fresh Collection
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)} 
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-black transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="font-black text-orange-600 uppercase tracking-widest text-xs">Preparing Menu...</p>
            </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => {
              const favorited = isFavorite(product.id);
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group relative cursor-pointer"
                  onClick={() => navigate('product-detail', { productId: product.id })}
                >
                  <div className="relative h-56 md:h-64 overflow-hidden bg-slate-50/50 flex items-center justify-center p-6">
                    <div className="absolute top-5 left-5 bg-white/90 backdrop-blur text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm z-10 flex items-center gap-1">
                        <Sparkles size={10}/> STREET HUB
                    </div>
                    {imageErrors[product.id] ? (
                        <div className="flex flex-col items-center justify-center text-slate-200">
                            <ImageIcon size={48} strokeWidth={1}/>
                        </div>
                    ) : (
                        <img 
                            src={product.image} 
                            alt={product.name} 
                            onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))} 
                            className="max-w-full max-h-full object-contain group-hover:scale-110 transition duration-700 drop-shadow-xl" 
                        />
                    )}
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(product); }}
                        className={`absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white shadow-md z-10 ${favorited ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'}`}
                    >
                        <Heart size={20} fill={favorited ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 bg-orange-50 px-2 py-0.5 rounded-md">{product.category}</span>
                        {product.rating && (
                            <div className="flex items-center gap-1 text-amber-500">
                                <Star size={10} fill="currentColor"/>
                                <span className="text-[10px] font-bold">{product.rating}</span>
                            </div>
                        )}
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight mb-4 line-clamp-2 h-10 group-hover:text-orange-600 transition-colors text-base md:text-lg">{product.name}</h3>
                    
                    <div className="mt-auto pt-5 border-t border-dashed border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.original_price && <span className="text-xs text-slate-400 line-through font-bold">₹{product.original_price}</span>}
                        <span className="text-2xl font-black text-slate-900 flex items-baseline gap-0.5">
                            <span className="text-gray-400 text-sm">₹</span>{product.price}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30 hover:bg-orange-700 active:scale-95 transition-all group-hover:rotate-6"
                      >
                        <Plus size={24} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-200 mb-6">
                    <Coffee size={48} strokeWidth={1} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No Street Hub items found</h3>
                <p className="text-slate-500 max-w-xs font-medium">We're currently preparing our menu. Please check back in a jiffy!</p>
                <button onClick={onBack} className="mt-8 text-orange-600 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all">
                    <ArrowLeft size={16}/> Go Back Home
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
