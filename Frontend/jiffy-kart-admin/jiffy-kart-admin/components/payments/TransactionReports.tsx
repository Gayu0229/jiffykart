
import React, { useState, useEffect } from 'react';
import {
   Search, Filter, Download, ArrowUpRight, ArrowDownLeft,
   Calendar, FileText, DollarSign, Activity
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from '../../services/api';
import { TransactionReportItem } from '../../types';

const TransactionReports: React.FC = () => {
   const [transactions, setTransactions] = useState<TransactionReportItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [typeFilter, setTypeFilter] = useState('All');
   const [statusFilter, setStatusFilter] = useState('All');

   useEffect(() => {
      fetchTransactions();
   }, []);

   const fetchTransactions = async () => {
      try {
         setLoading(true);
         const data = await api.getTransactions();
         setTransactions(data);
      } catch (error) {
         console.error('Failed to fetch transactions:', error);
         alert('Failed to load transactions');
      } finally {
         setLoading(false);
      }
   };

   const filteredData = transactions.filter(item => {
      const matchesSearch = item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
         item.referenceId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
   });

   // Calculations
   const totalInflow = filteredData
      .filter(i => ['Commission', 'Subscription', 'Penalty'].includes(i.type))
      .reduce((sum, i) => sum + i.amount, 0);

   const totalOutflow = filteredData
      .filter(i => ['Payout', 'Refund'].includes(i.type))
      .reduce((sum, i) => sum + i.amount, 0);

   const netFlow = totalInflow - totalOutflow;

   const handleExport = () => {
      const doc = new jsPDF();
      doc.text("Transaction Report", 14, 22);

      const tableColumn = ["Date", "ID", "Party", "Type", "Amount", "Status", "Ref ID"];
      const tableRows = filteredData.map(item => [
         item.date,
         item.id,
         item.partyName,
         item.type,
         `₹${item.amount.toFixed(2)}`,
         item.status,
         item.referenceId
      ]);

      autoTable(doc, {
         head: [tableColumn],
         body: tableRows,
         startY: 30,
      });

      doc.save(`transactions_report.pdf`);
   };

   const getTypeColor = (type: string) => {
      switch (type) {
         case 'Commission': return 'text-green-600 bg-green-50 border-green-100';
         case 'Subscription': return 'text-blue-600 bg-blue-50 border-blue-100';
         case 'Penalty': return 'text-orange-600 bg-orange-50 border-orange-100';
         case 'Payout': return 'text-purple-600 bg-purple-50 border-purple-100';
         case 'Refund': return 'text-red-600 bg-red-50 border-red-100';
         default: return 'text-gray-600 bg-gray-50 border-gray-100';
      }
   };

   return (
      <div className="space-y-6">
         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Inflow</p>
                  <h3 className="text-2xl font-bold text-green-600">+₹{totalInflow.toLocaleString()}</h3>
                  <p className="text-xs text-gray-400 mt-1">Commissions, Subscriptions</p>
               </div>
               <div className="p-3 bg-green-50 rounded-full text-green-600">
                  <ArrowDownLeft size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Outflow</p>
                  <h3 className="text-2xl font-bold text-red-600">-₹{totalOutflow.toLocaleString()}</h3>
                  <p className="text-xs text-gray-400 mt-1">Payouts, Refunds</p>
               </div>
               <div className="p-3 bg-red-50 rounded-full text-red-600">
                  <ArrowUpRight size={24} />
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Net Cash Flow</p>
                  <h3 className={`text-2xl font-bold ${netFlow >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                     {netFlow >= 0 ? '+' : ''}₹{netFlow.toLocaleString()}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Selected Period</p>
               </div>
               <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                  <Activity size={24} />
               </div>
            </div>
         </div>

         {/* Filters */}
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-sm">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input
                  type="text"
                  placeholder="Search ID, Party Name..."
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex gap-3 w-full sm:w-auto overflow-x-auto">
               <select
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
               >
                  <option value="All">All Types</option>
                  <option value="Commission">Commission</option>
                  <option value="Payout">Payout</option>
                  <option value="Refund">Refund</option>
                  <option value="Subscription">Subscription</option>
               </select>
               <select
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
               >
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
               </select>
               <button
                  onClick={handleExport}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium whitespace-nowrap"
               >
                  <Download size={16} className="mr-2" /> Export
               </button>
            </div>
         </div>

         {/* Table */}
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
               <div className="flex flex-col items-center justify-center p-20">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading transactions...</p>
               </div>
            ) : (
               <>
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        {/* ... existing table structure ... */}
                        <thead className="bg-gray-50 border-b border-gray-100">
                           <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Party</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {filteredData.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-bold text-gray-900 text-sm">{item.id}</div>
                                    <div className="text-xs text-gray-500">Ref: {item.referenceId}</div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {item.date}
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.partyName}
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                                       {item.type}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap font-bold text-sm">
                                    <span className={['Payout', 'Refund'].includes(item.type) ? 'text-red-600' : 'text-green-600'}>
                                       {['Payout', 'Refund'].includes(item.type) ? '-' : '+'}
                                       ₹{item.amount.toLocaleString()}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                       item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                       }`}>
                                       {item.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  {filteredData.length === 0 && (
                     <div className="p-12 text-center text-gray-500">
                        No transactions found for the selected filters.
                     </div>
                  )}
               </>
            )}
         </div>
      </div>
   );
};

export default TransactionReports;
