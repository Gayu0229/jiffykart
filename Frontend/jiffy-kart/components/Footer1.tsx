
import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ExternalLink, ArrowRight, Store, ShieldCheck, Truck } from 'lucide-react';
import { useNavigation } from '../hooks';

export const Footer: React.FC = () => {
  const { navigate } = useNavigation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white mt-24">
      {/* Top Banner - Features */}
      <div className="border-b border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <Truck size={24} />
            </div>
            <div>
              <h5 className="font-black uppercase tracking-widest text-xs">Fast Hyperlocal Delivery</h5>
              <p className="text-slate-500 text-xs mt-1 font-medium italic">Items at your door in 30 mins</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h5 className="font-black uppercase tracking-widest text-xs">Verfied Partner Shops</h5>
              <p className="text-slate-500 text-xs mt-1 font-medium italic">100% genuine products only</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <Store size={24} />
            </div>
            <div>
              <h5 className="font-black uppercase tracking-widest text-xs">Zero Commission for Locals</h5>
              <p className="text-slate-500 text-xs mt-1 font-medium italic">Directly empowering local shops</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="space-y-6">
            <img src="/assets/images/logo.jpg" className="h-16 w-auto brightness-200 invert" alt="JiffyKart" />
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
              Revolutionizing hyperlocal commerce with Jiffy-fast deliveries and direct store-to-customer connection.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 mb-8">Navigation</h4>
            <ul className="space-y-4">
              {['Shops', 'Collections', 'Jiffy Street', 'Jiffy Cafe'].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => navigate(link.toLowerCase().replace(' ', '-'))}
                    className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition group"
                  >
                    <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all font-black" />
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Links */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 mb-8">Partner With Us</h4>
            <ul className="space-y-4">
              {['Become a Shop Partner', 'Digital Marketing Services', 'Delivery Partner Program', 'Vendor Dashboard'].map((link) => (
                <li key={link}>
                  <button className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-2 transition group">
                    <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all font-black" />
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
            <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 mb-6">Need Support?</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <MapPin className="text-primary shrink-0" size={20} />
                <p className="text-slate-300 text-xs font-bold leading-relaxed">
                  123 Market Street,<br />
                  Tech District, Bangalore<br />
                  Karnataka 560001
                </p>
              </div>
              <div className="flex gap-4">
                <Mail className="text-primary shrink-0" size={20} />
                <p className="text-slate-300 text-xs font-bold">support@jiffykart.com</p>
              </div>
              <div className="flex gap-4">
                <Phone className="text-primary shrink-0" size={20} />
                <p className="text-slate-300 text-xs font-bold">+91 98765 43210</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal & Bottom */}
      <div className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
            © {currentYear} Jiffykart Technologies. All Rights Reserved.
          </p>
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('privacy-policy')} className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition">Privacy Policy</button>
            <button onClick={() => navigate('terms-and-conditions')} className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
