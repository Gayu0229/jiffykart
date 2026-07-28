
import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Filter, Calendar, Edit, Trash2,
  Image as ImageIcon, Eye, ToggleLeft, ToggleRight,
  Save, X, Check, MonitorPlay, Link as LinkIcon,
  LayoutTemplate, List, ExternalLink, Activity, Clock,
  AlertTriangle, CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Advertisement } from '../../types';

interface AdManagerProps {
  initialMode?: 'list' | 'create';
  filterPlacement?: string; // Optional filter to show only ads for specific placement
}

const PLACEMENT_OPTIONS = [
  'Homepage Top',
  'Homepage Middle',
  'Homepage Sidebar',
  'Jiffy Street Sunday Ad',
  'Category Page',
  'Product Page',
  'Checkout Page',
  'Order Tracking',
  'Custom Location'
];

const AdManager: React.FC<AdManagerProps> = ({ initialMode = 'list', filterPlacement }) => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [displayMode, setDisplayMode] = useState<'table' | 'preview'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // UI State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [currentAd, setCurrentAd] = useState<Partial<Advertisement>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    redirectUrl: '',
    placements: [],
    startDate: '',
    endDate: '',
    status: 'Active'
  });

  // Handle initial props
  useEffect(() => {
    if (initialMode === 'create') {
      handleCreateNew();
    } else {
      setViewMode('list');
    }
  }, [initialMode]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter Logic
  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (!filterPlacement) return matchesSearch;

    // Advanced filtering logic
    const filterKey = filterPlacement.toLowerCase();

    // Special handling for 'Homepage' to encompass related placements
    if (filterKey === 'homepage') {
      return matchesSearch && ad.placements.some(p => {
        const lowerP = p.toLowerCase();
        return lowerP.includes('homepage') || lowerP.includes('jiffy street');
      });
    }

    return matchesSearch && ad.placements.some(p =>
      p.toLowerCase().includes(filterKey.replace(' ads', ''))
    );
  });

  // Stats Calculation
  const totalAds = filteredAds.length;
  const activeAdsCount = filteredAds.filter(ad => ad.status === 'Active').length;
  const inactiveAdsCount = filteredAds.filter(ad => ad.status !== 'Active').length;

  const handleCreateNew = () => {
    setCurrentAd({
      title: '',
      subtitle: '',
      imageUrl: '',
      redirectUrl: '',
      placements: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active'
    });
    setViewMode('create');
  };

  const handleEdit = (e: React.MouseEvent, ad: Advertisement) => {
    e.stopPropagation();
    setCurrentAd(ad);
    setViewMode('edit');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setAds(prev => prev.filter(ad => ad.id !== deleteId));
      setToast({ message: 'Advertisement deleted successfully.', type: 'success' });
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const toggleStatus = (id: string) => {
    setAds(prev => prev.map(ad =>
      ad.id === id ? { ...ad, status: ad.status === 'Active' ? 'Inactive' : 'Active' } : ad
    ));
    setToast({ message: 'Status updated.', type: 'success' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAd.title || !currentAd.imageUrl || (currentAd.placements?.length || 0) === 0) {
      alert("Please fill in all required fields (Title, Image, Placement).");
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (viewMode === 'create') {
        const newAd: Advertisement = {
          ...currentAd,
          id: `AD-${Date.now()}`,
          status: currentAd.status as 'Active' | 'Inactive' | 'Scheduled'
        } as Advertisement;
        setAds([newAd, ...ads]);
        setToast({ message: 'New advertisement created successfully.', type: 'success' });
      } else {
        setAds(prev => prev.map(ad => ad.id === currentAd.id ? { ...currentAd } as Advertisement : ad));
        setToast({ message: 'Advertisement updated successfully.', type: 'success' });
      }
      setViewMode('list');
    } catch (error) {
      console.error("Error saving ad:", error);
      setToast({ message: 'Failed to save advertisement.', type: 'error' });
    }
  };

  const togglePlacementSelection = (placement: string) => {
    const currentPlacements = currentAd.placements || [];
    if (currentPlacements.includes(placement)) {
      setCurrentAd({ ...currentAd, placements: currentPlacements.filter(p => p !== placement) });
    } else {
      setCurrentAd({ ...currentAd, placements: [...currentPlacements, placement] });
    }
  };

  const renderPreview = () => {
    const activePreviewAds = filteredAds.filter(ad => ad.status === 'Active');

    if (activePreviewAds.length === 0) {
      return (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center bg-white rounded-xl border border-dashed border-gray-300 animate-in fade-in zoom-in duration-300">
          <MonitorPlay size={48} className="text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Active Ads to Preview</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md">
            Activate ads in the list view to see how they look to your customers.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {activePreviewAds.map(ad => (
          <div key={ad.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 group hover:shadow-md transition-all relative">

            {/* Placement Badge */}
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-medium shadow-sm">
                {ad.placements[0]} {ad.placements.length > 1 && `+${ad.placements.length - 1}`}
              </span>
            </div>

            {/* Actions Overlay */}
            <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => handleEdit(e, ad)}
                className="p-1.5 bg-white/90 hover:bg-white text-blue-600 rounded-md shadow-sm transition-colors"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(e, ad.id)}
                className="p-1.5 bg-white/90 hover:bg-white text-red-600 rounded-md shadow-sm transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Visual Simulation of the Banner */}
            <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                <h3 className="text-white font-bold text-xl leading-tight shadow-sm">{ad.title}</h3>
                {ad.subtitle && <p className="text-white/90 text-xs mt-1 font-medium">{ad.subtitle}</p>}
                {ad.redirectUrl && (
                  <button className="mt-3 w-fit px-4 py-1.5 bg-white text-gray-900 text-[10px] font-bold uppercase tracking-wide rounded-full flex items-center hover:bg-gray-100 transition-colors">
                    Shop Now <ExternalLink size={10} className="ml-1" />
                  </button>
                )}
              </div>
            </div>

            {/* Admin Info Footer */}
            <div className="p-3 bg-white border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span className="flex items-center font-medium"><Calendar size={12} className="mr-1.5 text-gray-400" /> {ad.endDate}</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Live</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --- Render Views ---

  return (
    <div className="space-y-6 relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* View Mode: List or Edit/Create */}
      {viewMode === 'list' ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <MonitorPlay size={24} className="mr-2 text-primary" />
                {filterPlacement ? `${filterPlacement} Manager` : 'Advertisement Manager'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filterPlacement
                  ? `Managing campaigns for ${filterPlacement}.`
                  : 'Manage banners and promotional content across the platform.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${displayMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Table View"
                >
                  <List size={16} /> <span className="hidden sm:inline">List</span>
                </button>
                <div className="w-px bg-gray-200 mx-1 my-1"></div>
                <button
                  onClick={() => setDisplayMode('preview')}
                  className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${displayMode === 'preview' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Live Preview"
                >
                  <LayoutTemplate size={16} /> <span className="hidden sm:inline">Live Preview</span>
                </button>
              </div>

              <button
                onClick={handleCreateNew}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                <Plus size={18} className="mr-2" />
                Add New Ad
              </button>
            </div>
          </div>

          {/* Stats Summary Header */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Total Campaigns</div>
                <div className="text-2xl font-bold text-gray-900">{totalAds}</div>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><MonitorPlay size={20} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Active Now</div>
                <div className="text-2xl font-bold text-green-600">{activeAdsCount}</div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><Activity size={20} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Scheduled / Inactive</div>
                <div className="text-2xl font-bold text-orange-600">{inactiveAdsCount}</div>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock size={20} /></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search ads by title..."
                className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {displayMode === 'preview' && (
              <div className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full font-medium flex items-center animate-pulse">
                <Eye size={12} className="mr-1.5" /> Viewing Active Ads as Customers see them
              </div>
            )}
          </div>

          {displayMode === 'table' ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Preview</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Title & Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Placement</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Schedule</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAds.map((ad) => (
                      <tr key={ad.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <img src={ad.imageUrl} alt={ad.title} className="h-12 w-20 object-cover rounded border border-gray-200 shadow-sm" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-gray-900">{ad.title}</div>
                          {ad.subtitle && <div className="text-xs text-gray-500">{ad.subtitle}</div>}
                          {ad.redirectUrl && (
                            <a href={ad.redirectUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center mt-1">
                              <LinkIcon size={10} className="mr-1" /> Link
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {ad.placements.map(p => (
                              <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center text-xs">
                            <Calendar size={12} className="mr-1 text-gray-400" />
                            {ad.startDate} <span className="mx-1">to</span> {ad.endDate}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleStatus(ad.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${ad.status === 'Active'
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : ad.status === 'Scheduled'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                              }`}
                          >
                            {ad.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            {ad.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleEdit(e, ad)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, ad.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAds.length === 0 && (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                  <MonitorPlay size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No {filterPlacement} Ads Found</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    There are currently no advertisements matching your filter.
                    <br />Click "Add New Ad" to create one.
                  </p>
                </div>
              )}
            </div>
          ) : (
            renderPreview()
          )}
        </>
      ) : (
        /* Create / Edit Mode */
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <X size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {viewMode === 'create' ? 'Add New Advertisement' : 'Edit Advertisement'}
            </h1>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <form onSubmit={handleSave} className="space-y-8">

              {/* General Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">Ad Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. Summer Sale 2023"
                      value={currentAd.title}
                      onChange={(e) => setCurrentAd({ ...currentAd, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      placeholder="e.g. Flat 50% Off"
                      value={currentAd.subtitle}
                      onChange={(e) => setCurrentAd({ ...currentAd, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL (Optional)</label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="https://ziffykart.com/sale/summer"
                        value={currentAd.redirectUrl}
                        onChange={(e) => setCurrentAd({ ...currentAd, redirectUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">Creative Assets</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image <span className="text-red-500">*</span></label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden group"
                    onClick={() => {
                      // Simulate upload
                      const mockUrl = `https://picsum.photos/800/400?random=${Date.now()}`;
                      setCurrentAd({ ...currentAd, imageUrl: mockUrl });
                    }}
                  >
                    {currentAd.imageUrl ? (
                      <>
                        <img src={currentAd.imageUrl} alt="Preview" className="h-48 object-cover rounded-lg shadow-sm" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium flex items-center"><Edit size={16} className="mr-2" /> Change Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-gray-600 font-medium">Click to upload ad banner</p>
                        <p className="text-xs text-gray-400 mt-1">Supported: JPG, PNG, WEBP (Max 2MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Placements */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">Target Placement <span className="text-red-500">*</span></h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PLACEMENT_OPTIONS.map(placement => (
                    <label
                      key={placement}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${currentAd.placements?.includes(placement)
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={currentAd.placements?.includes(placement)}
                        onChange={() => togglePlacementSelection(placement)}
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${currentAd.placements?.includes(placement) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 bg-white'
                        }`}>
                        {currentAd.placements?.includes(placement) && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">{placement}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule & Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">Schedule & Visibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      value={currentAd.startDate}
                      onChange={(e) => setCurrentAd({ ...currentAd, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                      value={currentAd.endDate}
                      onChange={(e) => setCurrentAd({ ...currentAd, endDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white"
                      value={currentAd.status}
                      onChange={(e) => setCurrentAd({ ...currentAd, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center"
                >
                  <Save size={18} className="mr-2" /> Save Advertisement
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Advertisement?</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this ad? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm"
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

export default AdManager;
