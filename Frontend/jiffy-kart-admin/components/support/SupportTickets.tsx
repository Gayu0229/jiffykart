
import React, { useState, useEffect } from 'react';
import {
   Search, Filter, MessageSquare, AlertCircle,
   User, ChevronRight, CheckCircle
} from 'lucide-react';
import { SupportTicket } from '../../types';
import { api } from '../../services/api';

interface SupportTicketsProps {
   defaultFilter?: 'Customer' | 'Vendor';
   onViewTicket?: (ticketId: string) => void;
}

const SupportTickets: React.FC<SupportTicketsProps> = ({ defaultFilter, onViewTicket }) => {
   const [tickets, setTickets] = useState<SupportTicket[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState('All');
   const [sourceFilter, setSourceFilter] = useState(defaultFilter || 'All');

   useEffect(() => {
      loadTickets();
   }, []);

   const loadTickets = async () => {
      setIsLoading(true);
      try {
         const data = await api.getTickets();
         setTickets(data);
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
   };

   // Sync state with prop if it changes
   useEffect(() => {
      if (defaultFilter) {
         setSourceFilter(defaultFilter);
      } else {
         setSourceFilter('All');
      }
   }, [defaultFilter]);

   // Filtering Logic
   const filteredTickets = tickets.filter(t => {
      const matchesSearch = t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (t.requesterName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || t.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
   });

   const getPriorityColor = (priority: string) => {
      switch (priority) {
         case 'Critical': return 'text-red-600 bg-red-50';
         case 'High': return 'text-orange-600 bg-orange-50';
         case 'Medium': return 'text-blue-600 bg-blue-50';
         default: return 'text-gray-600 bg-gray-50';
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'RESOLVED': return 'bg-green-100 text-green-700';
         case 'CLOSED': return 'bg-gray-100 text-gray-700';
         case 'OPEN': return 'bg-red-100 text-red-700';
         case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
         default: return 'bg-gray-100 text-gray-700';
      }
   };

   return (
      <div className="relative flex flex-col space-y-6">
         {/* Header & Controls */}
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
            <div className="relative flex-1 w-full sm:max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input
                  type="text"
                  placeholder="Search Ticket #, Subject or User..."
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
               <select
                  className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  disabled={!!defaultFilter}
               >
                  <option value="All">All Sources</option>
                  <option value="Customer">Customers Only</option>
                  <option value="Vendor">Vendors Only</option>
               </select>
               <select
                  className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
               >
                  <option value="All">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
               </select>
            </div>
         </div>

         {/* Ticket List */}
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1">
               <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                     <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Info</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requester</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredTickets.map((ticket) => (
                        <tr
                           key={ticket.id}
                           className="hover:bg-gray-50 transition-colors cursor-pointer group"
                           onClick={() => onViewTicket && onViewTicket(ticket.ticketId)}
                        >
                           <td className="px-6 py-4">
                              <div className="flex items-start">
                                 <div className="mr-3 mt-1">
                                    {ticket.category === 'Payment' ? <AlertCircle size={18} className="text-gray-400" /> : <MessageSquare size={18} className="text-gray-400" />}
                                 </div>
                                 <div>
                                    <div className="text-sm font-bold text-gray-900">{ticket.subject}</div>
                                    <div className="text-xs text-gray-500">#{ticket.ticketId} • {ticket.category}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{ticket.requesterName}</div>
                              <div className="text-xs text-gray-500 flex items-center">
                                 {ticket.source === 'Vendor' ? <span className="bg-purple-100 text-purple-700 px-1.5 rounded-[3px] mr-1 text-[10px] font-bold">V</span> : <span className="bg-blue-100 text-blue-700 px-1.5 rounded-[3px] mr-1 text-[10px] font-bold">C</span>}
                                 {ticket.source}
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                                 {ticket.priority}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                                 {ticket.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              {ticket.lastActivity}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button className="text-gray-400 group-hover:text-primary transition-colors">
                                 <ChevronRight size={18} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {filteredTickets.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                     No tickets found matching your criteria.
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default SupportTickets;
