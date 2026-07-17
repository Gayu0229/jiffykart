
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ApiService } from '../services/apiService';
import { Shop, Product, Review } from '../types';
import {
  Star, Clock, MapPin, Plus, Minus, Search,
  X, ShoppingCart, ArrowRightLeft,
  Check, Heart,
  Loader2, AlertCircle, RefreshCw,
  Shield, ChevronRight, ChevronLeft,
  ThumbsUp, CheckCircle, MessageSquarePlus,
  Share2, Send, Sparkles, Filter, Menu, Trash2, ArrowLeft
} from 'lucide-react';
import { useAuth, useNavigation, useFavorites, useComparison, useCart } from '../hooks';
import { Skeleton } from './Skeleton';
import { createPortal } from 'react-dom';
import { ReviewForm } from './ReviewForm';
import { ReviewSummary } from './ReviewSummary';

interface ShopDetailsProps {
  shop: Shop;
  onBack: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

export const ShopDetails: React.FC<ShopDetailsProps> = ({ shop, onBack, onAddToCart }) => {
  const { isLoggedIn, user: authUser } = useAuth();
  const { navigate, areaId } = useNavigation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCompare, removeFromCompare, isInCompare, compareList } = useComparison();
  const { cartItems, updateQuantity, cartCount, cartTotal, addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShopImageZoomed, setIsShopImageZoomed] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodData, shopRevData] = await Promise.all([
        ApiService.getProductsByShop(shop.id, areaId),
        ApiService.getReviews(shop.id)
      ]);
      setProducts(prodData);
      setReviews(shopRevData);
    } catch (err) {
      setError("Failed to load shop details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [shop.id, areaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const { avgRating, totalReviews } = useMemo(() => {
    if (reviews.length === 0) return { avgRating: 0, totalReviews: 0 };
    const sum = reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0);
    return {
      avgRating: Number((sum / reviews.length).toFixed(1)),
      totalReviews: reviews.length
    };
  }, [reviews]);

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  const productQuantity = (productId: string) => {
    return cartItems.find(item => item.product.id === productId)?.quantity || 0;
  };

  const handleReviewSuccess = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    setShowReviewForm(false);
    setToastMessage("Review posted successfully! ✨");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setToastMessage("Please login to add to cart");
      setTimeout(() => navigate('login', { redirect: 'details', redirectParams: { shopId: shop.id } }), 1000);
      return;
    }
    onAddToCart(product);
    setToastMessage(`Added ${product.name} to cart!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setToastMessage("Please login to save to wishlist");
      setTimeout(() => navigate('login', { redirect: 'details', redirectParams: { shopId: shop.id } }), 1000);
      return;
    }
    toggleFavorite(product);
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full overflow-x-hidden">
      {/* Header Splash */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4 md:px-8 md:py-6 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
          <button
            onClick={onBack}
            className="p-3 bg-white hover:bg-slate-50 shadow-xl rounded-full text-primary transition-all transform hover:scale-110 active:scale-95 border border-slate-100 flex items-center justify-center"
            title="Go Back"
          >
            <ChevronLeft size={28} strokeWidth={3} />
          </button>

          <div className="flex gap-2">
            {(shop.approvalStatus === 'APPROVED' || shop.kycStatus === 'VERIFIED') && (
              <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/20">
                <Shield size={14} fill="currentColor" /> Verified Store
              </div>
            )}
          </div>
        </div>

        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          {shop.banner_url ? (
            <img
              src={shop.banner_url}
              className="w-full h-full object-cover opacity-80 mix-blend-multiply transition-transform duration-[20s] hover:scale-110"
              alt="Banner"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
        </div>

        {/* Store Profile Identity Card */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 md:px-8 pb-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            <div
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl ring-8 ring-black/[0.02] overflow-hidden cursor-zoom-in group shrink-0"
              onClick={() => setIsShopImageZoomed(true)}
            >
              <img
                src={shop.logo}
                alt={shop.name}
                className="w-full h-full object-cover rounded-[2rem] group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Sparkles className="text-white" size={24} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                {shop.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/10 truncate max-w-full">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-6xl font-black text-slate-900 mb-3 tracking-tighter drop-shadow-sm line-clamp-2 md:line-clamp-none whitespace-normal">{shop.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-600 font-bold text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-xl shadow-sm border border-slate-100">
                  <Star size={16} fill="currentColor" className="text-amber-400" />
                  <span className="text-slate-900">{avgRating || 'New'}</span>
                  <span className="opacity-40 ml-1">({totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-xl shadow-sm border border-slate-100">
                  <Clock size={16} className="text-primary" />
                  <span className="text-slate-900">{shop.delivery_time}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[150px] max-w-full">
                  <MapPin size={16} className="text-rose-500 shrink-0" />
                  <span className="text-slate-900 truncate">{shop.location}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-8 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar / Categories */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-28 space-y-8">
              {/* Category Nav */}
              <div className="bg-white rounded-[2rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">Categories</h3>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-5 py-3 rounded-2xl text-sm font-bold transition-all flex justify-between items-center group ${activeCategory === cat
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-95'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                        }`}
                    >
                      {cat}
                      {activeCategory === cat ? (
                        <CheckCircle size={14} className="animate-fade-in" />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Card */}
              <div className="relative overflow-hidden bg-primary rounded-[2rem] p-8 text-white shadow-2xl shadow-primary/20 group">
                <div className="relative z-10">
                  <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Member Perk</p>
                  {/* <h4 className="text-xl font-black mb-4 leading-tight">Free Delivery</h4> */}
                  <p className="text-xs font-medium opacity-80 mb-6">Save more on every order with free delivery, member-only deals, and faster service through JiffyKart subscriptions.</p>
                  <button onClick={() => navigate('subscription')} className="w-full bg-white text-primary font-black py-3 rounded-xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest">Subscribe</button>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs & Search Header */}
            <div className="bg-white rounded-[2rem] p-4 md:p-6 mb-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex-1 md:flex-none px-4 sm:px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-white text-primary shadow-sm active:scale-95' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 md:flex-none px-4 sm:px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-white text-primary shadow-sm active:scale-95' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Reviews
                </button>
              </div>

              <div className="relative w-full md:w-80 group">
                <input
                  type="text"
                  placeholder="Seach catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all hover:bg-slate-100/50 placeholder:text-slate-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
              </div>
            </div>

            {/* Products / Reviews View */}
            {activeTab === 'menu' ? (
              <div>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-96 rounded-[2.5rem]" />)}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <AlertCircle className="text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-bold mb-6">{error}</p>
                    <button onClick={fetchData} className="px-8 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all">
                      <RefreshCw size={18} /> Retry
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Search size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No matching products</h3>
                    <p className="text-slate-500 font-medium">Try adjusting your search or category filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProducts.map((product) => (
                      <article
                        key={product.id}
                        className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col cursor-pointer"
                        onClick={() => navigate('product-detail', { productId: product.id })}
                      >
                        <div className="relative h-64 overflow-hidden bg-slate-50">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          <div className="absolute top-4 left-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            {product.is_best_seller && (
                              <span className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10 shadow-xl">
                                <Sparkles size={12} className="text-amber-400" /> Bestseller
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleToggleWishlist(product, e)}
                            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-90 transition-all shadow-xl"
                          >
                            <Heart size={18} fill={isFavorite(product.id) ? "currentColor" : "none"} className={isFavorite(product.id) ? "text-rose-500" : ""} />
                          </button>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            {renderRatingStars(4.5)}
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4.5 (24k)</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                          <p className="text-slate-500 text-xs font-bold line-clamp-2 mb-6 opacity-70">{product.description || 'Premium quality electronic essentials delivered to your doorstep.'}</p>

                          <div className="mt-auto flex items-center justify-between gap-4 pt-6 border-t border-slate-50">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">&#8377;{product.price}</span>
                                {product.original_price && <span className="text-sm text-slate-400 font-bold line-through">&#8377;{product.original_price}</span>}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleAddToCart(product, e)}
                              className="relative group/btn flex items-center justify-center w-14 h-14 bg-primary rounded-2xl text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all transform active:scale-90 hover:rotate-3"
                            >
                              <Plus size={24} strokeWidth={3} className="transition-transform group-hover/btn:rotate-90" />
                              {productQuantity(product.id) > 0 && (
                                <span className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg animate-bounce-subtle">
                                  {productQuantity(product.id)}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-10 animate-fade-in">
                {/* Review Summary */}
                <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                    <div className="text-center md:border-r border-slate-100 md:pr-10">
                      <div className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{avgRating || '0.0'}</div>
                      {renderRatingStars(Math.round(avgRating))}
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-3">Overall Store Rating</p>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      {[5, 4, 3, 2, 1].map(r => (
                        <div key={r} className="flex items-center gap-4">
                          <span className="text-xs font-bold text-slate-400 w-4">{r}</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r === 5 ? (reviews.length > 0 ? 70 : 0) : r === 4 ? (reviews.length > 0 ? 20 : 0) : (reviews.length > 0 ? 5 : 0)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-8">{(r === 5 ? (reviews.length > 0 ? 70 : 0) : r === 4 ? (reviews.length > 0 ? 20 : 0) : (reviews.length > 0 ? 5 : 0))}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="md:pl-10 text-center">
                        <button 
                          onClick={() => setShowReviewForm(true)}
                          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center gap-3"
                        >
                           <MessageSquarePlus size={18} /> Write a Review
                        </button>
                    </div>
                  </div>

                {reviews.length === 0 ? (
                  <div className="text-center p-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <MessageSquarePlus className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-slate-900 font-black text-xl mb-2">No reviews yet</h3>
                    <p className="text-slate-500 font-medium">Be the first to share your experience!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(rev => (
                      <div key={rev.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/30">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black uppercase shadow-sm">
                              {rev.user?.username?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 leading-tight">{rev.user?.username || 'Verified Customer'}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordered 3 days ago</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {renderRatingStars(rev.rating)}
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Verified Purchase</p>
                          </div>
                        </div>
                        <p className="text-slate-600 font-bold leading-relaxed">{rev.comment}</p>
                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-50">
                          <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                            <ThumbsUp size={14} /> Helpful (2)
                          </button>
                          <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                            Share Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && createPortal(
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowReviewForm(false)}></div>
            <ReviewForm 
               shop={shop} 
               onSuccess={handleReviewSuccess}
               onCancel={() => setShowReviewForm(false)}
            />
         </div>,
         document.body
      )}

      {/* Cart Summary FAB (Old style) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-4 md:bottom-10 md:right-10 z-[100] animate-zoom-in">
          <button
            onClick={() => navigate('cart')}
            className="flex items-center gap-4 pl-8 pr-10 py-5 bg-slate-900 text-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] group transform hover:-translate-y-2 active:scale-95 transition-all"
          >
            <div className="relative">
              <div className="bg-primary/20 p-3 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner shadow-white/10">
                <ShoppingCart size={28} className="text-white" />
              </div>
              <span className="absolute -top-3 -right-3 bg-primary text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl">
                {cartCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-0.5">Checkout Items</p>
              <p className="text-lg font-black leading-none">&#8377;{cartTotal.toLocaleString()}</p>
            </div>
            <ArrowRightLeft className="ml-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" size={20} />
          </button>
        </div>
      )}

      {/* Full Screen Image Zoom Portal */}
      {isShopImageZoomed && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md" onClick={() => setIsShopImageZoomed(false)}></div>
          <button
            onClick={() => setIsShopImageZoomed(false)}
            className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-[1001] border border-white/20"
          >
            <X size={28} />
          </button>
          <div className="relative z-[1001] max-w-5xl w-full h-full flex items-center justify-center animate-zoom-in">
            <img
              src={shop.logo}
              alt={shop.name}
              className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Custom Toasts */}
      {toastMessage && createPortal(
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm">
          <div className="bg-slate-900 border border-white/10 backdrop-blur-md text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-up">
            <div className="bg-emerald-500 rounded-full p-2 shrink-0 shadow-lg shadow-emerald-500/20">
              <Check size={18} strokeWidth={4} />
            </div>
            <p className="font-black text-sm">{toastMessage}</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
