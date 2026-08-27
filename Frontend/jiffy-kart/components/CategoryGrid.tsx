import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES } from './constants';
import { LayoutGrid, X, ChevronRight } from 'lucide-react';
import { useNavigation } from '../hooks';

interface CategoryGridProps {
  onCategoryClick: (id: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategoryClick }) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const { navigate } = useNavigation();

  const CATEGORY_BROWSER_DATA = [
    {
      name: 'Kurtis and dress',
      icon: '👗',
      subGroups: [
        {
          groupName: 'Kurtis & Dress',
          items: ['Kurtis', 'Sarees', 'Salwar Suits', 'Gowns', 'Dress Materials']
        }
      ]
    },
    {
      name: 'Kids',
      icon: '👶',
      subGroups: [
        {
          groupName: 'Kids Wear',
          items: ['Boys Clothing', 'Girls Clothing', 'Baby Wear']
        },
        {
          groupName: 'Baby Care',
          items: ['Infant Care']
        }
      ]
    },
    {
      name: 'Home',
      icon: '🏠',
      subGroups: [
        {
          groupName: 'Home Essentials',
          items: ['Bedsheets', 'Curtains', 'Cushions', 'Blankets', 'Towels']
        }
      ]
    },
    {
      name: 'Footwear',
      icon: '👟',
      subGroups: [
        {
          groupName: 'Women',
          items: ['Flip Flops', 'Heels & Sandals', 'Juttis & Mojaris', 'Boots', 'Casual Shoes', 'Flats', 'Bellies & Ballerinas']
        },
        {
          groupName: 'Men',
          items: ['Casual Shoes', 'Flip Flops', 'Loafers', 'Sandals', 'Sports Shoes']
        },
        {
          groupName: 'Kids',
          items: ['Casual Shoes', 'Flip Flops', 'Booties', 'Sandals', 'Sports Shoes']
        }
      ]
    },
    {
      name: 'Sports',
      icon: '⚽',
      subGroups: [
        {
          groupName: 'Sports Gear',
          items: ['Fitness Gear', 'Cricket', 'Badminton', 'Football']
        },
        {
          groupName: 'Apparel',
          items: ['Activewear']
        }
      ]
    },
    {
      name: 'Toys',
      icon: '🧸',
      subGroups: [
        {
          groupName: 'Toys & Games',
          items: ['Soft Toys', 'Board Games', 'Action Figures', 'Puzzles', 'Outdoor Toys']
        }
      ]
    },
    {
      name: 'Furniture',
      icon: '🛋️',
      subGroups: [
        {
          groupName: 'Furniture Essentials',
          items: ['Sofas', 'Beds', 'Dining Tables', 'Chairs', 'Wardrobes']
        }
      ]
    },
    {
      name: 'Ethnic Wear',
      icon: '🏮',
      subGroups: [
        {
          groupName: 'Lehangas',
          items: ['Silk lehangas', 'Indo-Western Lehangas', 'Readymade Lehangas']
        },
        {
          groupName: 'Ethnic Gowns',
          items: ['Rayon Ethnic Gowns', 'Anarkali Gowns']
        },
        {
          groupName: 'Blouses',
          items: ['Silk Embroidery Blouse', 'Rayon Blouse', 'Cotton Blouse']
        }
      ]
    },
    {
      name: 'Western Wear',
      icon: '👖',
      subGroups: [
        {
          groupName: 'Apparel',
          items: ['T-Shirts', 'Jeans', 'Shirts', 'Dresses', 'Trousers', 'Jackets']
        }
      ]
    },
    {
      name: 'Jewellery',
      icon: '💍',
      subGroups: [
        {
          groupName: 'Bangle set',
          items: ['Bridal side Bangles', 'Cuff', 'Bracelet']
        },
        {
          groupName: 'Jewellery Set',
          items: ['Bridal Jewellery set', 'Mangtika', 'nosepin', 'Anklets']
        },
        {
          groupName: 'Earrings',
          items: ['Jhumkas', 'Studs', 'Ear Chain', 'Chandelier', 'Drop Earrings', 'Half Hoop Earrings', 'Hoop earrings']
        },
        {
          groupName: 'Pendent & Locket',
          items: ['Western Casual', 'Minimal', 'Ethnic Party', 'Ethnic Casual', 'Religious', 'Festive', 'Hand crafted']
        },
        {
          groupName: 'Rings',
          items: ['Finger Ring', 'Toe Ring']
        },
        {
          groupName: 'Mangalsutra',
          items: ['Ethnic Party', 'Festive', 'Ethnic Casual', 'Minimal']
        }
      ]
    },
    {
      name: 'Beauty',
      icon: '💄',
      subGroups: [
        {
          groupName: 'Women Makeup',
          items: ['Lipsticks', 'Face Makeup', 'Nail Polish']
        },
        {
          groupName: 'Women Hair Care',
          items: ['Shampoo & conditioner', 'Hair Oil', 'Hair Styling']
        },
        {
          groupName: 'Women Face Wash',
          items: ['Whitening Creams', 'Face Wash', 'Face Oils & Serums', 'Face Mask & Peels']
        },
        {
          groupName: 'Women Personal care',
          items: ['Body Wash & Scrubs', 'Moisturiser', 'Oils & Serums', 'Perfumes']
        },
        {
          groupName: 'Men Grooming',
          items: ['Trimmers', 'Beard Oil', 'Shaving Razors', 'Aftershave solutions', 'Shaving Scissors', 'Shaving Soap']
        },
        {
          groupName: 'Men Personal care',
          items: ['Shampoo & Conditioner', 'Men\'s Face cream', 'Hair Styling', 'Face Wash', 'Perfume', 'Body Wash']
        },
        {
          groupName: 'Baby',
          items: ['Baby Diapers', 'Baby Wipes', 'Baby Feeding Bottles', 'Baby Teeth Care', 'Baby Body Wash', 'Baby Lotion', 'Baby Powder', 'Baby Oil', 'Baby Shampoo & Conditioner']
        }
      ]
    },
    {
      name: 'Stationery',
      icon: '✏️',
      subGroups: [
        {
          groupName: 'Pen, Pencils & Accessories',
          items: ['Pen', 'Pencil & Accessories', 'Geometry Sets & Pencil Cases']
        },
        {
          groupName: 'Art & Craft',
          items: ['Drawing & Painting', 'Sewing & Beading', 'Craft Items']
        },
        {
          groupName: 'Organise Your Workplace',
          items: ['Desk Organizers', 'Hooks & Hangers', 'File Folder', 'Adhesives & Tapes', 'Calculators', 'Labels & Sticky Notes']
        }
      ]
    },
    {
      name: 'Electronics',
      icon: '🔌',
      subGroups: [
        {
          groupName: 'Audio & Wearables',
          items: ['True Wireless', 'Speaker', 'Neck Band', 'Wired Earphones']
        },
        {
          groupName: 'Accessories',
          items: ['Cable Protectors', 'Mobile Holder', 'Selfie Stick & Ring Lights', 'Chargers & Cable']
        }
      ]
    },
    {
      name: 'Bags & Accessories',
      icon: '👜',
      subGroups: [
        {
          groupName: 'Bags',
          items: ['Handbags', 'Sling Bags', 'Tote Bag', 'Backpacks', 'Travel Bag']
        },
        {
          groupName: 'Watches',
          items: ['Women Watches', 'Men Watches', 'couple Watches', 'Kids Watches']
        },
        {
          groupName: 'Men Accessories',
          items: ['Wallets', 'Belts', 'Sunglasses']
        },
        {
          groupName: 'Women Accessories',
          items: ['Hair Accessories', 'Hair Clips & Pins', 'Wallets', 'Belts', 'Sunglasses']
        },
        {
          groupName: 'Keychains',
          items: ['Keychains']
        }
      ]
    },
    {
      name: 'Cases & Covers',
      icon: '📱',
      subGroups: [
        {
          groupName: 'Case Styles',
          items: ['Designer cases', 'Flip Cases', 'Plain cases']
        },
        {
          groupName: 'Phone Models',
          items: ['iPhone 15 Case', 'iPhone 14 Cover', 'Samsung S24 Case', 'Samsung A55 Cover', 'OnePlus 12 Case', 'OnePlus Nord CE4 Cover', 'Redmi Note 13 Case', 'Realme 12 Pro Cover', 'Vivo V30 Case', 'Oppo F25 Pro Cover', 'Nothing Phone 2 Case', 'Google Pixel 8 Cover']
        }
      ]
    },
    {
      name: 'Books',
      icon: '📚',
      subGroups: [
        {
          groupName: 'Literature',
          items: ['Fiction', 'Biography']
        },
        {
          groupName: 'Learning & Kids',
          items: ['Academic', 'Self Help', 'Kids Books']
        }
      ]
    },
    {
      name: 'Men Fashion',
      icon: '👕',
      subGroups: [
        {
          groupName: 'Shirts & Tshirts',
          items: ['Check Shirts', 'Printed Tshirts', 'Polo Tshirts', 'Half Sleeves Tshirts']
        },
        {
          groupName: 'Pants & Shorts',
          items: ['Regular Jeans', 'Regular Trousers', 'Trackpants', 'Shorts']
        },
        {
          groupName: 'Ethnic Wear',
          items: ['Kurtas & Kurtas Sets', 'Ethnic Jackets', 'Sherwani']
        }
      ]
    },
    {
      name: 'Healthcare',
      icon: '🏥',
      subGroups: [
        {
          groupName: 'Wellness & First Aid',
          items: ['Vitamins', 'First Aid', 'Hygiene', 'Wellness Devices']
        }
      ]
    }
  ];

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const handleSubcategoryClick = (subName: string) => {
    setIsBrowserOpen(false);
    navigate('shops', { category: subName });
  };

  return (
    <div className="mb-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Shop by Category</h3>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Explore our range</p>
        </div>
        <button
          onClick={() => setIsBrowserOpen(true)}
          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full text-rose-600 transition-all duration-300 shadow-sm"
        >
          <LayoutGrid size={16} className="stroke-[2.5]" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Categories</span>
        </button>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">

        {CATEGORIES.map((cat, index) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick(cat.id)}
            className="group flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-primary/20 transition-all duration-500"
          >
            <div className={`
                w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-700 overflow-hidden
                group-hover:scale-110 group-hover:rotate-3
                ${index % 4 === 0 ? 'bg-indigo-50 text-indigo-600 group-hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]' :
                index % 4 === 1 ? 'bg-rose-50 text-rose-600 group-hover:shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)]' :
                  index % 4 === 2 ? 'bg-emerald-50 text-emerald-600 group-hover:shadow-[0_20px_40px_-10px_rgba(5,150,105,0.4)]' :
                    'bg-amber-50 text-amber-600 group-hover:shadow-[0_20px_40px_-10px_rgba(217,119,6,0.4)]'}
            `}>
              {failedImages.has(cat.id) ? (
                <span className="text-current">{(cat as any).iconComponent}</span>
              ) : (
                <img
                  src={`/assets/images/categories/${cat.id}.png`}
                  alt={cat.name}
                  className="w-full h-full object-contain p-2 sm:p-4 transition-all duration-500 group-hover:drop-shadow-lg mix-blend-multiply"
                  onError={() => setFailedImages(prev => new Set(prev).add(cat.id))}
                />
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] group-hover:text-slate-900 transition-colors text-center px-1">
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Category Browser Modal Overlay */}
      {isBrowserOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full h-full md:h-[85vh] md:max-w-4xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">All Categories</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Choose a department to browse products</p>
              </div>
              <button
                onClick={() => setIsBrowserOpen(false)}
                className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Split Pane View */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Sidebar Pane */}
              <div className="w-1/3 md:w-80 border-r border-slate-100 bg-slate-50 overflow-y-auto">
                {CATEGORY_BROWSER_DATA.map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTabIdx(idx)}
                    className={`w-full text-left px-5 py-4 border-l-4 flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      activeTabIdx === idx
                        ? 'border-primary bg-white text-primary shadow-sm'
                        : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{tab.icon}</span>
                      <span className="truncate">{tab.name}</span>
                    </span>
                    <ChevronRight size={14} className={activeTabIdx === idx ? 'text-primary' : 'text-slate-300'} />
                  </button>
                ))}
              </div>

              {/* Right Content Pane */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
                  Popular in {CATEGORY_BROWSER_DATA[activeTabIdx].name}
                </h3>
                <div className="space-y-8">
                  {CATEGORY_BROWSER_DATA[activeTabIdx].subGroups ? (
                    CATEGORY_BROWSER_DATA[activeTabIdx].subGroups.map((group, groupIdx) => (
                      <div key={groupIdx} className="space-y-3">
                        <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest border-b border-rose-50 pb-2 mb-2">
                          {group.groupName}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {group.items.map((sub, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSubcategoryClick(sub)}
                              className="p-4 text-center bg-slate-50 hover:bg-rose-50/50 hover:border-primary/20 border border-slate-100 rounded-2xl transition-all duration-300 group flex flex-col items-center gap-2 hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider group-hover:text-slate-900 leading-tight">
                                {sub}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {CATEGORY_BROWSER_DATA[activeTabIdx].subCategories?.map((sub, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSubcategoryClick(sub)}
                          className="p-5 text-center bg-slate-50 hover:bg-rose-50/50 hover:border-primary/20 border border-slate-100 rounded-2xl transition-all duration-300 group flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-md"
                        >
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                            🏷️
                          </div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider group-hover:text-slate-900 leading-tight">
                            {sub}
                          </span>
                        </button>
                      ))}
                      {(!CATEGORY_BROWSER_DATA[activeTabIdx].subCategories || CATEGORY_BROWSER_DATA[activeTabIdx].subCategories.length === 0) && (
                        <button
                          onClick={() => handleSubcategoryClick(CATEGORY_BROWSER_DATA[activeTabIdx].name)}
                          className="col-span-full p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase text-slate-400 hover:text-slate-900 hover:bg-rose-50/30 transition-colors"
                        >
                          Show All in {CATEGORY_BROWSER_DATA[activeTabIdx].name}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
