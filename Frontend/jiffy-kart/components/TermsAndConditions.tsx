
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsAndConditionsProps {
  onBack: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3 border-b border-gray-100 flex items-center shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition mr-4">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Terms and Conditions</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
          <h2 className="text-2xl font-black text-[#03045E] mb-6">Terms and Conditions</h2>
          <p className="text-gray-500 text-sm mb-6">Last updated on Jun 23 2024</p>
          
          <p className="mb-4 text-gray-700 leading-relaxed">
            For the purpose of these Terms and Conditions, The term “we”, “us”, “our” used anywhere on this page shall mean <strong>Dealit Technologies Private Limited</strong>, whose registered/operational office is <strong>#89, Seetharampalya, Basavanagar Main Road, Mahadevpura post Bengaluru KARNATAKA 560048</strong> . “you”, “your”, “user”, “visitor” shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
          </p>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your use of the website and/or purchase from us are governed by following Terms and Conditions:</h3>
          
          <ul className="list-disc pl-5 mb-6 text-gray-700 space-y-4">
            <li>The content of the pages of this website is subject to change without notice.</li>
            <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
            <li>Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.</li>
            <li>Our website contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li>
            <li>All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.</li>
            <li>Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.</li>
            <li>From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.</li>
            <li>You may not create a link to our website from another website or document without Dealit Technologies Private Limiteds prior written consent.</li>
            <li>Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India .</li>
            <li>We, shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time</li>
          </ul>

        </div>
      </div>
    </div>
  );
};
