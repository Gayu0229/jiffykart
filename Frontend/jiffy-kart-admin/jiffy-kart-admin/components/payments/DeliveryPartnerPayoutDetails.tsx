
import React, { useState } from 'react';
import { 
  ArrowLeft, Wallet, CheckCircle, X, Download, 
  ArrowRightLeft, RefreshCw, FileText, Briefcase, 
  Phone, MapPin, DollarSign 
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DeliveryPartner } from '../../types';

// --- Local Types for Financial View ---
export interface DeliveryPartnerFinancial extends DeliveryPartner {
  walletBalance: number;
  totalEarningsMonth: number;
  pendingPayout: number;
  lastSettlementDate: string;
  fieldManager: string;
}

interface WalletTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'Credit' | 'Debit';
  reason: string;
  addedBy: string;
  status: 'Success' | 'Failed';
}

interface Settlement {
  id: string;
  date: string;
  period: string;
  totalEarnings: number;
  deductions: number;
  netPayout: number;
  status: 'Paid' | 'Pending' | 'Processing';
  transactionRef?: string;
}

// --- Mock Data ---
const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 'DPW-01921', date: '22 Nov', amount: 350, type: 'Credit', reason: 'Extra Pay (Peak Hours)', addedBy: 'Admin', status: 'Success' },
  { id: 'DPW-01899', date: '21 Nov', amount: 120, type: 'Debit', reason: 'Penalty Reversal', addedBy: 'System', status: 'Success' },
  { id: 'DPW-01885', date: '18 Nov', amount: 500, type: 'Credit', reason: 'Weekly Settlement', addedBy: 'System', status: 'Success' },
  { id: 'DPW-01750', date: '15 Nov', amount: 200, type: 'Credit', reason: 'Fuel Allowance', addedBy: 'Admin', status: 'Success' },
];

const MOCK_SETTLEMENTS: Settlement[] = [
  { id: 'SET-1001', date: '20 Nov 2023', period: '13 Nov - 19 Nov', totalEarnings: 4500, deductions: 0, netPayout: 4500, status: 'Paid', transactionRef: 'UTR-882910' },
  { id: 'SET-1002', date: '13 Nov 2023', period: '06 Nov - 12 Nov', totalEarnings: 3800, deductions: 200, netPayout: 3600, status: 'Paid', transactionRef: 'UTR-882112' },
  { id: 'SET-1003', date: '06 Nov 2023', period: '30 Oct - 05 Nov', totalEarnings: 4100, deductions: 0, netPayout: 4100, status: 'Paid', transactionRef: 'UTR-881001' },
];

const TRANSFER_REASONS = [
  "Delivery Incentive",
  "Extra Pay (Peak Hours)",
  "Penalty Reversal",
  "Re-Delivery Bonus",
  "Manual Adjustment",
  "Weekly Settlement",
  "Fuel Allowance",
  "Referral Bonus"
];

interface DeliveryPartnerPayoutDetailsProps {
  partner: DeliveryPartnerFinancial;
  onBack: () => void;
}

const DeliveryPartnerPayoutDetails: React.FC<DeliveryPartnerPayoutDetailsProps> = ({ partner, onBack }) => {
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartnerFinancial>(partner);
  const [activeTab, setActiveTab] = useState<'Wallet' | 'Settlements'>('Wallet');
  
  // Form State
  const [transferAmount, setTransferAmount] = useState('');
  const [transferReason, setTransferReason] = useState(TRANSFER_REASONS[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  
  // Data State
  const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
  const [settlements] = useState<Settlement[]>(MOCK_SETTLEMENTS);
  const [txnFilterType, setTxnFilterType] = useState('All'); 
  
  // UI State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(t => {
    return txnFilterType === 'All' || t.type === txnFilterType;
  });

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    setIsConfirmOpen(true);
  };

  const confirmTransfer = async () => {
    const amount = parseFloat(transferAmount);
    
    try {
      // Mock API Call: POST /api/v1/delivery-wallet/transfer
      // await fetch('/api/v1/delivery-wallet/transfer', {
      //   method: 'POST',
      //   body: JSON.stringify({ partnerId: selectedPartner.id, amount, reason: transferReason })
      // });
      await new Promise(resolve => setTimeout(resolve, 600));

      const updatedPartner = { ...selectedPartner, walletBalance: selectedPartner.walletBalance + amount };
      
      setSelectedPartner(updatedPartner);

      const newTx: WalletTransaction = {
        id: `DPW-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        amount: amount,
        type: 'Credit',
        reason: transferReason,
        addedBy: 'Admin',
        status: 'Success'
      };
      setTransactions([newTx, ...transactions]);

      setIsConfirmOpen(false);
      setSuccessMessage(`₹${amount} has been successfully added to the Delivery Partner’s Wallet.`);
      setTransferAmount('');
      
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      alert("Transfer failed");
    }
  };

  const handleDownloadHistory = () => {
    const doc = new jsPDF();
    doc.text(`Wallet Transaction History - ${selectedPartner.name}`, 14, 22);
    const tableColumn = ["ID", "Date", "Amount", "Type", "Reason", "Added By", "Status"];
    const tableRows = filteredTransactions.map(t => [t.id, t.date, `₹${t.amount}`, t.type, t.reason, t.addedBy, t.status]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`wallet_history_${selectedPartner.id}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
        
      {/* Toast */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center animate-bounce">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Partner List
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full p-1 border-2 border-indigo-100 shadow-sm bg-white flex-shrink-0">
                    <img src={selectedPartner.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPartner.name}</h2>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-2">
                      <span className="flex items-center bg-white px-2 py-1 rounded border border-gray-200"><Briefcase size={12} className="mr-1 text-indigo-500"/> {selectedPartner.id}</span>
                      <span className="flex items-center bg-white px-2 py-1 rounded border border-gray-200"><Phone size={12} className="mr-1 text-green-500"/> {selectedPartner.phone}</span>
                      <span className="flex items-center bg-white px-2 py-1 rounded border border-gray-200"><MapPin size={12} className="mr-1 text-red-500"/> {selectedPartner.zone}</span>
                    </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 text-white shadow-lg w-full md:w-auto min-w-[220px]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Wallet Balance</span>
                    <Wallet size={16} className="text-green-400" />
                </div>
                <div className="text-3xl font-bold tracking-tight">₹{selectedPartner.walletBalance.toLocaleString()}</div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">Monthly Earnings</div>
                <div className="text-lg font-bold text-gray-900">₹{selectedPartner.totalEarningsMonth.toLocaleString()}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">Pending Payout</div>
                <div className="text-lg font-bold text-orange-600">₹{selectedPartner.pendingPayout.toLocaleString()}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">Last Settlement</div>
                <div className="text-lg font-bold text-blue-600">{selectedPartner.lastSettlementDate}</div>
              </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white">
          <button 
            onClick={() => setActiveTab('Wallet')}
            className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'Wallet' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
              <Wallet size={16} className="mr-2"/> Wallet & Transfer
          </button>
          <button 
            onClick={() => setActiveTab('Settlements')}
            className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'Settlements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
              <FileText size={16} className="mr-2"/> Settlement History
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-gray-50/30 min-h-[500px]">
          {activeTab === 'Wallet' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Transfer Form */}
                <div className="xl:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center text-sm uppercase tracking-wide">
                          <ArrowRightLeft size={16} className="mr-2 text-indigo-600"/> Transfer Funds
                      </h3>
                      <form onSubmit={handleInitiateTransfer} className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Partner ID</span>
                                <span className="font-medium text-gray-900">{selectedPartner.id}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Current Balance</span>
                                <span className="font-bold text-green-600">₹{selectedPartner.walletBalance}</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                <input 
                                  type="number" 
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-lg text-gray-800 placeholder-gray-300"
                                  placeholder="0.00"
                                  min="1"
                                  required
                                />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                            <select 
                              value={transferReason}
                              onChange={(e) => setTransferReason(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            >
                                {TRANSFER_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                            <select 
                              value={paymentMode}
                              onChange={(e) => setPaymentMode(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                            >
                                <option>Bank Transfer</option>
                                <option>Cash</option>
                                <option>Wallet Adjustment</option>
                            </select>
                          </div>

                          <button 
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center transform active:scale-[0.98]"
                          >
                            <CheckCircle size={16} className="mr-2"/> Transfer to Wallet
                          </button>
                      </form>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="xl:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wide">
                            <RefreshCw size={16} className="mr-2 text-indigo-600"/> Transactions
                          </h3>
                          <div className="flex gap-2">
                            <select 
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none"
                              value={txnFilterType}
                              onChange={(e) => setTxnFilterType(e.target.value)}
                            >
                                <option value="All">All Types</option>
                                <option value="Credit">Credit</option>
                                <option value="Debit">Debit</option>
                            </select>
                            <button onClick={handleDownloadHistory} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200" title="Download">
                                <Download size={16}/>
                            </button>
                          </div>
                      </div>
                      
                      <div className="overflow-auto flex-1">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 rounded-tl-lg">Date / ID</th>
                                  <th className="px-4 py-3">Amount</th>
                                  <th className="px-4 py-3">Type</th>
                                  <th className="px-4 py-3">Reason</th>
                                  <th className="px-4 py-3">By</th>
                                  <th className="px-4 py-3 rounded-tr-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{tx.date}</div>
                                        <div className="text-xs text-gray-400 font-mono">{tx.id}</div>
                                      </td>
                                      <td className={`px-4 py-3 font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {tx.type}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">{tx.reason}</td>
                                      <td className="px-4 py-3 text-gray-500 text-xs">{tx.addedBy}</td>
                                      <td className="px-4 py-3">
                                        <span className="flex items-center text-green-600 text-xs font-medium">
                                            <CheckCircle size={12} className="mr-1"/> {tx.status}
                                        </span>
                                      </td>
                                  </tr>
                                )) : (
                                  <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No transactions recorded.</td></tr>
                                )}
                            </tbody>
                          </table>
                      </div>
                    </div>
                </div>
              </div>
          )}

          {activeTab === 'Settlements' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Weekly Settlements</h3>
                    <button className="text-xs flex items-center text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors">
                      <Download size={14} className="mr-1.5"/> Export Statement
                    </button>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-left">
                      <thead className="bg-white text-xs text-gray-500 uppercase font-semibold border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4">Payout Date</th>
                            <th className="px-6 py-4">Period</th>
                            <th className="px-6 py-4">Total Earnings</th>
                            <th className="px-6 py-4">Deductions</th>
                            <th className="px-6 py-4">Net Payout</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Reference ID</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100">
                        {settlements.map(set => (
                            <tr key={set.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">{set.date}</td>
                              <td className="px-6 py-4 text-gray-500 text-xs">{set.period}</td>
                              <td className="px-6 py-4 text-gray-900">₹{set.totalEarnings.toLocaleString()}</td>
                              <td className="px-6 py-4 text-red-500 font-medium">- ₹{set.deductions.toLocaleString()}</td>
                              <td className="px-6 py-4 font-bold text-indigo-700">₹{set.netPayout.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                    set.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {set.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right text-xs font-mono text-gray-500">{set.transactionRef}</td>
                            </tr>
                        ))}
                      </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform scale-100 transition-all">
               <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                     <DollarSign size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Transfer</h3>
                  <p className="text-gray-600 text-sm leading-relaxed px-4">
                     You are about to transfer <span className="font-bold text-gray-900 text-lg">₹{transferAmount}</span> to <span className="font-bold text-indigo-600">{selectedPartner.name}</span>.
                  </p>
                  <div className="mt-4 text-xs text-gray-400 bg-gray-50 py-2 rounded border border-gray-100">
                     Reason: <span className="font-medium text-gray-700">{transferReason}</span>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setIsConfirmOpen(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                    onClick={confirmTransfer}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                     Yes, Transfer
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default DeliveryPartnerPayoutDetails;
