import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Star, CheckCircle, XCircle,
  MessageSquare, User, Filter, Trash2, Reply,
  ChevronDown, Check, X, Send, AlertTriangle, Loader2, Layers,
  Eye, Play, Image as ImageIcon
} from 'lucide-react';
import { Review } from '../../types';
import { api } from '../../services/api';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [replyingTo, setReplyingTo] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [viewingMedia, setViewingMedia] = useState<Review | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getAllReviews();
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      showToast("Failed to load reviews", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Derived Stats
  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => r.status.toUpperCase() === 'PENDING').length,
    avgRating: (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0).toFixed(1),
    published: reviews.filter(r => r.status.toUpperCase() === 'PUBLISHED').length
  }), [reviews]);

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'All' || r.rating === ratingFilter;
    const matchesStatus = statusFilter === 'All' || r.status.toUpperCase() === statusFilter.toUpperCase();
    
    let matchesType = true;
    if (typeFilter === 'Product Review') {
      matchesType = r.type === 'PRODUCT' && !r.isJiffyStreet && !r.isJiffyCafe;
    } else if (typeFilter === 'Shop Review') {
      matchesType = r.type === 'SHOP';
    } else if (typeFilter === 'Jiffy Street Review') {
      matchesType = !!r.isJiffyStreet;
    } else if (typeFilter === 'Jiffy Cafe Review') {
      matchesType = !!r.isJiffyCafe;
    }

    return matchesSearch && matchesRating && matchesStatus && matchesType;
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (id: string, action: 'Published' | 'Rejected' | 'Delete') => {
    if (action === 'Delete') {
      if (!confirm('Are you sure you want to delete this review?')) return;
    }

    try {
      if (action === 'Delete') {
        await api.deleteReview(id);
        setReviews(prev => prev.filter(r => r.id.toString() !== id.toString()));
        showToast("Review deleted");
      } else {
        const apiStatus = action === 'Published' ? 'PUBLISHED' : 'REJECTED';
        await api.updateReviewStatus(id, apiStatus);
        setReviews(prev => prev.map(r => r.id.toString() === id.toString() ? { ...r, status: action } : r));
        showToast(`Review ${action === 'Published' ? 'approved' : 'rejected'}`);
      }
    } catch (error) {
      showToast("Action failed", 'error');
    }
  };

  const handleBulkAction = async (action: 'Published' | 'Rejected' | 'Delete') => {
    if (action === 'Delete' && !confirm(`Delete ${selectedIds.size} reviews?`)) return;

    try {
      const promises = Array.from(selectedIds).map(id => {
        if (action === 'Delete') return api.deleteReview(id);
        return api.updateReviewStatus(id, action === 'Published' ? 'PUBLISHED' : 'REJECTED');
      });
      await Promise.all(promises);

      if (action === 'Delete') {
        setReviews(prev => prev.filter(r => !selectedIds.has(r.id.toString())));
      } else {
        setReviews(prev => prev.map(r => selectedIds.has(r.id.toString()) ? { ...r, status: action } : r));
      }
      setSelectedIds(new Set());
      showToast(`Bulk action: ${action} completed`);
    } catch (e) {
      showToast("Bulk action failed", 'error');
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id.toString())) next.delete(id.toString());
    else next.add(id.toString());
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredReviews.length && filteredReviews.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map(r => r.id.toString())));
    }
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replyText.trim()) return;

    try {
      await api.replyToReview(replyingTo.id, replyText);
      setReviews(prev => prev.map(r => r.id.toString() === replyingTo.id.toString() ? { ...r, adminReply: replyText } : r));
      showToast("Reply posted successfully");
      setReplyingTo(null);
      setReplyText('');
    } catch (e) {
      showToast("Failed to post reply", 'error');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-gray-300"} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium font-serif italic text-lg text-center px-4">Aggregating product feedback and platform sentiments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative pb-20">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-yellow-400">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-indigo-400">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Platform Rating</div>
          <div className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            {stats.avgRating} <Star size={20} className="fill-indigo-600" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-green-400">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Published Content</div>
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
        </div>
      </div>

      {/* Filters & Actions Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={toggleAll}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedIds.size > 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
              {selectedIds.size === filteredReviews.length && filteredReviews.length > 0 ? <Check size={14} className="text-white" /> : selectedIds.size > 0 ? <div className="w-2 h-0.5 bg-white"></div> : null}
            </div>
            <span className="text-sm font-medium text-gray-600">Select All</span>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by product, customer or content..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none cursor-pointer hover:border-indigo-300"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Product Review">Product</option>
            <option value="Shop Review">Shop</option>
            <option value="Jiffy Street Review">Jiffy Street</option>
            <option value="Jiffy Cafe Review">Jiffy Cafe</option>
          </select>
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none cursor-pointer hover:border-indigo-300"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
          >
            <option value="All">All Ratings</option>
            {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} Stars</option>)}
          </select>
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none cursor-pointer hover:border-indigo-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`bg-white rounded-xl border transition-all duration-300 p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg ${selectedIds.has(review.id) ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-100 shadow-sm'
              }`}
          >
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={selectedIds.has(review.id)}
                onChange={() => toggleSelect(review.id)}
                className="mt-1.5 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-6">
              {/* Product Info (Left) */}
              <div className="flex-shrink-0 w-full md:w-48 flex md:flex-col items-center md:items-start gap-3">
                <div className="relative group cursor-pointer">
                  <img src={review.productImage} alt={review.productName} className="w-20 h-20 rounded-xl object-cover border border-gray-100 shadow-sm group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Search size={16} className="text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight hover:text-indigo-600 cursor-pointer transition-colors line-clamp-2" title={review.productName}>{review.productName}</h4>
                  <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase flex items-center gap-1">
                    <Layers size={10} />
                    {review.shopName}
                  </p>
                  <p className="text-[9px] font-mono text-gray-400 mt-0.5 uppercase">ID: {review.id}</p>
                </div>
              </div>

              {/* Review Content (Middle) */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    {renderStars(review.rating)}
                    <h3 className="text-base font-bold text-gray-900">{review.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${review.status === 'Published' ? 'bg-green-50 text-green-700 border-green-100' :
                    review.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {review.status}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed mb-4 italic">
                  "{review.content}"
                </div>

                {review.adminReply && (
                  <div className="mb-4 ml-4 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400 flex gap-3 items-start">
                    <MessageSquare size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">Official Reply</span>
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{review.adminReply}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-6 text-[11px] text-gray-400 font-medium">
                  <span className="flex items-center"><User size={14} className="mr-1.5 text-gray-400" /> {review.customerName}</span>
                  <span className="flex items-center"><MessageSquare size={14} className="mr-1.5 text-gray-400" /> {review.date}</span>
                  {((review.images && review.images.length > 0) || review.videoUrl) && (
                    <span className="flex items-center text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Eye size={12} className="mr-1" /> Media Attached
                    </span>
                  )}
                </div>
              </div>

              {/* Actions (Right) */}
              <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                {((review.images && review.images.length > 0) || review.videoUrl) && (
                  <button
                    onClick={() => setViewingMedia(review)}
                    className="flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all font-bold text-xs shadow-sm hover:shadow active:scale-95"
                  >
                    <Eye size={14} className="mr-1.5" /> View Media
                  </button>
                )}

                {review.status === 'Pending' && (
                  <button
                    onClick={() => handleAction(review.id, 'Published')}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold text-xs shadow-sm hover:shadow active:scale-95 border-none"
                  >
                    <Check size={14} className="mr-1.5" /> Approve
                  </button>
                )}

                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  {review.status === 'Published' && (
                    <button
                      onClick={() => handleAction(review.id, 'Rejected')}
                      className="flex items-center justify-center px-4 py-2 border border-orange-200 text-orange-700 hover:bg-orange-50 rounded-lg transition-all font-bold text-xs active:scale-95"
                    >
                      <XCircle size={14} className="mr-1.5" /> Unpublish
                    </button>
                  )}

                  {review.status === 'Pending' && (
                    <button
                      onClick={() => handleAction(review.id, 'Rejected')}
                      className="flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-all font-bold text-xs active:scale-95"
                    >
                      <X size={14} className="mr-1.5" /> Reject
                    </button>
                  )}

                  <button
                    onClick={() => setReplyingTo(review)}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all font-bold text-xs active:scale-95 border-none"
                  >
                    <Reply size={14} className="mr-1.5" /> {review.adminReply ? 'Edit Reply' : 'Reply'}
                  </button>

                  <button
                    onClick={() => handleAction(review.id, 'Delete')}
                    className="flex items-center justify-center px-4 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-bold text-xs active:scale-95 border-none"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100 animate-in fade-in zoom-in duration-300">
            <MessageSquare size={48} className="mx-auto mb-3 text-gray-200" />
            <h3 className="text-lg font-medium text-gray-900">No reviews match your filters</h3>
            <p className="text-sm mt-1">Try adjusting the search query or status selection.</p>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-gray-800">
            <div className="flex items-center gap-2 border-r border-gray-700 pr-6 mr-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
                {selectedIds.size}
              </div>
              <span className="text-sm font-medium">Selected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkAction('Published')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-xs font-bold transition-colors border-none"
              >
                <Check size={14} /> Approve All
              </button>
              <button
                onClick={() => handleBulkAction('Rejected')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors border-none"
              >
                <XCircle size={14} /> Reject All
              </button>
              <button
                onClick={() => handleBulkAction('Delete')}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl text-xs font-bold transition-colors border-none"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2 bg-transparent border-none text-white"
              title="Cancel selection"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyingTo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Reply size={18} className="text-indigo-600" />
                Post Official Response
              </h3>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <img src={replyingTo.productImage} className="w-8 h-8 rounded border" />
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{replyingTo.customerName}'s Review</div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{replyingTo.content}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Admin Reply Body</label>
                <textarea
                  className="w-full p-4 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-40 resize-none leading-relaxed"
                  placeholder="Write a helpful response to the customer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
                <p className="text-[10px] text-gray-400 mt-2">Professional, empathetic responses help maintain store credibility.</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-bold hover:bg-white transition-colors bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 border-none"
              >
                <Send size={16} className="mr-2" /> Post Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {viewingMedia && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <button 
            onClick={() => setViewingMedia(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[130] border-none"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-5xl flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">{viewingMedia.productName}</h3>
              <p className="text-gray-400 font-medium">{viewingMedia.customerName}'s shared media</p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/20">
              {/* Video if exists */}
              {viewingMedia.videoUrl && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group relative">
                  <video 
                    src={viewingMedia.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                    <Play size={10} /> Video Review
                  </div>
                </div>
              )}

              {/* Images */}
              {viewingMedia.images?.map((img, idx) => (
                <div key={idx} className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 group cursor-zoom-in relative">
                  <img src={img} alt={`Review media ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon size={14} className="text-white" />
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-xl text-center">
              <p className="text-white/80 text-lg italic leading-relaxed font-medium">"{viewingMedia.content}"</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reviews;
