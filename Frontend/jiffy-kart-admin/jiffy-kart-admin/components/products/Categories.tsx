import React, { useState, useEffect } from 'react';
import {
  FolderPlus, Edit, Trash2, ChevronRight, Plus,
  Search, Image as ImageIcon, Save, X, Layers,
  ChevronDown
} from 'lucide-react';
import { ProductCategory } from '../../types';
import { api } from '../../services/api';

// Extended local type for the UI
interface CategoryUI extends ProductCategory {
  productsCount: number;
  isActive: boolean;
  status?: string; // For compatibility
  imageUrl?: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryUI | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    parent: '',
    isActive: true,
    imageUrl: ''
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subCategories.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (category?: CategoryUI) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parent: '',
        isActive: category.isActive,
        imageUrl: category.imageUrl || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', parent: '', isActive: true, imageUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        subCategories: editingCategory ? editingCategory.subCategories : [],
        isActive: formData.isActive,
        imageUrl: formData.imageUrl || (editingCategory ? editingCategory.imageUrl : `https://picsum.photos/seed/${formData.name}/200/200`)
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
      } else {
        await api.createCategory(payload);
      }

      await fetchCategories();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save category", error);
      alert("Failed to save category.");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Delete this category? This will also affect all subcategories.')) {
      try {
        await api.deleteCategory(id);
        await fetchCategories();
      } catch (e) {
        alert("Failed to delete category.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize products into catalogs and sub-catalogs.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} className="mr-2" /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="p-5 flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(category)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${category.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">{category.productsCount} Products</span>
                </div>
              </div>
            </div>

            {/* Subcategories */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                <Layers size={12} className="mr-1.5" /> Subcategories
              </div>
              <div className="flex flex-wrap gap-2">
                {category.subCategories.map((sub, idx) => (
                  <span key={idx} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-700 font-medium shadow-sm">
                    {sub}
                  </span>
                ))}
                <button className="text-xs bg-white border border-dashed border-gray-300 px-2 py-1 rounded text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  value={formData.isActive ? 'Active' : 'Inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'Active' })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Parent Category - Optional for simplicity */}
              {!editingCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
                  <select
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    value={formData.parent}
                    onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Categories;
