
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Upload, Trash2,
  Image as ImageIcon, DollarSign, Info,
  CheckCircle, Loader2, Package, Eye,
   ShoppingCart, Star, Zap, Coffee
 } from 'lucide-react';
import { Product, ProductImage, VendorFull } from '../../types';
import { CATEGORIES_TREE } from '../../constants';
import { api } from '../../services/api';

interface AddProductProps {
  onBack: () => void;
  editProduct?: Product | null;
  fixedFlags?: {
    isJiffyStreet?: boolean;
    isJiffyCafe?: boolean;
  };
}

const AddProduct: React.FC<AddProductProps> = ({ onBack, editProduct, fixedFlags }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<VendorFull[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
    unitType: 'piece',
    status: 'Live',
    price: 0,
    mrp: 0,
    stock: 100,
    imageUrl: '',
    galleryImages: [],
    vendorId: fixedFlags?.isJiffyCafe ? 'JIFFY_CAFE' : 'JIFFY_STREET', 
    isJiffyStreet: fixedFlags ? !!fixedFlags.isJiffyStreet : true,
    isJiffyCafe: fixedFlags ? !!fixedFlags.isJiffyCafe : false,
  });

  useEffect(() => {
    if (editProduct) {
      setProduct({ ...editProduct });
    } else if (fixedFlags) {
      setProduct(prev => ({
        ...prev,
        isJiffyStreet: !!fixedFlags.isJiffyStreet,
        isJiffyCafe: !!fixedFlags.isJiffyCafe,
        vendorId: fixedFlags.isJiffyCafe ? 'JIFFY_CAFE' : 'JIFFY_STREET'
      }));
    }
  }, [editProduct, fixedFlags]);

  useEffect(() => {
    setIsLoadingVendors(true);
    api.getVendors()
      .then(setVendors)
      .catch(err => console.error("Failed to load vendors:", err))
      .finally(() => setIsLoadingVendors(false));
  }, []);

  const handleChange = (field: keyof Product, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFiles([file]);
      const url = URL.createObjectURL(file);
      setProduct(prev => ({
        ...prev,
        imageUrl: url,
        galleryImages: [{ id: 'main', url, isMain: true }]
      }));
    }
  };

  const handleSave = async () => {
    if (!product.name?.trim()) {
      alert("Product name is required.");
      return;
    }
    if (!product.category) {
      alert("Please select a category.");
      return;
    }
    if (product.price === undefined || product.price === null || isNaN(product.price) || product.price <= 0) {
      alert("Please provide a valid price.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editProduct && editProduct.id) {
        // Map frontend field names to backend expected keys for JSON update
        const updateData = {
          ...product,
          showOnJiffyStreet: product.isJiffyStreet,
          showOnJiffyCafe: product.isJiffyCafe,
          stockQuantity: (product.category === 'Food' || product.isJiffyCafe) ? 9999 : product.stock,
          shopId: product.vendorId && !['JIFFY_CAFE', 'JIFFY_STREET', ''].includes(product.vendorId) ? product.vendorId : null
        };
        await api.updateProduct(editProduct.id, updateData);
        alert("Product updated successfully!");
      } else {
        const createFormData = new FormData();
        createFormData.append('name', product.name || '');
        createFormData.append('price', (product.price || 0).toString());
        createFormData.append('mrp', (product.mrp || 0).toString());
        createFormData.append('description', product.description || '');
        createFormData.append('category', product.category || '');
        createFormData.append('status', product.status === 'Live' ? 'PUBLISHED' : 'DRAFT');
        createFormData.append('stockQuantity', (product.category === 'Food' || product.isJiffyCafe) ? '9999' : (product.stock || 0).toString());
        createFormData.append('showOnJiffyStreet', String(product.isJiffyStreet));
        createFormData.append('showOnJiffyCafe', String(product.isJiffyCafe));
        
        if (product.vendorId && !['JIFFY_CAFE', 'JIFFY_STREET', ''].includes(product.vendorId)) {
          createFormData.append('shopId', product.vendorId);
        }

        if (imageFiles.length > 0) {
          createFormData.append('image', imageFiles[0]);
        }

        await api.addProduct(createFormData as any);
        alert(`New product created successfully!`);
      }
      onBack();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors" disabled={isSubmitting}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {editProduct ? 'Edit Product' : 
               fixedFlags?.isJiffyCafe ? 'Add Jiffy Cafe Product' : 
               fixedFlags?.isJiffyStreet ? 'Add Jiffy Street Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-gray-500 font-medium">Flash listing form • Multi-Channel Priority</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="flex items-center px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
          {isSubmitting ? 'Processing...' : 'Save Product'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Form Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-8">
              {/* Image Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Product Image</label>
                <div className="relative aspect-video sm:aspect-[21/9] rounded-2xl bg-slate-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:bg-white hover:border-indigo-300 transition-all cursor-pointer group">
                  {product.imageUrl ? (
                    <>
                      <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Trash2 className="text-white cursor-pointer" onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setProduct(prev => ({ ...prev, imageUrl: '', galleryImages: [] }));
                          setImageFiles([]);
                        }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 text-gray-400 group-hover:text-indigo-600 transition-colors">
                        <Upload size={28} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">Click to upload photo</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Basic Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 text-gray-900 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-xl font-bold transition-all"
                    placeholder="What are you selling?"
                  />
                </div>

                <div className={`grid ${fixedFlags ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                    <select
                      value={product.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer text-gray-900 font-bold transition-all"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES_TREE.filter(cat => {
                        if (fixedFlags?.isJiffyCafe) {
                          return ['Food', 'Groceries', 'Beverages', 'Meals'].includes(cat.name);
                        }
                        return true;
                      }).map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {!fixedFlags && (
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Shop / Vendor</label>
                    <select
                      value={product.vendorId}
                      onChange={(e) => handleChange('vendorId', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer text-gray-900 font-bold transition-all"
                    >
                      <option value="">Select Shop</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.shopName}</option>
                      ))}
                    </select>
                  </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Unit</label>
                    <select
                      value={product.unitType}
                      onChange={(e) => handleChange('unitType', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none text-gray-900 font-bold transition-all"
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">KG</option>
                      <option value="gm">GM</option>
                      <option value="ml">ML</option>
                      <option value="l">L</option>
                      <option value="pack">Pack</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1">
                    {/* Empty for spacing or add something else here */}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
                      <input
                        type="number"
                        value={product.price || ''}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 text-gray-900 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-2xl font-black transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">MRP (Max Retail Price)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
                      <input
                        type="number"
                        value={product.mrp || ''}
                        onChange={(e) => handleChange('mrp', parseFloat(e.target.value) || 0)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-200 text-gray-600 border border-transparent rounded-2xl outline-none text-2xl font-black transition-all opacity-80"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {(product.category !== 'Food' && !product.isJiffyCafe) && (
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-4 bg-slate-50 text-gray-900 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none text-2xl font-black transition-all"
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    value={product.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none resize-none leading-relaxed text-gray-900 font-medium transition-all"
                    placeholder="Tell buyers why they should get this..."
                  />
                </div>

                {/* Content Toggles (Hidden if flags are fixed) */}
                {!fixedFlags && (
                  <>
                    {/* Jiffy Street Toggle */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${product.isJiffyStreet ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                          <ShoppingCart size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Show on Jiffy Street</p>
                          <p className="text-xs text-gray-500 font-medium">Visible in Jiffy Street section</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleChange('isJiffyStreet', !product.isJiffyStreet)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${product.isJiffyStreet ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${product.isJiffyStreet ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>

                    {/* Jiffy Cafe Toggle */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${product.isJiffyCafe ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Coffee size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Show on Jiffy Cafe</p>
                          <p className="text-xs text-gray-500 font-medium">Visible in Jiffy Cafe section</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleChange('isJiffyCafe', !product.isJiffyCafe)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${product.isJiffyCafe ? 'bg-orange-600 shadow-lg shadow-orange-100' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${product.isJiffyCafe ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>
                  </>
                )}
                

                {/* Availability Toggle */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${product.status === 'Live' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Zap size={20} fill={product.status === 'Live' ? "currentColor" : "none"} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Status</p>
                      <p className="text-xs text-gray-500 font-medium">{product.status === 'Live' ? 'Product is Published' : 'Hidden as draft'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleChange('status', product.status === 'Live' ? 'Draft' : 'Live')}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${product.status === 'Live' ? 'bg-green-600 shadow-lg shadow-green-100' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${product.status === 'Live' ? 'translate-x-6' : ''}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Preview Area */}
        <aside className="w-[400px] bg-white border-l border-gray-200 p-8 hidden lg:block overflow-y-auto">
          <div className="sticky top-0 space-y-8">
            <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Eye size={18} className="text-indigo-600" /> Live Preview
            </h3>

            {/* Phone Mockup */}
            <div className="relative mx-auto w-full max-w-[300px] aspect-[9/18.5] bg-gray-950 rounded-[3rem] border-[10px] border-gray-950 shadow-2xl overflow-hidden ring-4 ring-gray-100">
              <div className="h-full bg-white overflow-y-auto pt-8 scrollbar-none">
                {/* Product Hero */}
                <div className="relative aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-200"><ImageIcon size={64} /></div>
                  )}
                  <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm text-gray-400">
                    <Star size={16} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name || 'Your Product Title'}</h2>
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded">
                      {product.category || 'Category'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-600">₹{product.price || '0.00'}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">/ {product.unitType}</span>
                  </div>

                  {product.mrp && product.mrp > (product.price || 0) && (
                    <div className="flex items-center gap-2 mt-[-8px]">
                      <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                      <span className="text-[10px] font-black text-emerald-500 italic">
                        {Math.round(((product.mrp - (product.price || 0)) / product.mrp) * 100)}% OFF
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-4">
                    {product.description || 'Fill in the description to see how it looks here.'}
                  </p>

                  <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                    <ShoppingCart size={18} /> Buy Now
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl text-indigo-400">
                  <Info size={18} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">System Info</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  <span className="text-white font-bold italic">Default: Jiffy Street</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full ${product.stock && product.stock > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <span className="text-white font-bold">Stock: {product.stock || 0} units</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddProduct;
