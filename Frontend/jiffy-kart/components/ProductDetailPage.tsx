
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
   ArrowLeft, Star, ShoppingCart, Heart, Share2,
   ShieldCheck, Clock, MapPin, Plus, Minus,
   ChevronRight, CheckCircle, Info, Sparkles, Store,
   X, RefreshCw, Send, Video
} from 'lucide-react';
import { Product, Shop, Review, ReviewSummary as ReviewSummaryType } from '../types';
import { ApiService } from '../services/apiService';
import { useNavigation, useCart, useAuth, useFavorites } from '../hooks';
import { Skeleton } from './Skeleton';
import { ReviewSummary } from './ReviewSummary';
import { ReviewForm } from './ReviewForm';

export const ProductDetailPage: React.FC = () => {
   const { params, goBack, navigate, areaId } = useNavigation();
   const { addToCart } = useCart();
   const { isLoggedIn } = useAuth();
   const { isFavorite, toggleFavorite } = useFavorites();

   const [product, setProduct] = useState<Product | null>(null);
   const [shop, setShop] = useState<Shop | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [quantity, setQuantity] = useState(1);
   const [toast, setToast] = useState<string | null>(null);
   const [reviews, setReviews] = useState<Review[]>([]);
   const [reviewSummary, setReviewSummary] = useState<ReviewSummaryType | null>(null);
   const [showReviewForm, setShowReviewForm] = useState(false);
   const [editingReview, setEditingReview] = useState<Review | undefined>(undefined);
   const [isSubmittingReview, setIsSubmittingReview] = useState(false);
   const [activeMedia, setActiveMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);

   useEffect(() => {
      const fetchProduct = async () => {
         setIsLoading(true);
         try {
            const data = await ApiService.getProductById(params.productId, areaId);
            if (data) {
               setProduct(data);
               if (data.shop_id) {
                  const shopData = await ApiService.getShopById(data.shop_id);
                  setShop(shopData);
               }
               // Fetch reviews
               const reviewData = await ApiService.getProductReviews(params.productId);
               setReviews(reviewData);

               // Fetch summary
               const summaryData = await ApiService.getProductReviewSummary(params.productId);
               setReviewSummary(summaryData);
            }
         } catch (e) {
            console.error("Failed to load product", e);
         } finally {
            setIsLoading(false);
         }
      };
      if (params.productId) fetchProduct();
   }, [params.productId, areaId]);

   const handleAddToCart = () => {
      if (!product) return;
      if (!isLoggedIn) {
         navigate('login', {
            redirect: 'product-detail',
            redirectParams: { productId: product.id },
            message: "Please sign in to add items to your cart."
         });
         return;
      }
      addToCart(product, quantity);
      setToast(`Added ${quantity} ${product.name} to cart!`);
      setTimeout(() => setToast(null), 3000);
   };

   const handleToggleFavorite = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!product) return;
      if (!isLoggedIn) {
         navigate('login', { redirect: 'product-detail', redirectParams: { productId: product.id } });
         return;
      }
      const wasFavorite = isFavorite(product.id);
      toggleFavorite(product);
      setToast(wasFavorite ? "Removed from wishlist" : "Saved to wishlist! ✨");
      setTimeout(() => setToast(null), 3000);
   };

   const handleReviewSuccess = async (updatedReview: Review) => {
      setReviews(prev => {
         const exists = prev.find(r => r.id === updatedReview.id);
         if (exists) return prev.map(r => r.id === updatedReview.id ? updatedReview : r);
         return [updatedReview, ...prev];
      });
      setShowReviewForm(false);
      setEditingReview(undefined);
      setToast(editingReview ? "Review updated! ✨" : "Review submitted! ✨");
      
      // Refresh summary and product rating
      try {
         const [summary, updatedProd] = await Promise.all([
            ApiService.getProductReviewSummary(product!.id),
            ApiService.getProductById(product!.id)
         ]);
         setReviewSummary(summary);
         if (updatedProd) setProduct(updatedProd);
      } catch (e) {
         console.error("Refresh after review failed", e);
      }

      setTimeout(() => setToast(null), 3000);
   };

   if (isLoading) {
      return (
         <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-12">
               <Skeleton className="w-full lg:w-1/2 aspect-square rounded-[3rem]" />
               <div className="flex-1 space-y-6">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-40 w-full" />
               </div>
            </div>
         </div>
      );
   }

   if (!product) {
      return (
         <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
               <Info size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Product Not Found</h2>
            <p className="text-slate-400 mb-8 max-w-xs">The product might have been removed or is temporarily unavailable.</p>
            <button onClick={goBack} className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg">Go Back</button>
         </div>
      );
   }

   return (
      <div className="animate-fade-in bg-white min-h-screen pb-32">
         {/* Toast */}
         {toast && createPortal(
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm pointer-events-none">
               <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10 backdrop-blur-md">
                  <div className="bg-emerald-500 rounded-full p-1.5 shrink-0">
                     <CheckCircle size={16} strokeWidth={4} className="text-white" />
                  </div>
                  <p className="font-bold text-sm tracking-tight flex-1">{toast}</p>
               </div>
            </div>,
            document.body
         )}

         {/* Header (Desktop Breadcrumbs, Mobile Back) */}
         <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 lg:static lg:bg-transparent lg:border-none">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-600">
                     <ArrowLeft size={24} />
                  </button>
                  <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <span className="cursor-pointer hover:text-primary" onClick={() => navigate('home')}>Home</span>
                     <ChevronRight size={12} />
                     <span className="cursor-pointer hover:text-primary" onClick={() => navigate('shops', { category: product.category })}>{product.category}</span>
                     <ChevronRight size={12} />
                     <span className="text-slate-900 font-black">{product.name}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={handleToggleFavorite} className={`p-3 rounded-2xl transition border ${isFavorite(product.id) ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-400'}`}>
                     <Heart size={20} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition">
                     <Share2 size={20} />
                  </button>
               </div>
            </div>
         </div>

         <main className="max-w-7xl mx-auto px-4 mt-4 lg:mt-8">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
               {/* Image Section */}
               <div className="w-full lg:w-1/2 space-y-4">
                  <div className="aspect-square bg-slate-50 rounded-[2.5rem] md:rounded-[3rem] p-4 md:p-10 flex items-center justify-center border border-slate-100 shadow-sm relative group overflow-hidden">
                     <img
                        src={product.image}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700"
                     />
                     {product.is_best_seller && (
                        <div className="absolute top-8 left-8 bg-secondary text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                           Bestseller <Sparkles size={10} className="inline ml-1 mb-0.5" />
                        </div>
                     )}
                  </div>
               </div>

               {/* Details Section */}
               <div className="flex-1 min-w-0 flex flex-col">
                  <div className="mb-8">
                     <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">
                        <div className="w-6 h-px bg-primary/30"></div>
                        {product.category}
                     </div>
                     <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight md:leading-none mb-3 md:mb-4">{product.name}</h1>

                     <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-black text-sm">
                           {product.rating} <Star size={14} fill="currentColor" />
                        </div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                           {product.votes} Verified Ratings
                        </div>
                     </div>

                     <div className="flex items-baseline gap-3 md:gap-4 mb-8 md:mb-10">
                        <span className="text-3xl md:text-4xl font-black text-slate-900">₹{product.price.toLocaleString()}</span>
                        {product.original_price && (
                           <span className="text-lg md:text-xl font-bold text-slate-300 line-through">₹{product.original_price.toLocaleString()}</span>
                        )}
                        {product.original_price && (
                           <span className="bg-highlight text-white px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-black uppercase">
                              {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                           </span>
                        )}
                     </div>

                     <div className="space-y-3 mb-8 md:mb-10">
                        <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">About this item</h3>
                        <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                           {product.description}
                        </p>
                     </div>

                     {/* Additional Specs */}
                     <div className="grid grid-cols-2 gap-3 md:gap-4 mb-10 md:mb-12">
                        <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 md:gap-3">
                           <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                              <ShieldCheck size={18} />
                           </div>
                           <div>
                              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Warranty</p>
                              <p className="text-[10px] md:text-xs font-black text-slate-900">{product.warranty_period || '1 Year Brand'}</p>
                           </div>
                        </div>
                        <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2 md:gap-3">
                           <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                              <Clock size={18} />
                           </div>
                           <div>
                              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery</p>
                              <p className="text-[10px] md:text-xs font-black text-slate-900">Under 30 Mins</p>
                           </div>
                        </div>
                     </div>
                  </div>


                  {/* Action Controls - Only visible on Desktop */}
                  <div className="hidden lg:flex items-center gap-6 mt-12 pt-8 border-t border-slate-100">
                     <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <button
                           onClick={() => setQuantity(q => Math.max(1, q - 1))}
                           className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-primary transition shadow-sm active:scale-90"
                        >
                           <Minus size={18} />
                        </button>
                        <span className="w-8 text-center font-black text-lg text-slate-900">{quantity}</span>
                        <button
                           onClick={() => setQuantity(q => q + 1)}
                           className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-primary transition shadow-sm active:scale-90"
                        >
                           <Plus size={18} />
                        </button>
                     </div>
                     <button
                        onClick={handleAddToCart}
                        className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:bg-indigo-600 transition-all active:scale-[0.98]"
                     >
                        <ShoppingCart size={24} /> Add to Cart • ₹{(product.price * quantity).toLocaleString()}
                     </button>
                  </div>
               </div>
            </div>

            {/* Reviews Section */}
            <section className="mt-20 pt-20 border-t border-slate-100">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 mb-2">Customer Feedback</h2>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">What others are saying about this item</p>
                  </div>
                  <button
                     onClick={() => {
                        if (isLoggedIn) {
                           setEditingReview(undefined);
                           setShowReviewForm(true);
                        } else {
                           navigate('login', { redirect: 'product-detail', redirectParams: { productId: product.id } });
                        }
                     }}
                     className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition hover:bg-indigo-600 shadow-xl shadow-primary/20"
                  >
                     Write a Review
                  </button>
               </div>

               {reviewSummary && (
                  <ReviewSummary summary={reviewSummary} averageRating={product.rating} />
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((rev) => (
                     <div key={rev.id} className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary text-xl uppercase shadow-sm border border-slate-100">
                                 {rev.user.charAt(0)}
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900">{rev.user}</h4>
                                    {rev.isVerified && (
                                       <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                                          <CheckCircle size={10} fill="currentColor" /> Verified
                                       </div>
                                    )}
                                    {isLoggedIn && Number(rev.userId) === Number(ApiService.getAuthUser()?.id) && (
                                       <button 
                                          onClick={() => {
                                             setEditingReview(rev);
                                             setShowReviewForm(true);
                                          }}
                                          className="text-[10px] font-black text-primary uppercase ml-2 hover:underline"
                                       >
                                          Edit
                                       </button>
                                    )}
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{rev.date}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-black">
                              {rev.rating} <Star size={12} fill="currentColor" />
                           </div>
                        </div>
                        {rev.title && <h5 className="font-black text-slate-900 mb-2 tracking-tight">{rev.title}</h5>}
                        <p className="text-slate-600 leading-relaxed text-sm font-medium italic mb-4">"{rev.comment}"</p>
                        
                        {/* Media Display */}
                        {(rev.images?.length! > 0 || rev.videoUrl) && (
                           <div className="flex flex-wrap gap-2 mt-4">
                              {rev.images?.map((img, i) => (
                                 <div 
                                    key={i} 
                                    className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => setActiveMedia({ type: 'image', url: img })}
                                 >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                 </div>
                              ))}
                              {rev.videoUrl && (
                                 <div 
                                    className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
                                    onClick={() => setActiveMedia({ type: 'video', url: rev.videoUrl })}
                                 >
                                    <Video size={20} className="text-white" />
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  ))}
                  {reviews.length === 0 && (
                     <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <Info size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">No reviews for this product yet.</p>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">Be the first to share your experience!</p>
                     </div>
                  )}
               </div>
            </section>
         </main>

         {/* Mobile Sticky CTA */}
         <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 animate-slide-up">
            <div className="max-w-xl mx-auto flex items-center gap-4">
               <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button
                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 transition active:scale-90"
                  >
                     <Minus size={18} />
                  </button>
                  <span className="w-6 text-center font-black text-slate-900">{quantity}</span>
                  <button
                     onClick={() => setQuantity(q => q + 1)}
                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 transition active:scale-90"
                  >
                     <Plus size={18} />
                  </button>
               </div>
               <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-white py-4 px-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest"
               >
                  Add <ShoppingCart size={18} /> • ₹{(product.price * quantity).toLocaleString()}
               </button>
            </div>
         </div>
 
          {/* Review Form Modal */}
         {showReviewForm && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowReviewForm(false)}></div>
               <ReviewForm 
                  product={product} 
                  existingReview={editingReview}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewForm(false)}
               />
            </div>,
            document.body
          )}

          {/* Media Lightbox */}
          {activeMedia && createPortal(
             <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md" onClick={() => setActiveMedia(null)}></div>
                <div className="relative max-w-5xl w-full max-h-full flex items-center justify-center z-10">
                   <button 
                      onClick={() => setActiveMedia(null)}
                      className="absolute -top-12 right-0 md:-right-12 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20"
                   >
                      <X size={24} />
                   </button>
                   
                   <div className="w-full h-full rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-black flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                      {activeMedia.type === 'image' ? (
                         <img src={activeMedia.url} className="max-w-full max-h-[85vh] object-contain" alt="" />
                      ) : (
                         <video 
                           src={activeMedia.url} 
                           controls 
                           autoPlay 
                           className="max-w-full max-h-[85vh]"
                         />
                      )}
                   </div>
                </div>
             </div>,
             document.body
          )}
       </div>
    );
 
};
