
import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Calendar, Image as ImageIcon, Plus, X, Save, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { Banner, City, Zone } from '../../types';
import { api } from '../../services/api';

interface BannerManagerProps {
  defaultTab?: 'Homepage' | 'Category' | 'Shop';
}

const BannerManager: React.FC<BannerManagerProps> = ({ defaultTab = 'Homepage' }) => {
  const [activeTab, setActiveTab] = useState<'Homepage' | 'Category' | 'Shop'>(defaultTab);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    title: '',
    type: 'Homepage',
    startDate: '',
    endDate: '',
    target: '',
    cityId: '',
    zoneId: ''
  });

  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminBanners();
      setBanners(data);
    } catch (error) {
      console.error("Failed to fetch banners", error);
      setToast({ message: 'Failed to load banners.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const data = await api.getCities();
      setCities(data);
    } catch (error) {
      console.error("Failed to fetch cities", error);
    }
  };

  const fetchZones = async (cityId: string) => {
    try {
      const data = await api.getZones(cityId);
      setZones(data);
    } catch (error) {
      console.error("Failed to fetch zones", error);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchCities();
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (newBanner.cityId) {
      fetchZones(newBanner.cityId);
    } else {
      setZones([]);
    }
  }, [newBanner.cityId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredBanners = banners.filter(b =>
    b.type === activeTab &&
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemove = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await api.deleteBanner(deleteId);
        setToast({ message: 'Banner deleted successfully.', type: 'success' });
        fetchBanners();
      } catch (error) {
        console.error("Failed to delete banner", error);
        setToast({ message: 'Failed to delete banner.', type: 'error' });
      } finally {
        setShowDeleteModal(false);
        setDeleteId(null);
      }
    }
  };

  const handleUpload = () => {
    setNewBanner({
      title: '',
      type: activeTab,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      target: '',
      cityId: '',
      zoneId: ''
    });
    setImageFile(null);
    setIsUploadModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      setToast({ message: 'Please select a banner image.', type: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newBanner.title || 'Untitled Promotion');
      formData.append('position', newBanner.type === 'Homepage' ? 'Home' : (newBanner.type === 'Shop' ? 'Street' : String(newBanner.type)));
      if (newBanner.target) formData.append('ctaUrl', newBanner.target); // Map target to ctaUrl for the backend
      if (newBanner.startDate) formData.append('startDate', `${newBanner.startDate}T00:00:00`);
      if (newBanner.endDate) formData.append('endDate', `${newBanner.endDate}T23:59:59`);
      if (newBanner.cityId) formData.append('cityId', newBanner.cityId);
      if (newBanner.zoneId) formData.append('zoneId', newBanner.zoneId);
      formData.append('imageDesktop', imageFile);

      await api.createBanner(formData);

      setIsUploadModalOpen(false);
      setImageFile(null);
      setToast({ message: 'Banner uploaded successfully.', type: 'success' });
      fetchBanners();
    } catch (error) {
      console.error("Failed to save banner", error);
      setToast({ message: 'Failed to save banner.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Banner Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Manage promotional banners across the app.</p>
        </div>
        <button
          onClick={handleUpload}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Upload size={18} className="mr-2" />
          Upload Banner
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search banner title..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {(['Homepage', 'Category', 'Shop'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab} Banners
            </button>
          ))}
        </div>
      </div>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.map((banner) => (
          <div key={banner.id} className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-40 bg-gray-100">
              <img src={banner.imageDesktopUrl?.startsWith('http') ? banner.imageDesktopUrl : `http://api.jiffykart.in${banner.imageDesktopUrl}`} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleRemove(banner.id)}
                  className="p-2 bg-white/90 text-red-600 rounded-lg hover:bg-red-50 shadow-sm transition-colors"
                  title="Delete Banner"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-md shadow-sm ${banner.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {banner.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{banner.title}</h3>
              {banner.target && (
                <p className="text-xs text-gray-500 mb-2">Target: <span className="font-medium text-gray-700">{banner.target}</span></p>
              )}
              
              {(banner.cityId || banner.zoneId) && (
                <div className="flex items-center text-xs text-indigo-600 mb-2 font-medium bg-indigo-50 w-fit px-2 py-0.5 rounded-md">
                  <span className="mr-1">📍</span>
                  {banner.zoneId 
                    ? zones.find(z => z.id === banner.zoneId)?.name || 'Specific Area'
                    : cities.find(c => c.id === banner.cityId)?.name || 'Specific City'}
                </div>
              )}

              <div className="flex items-center text-xs text-gray-500 mt-2">
                <Calendar size={14} className="mr-1.5 text-gray-400" />
                {banner.startDate} - {banner.endDate}
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder for Empty State or Add New */}
        <button
          onClick={handleUpload}
          className="flex flex-col items-center justify-center h-full min-h-[250px] border-2 border-dashed border-gray-300 rounded-xl hover:border-primary/50 hover:bg-gray-50 transition-colors group"
        >
          <div className="p-4 bg-gray-100 rounded-full text-gray-400 group-hover:text-primary group-hover:bg-white transition-colors mb-3">
            <Plus size={24} />
          </div>
          <span className="font-medium text-gray-600">Schedule New Banner</span>
          <span className="text-xs text-gray-400 mt-1">Supported: JPG, PNG, WEBP</span>
        </button>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Upload New Banner</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveBanner} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none placeholder-gray-400"
                  placeholder="e.g., Summer Sale 2023"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type</label>
                  <select
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={newBanner.type}
                    onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value as any })}
                  >
                    <option value="Homepage">Homepage</option>
                    <option value="Category">Category</option>
                    <option value="Shop">Shop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newBanner.type === 'Homepage' ? 'Target Link (Optional)' : 'Target Name'}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none placeholder-gray-400"
                    placeholder={newBanner.type === 'Category' ? 'e.g. Electronics' : 'Target...'}
                    value={newBanner.target}
                    onChange={(e) => setNewBanner({ ...newBanner, target: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target City (Optional)</label>
                  <select
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={newBanner.cityId}
                    onChange={(e) => setNewBanner({ ...newBanner, cityId: e.target.value, zoneId: '' })}
                  >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Area (Optional)</label>
                  <select
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    value={newBanner.zoneId}
                    onChange={(e) => setNewBanner({ ...newBanner, zoneId: e.target.value })}
                    disabled={!newBanner.cityId}
                  >
                    <option value="">All Areas</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={newBanner.startDate}
                    onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                    value={newBanner.endDate}
                    onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="max-h-32 object-contain" />
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-gray-400 mb-2 whitespace-pre" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                      <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center shadow-sm transition-colors"
                >
                  <Save size={18} className="mr-2" /> Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Banner?</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this banner? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BannerManager;
