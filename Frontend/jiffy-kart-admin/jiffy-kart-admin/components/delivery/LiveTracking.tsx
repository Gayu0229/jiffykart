
import React from 'react';
import { MapPin, Navigation, AlertTriangle, Clock, Wifi } from 'lucide-react';

const LiveTracking: React.FC = () => {
  // Live tracking will connect to real-time backend (WebSocket) when implemented.
  // No mock data is used.
  const activeDeliveries: any[] = [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">

      {/* Map Area */}
      <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden shadow-inner flex flex-col items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#6b7280 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Wifi size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Live Tracking Not Connected</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Real-time delivery tracking will appear here once the WebSocket connection to the backend is configured.
          </p>
        </div>
      </div>

      {/* Sidebar List */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center">
            <Clock size={18} className="mr-2 text-primary" />
            Active Deliveries ({activeDeliveries.length})
          </h3>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No active deliveries</p>
            <p className="text-xs text-gray-400 mt-1">Live orders will appear here automatically</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LiveTracking;
