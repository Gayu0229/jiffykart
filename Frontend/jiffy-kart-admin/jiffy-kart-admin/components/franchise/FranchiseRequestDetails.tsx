
import React, { useState } from 'react';
import { 
  ArrowLeft, User, MapPin, Phone, Mail, Calendar, 
  FileText, Shield, CheckCircle, XCircle, Save, 
  AlertCircle, X, Briefcase, Eye, ZoomIn, Download
} from 'lucide-react';
import { FranchiseRequest } from '../../types';

// Extended interface matching the data structure passed from the list view
interface ExtendedRequest extends FranchiseRequest {
  assignedTerritory?: string;
  pincodes?: string[];
  kycDocs: { name: string; status: 'Pending' | 'Verified' | 'Rejected'; url: string; type?: 'image' | 'pdf' }[];
  territoryNotes?: string;
}

interface FranchiseRequestDetailsProps {
  request: ExtendedRequest;
  onBack: () => void;
}

const FranchiseRequestDetails: React.FC<FranchiseRequestDetailsProps> = ({ request: initialRequest, onBack }) => {
  const [request, setRequest] = useState<ExtendedRequest>(initialRequest);
  
  // Form State for Territory
  const [territoryForm, setTerritoryForm] = useState({
    name: request.assignedTerritory || '',
    pincodes: request.pincodes?.join(', ') || '',
    notes: request.territoryNotes || ''
  });

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | null;
  }>({ isOpen: false, type: null });
  const [rejectReason, setRejectReason] = useState('');

  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string; status: string; type?: 'image' | 'pdf' } | null>(null);

  const handleUpdateKYCDoc = (docName: string, status: 'Verified' | 'Rejected') => {
    const updatedDocs = request.kycDocs.map(d => 
      d.name === docName ? { ...d, status } : d
    );
    
    // Auto-update overall KYC status if all verified
    const allVerified = updatedDocs.every(d => d.status === 'Verified');
    const newKycStatus = allVerified ? 'Verified' : request.kycStatus;

    setRequest({ ...request, kycDocs: updatedDocs, kycStatus: newKycStatus as any });
    
    // If action taken from inside preview modal, close it or update its local status
    if (previewDoc && previewDoc.name === docName) {
       setPreviewDoc(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleAssignTerritory = async () => {
    try {
      // Mock API Call: PUT /api/v1/franchise-requests/:id/territory
      // await fetch(`/api/v1/franchise-requests/${request.id}/territory`, {
      //   method: 'PUT',
      //   body: JSON.stringify(territoryForm)
      // });
      await new Promise(resolve => setTimeout(resolve, 500));

      setRequest({
        ...request,
        assignedTerritory: territoryForm.name,
        pincodes: territoryForm.pincodes.split(',').map(s => s.trim()),
        territoryNotes: territoryForm.notes
      });
      alert("Territory Assigned Successfully");
    } catch (e) {
      alert("Failed to assign territory");
    }
  };

  const confirmAction = async () => {
    try {
      // Mock API Call: POST /api/v1/franchise-requests/:id/approve (or reject)
      // await fetch(`/api/v1/franchise-requests/${request.id}/${modal.type}`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 500));

      if (modal.type === 'approve') {
        setRequest({ ...request, status: 'Approved' });
        alert(`Field Manager ${request.applicantName} has been approved! Notification sent.`);
      } else if (modal.type === 'reject') {
        setRequest({ ...request, status: 'Rejected' });
        alert(`Field Manager request rejected. Notification sent.`);
      }
      setModal({ isOpen: false, type: null });
    } catch (e) {
      alert("Action failed");
    }
  };

  const handleDownload = (e: React.MouseEvent | undefined, doc: { name: string; url: string }) => {
    if (e) e.stopPropagation();
    
    // For production, a fetch-blob approach is good, but for mock images (picsum),
    // direct window.open is more reliable due to CORS redirect handling in JS.
    try {
      window.open(doc.url, '_blank');
    } catch (err) {
      console.error("Download failed", err);
      alert("Unable to open document. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
             <span>ID: {request.id}</span>
             <span>•</span>
             <span>Applied on {request.applicationDate}</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg border text-sm font-bold ${getStatusColor(request.status)}`}>
           {request.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
           {/* Applicant Card */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
                 <User size={18} className="mr-2 text-indigo-600" />
                 <h3 className="font-bold text-gray-800">Applicant Information</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                    <div className="text-gray-900 font-medium mt-1">{request.applicantName}</div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Contact</label>
                    <div className="flex items-center mt-1 text-gray-700 text-sm">
                       <Mail size={14} className="mr-2 text-gray-400"/> {request.email}
                    </div>
                    <div className="flex items-center mt-1 text-gray-700 text-sm">
                       <Phone size={14} className="mr-2 text-gray-400"/> {request.phone}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                    <div className="flex items-center mt-1 text-gray-700 text-sm">
                       <MapPin size={14} className="mr-2 text-gray-400"/> {request.city}, {request.state}
                    </div>
                 </div>
              </div>
           </div>

           {/* Status Summary */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4">Current Status</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">KYC Status</span>
                    <span className={`font-bold ${request.kycStatus === 'Verified' ? 'text-green-600' : 'text-orange-500'}`}>
                       {request.kycStatus}
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Territory</span>
                    <span className={`font-bold ${request.assignedTerritory ? 'text-indigo-600' : 'text-gray-400'}`}>
                       {request.assignedTerritory ? 'Assigned' : 'Pending'}
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* KYC Documents */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                 <div className="flex items-center">
                    <Shield size={18} className="mr-2 text-indigo-600" />
                    <h3 className="font-bold text-gray-800">KYC Documents</h3>
                 </div>
              </div>
              <div className="p-6 space-y-3">
                 {request.kycDocs.map((doc, idx) => (
                    <div 
                        key={idx} 
                        className="flex flex-col sm:flex-row justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => setPreviewDoc(doc)}
                    >
                       <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
                          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center mr-3 text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                             <FileText size={18} />
                          </div>
                          <div className="flex-1">
                             <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">{doc.name}</span>
                             <div className="text-xs text-gray-400 flex items-center mt-0.5 group-hover:text-indigo-500">
                                <Eye size={10} className="mr-1"/> Click to review
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          {doc.status === 'Pending' ? (
                             <>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleUpdateKYCDoc(doc.name, 'Verified'); }} 
                                 className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded hover:bg-green-100 transition-colors"
                               >
                                 <CheckCircle size={14} className="mr-1"/> Verify
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleUpdateKYCDoc(doc.name, 'Rejected'); }} 
                                 className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded hover:bg-red-100 transition-colors"
                               >
                                 <XCircle size={14} className="mr-1"/> Reject
                               </button>
                             </>
                          ) : (
                             <span className={`text-xs font-bold px-2 py-1 rounded flex items-center ${
                                doc.status === 'Verified' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                             }`}>
                                {doc.status === 'Verified' ? <CheckCircle size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>}
                                {doc.status}
                             </span>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Territory Assignment */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
                 <Briefcase size={18} className="mr-2 text-indigo-600" />
                 <h3 className="font-bold text-gray-800">Territory Assignment</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City / Region</label>
                       <input 
                         type="text" 
                         className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 outline-none"
                         value={request.city}
                         readOnly
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Territory Name</label>
                       <input 
                         type="text" 
                         className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                         placeholder="e.g. North Chennai Zone"
                         value={territoryForm.name}
                         onChange={(e) => setTerritoryForm({...territoryForm, name: e.target.value})}
                         disabled={request.status !== 'Pending'}
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Pincodes</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      placeholder="Comma separated (e.g. 600001, 600002)"
                      value={territoryForm.pincodes}
                      onChange={(e) => setTerritoryForm({...territoryForm, pincodes: e.target.value})}
                      disabled={request.status !== 'Pending'}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                    <textarea 
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/50 outline-none h-20 resize-none"
                      placeholder="Additional details about the territory..."
                      value={territoryForm.notes}
                      onChange={(e) => setTerritoryForm({...territoryForm, notes: e.target.value})}
                      disabled={request.status !== 'Pending'}
                    ></textarea>
                 </div>
                 {request.status === 'Pending' && (
                    <button 
                      onClick={handleAssignTerritory}
                      className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm hover:bg-indigo-100 transition-colors"
                    >
                       <Save size={16} className="mr-2"/> Save Territory
                    </button>
                 )}
              </div>
           </div>

        </div>
      </div>

      {/* Footer Actions */}
      {request.status === 'Pending' && (
         <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4 shadow-lg rounded-t-xl z-10">
            <button 
              onClick={() => setModal({ isOpen: true, type: 'reject' })}
              className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
            >
               Reject Request
            </button>
            <button 
              onClick={() => setModal({ isOpen: true, type: 'approve' })}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-sm transition-colors flex items-center"
            >
               <CheckCircle size={18} className="mr-2"/> Approve Field Manager
            </button>
         </div>
      )}

      {/* Confirmation Modals */}
      {modal.isOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform scale-100 transition-all">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                     {modal.type === 'approve' ? 'Confirm Approval' : 'Reject Request'}
                  </h3>
                  <button onClick={() => setModal({ isOpen: false, type: null })} className="text-gray-400 hover:text-gray-600">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="mb-6">
                  {modal.type === 'approve' ? (
                     <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                           <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <p className="text-gray-600">
                           Are you sure you want to approve <strong>{request.applicantName}</strong>? This will grant them system access and send an onboarding email.
                        </p>
                     </div>
                  ) : (
                     <div>
                        <p className="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
                        <textarea 
                           className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/50 outline-none"
                           rows={4}
                           placeholder="e.g. Incomplete documentation..."
                           value={rejectReason}
                           onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                     </div>
                  )}
               </div>

               <div className="flex gap-3">
                  <button 
                    onClick={() => setModal({ isOpen: false, type: null })}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                     Cancel
                  </button>
                  <button 
                    onClick={confirmAction}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-white shadow-sm transition-colors ${
                       modal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                     {modal.type === 'approve' ? 'Yes, Approve' : 'Reject Application'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                   <div>
                      <h3 className="text-lg font-bold text-gray-900">{previewDoc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            previewDoc.status === 'Verified' ? 'bg-green-100 text-green-700' : 
                            previewDoc.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-orange-100 text-orange-700'
                         }`}>
                            {previewDoc.status}
                         </span>
                         <span className="text-xs text-gray-400">• Preview Mode</span>
                      </div>
                   </div>
                   <button onClick={() => setPreviewDoc(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                      <X size={20} />
                   </button>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4 relative">
                   {previewDoc.type === 'image' ? (
                      <img 
                        src={previewDoc.url} 
                        alt={previewDoc.name} 
                        className="max-w-full max-h-full object-contain shadow-lg rounded"
                      />
                   ) : (
                      <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl shadow-sm">
                         <FileText size={48} className="text-indigo-300 mb-4" />
                         <h4 className="font-bold text-gray-700">PDF Preview</h4>
                         <p className="text-sm text-gray-500 mb-4 max-w-xs">This document is a PDF. Please download to view.</p>
                         <button 
                            onClick={(e) => handleDownload(e, previewDoc)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-sm font-medium"
                         >
                            Download PDF
                         </button>
                      </div>
                   )}
                </div>

                {/* Quick Actions in Viewer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center">
                   <div className="text-sm text-gray-500 hidden sm:block">Reviewing document for {request.applicantName}</div>
                   <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        onClick={(e) => handleDownload(e, previewDoc)}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                      >
                         <Download size={16} className="mr-2" /> Download
                      </button>
                      <button 
                        onClick={() => handleUpdateKYCDoc(previewDoc.name, 'Rejected')}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors"
                      >
                         <XCircle size={16} className="mr-2" /> Reject Doc
                      </button>
                      <button 
                        onClick={() => handleUpdateKYCDoc(previewDoc.name, 'Verified')}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm"
                      >
                         <CheckCircle size={16} className="mr-2" /> Verify Doc
                      </button>
                   </div>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default FranchiseRequestDetails;
