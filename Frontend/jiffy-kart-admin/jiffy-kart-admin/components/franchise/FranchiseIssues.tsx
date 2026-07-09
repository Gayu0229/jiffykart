import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, CheckCircle, AlertCircle, XCircle, Reply, Filter, X, Send, User, Clock, Briefcase, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { FranchiseIssue } from '../../types';

const FranchiseIssues: React.FC = () => {
   const [issues, setIssues] = useState<FranchiseIssue[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedIssue, setSelectedIssue] = useState<FranchiseIssue | null>(null);
   const [replyText, setReplyText] = useState('');
   const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);

   // Modal state for closing ticket
   const [closeTicketId, setCloseTicketId] = useState<string | null>(null);

   useEffect(() => {
      const fetchIssues = async () => {
         setLoading(true);
         try {
            const data = await api.getFranchiseTickets();
            const mapped: FranchiseIssue[] = data.map((t: any) => ({
               id: t.id.toString(),
               ticketId: t.ticketId || `FM-${t.id}`,
               franchiseName: t.requesterName || 'Unknown',
               franchiseId: t.createdById?.toString() || 'N/A',
               issueType: t.category || 'General',
               description: t.description || 'No description',
               priority: t.priority as any || 'Medium',
               status: t.status as any || 'Open',
               date: t.lastActivity || new Date().toLocaleDateString()
            }));
            setIssues(mapped);
         } catch (err) {
            console.error("Failed to load issues", err);
         } finally {
            setLoading(false);
         }
      };
      fetchIssues();
   }, []);

   const filteredIssues = issues.filter(issue =>
      issue.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.franchiseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.issueType.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const showToast = (message: string, type: 'success' | 'info' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
   };

   const handleInitiateClose = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setCloseTicketId(id);
   };

   const confirmCloseTicket = async () => {
      if (closeTicketId) {
         try {
            await new Promise(resolve => setTimeout(resolve, 400));
            setIssues(prev => prev.map(i => i.id === closeTicketId ? { ...i, status: 'Closed' } : i));
            showToast('Ticket closed successfully.');
            if (selectedIssue?.id === closeTicketId) setSelectedIssue(null);
            setCloseTicketId(null);
         } catch (e) {
            showToast('Failed to close ticket', 'info');
         }
      }
   };

   const handleOpenReply = (e: React.MouseEvent, issue: FranchiseIssue) => {
      e.stopPropagation();
      setSelectedIssue(issue);
   };

   const handleSendReply = async () => {
      if (!selectedIssue || !replyText.trim()) return;

      try {
         await new Promise(resolve => setTimeout(resolve, 400));
         setIssues(prev => prev.map(i =>
            i.id === selectedIssue.id
               ? { ...i, status: i.status === 'Open' ? 'In Progress' : i.status }
               : i
         ));
         showToast(`Reply sent to ${selectedIssue.franchiseName}`);
         setReplyText('');
         setSelectedIssue(null);
      } catch (e) {
         showToast('Failed to send reply', 'info');
      }
   };

   return (
      <div className="space-y-6 relative">
         {/* Toast Notification */}
         {toast && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <CheckCircle size={18} className="text-green-400" />
               <span className="text-sm font-medium">{toast.message}</span>
            </div>
         )}

         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-gray-800">Field Manager Issues</h2>
               <p className="text-sm text-gray-500 mt-1">Support tickets raised by field managers.</p>
            </div>
         </div>

         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input
                  type="text"
                  placeholder="Search by Ticket ID, Field Manager or Issue Type..."
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
                  <Filter size={16} /> Filter
               </button>
            </div>
         </div>

         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-[400px]">
                  <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
                  <p className="text-gray-500 font-medium">Synchronizing tickets...</p>
               </div>
            ) : (
               <>
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                           <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Field Manager Name</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Type</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {filteredIssues.map((issue) => (
                              <tr
                                 key={issue.id}
                                 className="hover:bg-gray-50 transition-colors cursor-pointer"
                                 onClick={() => setSelectedIssue(issue)}
                              >
                                 <td className="px-6 py-4 text-sm text-indigo-600 font-medium">
                                    {issue.ticketId}
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="font-medium text-sm text-gray-900">{issue.franchiseName}</div>
                                    <div className="text-xs text-gray-500">{issue.date}</div>
                                 </td>
                                 <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="font-medium text-gray-800">{issue.issueType}</div>
                                    <div className="text-xs truncate max-w-[200px] text-gray-500" title={issue.description}>{issue.description}</div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                                       issue.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                                          'bg-blue-100 text-blue-800'
                                       }`}>{issue.priority}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${issue.status === 'Open' ? 'bg-red-50 text-red-700 border border-red-100' :
                                       issue.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                          'bg-gray-100 text-gray-700 border border-gray-200'
                                       }`}>
                                       {issue.status === 'Open' && <AlertCircle size={12} className="mr-1" />}
                                       {issue.status === 'In Progress' && <MessageSquare size={12} className="mr-1" />}
                                       {issue.status === 'Closed' && <CheckCircle size={12} className="mr-1" />}
                                       {issue.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                       {issue.status !== 'Closed' && (
                                          <>
                                             <button
                                                onClick={(e) => handleOpenReply(e, issue)}
                                                className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors text-xs font-medium"
                                             >
                                                <Reply size={14} className="mr-1.5" /> Reply
                                             </button>
                                             <button
                                                onClick={(e) => handleInitiateClose(e, issue.id)}
                                                className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors text-xs font-medium"
                                             >
                                                <XCircle size={14} className="mr-1.5" /> Close
                                             </button>
                                          </>
                                       )}
                                       {issue.status === 'Closed' && (
                                          <span className="text-xs text-gray-400 italic">Ticket Closed</span>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  {filteredIssues.length === 0 && (
                     <div className="p-12 text-center text-gray-500">
                        No issues found matching criteria.
                     </div>
                  )}
               </>
            )}
         </div>

         {/* Issue Detail Modal */}
         {selectedIssue && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedIssue.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                           <AlertCircle size={20} />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              {selectedIssue.issueType}
                              <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-white border rounded-full">{selectedIssue.ticketId}</span>
                           </h3>
                           <p className="text-xs text-gray-500 flex items-center mt-0.5">
                              <Clock size={12} className="mr-1" /> Posted on {selectedIssue.date}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedIssue(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                     <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                              <User size={20} />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-gray-900">{selectedIssue.franchiseName}</div>
                              <div className="text-xs text-gray-500 flex items-center">
                                 <Briefcase size={10} className="mr-1" /> Field Manager • {selectedIssue.franchiseId}
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedIssue.status === 'Open' ? 'bg-red-100 text-red-700' :
                              selectedIssue.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                 'bg-green-100 text-green-700'
                              }`}>
                              {selectedIssue.status}
                           </div>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Description</h4>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm leading-relaxed shadow-sm">
                           {selectedIssue.description}
                        </div>
                     </div>

                     {selectedIssue.status !== 'Closed' && (
                        <div className="pt-4 border-t border-gray-100">
                           <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                              <Reply size={16} className="mr-2 text-indigo-600" />
                              Send Reply
                           </h4>
                           <textarea
                              className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none min-h-[120px] resize-none"
                              placeholder="Type your response to the field manager..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                           ></textarea>
                           <div className="flex justify-end mt-3">
                              <button
                                 onClick={handleSendReply}
                                 disabled={!replyText.trim()}
                                 className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 <Send size={16} className="mr-2" /> Send Reply
                              </button>
                           </div>
                        </div>
                     )}
                  </div>

                  {selectedIssue.status === 'Closed' && (
                     <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500 flex justify-center items-center">
                        <CheckCircle size={16} className="mr-2 text-green-600" /> This ticket has been closed.
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Close Confirmation Modal */}
         {closeTicketId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all">
                  <div className="flex flex-col items-center text-center mb-6">
                     <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3 text-red-600">
                        <AlertCircle size={24} />
                     </div>
                     <h3 className="text-lg font-bold text-gray-900 mb-2">Close Ticket?</h3>
                     <p className="text-gray-600 text-sm">
                        Are you sure you want to close this ticket? The field manager will be notified.
                     </p>
                  </div>
                  <div className="flex gap-3">
                     <button
                        onClick={() => setCloseTicketId(null)}
                        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={confirmCloseTicket}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                     >
                        Confirm Close
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FranchiseIssues;
