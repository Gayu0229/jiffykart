import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/apiService';
import { useNavigation } from '../hooks';
import { BookOpen, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface Blog {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export const BlogSection: React.FC = () => {
  const { cityObj, areaId, city } = useNavigation();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, [cityObj?.id, areaId]);

  const loadBlogs = async () => {
    setLoading(true);
    const data = await ApiService.getBlogPosts(cityObj?.id, areaId);
    setBlogs(data);
    setLoading(false);
  };

  if (loading) return null;
  if (blogs.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Local Stories & Updates <BookOpen className="text-primary" size={24} />
          </h3>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">What's happening in {city}</p>
        </div>
        <button className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:gap-3 transition-all group">
          View All Posts <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.slice(0, 3).map((blog) => (
          <div key={blog.id} className="group cursor-pointer">
            <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-6 shadow-xl shadow-slate-200/50 group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
              <img 
                src={blog.imageUrl || `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800`} 
                alt={blog.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Featured</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <Calendar size={12} />
                {new Date(blog.createdAt).toLocaleDateString()}
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
              <div className="text-primary text-[10px] font-black uppercase tracking-widest">General</div>
            </div>
            <h4 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight mb-3">
              {blog.title}
            </h4>
            <p className="text-slate-500 font-medium text-sm line-clamp-2 leading-relaxed">
              {blog.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
