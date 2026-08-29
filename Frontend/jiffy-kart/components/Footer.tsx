import React from 'react';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Store,
  ShieldCheck,
  Truck,
  Linkedin,
} from 'lucide-react';
import { useNavigation } from '../hooks';
import { ViewType } from '../context/NavigationContext';

export const Footer: React.FC = () => {
  const { navigate } = useNavigation();
  const currentYear = new Date().getFullYear();

  const quickLinks: { label: string; path: ViewType }[] = [
    { label: 'About Us', path: 'home' },
    { label: 'Contact Us', path: 'home' },
    { label: 'Privacy Policy', path: 'privacy-policy' },
    { label: 'Terms & Conditions', path: 'terms-and-conditions' },
    { label: 'Refund Policy', path: 'cancellation-refund' },
  ];

  const exploreLinks: { label: string; path: ViewType }[] = [
    { label: 'Shops', path: 'shops' },
    { label: 'Collections', path: 'collections' },
    { label: 'Jiffy Street', path: 'jiffy-street' },
    { label: 'Jiffy Cafe', path: 'jiffy-cafe' },
    { label: 'Become a Seller', path: 'seller-registration' },
  ];

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/jiffykart', label: 'Instagram', color: 'hover:bg-pink-500' },
    { icon: Facebook, href: 'https://facebook.com/jiffykart', label: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: Twitter, href: 'https://twitter.com/jiffykart', label: 'Twitter/X', color: 'hover:bg-sky-500' },
    { icon: Youtube, href: 'https://youtube.com/@jiffykart', label: 'YouTube', color: 'hover:bg-red-500' },
    { icon: Linkedin, href: 'https://linkedin.com/company/jiffykart', label: 'LinkedIn', color: 'hover:bg-blue-700' },
  ];

  const features = [
    {
      icon: Truck,
      title: 'Hyperlocal Delivery',
      desc: 'Items at your door in 30 mins',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Sellers',
      desc: '100% genuine products only',
    },
    {
      icon: Store,
      title: 'Support Local',
      desc: 'Empowering neighbourhood shops',
    },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-24">

      {/* ── Feature Strip ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all duration-300 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shrink-0">
                  <Icon size={22} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-800">{title}</h5>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Brand Column ── */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-1">
            <div>
              <img
                src="/assets/images/logo.jpg"
                className="h-14 w-auto object-contain"
                alt="JiffyKart"
              />
              <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest mt-2">
                DEALIT TECHNOLOGIES PRIVATE LIMITED
              </p>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed">
              JiffyKart is a hyperlocal marketplace platform connecting customers
              with verified sellers across multiple categories.
            </p>

            {/* Social Icons */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Follow Us
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {socialLinks.map(({ icon: Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-white ${color} hover:border-transparent transition-all duration-300`}
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ label, path }) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-gray-600 hover:text-orange-500 text-sm font-medium flex items-center gap-2 transition-all duration-200 group"
                  >
                    <ArrowRight
                      size={13}
                      className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-orange-500"
                    />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Explore ── */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
              Explore
            </h4>
            <ul className="space-y-3">
              {exploreLinks.map(({ label, path }) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-gray-600 hover:text-orange-500 text-sm font-medium flex items-center gap-2 transition-all duration-200 group"
                  >
                    <ArrowRight
                      size={13}
                      className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-orange-500"
                    />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact Card ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
              Get In Touch
            </h4>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

              <a
                href="mailto:support@jiffykart.in"
                className="flex items-center justify-start text-left gap-3 group w-full"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-all duration-300">
                  <Mail size={16} className="text-orange-500 group-hover:text-white transition-all duration-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email</p>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-500 transition-colors truncate">
                    support@jiffykart.in
                  </p>
                </div>
              </a>

              <a
                href="tel:+919066390736"
                className="flex items-center justify-start text-left gap-3 group w-full"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-all duration-300">
                  <Phone size={16} className="text-orange-500 group-hover:text-white transition-all duration-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Phone</p>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-500 transition-colors">
                    +91 90663 90736
                  </p>
                </div>
              </a>

              <div className="flex items-center justify-start text-left gap-3 w-full">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Location</p>
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                    Bengaluru, Tamil Nadu, India
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Divider ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-gray-200" />
      </div>

      {/* ── Bottom Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-400 font-medium">
              © {currentYear}{' '}
              <span className="font-bold text-gray-600">Dealit Technologies Private Limited</span>
              . All rights reserved.
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              JiffyKart® — Hyperlocal Marketplace Platform
            </p>
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            {(
              [
                { label: 'Privacy Policy', path: 'privacy-policy' },
                { label: 'Terms & Conditions', path: 'terms-and-conditions' },
                { label: 'Refund Policy', path: 'cancellation-refund' },
              ] as { label: string; path: ViewType }[]
            ).map(({ label, path }, i, arr) => (
              <React.Fragment key={label}>
                <button
                  onClick={() => navigate(path)}
                  className="text-[11px] text-gray-400 hover:text-orange-500 font-medium transition-colors duration-200 px-1"
                >
                  {label}
                </button>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 text-xs">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>

    </footer>
  );
};
