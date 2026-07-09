
import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, Edit, Trash2, Eye,
  MoreHorizontal, CheckCircle, XCircle, Package, AlertTriangle, Image as ImageIcon, Zap, Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';

interface ProductListProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onAddProduct, onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('Jiffy Street');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const data = await api.getVendors();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getVendorName = (id: string) => {
    return vendors.find(v => v.id === id)?.shopName || 'Unknown Vendor';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;

    let matchesType = true;
    if (filterType === 'Jiffy Street') matchesType = !!p.isJiffyStreet;
    if (filterType === 'Standard') matchesType = !p.isJiffyStreet;

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedProducts = products.filter(p => p.id !== deleteId);
        // Persist change via an API method if needed, for now updating local state
        setProducts(updatedProducts);
        setToast({ message: 'Product deleted successfully.', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to delete product.', type: 'error' });
      } finally {
        setShowDeleteModal(false);
        setDeleteId(null);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Live': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Live</span>;
      case 'Draft': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">Draft</span>;
      case 'Inactive': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Inactive</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">

      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertTriangle size={18} className="text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage catalog, inventory, and pricing.</p>
        </div>
        <button
          onClick={onAddProduct}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} className="mr-2" /> Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Jiffy Street">Jiffy Street Exclusives</option>
            <option value="Standard">Standard Products</option>
          </select>
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home</option>
          </select>
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Live">Live</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-gray-500 font-medium">Loading products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Product Gallery</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={24} />
                            </div>
                          )}
                          {product.isJiffyStreet && (
                            <div className="absolute top-0 right-0 p-1 bg-indigo-600 text-white rounded-bl-lg">
                              <Zap size={10} fill="white" />
                            </div>
                          )}
                        </div>

                        {product.galleryImages && product.galleryImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 w-16 h-16 flex-shrink-0">
                            {product.galleryImages.filter(img => !img.isMain).slice(0, 3).map((img, idx) => (
                              <div key={idx} className="relative w-full h-full rounded overflow-hidden border border-gray-100">
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {product.galleryImages.filter(img => !img.isMain).length > 3 && (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 rounded">
                                +{product.galleryImages.filter(img => !img.isMain).length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-gray-900 line-clamp-1 max-w-xs" title={product.name}>{product.name}</div>
                          {product.isJiffyStreet && (
                            <span className="text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded tracking-wider">Jiffy Street</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">SKU: {product.sku}</div>
                        <div className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                          {product.category}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Vendor: {getVendorName(product.vendorId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</div>
                      {product.discount > 0 && <div className="text-xs text-green-600">{product.discount}% Off</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${product.stock < 10 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {product.stock}
                        </span>
                        {product.stock < 10 && <AlertTriangle size={14} className="text-orange-500 ml-2" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
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
        )}
        {!loading && filteredProducts.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Package size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or add a new product.</p>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this product? This action cannot be undone and will remove it from all listings.
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

export default ProductList;
