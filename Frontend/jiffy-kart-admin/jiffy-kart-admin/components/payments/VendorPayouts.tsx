
import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  ChevronRight,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { VendorPaymentProfile } from '../../types';

interface VendorPayoutsProps {
  payments: VendorPaymentProfile[];
  onViewDetails?: (vendor: VendorPaymentProfile) => void;
}

const VendorPayouts: React.FC<VendorPayoutsProps> = ({ payments, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCycle, setFilterCycle] = useState('All');

  // Filter Logic
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.shopName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchesCycle = filterCycle === 'All' || p.settlementCycle === filterCycle;
    return matchesSearch && matchesStatus && matchesCycle;
  });

  // Summary Stats Calculation
  const totalEarnings = payments.reduce((acc, p) => acc + p.totalEarnings, 0);
  const totalPending = payments.filter(p => p.status.toUpperCase() === 'PENDING' || p.status.toUpperCase() === 'PROCESSING').reduce((acc, p) => acc + p.netPayable, 0);
  const vendorsDue = payments.filter(p => p.netPayable > 0).length;
  const totalDeductions = payments.reduce((acc, p) => acc + (p.commissionDeducted + p.refundsDeducted + p.penalties), 0);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'ON HOLD': return 'bg-orange-100 text-orange-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Vendor Payouts Report", 14, 22);

    // Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Columns
    const tableColumn = ["Vendor", "ID", "Earnings", "Deductions", "Net Payable", "Status", "Cycle"];

    // Rows
    const tableRows = filteredPayments.map(p => {
      const deductions = (p.commissionDeducted + p.refundsDeducted + p.penalties).toFixed(2);
      return [
        p.shopName,
        p.vendorId,
        `₹${p.totalEarnings.toFixed(2)}`,
        `₹${deductions}`,
        `₹${p.netPayable.toFixed(2)}`,
        p.status,
        p.settlementCycle
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`vendor_payouts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="relative flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Vendor Payouts & Wallet Transfers</h1>
        <p className="text-sm text-gray-500">Manage vendor settlements and manual wallet adjustments.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-gray-500 text-xs font-bold uppercase">Total Earnings</div>
            <DollarSign className="text-indigo-500 bg-indigo-50 p-1 rounded-lg w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">This Month</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-gray-500 text-xs font-bold uppercase">Payouts Processed</div>
            <CheckCircle className="text-green-500 bg-green-50 p-1 rounded-lg w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{(totalEarnings - totalPending).toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Successfully transferred</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-gray-500 text-xs font-bold uppercase">Pending Payouts</div>
            <Clock className="text-yellow-500 bg-yellow-50 p-1 rounded-lg w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</div>
          <div className="text-xs text-red-500 mt-1">{vendorsDue} Vendors waiting</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-gray-500 text-xs font-bold uppercase">Refund Deductions</div>
            <RefreshCw className="text-orange-500 bg-orange-50 p-1 rounded-lg w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{totalDeductions.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Auto-adjusted</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search Vendor by Name, ID, Email..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
          >
            <option value="All">All Cycles</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
          <select
            className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Failed">Failed</option>
          </select>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 text-gray-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Earnings</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Payable</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cycle</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((p) => (
                <tr
                  key={p.vendorId}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onViewDetails && onViewDetails(p)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900 text-sm">{p.shopName}</div>
                    <div className="text-xs text-gray-500">{p.vendorId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${p.totalEarnings.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-red-500">
                      - ${(p.commissionDeducted + p.refundsDeducted + p.penalties).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-indigo-600">${p.netPayable.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {p.settlementCycle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-gray-400 group-hover:text-indigo-600 p-1.5 rounded-full transition-colors bg-gray-50 group-hover:bg-indigo-50">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No payments found matching criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorPayouts;
