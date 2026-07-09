
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Upload, Trash2, Plus, ChevronDown,
  X, Image as ImageIcon, CheckCircle2, AlertCircle, Eye, EyeOff,
  Search, Filter, MoreVertical, LayoutGrid, List, Package,
  TrendingUp, ArrowUpRight, ArrowDownRight, Edit3, Loader2, AlertTriangle,
  Minus, Scale, Box, Layers, RefreshCcw, Layers2, Copy, Settings2,
  Star, MessageSquare, User, Calendar, Tag as TagIcon, Sparkles,
  Globe, MapPin
} from 'lucide-react';
import { api } from '../vendor.api';
import { useEffect } from 'react';

interface Review {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
}

interface Variation {
  id: string;
  sku: string;
  attribute: string;
  price: string;
  mrp: string;
  stock: number;
}

interface ProductForm {
  id: string;
  sku: string;
  name: string;
  category: string;
  subCategory: string;
  price: string;
  mrp: string;
  stock: number;
  description: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'REJECTED';
  isActive: boolean;
  show_on_home: boolean;
  show_on_jiffy_street: boolean;
  images: string[]; // base64 previews or backend URLs
  imageFiles?: File[]; // actual File objects for upload
  weight?: string;
  dimensions?: string;
  material?: string;
  has_variations: boolean;
  variations: Variation[];
  reviews: Review[];
}

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', userName: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=alex', rating: 5, comment: 'Absolutely phenomenal quality! The beans are fresh and the roast is perfect.', date: 'Oct 12, 2023', likes: 12 },
  { id: 'r2', userName: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?u=maria', rating: 4, comment: 'Very good, though the packaging was slightly damaged on arrival.', date: 'Oct 05, 2023', likes: 4 },
  { id: 'r3', userName: 'Steve Smith', avatar: 'https://i.pravatar.cc/150?u=steve', rating: 5, comment: 'The best coffee I have had in years. Highly recommended!', date: 'Sep 28, 2023', likes: 21 },
];

const CATEGORY_SUB_MAP: Record<string, string[]> = {
  'Electronics': [
    'Smartphones', 'Tablets', 'Laptops', 'Desktop Accessories',
    'Storage Devices', 'Headphones & Earbuds', 'Speakers',
    'Televisions', 'Smartwatches', 'Smart Home Devices', 'CCTV & Surveillance'
  ],
  'Fashion': [
    'Men Clothing', 'Women Clothing', 'Kids Clothing', 'Footwear',
    'Bags & Accessories', 'Watches & Sunglasses'
  ],
  'Groceries': [
    'Fruits & Vegetables', 'Dairy & Breakfast', 'Munchies',
    'Cold Drinks & Juices', 'Instant & Frozen Food', 'Atta, Rice & Dal',
    'Cooking Oil & Ghee', 'Masala, Fruit & Dry Fruits', 'Sweet Cravings',
    'Cleaning Essentials', 'Personal Care'
  ],
  'Home & Kitchen': [
    'Cookware', 'Kitchen Appliances', 'Home Decor', 'Furniture',
    'Cleaning Supplies', 'Storage & Organization', 'Bedding'
  ],
  'Beauty': [
    'Skincare', 'Haircare', 'Makeup', 'Fragrances', 'Personal Care'
  ],
  'Health': [
    'Health Supplements', 'Medical Devices', 'Wellness', 'Hygiene'
  ],
  'Sports': [
    'Sports Equipment', 'Fitness Accessories', 'Gym Gear', 'Outdoor Sports', 'Swimming'
  ],
  'Books & Stationery': [
    'School Books', 'Competitive Exam Books', 'Novels',
    'Office Stationery', 'Art Supplies', 'Notebooks'
  ],
  'Toys': [
    'Educational Toys', 'Soft Toys', 'Remote Control Toys', 'Board Games', 'Puzzles'
  ],
  'Auto Parts': [
    'Bike Accessories', 'Car Accessories', 'Lubricants', 'Spare Parts', 'Cleaning Tools'
  ],
  'Food': [
    'Meals', 'Fast Food', 'Beverages', 'Desserts', 'Snacks',
    'Laddu', 'Jilabi', 'Gulab Jamun', 'Halwa', 'Cakes', 'Pastries',
    'Biscuits & Cookies', 'Savories', 'Chocolates', 'Traditional Sweets',
    'Donuts', 'Muffins', 'Bread & Buns'
  ],
  'Pet Supplies': [
    'Pet Food', 'Pet Toys', 'Grooming Products', 'Pet Accessories'
  ],
  'Furniture': [
    'Beds', 'Sofas', 'Tables', 'Chairs', 'Storage & Organization', 'Office Furniture'
  ]
};

// Initial state is empty, fetched from API in useEffect
const initialMockProducts: ProductForm[] = [];

const Products: React.FC = () => {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAILS'>('LIST');
  const [products, setProducts] = useState<ProductForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorCategory, setVendorCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductForm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [locationModalProduct, setLocationModalProduct] = useState<ProductForm | null>(null);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [locDetails, setLocDetails] = useState<any[]>([]);
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [locPrice, setLocPrice] = useState('');
  const [locMrp, setLocMrp] = useState('');
  const [locStock, setLocStock] = useState('');

  // Fetch products from API
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.fetchProducts();
      // Ensure backend field names match frontend interface if needed
      // (Mapping backend names to frontend naming if different)
      const BACKEND = (import.meta.env.VITE_API_BASE_URL || 'http://api.jiffykart.in/api').replace('/api', '');
      const resolveImg = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return BACKEND + url;
      };
      const mappedProducts = data.map((p: any) => ({
        ...p,
        stock: p.stockQuantity || 0,
        price: p.price?.toString() || '0',
        mrp: p.mrp?.toString() || '0',
        status: p.status || 'DRAFT',
        images: p.image ? [resolveImg(p.image)] : [],
        isActive: p.status === 'PUBLISHED',
        reviews: p.reviews || [],
        tags: p.tags || [],
        variations: p.variations || [],
        description: p.description || '',
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorProfile = async () => {
    try {
      const profileData = await api.getProfile();
      const pData = profileData as any;
      if (pData && pData.vendorProfile) {
        setVendorCategory(pData.vendorProfile.category);
      }
    } catch (error) {
      console.error('Failed to fetch vendor profile:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadVendorProfile();
  }, []);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Derive dynamic categories from data
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All Categories', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.tags.some(tag => tag.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const [bulkProducts, setBulkProducts] = useState<Partial<ProductForm>[]>([{
    id: Date.now().toString(),
    name: '',
    category: vendorCategory || '',
    subCategory: '',
    price: '',
    mrp: '',
    stock: 0,
    description: '',
    tags: [],
    status: 'DRAFT',
    isActive: false,
    show_on_home: false,
    show_on_jiffy_street: false,
    images: [],
    weight: '',
    dimensions: '',
    material: '',
    has_variations: false,
    variations: [],
    reviews: []
  }]);

  // Sync vendorCategory when it loads
  useEffect(() => {
    if (vendorCategory) {
      setBulkProducts(prev => prev.map(p => ({
        ...p,
        category: p.category || vendorCategory
      })));
    }
  }, [vendorCategory]);

  const handleUpdateStock = async (productId: string, newValue: number, variationId?: string) => {
    try {
      if (variationId) {
        // Assuming backend handles variation stock updates
        await api.updateVariationStock(productId, variationId, newValue);
      } else {
        await api.updateStock(productId, newValue);
      }
      loadProducts(); // Refresh list after update
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      if (product.status === 'PUBLISHED') {
        await api.unpublishProduct(id);
      } else {
        await api.publishProduct(id);
      }
      loadProducts(); // Refresh list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenLocationPricing = async (product: ProductForm) => {
    setLocationModalProduct(product);
    setIsLocLoading(true);
    try {
      const [cities, details] = await Promise.all([
        api.fetchCities(),
        api.fetchLocationProductDetails(product.id)
      ]);
      setAvailableCities(cities);
      setLocDetails(details);
    } catch (e) {
      console.error("Failed to load location details", e);
    } finally {
      setIsLocLoading(false);
    }
  };

  const handleUpdateLocDetail = async () => {
    if (!locationModalProduct || !selectedCityId) return;
    setIsLocLoading(true);
    try {
      await api.updateLocationProductDetail(locationModalProduct.id, selectedCityId, {
        price: parseFloat(locPrice),
        mrp: parseFloat(locMrp),
        stockQuantity: parseInt(locStock)
      });
      const updatedDetails = await api.fetchLocationProductDetails(locationModalProduct.id);
      setLocDetails(updatedDetails);
      setSelectedCityId('');
      setLocPrice('');
      setLocMrp('');
      setLocStock('');
    } catch (e) {
      alert("Failed to update location detail");
    } finally {
      setIsLocLoading(false);
    }
  };

  const calculateAvgRating = (reviews: Review[] = []) => {
    if (!reviews || reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const handleOpenDetails = async (product: ProductForm) => {
    setSelectedProduct(product);
    setView('DETAILS');
    try {
      const reviewData = await api.fetchProductReviews(product.id);
      setSelectedProduct({
        ...product,
        reviews: reviewData.map((r: any) => ({
          id: String(r.id),
          userName: r.userName || 'User',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName || 'User')}&background=random`,
          rating: r.rating || 0,
          comment: r.comment || '',
          date: r.date ? new Date(r.date).toLocaleDateString() : 'Recent',
          likes: r.helpfulCount || 0
        }))
      });
    } catch (e) {
      console.error("Failed to fetch product reviews", e);
    }
  };

  const handleEdit = (product: ProductForm) => {
    setBulkProducts([{
      ...product,
      id: product.id,
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || vendorCategory || '',
      subCategory: product.subCategory || '',
      price: product.price || '0',
      mrp: product.mrp || '0',
      stock: product.stock || 0,
      description: product.description || '',
      tags: [...(product.tags || [])],
      status: product.status || 'DRAFT',
      isActive: product.isActive || false,
      show_on_home: !!product.show_on_home,
      show_on_jiffy_street: !!product.show_on_jiffy_street,
      images: [...(product.images || [])],
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      material: product.material || '',
      has_variations: !!product.has_variations,
      variations: (product.variations || []).map(v => ({ ...v })),
      reviews: (product.reviews || []).map(r => ({ ...r }))
    }]);
    setIsEditMode(true);
    setView('CREATE');
  };

  const addProductBlock = () => {
    setBulkProducts([...bulkProducts, {
      id: Date.now().toString(),
      name: '',
      category: vendorCategory || '',
      subCategory: '',
      price: '',
      mrp: '',
      stock: 0,
      description: '',
      tags: [],
      status: 'DRAFT', // Changed from 'Active' to 'DRAFT'
      isActive: false,
      show_on_home: false,
      show_on_jiffy_street: false,
      images: [],
      weight: '',
      dimensions: '',
      material: '',
      has_variations: false,
      variations: [],
      reviews: []
    }]);
  };

  const removeProductBlock = (index: number) => {
    if (bulkProducts.length > 1) {
      setBulkProducts(bulkProducts.filter((_, i) => i !== index));
    }
  };

  const handleAiGenerateDescription = async (index: number) => {
    const product = bulkProducts[index];
    if (!product.name) {
      alert('Please enter a product name first.');
      return;
    }

    setAiLoading(index);
    try {
      const description = await api.generateAiDescription(product.name);
      handleInputChange(index, 'description', description);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate description with AI. Please check your connection.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleInputChange = (index: number, field: keyof ProductForm, value: any) => {
    const updated = [...bulkProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBulkProducts(updated);
  };

  const addVariationRow = (productIndex: number) => {
    const updated = [...bulkProducts];
    const product = updated[productIndex];
    const newVariation: Variation = {
      id: Date.now().toString() + Math.random(),
      sku: `${product.sku || 'SKU'}-${(product.variations?.length || 0) + 1}`,
      attribute: '',
      price: product.price || '',
      mrp: product.mrp || '',
      stock: 0
    };
    updated[productIndex].variations = [...(product.variations || []), newVariation];
    setBulkProducts(updated);
  };

  const removeVariationRow = (productIndex: number, varIndex: number) => {
    const updated = [...bulkProducts];
    updated[productIndex].variations = updated[productIndex].variations?.filter((_, i) => i !== varIndex);
    setBulkProducts(updated);
  };

  const handleVariationChange = (pIndex: number, vIndex: number, field: keyof Variation, value: any) => {
    const updated = [...bulkProducts];
    const variations = [...(updated[pIndex].variations || [])];
    variations[vIndex] = { ...variations[vIndex], [field]: value };
    updated[pIndex].variations = variations;
    setBulkProducts(updated);
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updated = [...bulkProducts];
        updated[index].images = [...(updated[index].images || []), base64];
        updated[index].imageFiles = [...(updated[index].imageFiles || []), file];
        setBulkProducts(updated);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (pIndex: number, iIndex: number) => {
    const updated = [...bulkProducts];
    updated[pIndex].images = updated[pIndex].images?.filter((_, i) => i !== iIndex);
    updated[pIndex].imageFiles = updated[pIndex].imageFiles?.filter((_, i) => i !== iIndex);
    setBulkProducts(updated);
  };

  const handleSaveAll = async () => {
    try {
      // 1. Validation Phase
      for (const p of bulkProducts) {
        if (!p.name || p.name.trim() === '') {
          alert('Product Name is required.');
          return;
        }
        if (!p.category && vendorCategory) {
          p.category = vendorCategory;
        }
        if (!p.category) {
          alert(`Category is required for product: ${p.name || 'Untitled'}`);
          return;
        }
        if (!p.price || parseFloat(p.price) <= 0) {
          alert(`Price must be greater than 0 for product: ${p.name}`);
          return;
        }
        if (!p.weight || p.weight.trim() === '') {
          alert(`Unit / Quantity is required for product: ${p.name}`);
          return;
        }

        const isFood = p.category === 'Food' || vendorCategory === 'Food';
        const totalStock = p.has_variations
          ? (p.variations || []).reduce((acc, curr) => acc + (parseInt(curr.stock.toString()) || 0), 0)
          : (parseInt(p.stock?.toString() || '0') || 0);

        if (!isFood && totalStock <= 0) {
          alert(`Stock quantity must be strictly greater than 0 for product: ${p.name}`);
          return;
        }
      }

      // 2. Submission Phase
      for (const p of bulkProducts) {
        const formData = new FormData();
        formData.append('name', p.name || '');
        formData.append('price', p.price || '0');
        if (p.mrp) formData.append('mrp', p.mrp);
        if (p.description) formData.append('description', p.description);
        formData.append('category', p.category || vendorCategory || '');
        formData.append('subCategory', p.subCategory || '');
        const isFood = p.category === 'Food' || vendorCategory === 'Food';
        const totalStock = isFood ? 9999 : (p.has_variations
          ? (p.variations || []).reduce((acc, curr) => acc + (parseInt(curr.stock.toString()) || 0), 0)
          : (parseInt(p.stock?.toString() || '0') || 0));
        formData.append('stockQuantity', totalStock.toString());
        if (p.weight) formData.append('weight', p.weight);
        if (p.dimensions) formData.append('dimensions', p.dimensions);
        if (p.material) formData.append('material', p.material);
        formData.append('showOnHome', (p.show_on_home || false).toString());
        formData.append('showOnJiffyStreet', (p.show_on_jiffy_street || false).toString());
        formData.append('status', p.status || 'DRAFT');
        // Attach actual File object for the image
        if (p.imageFiles && p.imageFiles.length > 0) {
          formData.append('image', p.imageFiles[0]); // Backend accepts single image
        }
        if (isEditMode && p.id) {
          await api.updateProduct(p.id, formData);
        } else {
          await api.createProduct(formData);
        }
      }
      alert(isEditMode ? 'Product updated successfully!' : 'Successfully saved ' + bulkProducts.length + ' products!');
      loadProducts(); // Refresh the product list
      setIsEditMode(false);
      setView('LIST');
      setBulkProducts([{
        id: Date.now().toString(),
        name: '',
        category: vendorCategory || '',
        subCategory: '',
        price: '',
        mrp: '',
        stock: 0,
        description: '',
        tags: [],
        status: 'DRAFT', // Changed from 'Active' to 'DRAFT'
        isActive: false,
        show_on_home: false,
        show_on_jiffy_street: false,
        images: [],
        weight: '',
        dimensions: '',
        material: '',
        has_variations: false,
        variations: [],
        reviews: []
      }]);
    } catch (error) {
      console.error('Failed to save products:', error);
      alert('Failed to save products. Please try again.');
    }
  };

  const handleDeleteClick = (product: ProductForm) => {
    setDeleteTarget(product);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(deleteTarget.id);
      loadProducts(); // Refresh list after deletion
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
  };

  if (view === 'DETAILS' && selectedProduct) {
    const avgRating = calculateAvgRating(selectedProduct.reviews);
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="flex items-center justify-between sticky top-0 z-50 bg-[#F9FAFB]/80 backdrop-blur-md py-4">
          <button
            onClick={() => setView('LIST')}
            className="flex items-center space-x-2 text-gray-800 hover:text-black font-black transition-all group"
          >
            <div className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-lg">Product Catalog</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Product Basics */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-6 rounded-[48px] border border-gray-50 shadow-sm overflow-hidden relative">
              <div className="aspect-square rounded-[32px] overflow-hidden mb-6 border border-gray-100 bg-gray-50 flex items-center justify-center">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img src={selectedProduct.images[0]} className="w-full h-full object-cover" alt={selectedProduct.name} />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-200" />
                )}
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedProduct.name}</h2>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-1">SKU: {selectedProduct.sku}</p>
                  </div>
                  <div className="bg-brand-900 text-brand-500 px-4 py-2 rounded-2xl flex items-center shadow-lg">
                    <span className="text-sm font-black mr-1">{avgRating}</span>
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedProduct.description}</p>

                {/* Display Tags */}
                {selectedProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedProduct.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-black uppercase rounded-full border border-brand-100 flex items-center">
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-gray-50 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{selectedProduct.weight || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Material</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{selectedProduct.material || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Variations */}
            {selectedProduct.has_variations && (
              <div className="bg-white p-8 rounded-[48px] border border-gray-50 shadow-sm space-y-6">
                <div className="flex items-center space-x-3">
                  <Layers2 className="w-5 h-5 text-brand-500" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">SKU Breakdown</h3>
                </div>
                <div className="space-y-3">
                  {selectedProduct.variations.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase">{v.attribute}</p>
                        <p className="text-[9px] font-bold text-gray-400">{v.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-gray-900">₹{v.price}</p>
                        {vendorCategory !== 'Food' && (
                          <p className="text-[9px] font-black text-brand-600 uppercase">{v.stock} in stock</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Reviews & Sentiment */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-brand-900 p-10 rounded-[48px] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-4xl font-black tracking-tight">{avgRating}</h3>
                  <div className="flex items-center justify-center md:justify-start space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= Math.round(Math.floor(Number(avgRating))) ? 'text-brand-500 fill-current' : 'text-gray-700'}`} />
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Based on {selectedProduct.reviews.length} reviews</p>
                </div>

                <div className="flex-1 space-y-3 max-w-xs">
                  {[5, 4, 3, 2, 1].map(stars => {
                    const count = selectedProduct.reviews.filter(r => r.rating === stars).length;
                    const pct = selectedProduct.reviews.length > 0 ? (count / selectedProduct.reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center space-x-3">
                        <span className="text-[10px] font-black w-4">{stars}★</span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Recent Feedback</h3>
                </div>
                <button className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">See All Activity</button>
              </div>

              <div className="space-y-4">
                {selectedProduct.reviews.map((review, idx) => (
                  <div key={review.id} className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm space-y-4 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={review.avatar} className="w-10 h-10 rounded-2xl object-cover" alt="" />
                        <div>
                          <p className="text-sm font-black text-gray-900">{review.userName}</p>
                          <div className="flex items-center space-x-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{review.date}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                  </div>
                ))}

                {selectedProduct.reviews.length === 0 && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] p-20 text-center space-y-4">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No reviews for this product yet.</p>
                  </div>
                )}~
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'CREATE') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-50 bg-[#F9FAFB]/80 backdrop-blur-md py-4 gap-4 px-2 md:px-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setView('LIST'); setIsEditMode(false); }}
              className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{isEditMode ? 'Edit Product' : 'Bulk Entry'}</h2>
              <p className="text-xs text-gray-500 font-medium">{isEditMode ? 'Modify product details' : 'Add multiple products at once'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
            <button
              onClick={() => { setView('LIST'); setIsEditMode(false); }}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="bg-brand-900 text-white px-6 md:px-10 py-3 md:py-3.5 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-wider hover:bg-black transition-all shadow-xl shadow-brand-100/50 whitespace-nowrap"
            >
              {isEditMode ? 'Save Changes' : 'Publish Products'}
            </button>
          </div>
        </div>

        <div className="space-y-10">
          {bulkProducts.map((product, index) => (
            <div key={product.id} className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
              <div className="px-10 py-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-black text-gray-900">
                    {product.name || 'Untitled Product'}
                  </h3>
                </div>
                <button
                  onClick={() => removeProductBlock(index)}
                  className={`p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ${bulkProducts.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Media & Toggles */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Images</label>
                      <span className="text-[10px] font-bold text-gray-600">{(product.images || []).length}/5</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {product.images?.map((img, iIndex) => (
                        <div key={iIndex} className="relative aspect-square rounded-3xl overflow-hidden group/img">
                          <img src={img} className="w-full h-full object-cover" alt="Preview" />
                          <button
                            onClick={() => removeImage(index, iIndex)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-lg text-red-500 opacity-0 group-hover/img:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(product.images || []).length < 5 && (
                        <label className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-white transition-all group">
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(index, e)} />
                          <div className="bg-white p-3 rounded-2xl shadow-sm mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand-500" />
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Fields */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Name *</label>
                    <input type="text" value={product.name || ''} onChange={(e) => handleInputChange(index, 'name', e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Category *</label>
                      <select 
                        value={product.category || vendorCategory || ''} 
                        onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all appearance-none"
                      >
                        <option value="">Select Category</option>
                        {Object.keys(CATEGORY_SUB_MAP).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <InputField 
                      label="Sub-category *" 
                      type="text" 
                      value={product.subCategory || ''} 
                      onChange={(val) => handleInputChange(index, 'subCategory', val)}
                      listId={`sub-categories-${index}`}
                      datalistOptions={
                        (product.category || vendorCategory) && CATEGORY_SUB_MAP[product.category || vendorCategory || '']
                          ? CATEGORY_SUB_MAP[product.category || vendorCategory || '']
                          : (product.category || vendorCategory) 
                            ? [`General ${product.category || vendorCategory}`] 
                            : Object.keys(CATEGORY_SUB_MAP)
                      }
                    />
                  </div>

                  {!product.has_variations ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                      <InputField label="Price (₹) *" type="number" value={product.price || ''} onChange={(val) => handleInputChange(index, 'price', val)} />
                      <InputField label="MRP (₹)" type="number" value={product.mrp || ''} onChange={(val) => handleInputChange(index, 'mrp', val)} />
                      {(product.category !== 'Food' && vendorCategory !== 'Food') && (
                        <InputField label="Stock *" type="number" value={product.stock?.toString() || ''} onChange={(val) => handleInputChange(index, 'stock', parseInt(val))} />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Variation Matrix</label>
                        <button
                          onClick={() => addVariationRow(index)}
                          className="flex items-center space-x-2 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Version</span>
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-100/50 text-[8px] font-black uppercase tracking-widest text-gray-400">
                              <th className="px-4 py-3">Attribute (Size/Color) *</th>
                              <th className="px-4 py-3">SKU</th>
                               <th className="px-4 py-3">Price *</th>
                              {(product.category !== 'Food' && vendorCategory !== 'Food') && <th className="px-4 py-3">Stock *</th>}
                              <th className="px-4 py-3 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {product.variations?.map((v, vIdx) => (
                              <tr key={v.id} className="group/row">
                                <td className="px-4 py-2">
                                  <input type="text" value={v.attribute} placeholder="e.g. Small / Red" onChange={(e) => handleVariationChange(index, vIdx, 'attribute', e.target.value)} className="w-full bg-transparent border-none text-[10px] font-bold text-gray-900 focus:ring-0 p-0" />
                                </td>
                                <td className="px-4 py-2">
                                  <input type="text" value={v.sku} placeholder="Auto-SKU" onChange={(e) => handleVariationChange(index, vIdx, 'sku', e.target.value)} className="w-full bg-transparent border-none text-[10px] font-bold text-gray-400 focus:ring-0 p-0" />
                                </td>
                                <td className="px-4 py-2">
                                  <input type="number" value={v.price} placeholder="0" onChange={(e) => handleVariationChange(index, vIdx, 'price', e.target.value)} className="w-full bg-transparent border-none text-[10px] font-bold text-gray-900 focus:ring-0 p-0" />
                                </td>
                                {(product.category !== 'Food' && vendorCategory !== 'Food') && (
                                  <td className="px-4 py-2">
                                    <input type="number" value={v.stock} placeholder="0" onChange={(e) => handleVariationChange(index, vIdx, 'stock', parseInt(e.target.value))} className="w-full bg-transparent border-none text-[10px] font-bold text-gray-900 focus:ring-0 p-0" />
                                  </td>
                                )}
                                <td className="px-4 py-2 text-right">
                                  <button onClick={() => removeVariationRow(index, vIdx)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(product.variations || []).length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  No variations defined. Click "Add Version" to start.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                        <Scale className="w-3 h-3 mr-1" /> UNIT / QUANTITY *
                      </label>
                      <input type="text" value={product.weight || ''} onChange={(e) => handleInputChange(index, 'weight', e.target.value)} placeholder="e.g. 1 Kg, 500 ml, 1 P" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                        <Box className="w-3 h-3 mr-1" /> Dimensions
                      </label>
                      <input type="text" value={product.dimensions || ''} onChange={(e) => handleInputChange(index, 'dimensions', e.target.value)} placeholder="e.g. 10x10x10cm" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                        <Layers className="w-3 h-3 mr-1" /> Material
                      </label>
                      <input type="text" value={product.material || ''} onChange={(e) => handleInputChange(index, 'material', e.target.value)} placeholder="e.g. Cotton" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={(product.tags || []).join(', ')}
                      onChange={(e) => handleInputChange(index, 'tags', e.target.value.split(',').map(t => t.trim()).filter(t => t !== ''))}
                      placeholder="e.g. organic, vegan, coffee"
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                      {/* <button 
                        onClick={() => handleAiGenerateDescription(index)}
                        disabled={aiLoading !== null}
                        className="flex items-center space-x-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {aiLoading === index ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                         <span>{aiLoading === index ? 'Generating...' : 'Generate with AI'}</span> 
                      </button> */}
                    </div>
                    <textarea rows={4} value={product.description || ''} onChange={(e) => handleInputChange(index, 'description', e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-none rounded-3xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all resize-none" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addProductBlock} className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center space-y-4 hover:border-brand-500 hover:bg-white hover:shadow-xl hover:shadow-brand-50 transition-all group">
            <div className="bg-gray-900 text-white p-4 rounded-3xl group-hover:bg-brand-500 group-hover:text-gray-900 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Add Another Product</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Product Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-md w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-2">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Remove Product?</h3>
              <p className="text-sm font-medium text-gray-500">
                Are you sure you want to delete <span className="font-black text-gray-900">"{deleteTarget.name}"</span>? This will permanently remove it from your store catalog.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full bg-red-500 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting Product...
                  </>
                ) : (
                  'Yes, Delete Product'
                )}
              </button>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="w-full bg-gray-50 text-gray-500 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Location-wise Pricing Modal */}
      {locationModalProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-300 space-y-8 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Hyperlocal Management</h3>
                <p className="text-sm font-medium text-gray-500">Set city-specific price and stock for <span className="text-gray-900 font-bold">{locationModalProduct.name}</span></p>
              </div>
              <button 
                onClick={() => setLocationModalProduct(null)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-[32px] space-y-4 border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-500">Add/Update Override</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select City</label>
                      <select 
                        value={selectedCityId} 
                        onChange={(e) => setSelectedCityId(e.target.value)}
                        className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 transition-all shadow-sm cursor-pointer"
                      >
                        <option value="">Choose a Location...</option>
                        {availableCities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                        <input 
                          type="number" 
                          value={locPrice} 
                          onChange={(e) => setLocPrice(e.target.value)}
                          placeholder="0"
                          className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</label>
                        <input 
                          type="number" 
                          value={locStock} 
                          onChange={(e) => setLocStock(e.target.value)}
                          placeholder="0"
                          className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MRP (₹)</label>
                      <input 
                        type="number" 
                        value={locMrp} 
                        onChange={(e) => setLocMrp(e.target.value)}
                        placeholder="0"
                        className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                      />
                    </div>

                    <button 
                      onClick={handleUpdateLocDetail}
                      disabled={isLocLoading || !selectedCityId}
                      className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-500 hover:text-gray-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isLocLoading ? 'Saving...' : 'Apply Overrides'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Existing Overrides</h4>
                <div className="space-y-3">
                  {locDetails.length === 0 ? (
                    <div className="p-10 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No local overrides found</p>
                    </div>
                  ) : (
                    locDetails.map(d => (
                      <div key={d.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between hover:border-brand-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-brand-50 transition-colors">
                            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{d.city?.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {d.city?.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-brand-600">₹{d.price}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.stockQuantity} in stock</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest justify-center">
              <Sparkles className="w-3 h-3 text-brand-500" /> Hyperlocal pricing helps optimize sales per region
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Products</h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium">Manage your store inventory and catalog</p>
        </div>
        <div className="flex items-center gap-2 md:space-x-3">
          <button className="hidden md:flex items-center space-x-2 bg-white border border-gray-100 px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('CREATE')}
            className="flex items-center gap-1.5 bg-brand-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider hover:bg-black transition-all shadow-xl shadow-brand-100/50"
          >
            <Plus className="w-4 h-4" /> Add product
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-2 ${vendorCategory === 'Food' ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-3 md:gap-6`}>
        <MiniStatCard label="Total Products" value={products.length.toString()} change="+12" isPositive={true} icon={<Package className="text-brand-500" />} />
        <MiniStatCard label="Active Items" value={products.filter(p => p.status === 'PUBLISHED').length.toString()} change="+8" isPositive={true} icon={<CheckCircle2 className="text-brand-600" />} />
        {vendorCategory !== 'Food' && (
          <>
            <MiniStatCard label="Out of Stock" value={products.filter(p => p.stock === 0).length.toString()} change="-2" isPositive={true} icon={<AlertCircle className="text-red-500" />} />
            <MiniStatCard label="Low Stock" value={products.filter(p => p.stock > 0 && p.stock < 20).length.toString()} change="+5" isPositive={false} icon={<TrendingUp className="text-orange-500" />} />
          </>
        )}
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, SKU, tags, or description..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-[20px] text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Category Filter */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-48 appearance-none pl-4 pr-10 py-3.5 bg-white border border-gray-100 rounded-[20px] text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <button
            onClick={clearFilters}
            className={`p-3.5 bg-white border border-gray-100 rounded-[20px] shadow-sm transition-all ${searchQuery || selectedCategory !== 'All Categories' ? 'text-brand-600 border-brand-500/20' : 'text-gray-400'}`}
          >
            <RefreshCcw className={`w-5 h-5 ${searchQuery || selectedCategory !== 'All Categories' ? 'animate-in spin-in-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100">
                <th className="px-8 py-6 w-12"><input type="checkbox" className="w-4 h-4 rounded border-gray-200 text-brand-500 focus:ring-brand-500" /></th>
                <th className="px-8 py-6">Product</th>
                <th className="px-8 py-6">Classification</th>
                <th className="px-8 py-6">Price Range</th>
                {vendorCategory !== 'Food' && <th className="px-8 py-6">Total Stock</th>}
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-gray-50/30 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(p)}>
                    <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 rounded border-gray-200 text-brand-500 focus:ring-brand-500" /></td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <img src={p.images[0]} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-sm" alt="" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{p.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg border border-brand-100">{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-sm font-black text-gray-900">
                          {p.has_variations && p.variations.length > 0 ? (
                            `₹${Math.min(...p.variations.map(v => parseInt(v.price)))} - ₹${Math.max(...p.variations.map(v => parseInt(v.price)))}`
                          ) : (
                            `₹${parseInt(p.price).toLocaleString()}`
                          )}
                        </span>
                      </div>
                    </td>
                    {vendorCategory !== 'Food' && (
                      <td className="px-8 py-6">
                        <div className="flex flex-col space-y-2 w-48">
                          <div className="flex justify-between items-center text-[10px] font-black mb-1">
                            <span className={p.stock === 0 ? 'text-red-500' : p.stock < 20 ? 'text-orange-500' : 'text-gray-500'}>
                              {p.stock === 0 ? 'Out of Stock' : p.stock < 20 ? 'Low Stock' : 'In Stock'}
                            </span>
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              {p.has_variations ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-400 text-[10px] font-bold uppercase mr-1">Total</span>
                                  <span className="text-gray-900 font-black">{p.stock}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1.5">
                                  <button onClick={() => handleUpdateStock(p.id, p.stock - 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 active:scale-90"><Minus className="w-3 h-3" /></button>
                                  <input
                                    type="number"
                                    value={p.stock}
                                    onChange={(e) => handleUpdateStock(p.id, parseInt(e.target.value) || 0)}
                                    className="w-12 h-6 bg-white border border-gray-100 rounded-lg text-[11px] font-black text-center text-gray-900 focus:ring-1 focus:ring-brand-500 focus:border-transparent outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button onClick={() => handleUpdateStock(p.id, p.stock + 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 active:scale-90"><Plus className="w-3 h-3" /></button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${p.stock === 0 ? 'bg-red-500' : p.stock < 20 ? 'bg-orange-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${p.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-100' :
                            p.status === 'DRAFT' ? 'bg-gray-50 text-gray-600 border-gray-100' :
                              p.status === 'UNPUBLISHED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-red-50 text-red-700 border-red-100'
                            }`}>
                            {p.status}
                          </span>
                        </div>
                        <button
                          className={`w-11 h-6 rounded-full relative transition-colors ${p.status === 'PUBLISHED' ? 'bg-brand-500' : 'bg-gray-200'}`}
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(p.id); }}
                          title={p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${p.status === 'PUBLISHED' ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenDetails(p)} className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit Product"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteClick(p)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                  {/* Variation Row Breakdown */}
                  {p.has_variations && vendorCategory !== 'Food' && (
                    <tr className="bg-gray-50/20">
                      <td colSpan={vendorCategory === 'Food' ? 6 : 7} className="px-12 py-0">
                        <div className="py-4 space-y-2 border-t border-gray-50">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-8">Quick Stock Adjustment</p>
                          <div className="flex flex-wrap gap-4 px-8">
                            {p.variations.map(v => (
                              <div key={v.id} className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-brand-500/30">
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-black text-gray-900 uppercase">{v.attribute}</p>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{v.sku}</p>
                                </div>
                                <div className="h-6 w-px bg-gray-100" />
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStock(p.id, v.stock - 1, v.id); }}
                                    className="w-5 h-5 flex items-center justify-center bg-gray-50 rounded-lg text-[10px] text-gray-500 hover:bg-gray-100 transition-colors"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={v.stock}
                                    onChange={(e) => handleUpdateStock(p.id, parseInt(e.target.value) || 0, v.id)}
                                    className="w-10 h-5 bg-transparent border-none text-[11px] font-black text-center text-gray-900 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStock(p.id, v.stock + 1, v.id); }}
                                    className="w-5 h-5 flex items-center justify-center bg-gray-50 rounded-lg text-[10px] text-gray-500 hover:bg-gray-100 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-900">No matching items</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Try adjusting your search or category filter</p>
                      </div>
                      <button
                        onClick={clearFilters}
                        className="text-[10px] font-black uppercase text-brand-500 hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </span>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase text-gray-400">Previous</button>
            <button className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-brand-100">1</button>
            <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase text-gray-700">2</button>
            <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase text-gray-700">Next</button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            onClick={() => handleOpenDetails(p)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex gap-3">
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0]} className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0" alt="" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-8 h-8 text-gray-200" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black text-gray-900 line-clamp-2 leading-tight">{p.name}</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border whitespace-nowrap flex-shrink-0 ${p.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-100' :
                      p.status === 'DRAFT' ? 'bg-gray-50 text-gray-600 border-gray-100' :
                        p.status === 'UNPUBLISHED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-red-50 text-red-700 border-red-100'
                      }`}>
                      {p.status}
                    </span>
                    <button
                      className={`w-10 h-5 rounded-full relative transition-colors ${p.status === 'PUBLISHED' ? 'bg-brand-500' : 'bg-gray-200'}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(p.id); }}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${p.status === 'PUBLISHED' ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">SKU: {p.sku}</p>
                <span className="text-[10px] font-black uppercase bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg border border-brand-100 inline-block mt-1">{p.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 border-dashed">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Price</p>
                  <p className="text-sm font-black text-gray-900">
                    {p.has_variations && p.variations.length > 0 ? (
                      `₹${Math.min(...p.variations.map(v => parseInt(v.price)))} - ₹${Math.max(...p.variations.map(v => parseInt(v.price)))}`
                    ) : (
                      `₹${parseInt(p.price).toLocaleString()}`
                    )}
                  </p>
                </div>
                {vendorCategory !== 'Food' && (
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Stock</p>
                    <p className={`text-sm font-black ${p.stock === 0 ? 'text-red-500' : p.stock < 20 ? 'text-orange-500' : 'text-gray-900'}`}>{p.stock}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenLocationPricing(p); }}
                  className="p-2.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all active:scale-95 tooltip"
                  title="Manage Location Pricing"
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                  className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleOpenDetails(p)}
                  className="p-2.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all active:scale-95"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(p)}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-sm font-black text-gray-900">No matching items</h3>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="text-xs font-black text-brand-500 mt-3 hover:underline">Reset Filters</button>
          </div>
        )}

        <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const MiniStatCard: React.FC<{ label: string; value: string; change: string; isPositive: boolean; icon: React.ReactNode }> = ({ label, value, change, isPositive, icon }) => (
  <div className="bg-white p-5 rounded-[24px] border border-gray-50 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="bg-gray-50 p-2.5 rounded-xl">{icon}</div>
      <span className={`flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isPositive ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />} {change}
      </span>
    </div>
    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">{label}</p>
    <h3 className="text-2xl font-black text-gray-900 mt-2">{value}</h3>
  </div>
);

const ToggleField: React.FC<{ label: string; sub: string; active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, sub, active, onClick, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100/50">{icon}</div>
      <div>
        <p className="text-xs font-black text-gray-900 uppercase">{label}</p>
        <p className="text-[10px] text-gray-500 font-medium leading-none mt-1">{sub}</p>
      </div>
    </div>
    <button onClick={onClick} className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-brand-500' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const InputField: React.FC<{ 
  label: string; 
  type: string; 
  value: string; 
  onChange: (val: string) => void;
  listId?: string;
  datalistOptions?: string[];
}> = ({ label, type, value, onChange, listId, datalistOptions }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      list={listId}
      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none" 
    />
    {listId && datalistOptions && (
      <datalist id={listId}>
        {datalistOptions.map(opt => <option key={opt} value={opt} />)}
      </datalist>
    )}
  </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white appearance-none cursor-pointer">
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  </div>
);

export default Products;
