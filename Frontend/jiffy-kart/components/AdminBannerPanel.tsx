
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Banner } from '../types';
import { BannerService } from '../services/bannerService';
import { generateBannerContent } from '../services/geminiService';

interface AdminBannerPanelProps {
  onBack: () => void;
}

export const AdminBannerPanel: React.FC<AdminBannerPanelProps> = ({ onBack }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
  
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBanners = async () => {
    const data = await BannerService.getBanners();
    setBanners(data);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEdit = (banner: Banner) => {
    setCurrentBanner(banner);
    setIsEditing(true);
    setAiTopic('');
  };

  const handleCreate = () => {
    setCurrentBanner({
      id: undefined,
      title: '',
      subtitle: '',
      image_url: '',
      link: '',
      position: 'Home',
      is_active: true,
      cta_text: 'Shop Now'
    });
    setIsEditing(true);
    setAiTopic('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this banner?')) {
      await BannerService.deleteBanner(id);
      await fetchBanners();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBanner.title) {
      await BannerService.saveBanner(currentBanner as Banner);
      await fetchBanners();
      setIsEditing(false);
      setCurrentBanner({});
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    
    setIsGenerating(true);
    const result = await generateBannerContent(aiTopic);
    setIsGenerating(false);

    if (result) {
      setCurrentBanner(prev => ({
        ...prev,
        title: result.title,
        subtitle: result.subtitle,
        cta_text: result.ctaText
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
      <div className="bg-white sticky top-0 z-30 px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-gray-900 text-lg">Banner Management</h1>
        </div>
        <button 
            onClick={handleCreate}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
        >
            <Plus size={16} /> New Banner
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
         {isEditing ? (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto animate-slide-up">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-900">{currentBanner.id ? 'Edit Banner' : 'New Banner'}</h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={20}/></button>
                 </div>

                 <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl mb-8 border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-sm mb-3">
                        <Sparkles size={16} className="text-indigo-600"/> AI Content Generator
                    </h3>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="e.g. Diwali Sale on Sneakers"
                            className="flex-1 px-4 py-2 rounded-xl border border-indigo-200 text-sm focus:outline-none focus:border-indigo-400"
                        />
                        <button 
                            onClick={handleAiGenerate}
                            disabled={isGenerating || !aiTopic.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                            {isGenerating ? 'Wait...' : 'Generate'}
                        </button>
                    </div>
                 </div>

                 <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                        <input required className="w-full p-3 border border-gray-200 rounded-xl" value={currentBanner.title} onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtitle</label>
                        <input className="w-full p-3 border border-gray-200 rounded-xl" value={currentBanner.subtitle || ''} onChange={e => setCurrentBanner({...currentBanner, subtitle: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                        <input className="w-full p-3 border border-gray-200 rounded-xl" value={currentBanner.image_url || ''} onChange={e => setCurrentBanner({...currentBanner, image_url: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Position</label>
                            <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={currentBanner.position} onChange={e => setCurrentBanner({...currentBanner, position: e.target.value as any})}>
                                <option value="Home">Home</option>
                                <option value="Sidebar">Sidebar</option>
                                <option value="Street">Street</option>
                                <option value="Tracking">Tracking</option>
                                <option value="Checkout">Checkout</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                            <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={currentBanner.is_active ? 'active' : 'inactive'} onChange={e => setCurrentBanner({...currentBanner, is_active: e.target.value === 'active'})}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg">Save Banner</button>
                 </form>
             </div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {banners.map(banner => (
                     <div key={banner.id} className="bg-white rounded-2xl overflow-hidden border shadow-sm">
                         <div className="h-40 bg-gray-100 relative group">
                             {banner.image_url && <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />}
                             <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(banner)} className="p-2 bg-white rounded-full text-blue-600 shadow-sm"><Edit2 size={16}/></button>
                                <button onClick={() => handleDelete(banner.id)} className="p-2 bg-white rounded-full text-red-600 shadow-sm"><Trash2 size={16}/></button>
                             </div>
                         </div>
                         <div className="p-4">
                             <h3 className="font-bold text-gray-900 line-clamp-1">{banner.title}</h3>
                             <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
};