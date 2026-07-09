
import React, { useState } from 'react';
import {
  CreditCard, ArrowUpRight, ArrowDownRight, DollarSign,
  Wallet, History, Download, Loader2, CheckCircle2, X,
  Building, Landmark, ShieldCheck, AlertCircle, Save, Clock
} from 'lucide-react';

const payouts: { id: string; date: string; amount: string; status: string; method: string }[] = [];

interface PayoutMethod {
  accountName: string;
  bankName: string;
  accountNumber: string;
}

const Payments: React.FC = () => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const isSunday = new Date().getDay() === 0;

  const [tempDetails, setTempDetails] = useState<PayoutMethod>({
    accountName: '',
    bankName: '',
    accountNumber: ''
  });

  const handleWithdraw = () => {
    if (!payoutMethod) {
      setShowSetupForm(true);
      return;
    }

    if (!isSunday) {
      return;
    }

    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setShowSuccessModal(true);
    }, 2000);
  };

  const handleSavePayoutMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDetails.accountName || !tempDetails.bankName || !tempDetails.accountNumber) return;

    setIsSavingDetails(true);
    setTimeout(() => {
      setPayoutMethod(tempDetails);
      setIsSavingDetails(false);
      setShowSetupForm(false);
    }, 1200);
  };

  const handleExport = () => {
    alert('Exporting payment history to CSV...');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-md w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-50 rounded-full mb-2">
              <CheckCircle2 className="w-10 h-10 text-brand-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Withdrawal Initiated!</h3>
              <p className="text-sm font-medium text-gray-500">
                Your withdrawal request has been successfully submitted and is being processed.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl space-y-3 text-left">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-500 uppercase tracking-wider">Destination</span>
                <span className="text-gray-900">{payoutMethod?.bankName} (**** {payoutMethod?.accountNumber.slice(-4)})</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-500 uppercase tracking-wider">Estimated Date</span>
                <span className="text-gray-900">Next 2-3 Business Days</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-brand-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Payout Method Setup Modal */}
      {showSetupForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-900"></div>
            <button
              onClick={() => setShowSetupForm(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Setup Payout Method</h3>
              <p className="text-sm font-medium text-gray-500">Enter your bank details to enable fund withdrawals.</p>
            </div>

            <form onSubmit={handleSavePayoutMethod} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Account Holder Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Sarah Shea"
                    value={tempDetails.accountName}
                    onChange={(e) => setTempDetails({ ...tempDetails, accountName: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Bank Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={tempDetails.bankName}
                    onChange={(e) => setTempDetails({ ...tempDetails, bankName: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Account Number (IFSC required for transfer)</label>
                  <input
                    required
                    type="password"
                    placeholder="•••• •••• •••• ••••"
                    value={tempDetails.accountNumber}
                    onChange={(e) => setTempDetails({ ...tempDetails, accountNumber: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-brand-50 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
                <p className="text-[10px] font-bold text-brand-700 leading-tight">Your data is secured as per RBI guidelines and PCI-DSS standards.</p>
              </div>

              <button
                type="submit"
                disabled={isSavingDetails}
                className="w-full bg-brand-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center space-x-2"
              >
                {isSavingDetails ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Account Details</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Link Bank Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payments & Payouts</h2>
          <p className="text-sm font-medium text-gray-500">Monitor your earnings and manage bank transfers</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 bg-white border border-gray-100 text-gray-900 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Balance Card */}
          <div className="bg-brand-900 p-10 rounded-[48px] text-white flex flex-col justify-between shadow-2xl shadow-brand-900/10 relative overflow-hidden group min-h-[320px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-300/10 -mr-20 -mt-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Available Balance</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-5xl font-black tracking-tight text-white">₹0</span>
                  <span className="text-xl font-black text-gray-500">.00</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-[24px] border border-white/10 backdrop-blur-md">
                <Wallet className="w-8 h-8 text-brand-200" />
              </div>
            </div>

            <div className="mt-8 relative z-10">
              {payoutMethod ? (
                <div className="flex flex-col space-y-3 mb-6 animate-in slide-in-from-left duration-500">
                  <div className="bg-brand-500/20 px-3 py-1.5 rounded-xl border border-brand-500/30 flex items-center space-x-2 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-300" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-200">Bank Linked: {payoutMethod.bankName}</span>
                  </div>
                  {!isSunday && (
                    <div className="bg-brand-300/10 px-3 py-1.5 rounded-xl border border-brand-300/20 flex items-center space-x-2 w-fit">
                      <Clock className="w-3.5 h-3.5 text-brand-200" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-100">Withdrawals open only on Sundays</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 mb-6 animate-in pulse duration-1000">
                  <div className="bg-orange-500/20 px-3 py-1.5 rounded-xl border border-orange-500/30 flex items-center space-x-2">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Action Required: Setup Payout Details</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || (payoutMethod !== null && !isSunday)}
                  className={`${payoutMethod && (isSunday || isWithdrawing) ? 'bg-brand-500 text-white hover:scale-[1.02] active:scale-95' : 'bg-white/10 text-white cursor-not-allowed opacity-50'
                    } px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center space-x-3 min-w-[200px] justify-center shadow-xl shadow-brand-500/20 border border-transparent`}
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing</span>
                    </>
                  ) : payoutMethod ? (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>{isSunday ? 'Withdraw Funds' : 'Closed for Payout'}</span>
                    </>
                  ) : (
                    <>
                      <Landmark className="w-4 h-4" />
                      <span>Setup Withdrawal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-white p-10 rounded-[48px] border border-gray-50 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Pending Payouts</p>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">₹0</h3>
              </div>
              <div className="w-14 h-14 bg-brand-50 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <History className="w-7 h-7 text-brand-600" />
              </div>
            </div>
            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Next window: <span className="text-gray-900">This Sunday</span></p>
              <button className="text-[10px] font-black text-brand-600 uppercase hover:underline">View details</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] border border-gray-50 shadow-sm space-y-8 flex flex-col overflow-hidden">
          {payoutMethod ? (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-8 bg-brand-500 rounded-full"></div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Active Account</h4>
              </div>
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Landmark className="w-5 h-5 text-gray-900" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Bank Destination</p>
                    <p className="text-sm font-black text-gray-900">{payoutMethod.bankName}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">A/C Holder</span>
                  <span className="text-gray-900 font-black">{payoutMethod.accountName}</span>
                </div>
                <button
                  onClick={() => setShowSetupForm(true)}
                  className="w-full mt-2 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                >
                  Edit Account Details
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-8 bg-brand-300 rounded-full"></div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Action Needed</h4>
              </div>
              <div className="bg-brand-50 p-6 rounded-[32px] border border-brand-100 space-y-4 text-center">
                <div className="bg-white p-4 rounded-full w-14 h-14 mx-auto shadow-sm flex items-center justify-center">
                  <Building className="w-6 h-6 text-brand-600" />
                </div>
                <p className="text-xs font-bold text-brand-900 leading-relaxed">Please link a bank account to receive your funds.</p>
                <button
                  onClick={() => setShowSetupForm(true)}
                  className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                >
                  Setup Method
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-brand-900 rounded-full"></div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Insights</h4>
            </div>
            <div className="space-y-6">
              <div className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Sales</span>
                  <span className="text-sm font-black text-gray-900">₹0</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 w-[0%] rounded-full"></div>
                </div>
              </div>
              <div className="pt-8 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Net Profit (Life time)</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-3xl font-black text-brand-600 tracking-tight">₹0</h4>
                  <div className="p-2 bg-brand-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-brand-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Table */}
      <div className="bg-white rounded-[48px] shadow-sm border border-gray-50 overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
          <div className="flex items-center space-x-3">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Transaction History</h4>
            <span className="px-2 py-0.5 bg-brand-900 text-white text-[10px] font-black rounded-lg">{payouts.length} TOTAL</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[10px] font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest border-b border-transparent hover:border-gray-900 transition-all">Download all</button>
            <div className="h-4 w-px bg-gray-200"></div>
            <button className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Filter</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="p-4 bg-gray-50 rounded-full">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400">No transactions yet</p>
              <p className="text-xs text-gray-400">Your payout history will appear here</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <th className="px-10 py-6 border-b border-gray-50">Payout ID</th>
                  <th className="px-10 py-6 border-b border-gray-50">Date</th>
                  <th className="px-10 py-6 border-b border-gray-50">Method</th>
                  <th className="px-10 py-6 border-b border-gray-50">Status</th>
                  <th className="px-10 py-6 text-right border-b border-gray-50">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-10 py-6 text-xs font-black text-gray-900 group-hover:text-brand-600 transition-colors">{p.id}</td>
                    <td className="px-10 py-6 text-xs font-bold text-gray-600 uppercase">{p.date}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-800">{p.method}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === 'Completed' ? 'bg-brand-50 text-brand-700' : 'bg-orange-50 text-orange-600'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${p.status === 'Completed' ? 'bg-brand-700' : 'bg-orange-600'}`}></div>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right text-sm font-black text-gray-900">{p.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// Simplified Trend Icon
const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

export default Payments;