
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Lock, Bell, Star, Plus, ShoppingBag, CheckCircle, ImageIcon, Heart, Sparkles } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { Product } from '../types';
import { useAuth, useNavigation, useFavorites } from '../hooks';

interface JiffyStreetPageProps {
  onBack: () => void;
  onAddToCart: (product: Product) => void;
}

export const JiffyStreetPage: React.FC<JiffyStreetPageProps> = ({ onBack, onAddToCart }) => {
  const { isLoggedIn } = useAuth();
  const { navigate, areaId } = useNavigation();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isSunday = new Date().getDay() === 0;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'cart' | 'wishlist' } | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    ApiService.getJiffyStreetProducts(areaId)
      .then(setProducts)
      .finally(() => setIsLoading(false));
  }, [areaId]);

  const categories = ['All', 'Baby Care', 'Fashion', 'Home & Kitchen', 'Electronics', 'Audio'];

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [selectedCategory, products]);

  const handleSmartAction = (product: Product) => {
    if (!isLoggedIn) {
      setToastMessage({ text: "Please sign in to continue.", type: 'cart' });
      setTimeout(() => navigate('login', { redirect: 'jiffy-street' }), 1500);
      return;
    }

    if (isSunday) {
      onAddToCart(product);
      setToastMessage({ text: `Added ${product.name} to cart`, type: 'cart' });
    } else {
      toggleFavorite(product);
      setToastMessage({ text: isFavorite(product.id) ? `Removed from Sunday Wishlist` : `Saved for Sunday! ✨`, type: 'wishlist' });
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in relative">
      {toastMessage && createPortal(
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm pointer-events-none">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10 backdrop-blur-md">
            <div className={`${toastMessage.type === 'cart' ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full p-1.5 shrink-0 shadow-lg`}>
              {toastMessage.type === 'cart' ? <CheckCircle size={16} strokeWidth={4} className="text-white" /> : <Heart size={16} fill="white" className="text-white" />}
            </div>
            <p className="font-bold text-sm tracking-tight leading-tight flex-1">{toastMessage.text}</p>
          </div>
        </div>, document.body
      )}

      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-accent/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"><ArrowLeft size={20} /></button>
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tight leading-none flex items-center gap-2">🛍️ Jiffy Street {!isSunday && <Lock size={18} className="text-gray-400" />}</h2>
              </div>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-white border border-accent text-primary'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? <div className="py-20 text-center text-slate-400 font-bold">Loading Street catalog...</div> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => {
              const favorited = isFavorite(product.id);
              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-accent shadow-sm flex flex-col group relative transition-all duration-300 cursor-pointer"
                  onClick={() => navigate('product-detail', { productId: product.id })}
                >
                  <div className="relative h-56 md:h-64 overflow-hidden bg-white flex items-center justify-center p-4">
                    <div className={`absolute top-5 left-5 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg z-10 uppercase ${isSunday ? 'bg-secondary text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {isSunday ? 'Sunday Deal' : 'Locked'}
                    </div>
                    {imageErrors[product.id] ? <ImageIcon size={48} className="text-slate-200" /> : <img src={product.image} alt={product.name} onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))} className={`max-w-full max-h-full object-contain group-hover:scale-110 transition duration-700 ${!isSunday ? 'grayscale opacity-80' : ''}`} />}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2">{product.category}</div>
                    <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 h-10 group-hover:text-primary text-base md:text-lg">{product.name}</h3>
                    <div className="mt-auto pt-5 border-t border-dashed border-slate-100 flex items-end justify-between">
                      <div className="flex flex-col">
                        {product.original_price && <span className="text-sm text-slate-400 line-through font-bold">₹{product.original_price}</span>}
                        <span className="text-2xl font-black text-slate-900">₹{product.price}</span>
                      </div>
                      <button onClick={() => handleSmartAction(product)} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 ${isSunday ? 'bg-primary text-white hover:bg-indigo-700' : favorited ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 border-2 border-rose-100'}`}>
                        {isSunday ? <Plus size={32} strokeWidth={3} /> : <Heart size={28} fill={favorited ? "currentColor" : "none"} />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
