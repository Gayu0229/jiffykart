
import React, { useState } from 'react';
import {
  CheckCircle, Circle, ChevronRight, ArrowLeft, FileText,
  Shield, Store, DollarSign, Briefcase, User, Eye, X, AlertTriangle
} from 'lucide-react';
import { PendingVendor, VendorFull, KYCRequest } from '../../types';

interface VendorOnboardingWizardProps {
  pendingVendor: PendingVendor;
  onComplete: (finalData: any) => void;
  onCancel: () => void;
}

const steps = [
  { id: 1, title: 'Application Review', icon: FileText },
  { id: 2, title: 'KYC Verification', icon: Shield },
  { id: 3, title: 'Store Config', icon: Store },
  { id: 4, title: 'Activation', icon: CheckCircle }
];

const VendorOnboardingWizard: React.FC<VendorOnboardingWizardProps> = ({ pendingVendor, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Local state for form inputs
  const [checks, setChecks] = useState({ contactVerified: false, businessVerified: false });
  const [docStatus, setDocStatus] = useState<Record<string, 'Approved' | 'Rejected' | 'Pending'>>({});
  const [commission, setCommission] = useState(5);
  const [category, setCategory] = useState('Retail');
  const [error, setError] = useState<string | null>(null);

  // In a real app, this would be fetched from API based on pendingVendor.id
  const [kycData, setKycData] = useState<KYCRequest | null>(null);

  React.useEffect(() => {
    // If we had an API for specific KYC, we'd call it here.
    // Setting a placeholder if none exists to avoid crash.
    const pv = pendingVendor as any;
    setKycData({
      id: pv.id ? `KYC-${pv.id}` : `KYC-${Date.now()}`,
      vendorId: pv.id,
      vendorName: pv.vendorName,
      ownerName: pv.ownerName || 'Applicant',
      status: 'Pending',
      submittedDate: pv.submittedDate,
      documents: pv.documents || pv.kycDocuments || []
    } as any);
  }, [pendingVendor]);

  const handleNext = () => {
    setError(null);

    // Step 1 Validation
    if (currentStep === 1) {
      if (!checks.contactVerified || !checks.businessVerified) {
        setError("Please verify both contact information and business entity checks to proceed.");
        return;
      }
    }

    // Step 2 Validation (Optional: Require at least one doc action)
    if (currentStep === 2) {
      const reviewedCount = Object.keys(docStatus).length;
      // Just a gentle warning in this demo, real app might force all
      if (reviewedCount === 0) {
        // Optional: force review
        // setError("Please review documents before continuing.");
        // return;
      }
    }

    if (currentStep < 4) setCurrentStep(curr => curr + 1);
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep(curr => curr - 1);
  };

  const handleFinalize = async () => {
    try {
      // Mock API Call: POST /api/v1/vendors/onboard
      // await fetch('/api/v1/vendors/onboard', {
      //   method: 'POST',
      //   body: JSON.stringify({ vendorId: pendingVendor.id, config: { commission, category } })
      // });
      await new Promise(resolve => setTimeout(resolve, 800));

      const finalVendorData: Partial<VendorFull> = {
        id: pendingVendor.id,
        shopName: pendingVendor.vendorName,
        status: 'Active',
        joinedDate: new Date().toLocaleDateString(),
        rating: 5.0,
        kycStatus: 'Verified'
      };
      onComplete(finalVendorData);
    } catch (e) {
      console.error("Onboarding failed", e);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
          <Briefcase size={20} className="mr-2" /> Applicant Details
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-blue-600 uppercase">Business Name</label>
            <div className="text-gray-900 font-medium text-lg">{pendingVendor.vendorName}</div>
          </div>
          <div>
            <label className="text-xs font-bold text-blue-600 uppercase">Business Type</label>
            <div className="text-gray-900 font-medium text-lg">{pendingVendor.businessType}</div>
          </div>
          <div>
            <label className="text-xs font-bold text-blue-600 uppercase">Submission Date</label>
            <div className="text-gray-700">{pendingVendor.submittedDate}</div>
          </div>
          <div>
            <label className="text-xs font-bold text-blue-600 uppercase">Application ID</label>
            <div className="text-gray-700 font-mono">{pendingVendor.id}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Pre-Screening Checklist</h3>
        <div className="space-y-3">
          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              checked={checks.contactVerified}
              onChange={(e) => setChecks({ ...checks, contactVerified: e.target.checked })}
            />
            <span className="ml-3 font-medium text-gray-700">Contact Information Verified (Email/Phone)</span>
          </label>
          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              checked={checks.businessVerified}
              onChange={(e) => setChecks({ ...checks, businessVerified: e.target.checked })}
            />
            <span className="ml-3 font-medium text-gray-700">Business Entity exists in Public Records</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Document Verification</h3>
        <span className="text-sm text-gray-500">Reviewing documents for: <span className="font-medium text-gray-900">{kycData?.ownerName}</span></span>
      </div>

      <div className="space-y-3">
        {kycData?.documents?.map((doc, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-900">{doc.type}</div>
                <div className="text-xs text-gray-500">{doc.fileName}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-xs flex items-center text-gray-600 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors">
                <Eye size={14} className="mr-1" /> Preview
              </button>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDocStatus({ ...docStatus, [doc.id]: 'Approved' })}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${docStatus[doc.id] === 'Approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => setDocStatus({ ...docStatus, [doc.id]: 'Rejected' })}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${docStatus[doc.id] === 'Rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start">
        <Shield size={16} className="mt-0.5 mr-2 shrink-0" />
        Ensure all documents match the business details provided in Step 1. Rejection will prompt the vendor to re-upload.
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Commission & Fees</h3>
          <p className="text-sm text-gray-500 mb-4">Configure the financial terms for this vendor.</p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Commission Rate (%)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="30"
                value={commission}
                onChange={(e) => setCommission(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="w-20 text-right font-bold text-indigo-600 text-xl">{commission}%</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Standard rate for {pendingVendor.businessType} is 10%.</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Store Classification</h3>
          <p className="text-sm text-gray-500 mb-4">Assign the primary category for search optimization.</p>

          <div className="grid grid-cols-3 gap-3">
            {['Electronics', 'Fashion', 'Home & Living', 'Groceries', 'Toys', 'Books'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${category === cat
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Vendor Activated!</h2>
      <p className="text-gray-600 max-w-md mb-8">
        <span className="font-bold text-gray-800">{pendingVendor.vendorName}</span> has been successfully onboarded. An automated email with login credentials has been sent to the vendor.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 w-full max-w-md border border-gray-200 mb-8 text-left">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Configuration Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Commission Rate:</span>
            <span className="font-medium text-gray-900">{commission}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium text-gray-900">{category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">KYC Status:</span>
            <span className="font-medium text-green-600">Verified</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleFinalize}
        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
      >
        Go to Vendor Profile
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 grid grid-cols-1 md:grid-cols-3 items-center shadow-sm gap-4">
        <div className="flex items-center justify-between md:justify-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendor Onboarding</h1>
            <p className="text-xs text-gray-500">ID: {pendingVendor.id}</p>
          </div>
          <button onClick={onCancel} className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="hidden md:flex items-center justify-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${currentStep > step.id ? 'bg-green-500 border-green-500 text-white' :
                  currentStep === step.id ? 'bg-indigo-600 border-indigo-600 text-white' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                  {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
                </div>
                <span className={`ml-2 text-sm font-medium ${currentStep === step.id ? 'text-indigo-900' : 'text-gray-500'
                  }`}>{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden md:flex justify-end">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-3xl relative">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} className="mr-2" />
              {error}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>

      {/* Footer Actions */}
      {currentStep < 4 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Save Draft & Exit
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm flex items-center transition-all"
            >
              {currentStep === 3 ? 'Complete & Activate' : 'Continue'} <ChevronRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOnboardingWizard;
