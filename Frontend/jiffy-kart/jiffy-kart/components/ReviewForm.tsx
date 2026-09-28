import React, { useState, useRef } from 'react';
import { Star, X, Upload, Image as ImageIcon, Video, Send, Loader2, CheckCircle } from 'lucide-react';
import { Product, Shop, Review } from '../types';
import { ApiService } from '../services/apiService';

interface ReviewFormProps {
  product?: Product;
  shop?: Shop;
  existingReview?: Review;
  onSuccess: (review: Review) => void;
  onCancel: () => void;
}

const CATEGORY_CRITERIA: Record<string, string[]> = {
  'Electronics': ['Performance', 'Build Quality', 'Battery Life'],
  'Fashion': ['Material Quality', 'Fitting', 'Finish'],
  'Groceries': ['Freshness', 'Packaging'],
  'Fruits': ['Freshness', 'Taste'],
  'Vegetables': ['Freshness', 'Cleanliness'],
  'Bakery': ['Taste', 'Freshness', 'Packaging'],
  'default': ['Quality', 'Value for Money', 'Packaging']
};

export const ReviewForm: React.FC<ReviewFormProps> = ({ product, shop, existingReview, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>(existingReview?.criteriaRatings || {});
  const [images, setImages] = useState<string[]>(existingReview?.images || []);
  const [videoUrl, setVideoUrl] = useState(existingReview?.videoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const criteria = shop 
    ? CATEGORY_CRITERIA['default'] 
    : (product ? (CATEGORY_CRITERIA[product.category] || CATEGORY_CRITERIA['default']) : CATEGORY_CRITERIA['default']);

  const handleRatingChange = (star: number) => setRating(star);

  const handleCriteriaRating = (name: string, star: number) => {
    setCriteriaRatings(prev => ({ ...prev, [name]: star }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    // In a real app, you'd upload to the server here.
    // For now, we'll simulate with base64/placeholders
    Array.from(files).forEach((file: File) => {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit for images
        setError(`Image ${file.name} exceeds 100MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) { // 500MB limit per user request
      setError("Video must be smaller than 500MB");
      return;
    }

    // Simulate upload
    setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4"); // Placeholder video
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select an overall rating");
      document.querySelector('.review-form-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Relaxed validations for easier testing
    if (comment.length < 3) {
      setError("Review must be at least 3 characters long");
      document.querySelector('.review-form-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reviewData = {
        rating,
        title,
        comment,
        criteriaRatings,
        images,
        videoUrl,
        productId: product?.id,
        shopId: shop?.id || product?.shop_id
      };

      let result: Review;
      if (existingReview) {
        result = await ApiService.editProductReview(existingReview.id, reviewData);
      } else if (shop) {
        result = await ApiService.addShopReview(shop.id, reviewData);
      } else if (product) {
        result = await ApiService.addProductReview(product.id, reviewData);
      } else {
        throw new Error("Missing product or shop context");
      }
      onSuccess(result);
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || "Failed to submit review. Please try again.";
      setError(errorMsg);
      document.querySelector('.review-form-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-container bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl relative animate-in fade-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            {existingReview ? 'Edit Your Review' : 'Rate & Review'}
          </h3>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{shop?.name || product?.name}</p>
        </div>
        <button 
          onClick={onCancel} 
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-4">
          <X size={18} className="shrink-0" />
          <p className="text-xs font-black uppercase tracking-tight">{error}</p>
        </div>
      )}

      <div className="space-y-12">
        {/* Overall Rating Section */}
        <div className="text-center bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Overall Experience</p>
           <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className={`p-2 transition-all duration-300 transform ${rating >= star ? 'scale-125 text-yellow-400' : 'text-slate-200 hover:text-yellow-200'}`}
                >
                  <Star size={48} fill={rating >= star ? "currentColor" : "none"} strokeWidth={rating >= star ? 1.5 : 2} />
                </button>
              ))}
           </div>
           {rating > 0 && (
             <p className="mt-4 text-xs font-black text-slate-900 uppercase tracking-widest animate-in fade-in">
                {rating === 5 ? 'Exceptional!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
             </p>
           )}
        </div>

        {/* Category Criteria Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Ratings</p>
              {criteria.map(name => (
                <div key={name} className="flex items-center justify-between group">
                  <span className="text-sm font-bold text-slate-600">{name}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleCriteriaRating(name, star)}
                        className={`text-sm transition-colors ${criteriaRatings[name] >= star ? 'text-emerald-500' : 'text-slate-200 hover:text-emerald-200'}`}
                      >
                        <Star size={18} fill={criteriaRatings[name] >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
           </div>

           {/* Media Upload Section */}
           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Media (Photos/Videos)</p>
              <div className="flex flex-wrap gap-3">
                 {/* Image Previews */}
                 {images.map((img, idx) => (
                   <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={14} />
                      </button>
                   </div>
                 ))}

                 {/* Video Preview */}
                 {videoUrl && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 group bg-slate-900 flex items-center justify-center">
                       <Video size={20} className="text-white" />
                       <button 
                        onClick={() => setVideoUrl('')}
                        className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                 )}

                 {/* Upload Buttons */}
                 {images.length < 5 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all bg-slate-50/50"
                    >
                       <ImageIcon size={20} />
                    </button>
                 )}
                 {!videoUrl && (
                   <button 
                     onClick={() => videoInputRef.current?.click()}
                     className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all bg-slate-50/50"
                   >
                      <Video size={20} />
                   </button>
                 )}
              </div>
              <p className="text-[9px] font-bold text-slate-400 italic">Up to 5 images (100MB each) • Optional 1 Video (500MB max)</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
           </div>
        </div>

        {/* Text Input Section */}
        <div className="space-y-6">
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Review Statement</label>
              <input 
                type="text"
                placeholder="Give your review a title (e.g. Best quality for the price)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
           </div>
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Detailed Comment</label>
              <textarea 
                rows={4}
                placeholder="Share your experience with this item. What did you like or dislike?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-medium text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
              ></textarea>
           </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
           <button 
             onClick={onCancel}
             className="flex-1 px-8 py-5 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
           >
              Cancel
           </button>
           <button 
             onClick={handleSubmit}
             disabled={isSubmitting}
             className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
           >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Publish Review'}
           </button>
        </div>
      </div>
    </div>
  );
};
