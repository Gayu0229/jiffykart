
import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Mail, Phone, ShieldCheck, 
  FileText, CheckCircle, XCircle, AlertTriangle, 
  Download, Eye, CreditCard, User, Building2, X,
  ZoomIn
} from 'lucide-react';
import { KYCRequest, KYCDocument } from '../../types';

interface KYCDetailsProps {
  request: KYCRequest;
  onBack: () => void;
}

const KYCDetails: React.FC<KYCDetailsProps> = ({ request: initialRequest, onBack }) => {
  const [request, setRequest] = useState<KYCRequest>(initialRequest);
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    clearDocs: false,
    nameMatch: false,
    addressMatch: false,
    validIds: false,
    bankVerified: false
  });

  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState<KYCDocument | null>(null);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject' | 'correction' | null;
    title: string;
    description: string;
    requiresInput: boolean;
  }>({ isOpen: false, type: null, title: '', description: '', requiresInput: false });
  
  const [actionInput, setActionInput] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'Resubmitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Awaiting Vendor Action': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Helper to get a usable image URL (mock data often has empty strings)
  const getDocUrl = (doc: KYCDocument) => {
    if (doc.url && doc.url.length > 5) return doc.url;
    // Generate consistent random image based on doc ID
    const seed = doc.id.charCodeAt(0) + (doc.fileName.length * 10);
    return `https://picsum.photos/seed/${seed}/800/600`;
  };

  const handleUpdateDocStatus = (docId: string, status: 'Verified' | 'Rejected') => {
    const updatedDocs = request.documents.map(d => 
        d.id === docId ? { ...d, status } : d
    );
    setRequest({ ...request, documents: updatedDocs });
    
    // Find next pending document to "render next"
    const nextPending = updatedDocs.find(d => d.status === 'Pending' && d.id !== docId);
    
    if (nextPending) {
        setPreviewDoc(nextPending);
    } else {
        // All docs reviewed or no more pending
        setPreviewDoc(null);
        // If last doc was just verified, maybe check if all are done to suggest approval
        const allReviewed = updatedDocs.every(d => d.status !== 'Pending');
        if (allReviewed) {
           // Optional: Show a small toast or hint that all docs are reviewed
           console.log("All documents have been reviewed.");
        }
    }
  };

  const handleDownload = async (doc: KYCDocument) => {
    const url = getDocUrl(doc);
    try {
      // Simulate fetching the file to create a blob for download
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.fileName || 'document.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: Open in new tab
      window.open(url, '_blank');
    }
  };

  // Actions
  const initiateApprove = () => {
    setActionModal({
      isOpen: true,
      type: 'approve',
      title: 'Approve Vendor KYC',
      description: 'Are you sure you want to approve this vendor? They will be able to start selling immediately.',
      requiresInput: false
    });
  };

  const initiateReject = () => {
    setActionModal({
      isOpen: true,
      type: 'reject',
      title: 'Reject KYC Application',
      description: 'Please provide a reason for rejection. This will be sent to the vendor.',
      requiresInput: true
    });
    setActionInput('');
  };

  const initiateCorrection = () => {
    setActionModal({
      isOpen: true,
      type: 'correction',
      title: 'Request Correction',
      description: 'Specify the corrections needed from the vendor.',
      requiresInput: true
    });
    setActionInput('');
  };

  const handleConfirmAction = async () => {
    if (!actionModal.type) return;

    try {
      // Mock API Call: POST /api/v1/kyc/:id/action
      // await fetch(`/api/v1/kyc/${request.id}/action`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: actionModal.type, remarks: actionInput })
      // });
      await new Promise(resolve => setTimeout(resolve, 600));

      if (actionModal.type === 'approve') {
        setRequest(prev => ({ ...prev, status: 'Approved' }));
        alert('KYC Verified Successfully! Vendor can now upload products.');
      } else if (actionModal.type === 'reject') {
        setRequest(prev => ({ ...prev, status: 'Rejected', remarks: actionInput }));
      } else if (actionModal.type === 'correction') {
        setRequest(prev => ({ ...prev, status: 'Awaiting Vendor Action', remarks: actionInput }));
      }
      
      setActionModal({ isOpen: false, type: null, title: '', description: '', requiresInput: false });
    } catch (e) {
      alert("Failed to process action.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification Details</h1>
          <p className="text-sm text-gray-500">Review documents and approve vendor application.</p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-gray-900">{request.vendorName}</h2>
           <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span className="flex items-center"><User size={14} className="mr-1"/> {request.ownerName}</span>
              <span>•</span>
              <span className="font-mono">ID: {request.vendorId}</span>
           </div>
        </div>
        <div className={`px-4 py-2 rounded-lg border text-sm font-bold ${getStatusColor(request.status)}`}>
           {request.status}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="xl:col-span-2 space-y-6">
           
           {/* Vendor Info */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                 <Building2 size={18} className="mr-2 text-indigo-600" />
                 <h3 className="font-bold text-gray-800">Business Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Business Type</label>
                    <div className="text-gray-900 font-medium mt-1">{request.businessType}</div>
                 </div>
                 <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                    <div className="text-gray-900 font-medium mt-1">{request.vendorCategory}</div>
                 </div>
                 <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                    <div className="flex items-center mt-1 text-gray-900">
                       <Mail size={14} className="mr-2 text-gray-400"/> {request.email}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Phone Number</label>
                    <div className="flex items-center mt-1 text-gray-900">
                       <Phone size={14} className="mr-2 text-gray-400"/> {request.phone}
                    </div>
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Registered Address</label>
                    <div className="flex items-start mt-1 text-gray-900">
                       <MapPin size={14} className="mr-2 mt-1 text-gray-400 shrink-0"/> {request.address}
                    </div>
                 </div>
              </div>
           </div>

           {/* Documents */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                 <FileText size={18} className="mr-2 text-indigo-600" />
                 <h3 className="font-bold text-gray-800">Submitted Documents</h3>
              </div>
              <div className="p-6 space-y-4">
                 {request.documents.map((doc) => (
                    <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all bg-white cursor-pointer group"
                        onClick={() => setPreviewDoc(doc)}
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                             {doc.fileType === 'pdf' ? <FileText size={24}/> : <Eye size={24}/>}
                          </div>
                          <div>
                             <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{doc.type}</div>
                             <div className="text-sm text-gray-500">{doc.fileName}</div>
                             <div className="flex items-center mt-1">
                                 <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded mr-2">{doc.category}</span>
                                 <span className="text-xs text-indigo-500 hidden group-hover:flex items-center font-medium">
                                    <ZoomIn size={12} className="mr-1" /> Click to preview
                                 </span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          {doc.status === 'Verified' && (
                             <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                <ShieldCheck size={12} className="mr-1"/> Verified
                             </span>
                          )}
                          {doc.status === 'Rejected' && (
                             <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                <XCircle size={12} className="mr-1"/> Rejected
                             </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                            className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors z-10"
                          >
                             <Download size={14} className="mr-2"/> Download
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Bank Details */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                 <CreditCard size={18} className="mr-2 text-indigo-600" />
                 <h3 className="font-bold text-gray-800">Bank Account Details</h3>
              </div>
              <div className="p-6">
                 <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                       <Building2 size={64} />
                    </div>
                    <div className="relative z-10">
                       <div className="text-sm text-slate-400 mb-1">Bank Name</div>
                       <div className="text-xl font-bold mb-6">{request.bankDetails.bankName}</div>
                       
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                             <div className="text-xs text-slate-400 mb-1">Account Number</div>
                             <div className="font-mono text-lg tracking-wider">{request.bankDetails.accountNumber}</div>
                          </div>
                          <div>
                             <div className="text-xs text-slate-400 mb-1">IFSC Code</div>
                             <div className="font-mono text-lg">{request.bankDetails.ifsc}</div>
                          </div>
                       </div>
                       
                       <div className="mt-6 pt-4 border-t border-slate-700">
                          <div className="text-xs text-slate-400 mb-1">Account Holder</div>
                          <div className="font-medium">{request.bankDetails.accountName}</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

        </div>

        {/* Right Column: Checklist & Actions */}
        <div className="space-y-6">
           
           {/* Verification Checklist */}
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="font-bold text-gray-800">Verification Checklist</h3>
              </div>
              <div className="p-4 space-y-1">
                 {[
                   { id: 'clearDocs', label: 'Documents are clear and readable' },
                   { id: 'nameMatch', label: 'Name matches vendor account' },
                   { id: 'addressMatch', label: 'Address matches registered details' },
                   { id: 'validIds', label: 'PAN/GST numbers are valid' },
                   { id: 'bankVerified', label: 'Bank details verified' }
                 ].map((item) => (
                   <label key={item.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={checklist[item.id as keyof typeof checklist]}
                        onChange={() => setChecklist({...checklist, [item.id]: !checklist[item.id as keyof typeof checklist]})}
                        disabled={request.status === 'Approved'}
                      />
                      <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                   </label>
                 ))}
              </div>
           </div>

           {/* Action Panel */}
           {request.status !== 'Approved' ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-3">
                 <button 
                   onClick={initiateApprove}
                   className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center shadow-md shadow-green-200 transition-all active:scale-[0.98]"
                 >
                    <CheckCircle size={18} className="mr-2" /> Approve Application
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={initiateCorrection}
                      className="py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-medium text-sm flex items-center justify-center transition-colors"
                    >
                       <AlertTriangle size={16} className="mr-2" /> Request Fix
                    </button>
                    <button 
                      onClick={initiateReject}
                      className="py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium text-sm flex items-center justify-center transition-colors"
                    >
                       <XCircle size={16} className="mr-2" /> Reject
                    </button>
                 </div>
              </div>
           ) : (
              <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                    <ShieldCheck size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-green-900">Verification Complete</h3>
                 <p className="text-sm text-green-700 mt-1">
                    This vendor has been approved and verified on {new Date().toLocaleDateString()}.
                 </p>
              </div>
           )}

        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                   <div>
                      <h3 className="text-lg font-bold text-gray-900">{previewDoc.type}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            previewDoc.status === 'Verified' ? 'bg-green-100 text-green-700' : 
                            previewDoc.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-orange-100 text-orange-700'
                         }`}>
                            {previewDoc.status}
                         </span>
                         <span className="text-xs text-gray-400">• {previewDoc.fileName}</span>
                      </div>
                   </div>
                   <button onClick={() => setPreviewDoc(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                      <X size={20} />
                   </button>
                </div>

                {/* Content Viewer */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4 relative">
                   {previewDoc.fileType === 'pdf' ? (
                      <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl shadow-sm">
                         <FileText size={48} className="text-indigo-300 mb-4" />
                         <h4 className="font-bold text-gray-700">PDF Document</h4>
                         <p className="text-sm text-gray-500 mb-4 max-w-xs">Preview not available for PDFs in this demo. Please download to view.</p>
                         <button 
                            onClick={() => handleDownload(previewDoc)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-sm font-medium"
                         >
                            Download PDF
                         </button>
                      </div>
                   ) : (
                      <img 
                        src={getDocUrl(previewDoc)} 
                        alt={previewDoc.type} 
                        className="max-w-full max-h-full object-contain shadow-lg rounded"
                      />
                   )}
                </div>

                {/* Quick Actions in Viewer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center">
                   <div className="text-sm text-gray-500 hidden sm:block">
                      Reviewing document for {request.vendorName}
                   </div>
                   <div className="flex gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => handleDownload(previewDoc)}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                      >
                         <Download size={16} className="mr-2" /> Download
                      </button>
                      <button 
                        onClick={() => handleUpdateDocStatus(previewDoc.id, 'Rejected')}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors"
                      >
                         <XCircle size={16} className="mr-2" /> Reject
                      </button>
                      <button 
                        onClick={() => handleUpdateDocStatus(previewDoc.id, 'Verified')}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm"
                      >
                         <CheckCircle size={16} className="mr-2" /> Verify
                      </button>
                   </div>
                </div>
            </div>
         </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform scale-100 transition-all">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900">{actionModal.title}</h3>
                 <button 
                   onClick={() => setActionModal({ isOpen: false, type: null, title: '', description: '', requiresInput: false })} 
                   className="text-gray-400 hover:text-gray-600"
                 >
                    <X size={20} />
                 </button>
              </div>
              <div className="mb-6">
                 <p className="text-sm text-gray-600 mb-3">{actionModal.description}</p>
                 {actionModal.requiresInput && (
                   <textarea 
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      rows={3}
                      placeholder="Enter details/reason here..."
                      value={actionInput}
                      onChange={(e) => setActionInput(e.target.value)}
                   ></textarea>
                 )}
              </div>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setActionModal({ isOpen: false, type: null, title: '', description: '', requiresInput: false })}
                   className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handleConfirmAction}
                   disabled={actionModal.requiresInput && !actionInput.trim()}
                   className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 
                      actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 
                      'bg-orange-500 hover:bg-orange-600'
                   }`}
                 >
                    Confirm
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default KYCDetails;
