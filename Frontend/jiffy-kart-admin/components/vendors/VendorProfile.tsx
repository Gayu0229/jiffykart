
import React from 'react';
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Star,
  Package,
  ShoppingBag,
  DollarSign,
  FileText,
  CreditCard,
  Ban,
  AlertTriangle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { VendorFull } from '../../types';
import { api } from '../../services/api';

interface VendorProfileProps {
  vendor: VendorFull;
  onBack: () => void;
}

const VendorProfile: React.FC<VendorProfileProps> = ({ vendor, onBack }) => {

  const handleSendWarning = async () => {
    const message = prompt(`Enter warning message for ${vendor.shopName}:`, "Please update your catalog.");
    if (message) {
      try {
        await api.sendVendorWarning(vendor.id, message);
        alert(`Warning sent to ${vendor.email}`);
      } catch (error) {
        alert("Failed to send warning. Please check if vendor email is configured.");
      }
    }
  };

  const handleBlockVendor = async () => {
    if (confirm(`Are you sure you want to BLOCK ${vendor.shopName}? This will suspend their account.`)) {
      try {
        await api.blockVendor(vendor.id);
        alert(`${vendor.shopName} has been blocked successfully.`);
        // Refresh the view or update status locally if needed
        window.location.reload();
      } catch (error) {
        alert("Failed to block vendor.");
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Back Navigation */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Vendor List
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6 relative">
        {/* Banner */}
        <div className="h-40 w-full bg-gray-100 relative">
          <img src={vendor.bannerUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => window.open('#', '_blank')}
              className="px-3 py-1.5 bg-white/90 backdrop-blur text-gray-700 text-xs font-medium rounded shadow-sm hover:bg-white flex items-center"
            >
              View Shop Page <ExternalLink size={12} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 pt-16 relative">
          {/* Avatar - Absolute Positioned for Perfect Overlap */}
          <div className="absolute -top-12 left-6">
            <img
              src={vendor.avatarUrl}
              alt={vendor.shopName}
              className="w-24 h-24 rounded-xl border-4 border-white shadow-md bg-white object-cover"
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            {/* Text Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{vendor.shopName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${vendor.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                  {vendor.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center text-gray-600"><BriefcaseIcon className="w-4 h-4 mr-1.5 text-gray-400" /> {vendor.businessType}</span>
                <span className="flex items-center"><MapPin size={14} className="mr-1.5 text-gray-400" /> {vendor.address}</span>
                <span className="flex items-center"><Calendar size={14} className="mr-1.5 text-gray-400" /> Joined {vendor.joinedDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto pt-2">
              <button
                onClick={handleSendWarning}
                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <AlertTriangle size={16} className="mr-2" />
                Send Warning
              </button>
              <button
                onClick={handleBlockVendor}
                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
              >
                <Ban size={16} className="mr-2" />
                Block Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="space-y-6">

          {/* Owner Details */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Owner Details</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mr-3">
                  {vendor.ownerName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{vendor.ownerName}</div>
                  <div className="text-xs text-gray-500">ID: {vendor.id}</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={16} className="mr-3 text-gray-400" />
                {vendor.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone size={16} className="mr-3 text-gray-400" />
                {vendor.phone}
              </div>
            </div>
          </div>

          {/* KYC & Bank */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Verification & Bank</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${vendor.kycStatus === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                {vendor.kycStatus}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-gray-400 mb-2">KYC DOCUMENTS</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border border-gray-100 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <div className="flex items-center text-sm text-gray-700">
                      <FileText size={16} className="text-blue-500 mr-2" />
                      <span className="truncate max-w-[140px]">Business License.pdf</span>
                    </div>
                    <ShieldCheck size={14} className="text-green-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between p-2 border border-gray-100 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <div className="flex items-center text-sm text-gray-700">
                      <FileText size={16} className="text-blue-500 mr-2" />
                      <span className="truncate max-w-[140px]">Tax Identification.pdf</span>
                    </div>
                    <ShieldCheck size={14} className="text-green-500 flex-shrink-0" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-400 mb-2">BANK DETAILS</div>
                {vendor.bankDetails ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center mb-2 text-blue-800 font-bold text-sm">
                      <CreditCard size={16} className="mr-2" />
                      {vendor.bankDetails.bankName}
                    </div>
                    <div className="text-xs text-blue-700 space-y-1.5 font-medium">
                      <div className="flex justify-between"><span>Account:</span> <span className="font-mono">{vendor.bankDetails.accountNumber}</span></div>
                      <div className="flex justify-between"><span>IFSC:</span> <span className="font-mono">{vendor.bankDetails.ifsc}</span></div>
                      <div className="flex justify-between"><span>Holder:</span> <span className="truncate max-w-[100px] text-right">{vendor.bankDetails.accountName}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No bank details linked</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-orange-200 transition-colors group">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{vendor.productsLive}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Products</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors group">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{vendor.ordersHandled.toLocaleString()}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-green-200 transition-colors group">
              <div className="p-3 bg-green-50 text-green-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">${vendor.totalRevenue.toLocaleString()}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</div>
            </div>
          </div>

          {/* Rating Overview */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-gray-900">Shop Rating Overview</h3>
              <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
                <span className="text-3xl font-bold text-yellow-600 mr-3">{vendor.rating}</span>
                <div className="flex flex-col">
                  <div className="flex text-yellow-400 text-sm mb-0.5">
                    {'★★★★★'.split('').map((s, i) => (
                      <span key={i} className={i < Math.floor(vendor.rating) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-yellow-700">Overall Rating</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center text-sm">
                  <span className="w-12 text-gray-500 flex items-center font-medium">{star} <Star size={12} className="ml-1 text-gray-400" /></span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full mx-3 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : 5}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-right text-gray-500 text-xs font-medium">
                    {star === 5 ? '60%' : star === 4 ? '25%' : star === 3 ? '10%' : '5%'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity / Products Placeholder */}
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center border-dashed">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Package size={32} className="text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg">Vendor Product Catalog</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
              Manage all products listed by <span className="font-medium text-gray-700">{vendor.shopName}</span>.
              You can approve new items, reject policy violations, or disable specific listings.
            </p>
            <button className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm text-sm">
              View All {vendor.productsLive} Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon Component
const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default VendorProfile;
