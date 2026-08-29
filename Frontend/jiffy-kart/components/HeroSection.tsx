
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerService } from '../services/bannerService';
import { Banner } from '../types';
import { useNavigation } from '../hooks';

interface HeroSectionProps {
  onShopNowClick?: () => void;
  onViewCategoriesClick?: () => void;
  position?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onShopNowClick, position = 'Home' }) => {
  const { cityObj, areaId } = useNavigation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api$/, '');

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await BannerService.getActiveBanners(position, cityObj?.id, areaId);
        setBanners(data);
      } catch (error) {
        console.error("Failed to fetch hero banners", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [position, cityObj?.id, areaId]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 pt-4 h-[220px] md:h-[340px] bg-gray-100 animate-pulse rounded-[2.5rem]" />;
  }

  if (banners.length === 0) return null;

  return (
    <div className="bg-white pb-8">
      {/* Top Banner Carousel */}
      <div className="max-w-7xl mx-auto px-4 pt-4 relative group">
        <div className="overflow-hidden rounded-[2.5rem] relative h-[220px] md:h-[340px] shadow-soft bg-slate-900 leading-[0]">
          {banners.map((banner, index) => {
            const imageUrl = isMobile && banner.imageMobileUrl
              ? resolveUrl(banner.imageMobileUrl)
              : resolveUrl(banner.imageDesktopUrl);

            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${index === activeIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                  }`}
              >
                <a
                  href={banner.ctaUrl || '#'}
                  className="block w-full h-full relative cursor-pointer"
                  onClick={(e) => {
                    if (!banner.ctaUrl) e.preventDefault();
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay Content (Optional - if title/subtitle are used as text overlays) */}
                  {(banner.title || banner.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 md:p-12 text-white">
                      <h2 className="text-2xl md:text-5xl lg:text-6xl font-black mb-1 md:mb-4 leading-tight tracking-tighter drop-shadow-lg">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-white/90 text-xs md:text-xl font-medium mb-4 md:mb-6 leading-relaxed max-w-2xl drop-shadow-md">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.ctaText && (
                        <div className="inline-block bg-white text-slate-900 px-5 py-2 md:px-8 md:py-3.5 rounded-full font-bold text-xs md:text-lg hover:bg-indigo-50 transition-all w-fit shadow-lg">
                          {banner.ctaText}
                        </div>
                      )}
                    </div>
                  )}
                </a>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Arrow Navigation */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % banners.length)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
