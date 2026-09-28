import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CancellationRefundProps {
  onBack: () => void;
}

export const CancellationRefund: React.FC<CancellationRefundProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3 border-b border-gray-100 flex items-center shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition mr-4">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Cancellation and Refund</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
          <h2 className="text-2xl font-black text-[#03045E] mb-6">Cancellation and Refund Policy</h2>
          <p className="text-gray-500 text-sm mb-6">Last updated on Oct 18 2024</p>
          
          <p className="mb-4 text-gray-700 leading-relaxed">
            <strong>Dealit Technologies Private Limited</strong> believes in helping its customers as far as possible and has therefore a liberal cancellation policy. Under this policy:
          </p>

          <ul className="list-disc pl-5 mb-6 text-gray-700 space-y-4">
            <li>Cancellations will be considered only if the request is made within same day of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.</li>
            <li>Dealit Technologies Private Limited does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.</li>
            <li>In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within same day of receipt of the products.</li>
            <li>In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within same day of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.</li>
            <li>In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.</li>
            <li>In case of any Refunds approved by the Dealit Technologies Private Limited, it'll take 5-7 days for the refund to be processed to the end customer.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
