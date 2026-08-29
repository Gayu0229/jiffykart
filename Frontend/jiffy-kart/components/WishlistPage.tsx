
import React from 'react';
import { Heart, ShoppingCart, X, ArrowLeft, Store } from 'lucide-react';
import { useFavorites, useCart, useNavigation } from '../hooks';

export const WishlistPage: React.FC = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { navigate, goBack } = useNavigation();

  return (
    <div className="animate-fade-in pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-4 mb-10 px-2">
         <button 
           onClick={goBack}
           className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600"
         >
           <ArrowLeft size={24} />
         </button>
         <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Wishlist</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Saved Items for Later</p>
         </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-soft flex flex-col items-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-rose-400 shadow-inner">
            <Heart size={48} />
          </div>
          <h4 className="text-2xl font-black text-slate-900 mb-2">Your wishlist is empty</h4>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            Looks like you haven't saved any items yet. <br/>
            Browse our top stores and save what you love!
          </p>
          <button 
            onClick={() => navigate('home')} 
            className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm uppercase transition shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
          >
            Start Exploring
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {favorites.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col group relative"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 p-6 mb-4">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                />
                <button 
                  onClick={() => toggleFavorite(product)} 
                  className="absolute top-3 right-3 bg-white/80 backdrop-blur-md text-rose-500 p-2.5 rounded-xl shadow-sm hover:bg-white transition-colors"
                  title="Remove from Wishlist"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-white/20">
                   <Heart size={10} fill="currentColor" className="text-rose-500" />
                   <span className="text-[10px] font-black text-slate-900 tracking-tight">SAVED</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0 px-1">
                <div className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">{product.category}</div>
                <h4 className="font-black text-slate-900 line-clamp-1 text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h4>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Instant Delivery</span>
                    <span className="font-black text-2xl text-emerald-600 leading-none">₹{product.price.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => navigate('details', { shopId: product.shop_id })}
                       className="p-3 bg-slate-50 text-slate-400 hover:text-primary hover:bg-indigo-50 rounded-2xl transition-all shadow-sm"
                       title="View Store"
                     >
                       <Store size={20} />
                     </button>
                     <button 
                       onClick={() => addToCart(product)} 
                       className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-primary hover:scale-105 active:scale-95 transition-all"
                       title="Add to Cart"
                     >
                       <ShoppingCart size={20} />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
