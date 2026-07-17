import React, { useState, useRef } from 'react';
import {
  X, Package, RotateCcw, AlertTriangle,
  ChevronDown, Camera, Loader2, CheckCircle2,
  ArrowLeftRight, ImagePlus, Trash2
} from 'lucide-react';
import { Order } from '../types';
import { ApiService } from '../services/apiService';
import api from '../services/axiosConfig';

interface ReturnRequestModalProps {
  order: Order;
  onClose: () => void;
  onSuccess?: () => void;
}

const RETURN_REASONS = [
  'Damaged product received',
  'Wrong item delivered',
  'Product not as described',
  'Quality not satisfactory',
  'Missing items in order',
  'Expired product received',
  'Size/quantity mismatch',
  'Other'
];

interface PreviewImage {
  file: File;
  preview: string;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ order, onClose, onSuccess }) => {
  const [type, setType] = useState<'RETURN' | 'REPLACEMENT'>('RETURN');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: PreviewImage[] = [];
    const maxImages = 5 - images.length;

    for (let i = 0; i < Math.min(files.length, maxImages); i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be under 5MB');
        continue;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    setUploadProgress('Uploading images...');

    const formData = new FormData();
    images.forEach(img => formData.append('images', img.file));

    try {
      const response = await api.post('/customer/returns/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.urls || [];
    } catch (e) {
      throw new Error('Failed to upload images');
    }
  };

  const handleSubmit = async () => {
    if (!reason) { setError('Please select a reason'); return; }
    if (!selectedProduct) { setError('Please select a product'); return; }
    setError('');
    setIsSubmitting(true);

    try {
      // Upload images first
      const imageUrls = await uploadImages();
      setUploadProgress('');

      await ApiService.createReturnRequest({
        orderId: parseInt(order.id),
        userId: 0,
        vendorId: parseInt(order.shop_id),
        productId: parseInt(selectedProduct),
        type,
        reason,
        details,
        images: imageUrls
      });
      setIsSuccess(true);
      // Cleanup previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
        <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl p-8 sm:p-12 text-center animate-slide-up max-h-[90vh] overflow-y-auto">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Request Submitted!</h3>
          <p className="text-sm text-slate-500 font-medium">
            Your {type === 'RETURN' ? 'return' : 'replacement'} request has been sent to the vendor.
            You'll be notified once they review it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">Request Return</h3>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Order #{order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">

          {/* Type Toggle */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Request Type</label>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setType('RETURN')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'RETURN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <RotateCcw size={14} /> Return & Refund
              </button>
              <button
                onClick={() => setType('REPLACEMENT')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'REPLACEMENT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ArrowLeftRight size={14} /> Replacement
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Select Product</label>
            <div className="space-y-2">
              {order.items.map((item, idx) => {
                const product = typeof item === 'string' ? { id: idx.toString(), name: item, image: '', price: 0 } : item.product;
                const productId = product.id?.toString() || idx.toString();
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedProduct(productId)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedProduct === productId
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                      <img src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'} alt={product.name} className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-slate-400 font-bold">₹{(typeof item !== 'string' ? item.priceAtOrder : product.price).toLocaleString()}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedProduct === productId ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                      {selectedProduct === productId && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Reason</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
              >
                <option value="">Select a reason...</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">
              Upload Product Images <span className="text-slate-300 normal-case">(max 5)</span>
            </label>

            {/* Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                    <img src={img.preview} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeImage(idx)}
                        className="p-2 bg-white/90 rounded-xl text-rose-500 hover:bg-white transition-all shadow-lg active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-white/90 rounded-lg flex items-center justify-center text-[9px] font-black text-slate-600 shadow-sm">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-primary/20 group-hover:shadow-md transition-all">
                  <ImagePlus size={18} className="group-hover:text-primary transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                    {images.length === 0 ? 'Add Photos' : 'Add More Photos'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                    JPG, PNG up to 5MB • {5 - images.length} remaining
                  </p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Details */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Additional Details (Optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3 rounded-2xl text-xs font-bold">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || !selectedProduct}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            {isSubmitting ? (uploadProgress || 'Submitting...') : `Submit ${type === 'RETURN' ? 'Return' : 'Replacement'} Request`}
          </button>
          <button
            onClick={onClose}
            className="w-full text-slate-400 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
