import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock,
  Building2, DownloadCloud, PieChart, X, Save, Wallet,
  ArrowRightLeft, Download, RefreshCw, DollarSign,
  Bell, Loader2
} from 'lucide-react';
import { VendorPaymentProfile, PayoutHistoryItem } from '../../types';
import { api } from '../../services/api';

// Mock data types specific to this view
interface WalletTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'Credit' | 'Debit';
  reason: string;
  addedBy: string;
  status: 'Success' | 'Failed';
}

interface VendorPayoutDetailsProps {
  vendor: VendorPaymentProfile;
  onBack: () => void;
  onUpdate?: (updatedVendor: VendorPaymentProfile) => void;
}

const VendorPayoutDetails: React.FC<VendorPayoutDetailsProps> = ({ vendor: initialVendor, onBack, onUpdate }) => {
  // Local state to handle updates within this view
  const [selectedVendor, setSelectedVendor] = useState<VendorPaymentProfile>(initialVendor);
  const [detailTab, setDetailTab] = useState<'Overview' | 'Wallet' | 'Payout History' | 'Settings'>('Overview');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Action Modal State (Release/Hold/Reject)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'release' | 'hold' | 'reject' | null;
    title: string;
  }>({ isOpen: false, type: null, title: '' });
  const [actionReason, setActionReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Transfer Form State
  const [transferAmount, setTransferAmount] = useState('');
  const [transferReason, setTransferReason] = useState('Settlement correction');
  const [paymentMode, setPaymentMode] = useState('Adjustment');
  const [isTransferConfirmOpen, setIsTransferConfirmOpen] = useState(false);
  const [walletHistory, setWalletHistory] = useState<WalletTransaction[]>([]);

  // Sync local state if prop changes
  useEffect(() => {
    setSelectedVendor(initialVendor);
  }, [initialVendor]);

  const fetchWalletHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getVendorWalletHistory(selectedVendor.vendorId);
      // Map backend data to local WalletTransaction type if necessary
      setWalletHistory(data);
    } catch (err) {
      console.error("Failed to fetch wallet history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (detailTab === 'Wallet') {
      fetchWalletHistory();
    }
  }, [detailTab]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleStatusUpdate = (newStatus: 'Completed' | 'On Hold' | 'Failed') => {
    const updatedVendor = { ...selectedVendor, status: newStatus };
    setSelectedVendor(updatedVendor);
    if (onUpdate) {
      onUpdate(updatedVendor);
    }
  };

  // -- Action Handlers (Open Modal) --

  const openActionModal = (type: 'release' | 'hold' | 'reject') => {
    let title = '';
    if (type === 'release') title = 'Confirm Payout Release';
    if (type === 'hold') title = 'Hold Payout';
    if (type === 'reject') title = 'Reject Payout';

    setActionReason('');
    setModalError(null);
    setActionModal({ isOpen: true, type, title });
  };

  const confirmAction = async () => {
    const { type } = actionModal;

    if (type === 'reject' && !actionReason.trim()) {
      setModalError("Please provide a reason for rejection.");
      return;
    }

    try {
      let apiStatus = '';
      if (type === 'release') apiStatus = 'COMPLETED';
      else if (type === 'hold') apiStatus = 'ON_HOLD';
      else if (type === 'reject') apiStatus = 'FAILED';

      await api.updatePayoutStatus(selectedVendor.vendorId, apiStatus, actionReason);

      if (type === 'release') {
        handleStatusUpdate('Completed');
        showToast(`Payout of ₹${selectedVendor.netPayable.toLocaleString()} released successfully!`, 'success');
      } else if (type === 'hold') {
        handleStatusUpdate('On Hold');
        showToast('Payment status updated to On Hold.', 'info');
      } else if (type === 'reject') {
        handleStatusUpdate('Failed');
        showToast('Payment rejected.', 'error');
      }

      setActionModal({ isOpen: false, type: null, title: '' });
    } catch (e) {
      showToast("Action failed", 'error');
    }
  };

  // -- Transfer Logic --

  const handleTransferInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      showToast("Please enter a valid amount.", "error");
      return;
    }
    setIsTransferConfirmOpen(true);
  };

  const confirmTransfer = async () => {
    const amount = parseFloat(transferAmount);

    try {
      await api.addWalletFunds(selectedVendor.vendorId, amount, transferReason);

      const newBalance = (selectedVendor.walletBalance || 0) + amount;

      // Update vendor
      const updatedVendor = { ...selectedVendor, walletBalance: newBalance };
      setSelectedVendor(updatedVendor);
      if (onUpdate) onUpdate(updatedVendor);

      // Refresh history
      fetchWalletHistory();

      // Reset
      setIsTransferConfirmOpen(false);
      setTransferAmount('');
      showToast(`₹${amount} added to wallet successfully.`, 'success');
    } catch (e) {
      showToast("Transfer failed", 'error');
    }
  };

  const handleDownloadStatement = () => {
    // Generate CSV content
    const headers = ['Transaction ID', 'Date', 'Amount', 'Type', 'Reason', 'Status'];
    const rows = walletHistory.map(tx => [
      tx.id,
      tx.date,
      tx.amount.toString(),
      tx.type,
      tx.reason,
      tx.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wallet_statement_${selectedVendor.vendorId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Statement downloaded successfully.', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-orange-100 text-orange-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6 relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all duration-300 animate-bounce ${toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          {toast.type === 'info' && <Bell size={20} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Payouts List
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedVendor.shopName}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>ID: {selectedVendor.vendorId}</span>
              <span>•</span>
              <span>{selectedVendor.ownerName}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedVendor.status)}`}>
                Payment Status: {selectedVendor.status}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {selectedVendor.status !== 'Completed' && selectedVendor.status !== 'Failed' && (
              <>
                <button
                  onClick={() => openActionModal('release')}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm active:scale-95"
                >
                  <CheckCircle size={16} className="mr-2" /> Release Payout
                </button>
                <button
                  onClick={() => openActionModal('hold')}
                  className="flex items-center px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-medium text-sm transition-colors active:scale-95"
                >
                  <AlertCircle size={16} className="mr-2" /> Hold
                </button>
                <button
                  onClick={() => openActionModal('reject')}
                  className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium text-sm transition-colors active:scale-95"
                >
                  <XCircle size={16} className="mr-2" /> Reject
                </button>
              </>
            )}
            {selectedVendor.status === 'Completed' && (
              <span className="flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-lg font-medium text-sm">
                <CheckCircle size={16} className="mr-2" /> Payout Released
              </span>
            )}
            {selectedVendor.status === 'Failed' && (
              <span className="flex items-center px-4 py-2 bg-red-50 text-red-700 border border-red-100 rounded-lg font-medium text-sm">
                <XCircle size={16} className="mr-2" /> Payout Rejected
              </span>
            )}
          </div>
        </div>

        {/* Panel Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['Overview', 'Wallet', 'Payout History', 'Settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${detailTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="p-6 min-h-[500px] bg-gray-50/30">

          {detailTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Col: Earnings */}
              <div className="space-y-6">
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center">
                    <PieChart size={16} className="mr-2" /> Earnings Breakdown (Current Cycle)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Gross Earnings</span>
                      <span className="font-medium text-gray-900">₹{selectedVendor.totalEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Commission</span>
                      <span className="font-medium text-red-600">- ₹{selectedVendor.commissionDeducted.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Refund Deductions</span>
                      <span className="font-medium text-red-600">- ₹{selectedVendor.refundsDeducted.toFixed(2)}</span>
                    </div>
                    {selectedVendor.penalties > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Penalties</span>
                        <span className="font-medium text-red-600">- ₹{selectedVendor.penalties.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedVendor.tds > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">TDS Applied</span>
                        <span className="font-medium text-red-600">- ₹{selectedVendor.tds.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-indigo-200 mt-2 flex justify-between items-center">
                      <span className="font-bold text-indigo-900">Net Payout Amount</span>
                      <span className="text-2xl font-bold text-indigo-600">₹{selectedVendor.netPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Vendor Contact</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Email:</span> <span className="text-gray-900">{selectedVendor.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{selectedVendor.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Category:</span> <span className="text-gray-900">{selectedVendor.category}</span></div>
                  </div>
                </div>
              </div>

              {/* Right Col: Bank */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Building2 size={20} className="mr-2 text-gray-400" /> Bank Details
                      </h3>
                      <button className="text-sm text-indigo-600 flex items-center font-medium hover:underline">
                        <DownloadCloud size={14} className="mr-1" /> Download Details
                      </button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Account Holder Name</div>
                        <div className="font-medium text-gray-900 text-lg">{selectedVendor.bankDetails.accountName}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Bank Name</div>
                          <div className="font-medium text-gray-900">{selectedVendor.bankDetails.bankName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">IFSC Code</div>
                          <div className="font-mono font-medium text-gray-900">{selectedVendor.bankDetails.ifsc}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Account Number</div>
                        <div className="font-mono font-bold text-gray-900 bg-gray-50 p-3 rounded border border-gray-100 w-full tracking-wide">
                          {selectedVendor.bankDetails.accountNumber}
                        </div>
                      </div>
                      {selectedVendor.bankDetails.upiId && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">UPI ID</div>
                          <div className="font-medium text-gray-900">{selectedVendor.bankDetails.upiId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'Wallet' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Section 1: Wallet Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white shadow-md">
                  <div className="text-sm font-bold uppercase opacity-80 mb-2">Current Wallet Balance</div>
                  <div className="text-4xl font-bold flex items-center mb-4">
                    <Wallet size={32} className="mr-3 opacity-80" />
                    ₹{(selectedVendor.walletBalance || 0).toLocaleString()}
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded text-sm font-medium backdrop-blur transition-colors" onClick={() => {/* handleDownloadStatement */ }}>
                      Download Statement
                    </button>
                    <button className="flex-1 bg-white text-indigo-900 hover:bg-gray-100 py-2 rounded text-sm font-bold transition-colors">
                      Add Funds
                    </button>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Earnings (Lifetime)</span>
                    <span className="font-bold text-gray-900 text-lg">₹{selectedVendor.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Pending Payout</span>
                    <span className="font-bold text-orange-600 text-lg">₹{selectedVendor.netPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                    <span className="text-gray-500">Last Payment Date</span>
                    <span className="font-medium text-gray-700">{selectedVendor.lastPayoutDate}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Transfer Money Form */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <ArrowRightLeft size={20} className="mr-2 text-indigo-600" /> Manual Transfer
                  </h3>
                  <form onSubmit={handleTransferInitiate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Vendor ID</label>
                      <input type="text" value={selectedVendor.vendorId} disabled className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Transfer Amount (₹)</label>
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-lg text-gray-800 placeholder-gray-300"
                        placeholder="0.00"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Reason for Transfer</label>
                      <select
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none"
                      >
                        <option>Settlement correction</option>
                        <option>Bonus / Incentive</option>
                        <option>Refund adjustment</option>
                        <option>Manual payout</option>
                        <option>Penalty reversal</option>
                        <option>Others</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none"
                      >
                        <option>Adjustment</option>
                        <option>Bank Transfer</option>
                        <option>Cash</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                      Initiate Transfer
                    </button>
                  </form>
                </div>

                {/* Section 3: Wallet Transaction History */}
                <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
                    <button
                      onClick={handleDownloadStatement}
                      className="text-xs flex items-center text-indigo-600 font-medium hover:underline"
                    >
                      <Download size={14} className="mr-1" /> Download Statement
                    </button>
                  </div>

                  <div className="overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">ID / Date</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Reason</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100">
                        {walletHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{tx.id}</div>
                              <div className="text-xs text-gray-500">{tx.date}</div>
                            </td>
                            <td className={`px-4 py-3 font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-700">{tx.reason}</div>
                              <div className="text-xs text-gray-400">By: {tx.addedBy}</div>
                            </td>
                            <td className="px-4 py-3 text-green-600 text-xs font-medium">
                              <span className="flex items-center"><CheckCircle size={12} className="mr-1" /> {tx.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'Payout History' && (
            <div className="space-y-4">
              <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                <Clock size={48} className="mx-auto mb-3 text-gray-200" />
                <p>Historical payout records are currently being migrated to the live ledger.</p>
                <p className="text-xs mt-1">Check back soon for the verified transaction history.</p>
              </div>
            </div>
          )}

          {detailTab === 'Settings' && (
            <div className="space-y-8 bg-white p-6 rounded-xl border border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Settlement Configuration</h3>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                  {(['Daily', 'Weekly', 'Monthly'] as const).map(cycle => (
                    <button
                      key={cycle}
                      className={`py-2 px-4 text-sm font-medium rounded-lg border transition-all ${selectedVendor.settlementCycle === cycle
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  The settlement cycle determines how often the vendor receives automated payouts.
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Commission Override</h3>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 max-w-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Standard Category Fee ({selectedVendor.category})</span>
                    <span className="text-sm font-bold text-gray-900">10%</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Custom Vendor Commission (%)</label>
                    <div className="flex gap-3">
                      <input type="number" className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none" placeholder="0.00" />
                      <button className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">Update Rule</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Setting a custom rate will override the category default for this specific vendor.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Action Modal (Replacing Native Confirm/Prompt) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform scale-100 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{actionModal.title}</h3>
              <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              {actionModal.type === 'release' && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 text-green-600">
                    <CheckCircle size={24} />
                  </div>
                  <p className="text-gray-600">
                    Are you sure you want to release the payout of <span className="font-bold text-gray-900">₹{selectedVendor.netPayable.toLocaleString()}</span> to <span className="font-bold text-gray-900">{selectedVendor.shopName}</span>?
                  </p>
                </div>
              )}

              {(actionModal.type === 'hold' || actionModal.type === 'reject') && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Please provide a reason for {actionModal.type === 'hold' ? 'holding' : 'rejecting'} this payout.
                    {actionModal.type === 'reject' && <span className="text-red-500 ml-1">*Required</span>}
                  </p>
                  <textarea
                    className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    rows={3}
                    placeholder="Enter reason..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  ></textarea>
                  {modalError && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-center">
                      <AlertCircle size={12} className="mr-1" /> {modalError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors shadow-sm ${actionModal.type === 'release' ? 'bg-green-600 hover:bg-green-700' :
                  actionModal.type === 'hold' ? 'bg-orange-500 hover:bg-orange-600' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Confirmation Modal */}
      {isTransferConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                <Wallet size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Wallet Transfer</h3>
              <p className="text-gray-600 mt-2">
                You are about to transfer <span className="font-bold text-gray-900 text-lg">₹{transferAmount}</span> to <span className="font-bold text-gray-900">{selectedVendor.shopName}</span>'s wallet.
              </p>
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-100 w-full">
                <strong>Note:</strong> This action will immediately reflect in the vendor's available balance.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsTransferConfirmOpen(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTransfer}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorPayoutDetails;
