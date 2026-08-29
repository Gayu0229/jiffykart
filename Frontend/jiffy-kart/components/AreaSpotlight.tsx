
import React from 'react';

interface AreaSpotlightProps {
  onAreaClick: (area: string) => void;
}

const AREAS = [
  { name: 'Velachery', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=150&q=80' },
  { name: 'T. Nagar', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=150&q=80' },
  { name: 'Porur', image: 'https://images.unsplash.com/photo-1599623560574-39d485900c95?auto=format&fit=crop&w=150&q=80' },
  { name: 'Anna Nagar', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=150&q=80' },
  { name: 'Medavakkam', image: 'https://images.unsplash.com/photo-1560769629-975e13f0c470?auto=format&fit=crop&w=150&q=80' },
  { name: 'Tambaram', image: 'https://images.unsplash.com/photo-1597872252165-4828132e873c?auto=format&fit=crop&w=150&q=80' },
  { name: 'Adyar', image: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=150&q=80' },
  { name: 'Perambur', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=150&q=80' },
  { name: 'Nungambakkam', image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=150&q=80' },
  { name: 'Saidapet', image: 'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=150&q=80' },
  { name: 'Chrompet', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=80' },
  { name: 'Guindy', image: 'https://images.unsplash.com/photo-1598327771800-33e716800c44?auto=format&fit=crop&w=150&q=80' },
];

export const AreaSpotlight: React.FC<AreaSpotlightProps> = ({ onAreaClick }) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Shop by Area in Chennai</h3>
          <p className="text-sm text-gray-500 mt-1">Explore top localities</p>
        </div>
      </div>
      
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
        {AREAS.map((area) => (
          <button 
            key={area.name}
            onClick={() => onAreaClick(area.name)}
            className="flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer snap-start"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition p-0.5 shadow-sm">
               <img 
                 src={area.image} 
                 alt={area.name} 
                 className="w-full h-full object-cover rounded-full group-hover:scale-110 transition duration-500" 
                 loading="lazy"
                 decoding="async"
               />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-primary whitespace-nowrap">
              {area.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
