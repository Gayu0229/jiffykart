
import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Mail, Phone, Calendar, ShieldCheck, FileText, CheckCircle, Ban, AlertTriangle, ExternalLink } from 'lucide-react';
import { Franchise, VendorFull, DeliveryPartner } from '../../types';
import { api } from '../../services/api';

interface FranchiseDetailsProps {
   franchise: Franchise;
   onBack: () => void;
}

const FranchiseDetails: React.FC<FranchiseDetailsProps> = ({ franchise: initialFranchise, onBack }) => {
   const [activeTab, setActiveTab] = useState<'Overview' | 'Shops' | 'Delivery' | 'Financials'>('Overview');
   const [franchise, setFranchise] = useState(initialFranchise);
   const [managedShops, setManagedShops] = useState<VendorFull[]>([]);
   const [managedPartners, setManagedPartners] = useState<DeliveryPartner[]>([]);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [shops, partners] = await Promise.all([
               api.getVendors(),
               api.getDeliveryPartners()
            ]);
            // Filter by pincode overlap with franchise territory
            const pincodes = new Set(franchise.pincodes);
            setManagedShops(shops.filter(s => s.pincode && pincodes.has(s.pincode)));
            setManagedPartners(partners.filter(p => p.pincode && pincodes.has(p.pincode)));
         } catch (e) {
            console.error('Failed to load franchise details data:', e);
         }
      };
      fetchData();
   }, [franchise.id]);

   const handleApprove = async () => {
      if (confirm("Confirm approval for this Field Manager?")) {
         try {
            setFranchise(prev => ({ ...prev, status: 'Active', kycStatus: 'Verified' }));
            alert("Field Manager Approved.");
         } catch (e) {
            alert("Action failed. Please try again.");
         }
      }
   };

   const handleDisable = async () => {
      if (confirm("Are you sure you want to disable this Field Manager account?")) {
         try {
            setFranchise(prev => ({ ...prev, status: 'Disabled' }));
            alert("Field Manager Disabled.");
         } catch (e) {
            alert("Action failed. Please try again.");
         }
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Field Manager Details</h1>
         </div>

         {/* Tabs */}
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-2">
            <div className="flex overflow-x-auto">
               {(['Overview', 'Shops', 'Delivery', 'Financials'] as const).map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                  >
                     {tab}
                  </button>
               ))}
            </div>
         </div>

         {/* Tab Content */}
         <div className="min-h-[400px]">
            {activeTab === 'Overview' && (
               <div className="space-y-6">
                  {/* Header Card */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-start">
                     <img src={franchise.avatarUrl} alt="" className="w-24 h-24 rounded-xl bg-gray-200 border border-gray-100" />
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <div>
                              <h2 className="text-2xl font-bold text-gray-900">{franchise.businessName}</h2>
                              <div className="text-sm text-gray-500 mt-1">Owner: {franchise.ownerName} • ID: {franchise.id}</div>
                              <span className={`mt-2 inline-block px-2 py-0.5 text-xs font-bold rounded ${franchise.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                 }`}>
                                 {franchise.status}
                              </span>
                           </div>
                           <div className="flex gap-2">
                              {franchise.status !== 'Active' && (
                                 <button onClick={handleApprove} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-sm font-medium hover:bg-green-100 transition-colors">
                                    Approve
                                 </button>
                              )}
                              {franchise.status !== 'Disabled' && (
                                 <button onClick={handleDisable} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-medium hover:bg-red-100 transition-colors">
                                    Disable
                                 </button>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                           <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex items-center"><MapPin size={16} className="mr-2 text-gray-400" /> {franchise.address}</div>
                              <div className="flex items-center"><Phone size={16} className="mr-2 text-gray-400" /> {franchise.phone}</div>
                              <div className="flex items-center"><Mail size={16} className="mr-2 text-gray-400" /> {franchise.email}</div>
                           </div>
                           <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex items-center">
                                 <span className="font-semibold w-24">Territory:</span>
                                 <span>{franchise.territory.join(', ')}</span>
                              </div>
                              <div className="flex items-center">
                                 <span className="font-semibold w-24">Pincodes:</span>
                                 <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{franchise.pincodes.join(', ')}</span>
                              </div>
                              <div className="flex items-center">
                                 <span className="font-semibold w-24">Joined:</span>
                                 <span>{franchise.joinedDate}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* KYC Docs */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                     <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                        <ShieldCheck size={20} className="mr-2 text-indigo-600" /> KYC Documents
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Business License', 'Tax ID', 'Owner ID', 'Bank Proof'].map((doc, i) => (
                           <div key={i} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center">
                                 <FileText size={18} className="text-gray-400 mr-3" />
                                 <span className="text-sm font-medium text-gray-700">{doc}.pdf</span>
                              </div>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Verified</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'Shops' && (
               <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                     <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Shop Name</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Orders</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {managedShops.length > 0 ? managedShops.map(s => (
                           <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900 text-sm">{s.shopName}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{s.ownerName}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{s.ordersHandled}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-1 text-xs rounded-full ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>{s.status}</span>
                              </td>
                           </tr>
                        )) : (
                           <tr><td colSpan={4} className="p-6 text-center text-gray-500">No shops assigned to this field manager.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'Delivery' && (
               <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                     <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Partner Name</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Zone</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Deliveries</th>
                           <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {managedPartners.length > 0 ? managedPartners.map(p => (
                           <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900 text-sm">{p.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{p.zone}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{p.completedDeliveries}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{p.rating}</td>
                           </tr>
                        )) : (
                           <tr><td colSpan={4} className="p-6 text-center text-gray-500">No delivery partners assigned.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}

            {activeTab === 'Financials' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <h3 className="font-bold text-gray-800 mb-4">Earnings Summary</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-gray-600">Total Revenue Generated</span>
                           <span className="font-bold text-gray-900">${franchise.earnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-gray-600">Pending Payout</span>
                           <span className="font-bold text-orange-600">$4,500</span>
                        </div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <h3 className="font-bold text-gray-800 mb-4">Bank Account</h3>
                     <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="font-bold text-blue-900">{franchise.bankDetails?.bankName}</div>
                        <div className="font-mono text-blue-800 mt-1">{franchise.bankDetails?.accountNumber}</div>
                        <div className="text-xs text-blue-600 mt-2">IFSC: {franchise.bankDetails?.ifsc}</div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default FranchiseDetails;
