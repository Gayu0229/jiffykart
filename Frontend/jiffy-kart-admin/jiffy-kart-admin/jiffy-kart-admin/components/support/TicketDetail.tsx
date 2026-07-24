
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Mail, Phone, Clock, MessageSquare,
  AlertCircle, CheckCircle, X, Send, Loader2, Sparkles,
  Users, FileText
} from 'lucide-react';
import { SupportTicket, TicketMessage } from '../../types';
import { api } from '../../services/api';
import { analyzeSupportTicket } from '../../services/geminiService';

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Resolution Form States
  const [resolution, setResolution] = useState(ticket?.adminResponse || '');
  const [reason, setReason] = useState(ticket?.resolutionReason || '');
  const [newStatus, setNewStatus] = useState(ticket?.status || 'RESOLVED');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      setResolution(ticket.adminResponse || '');
      setReason(ticket.resolutionReason || '');
      setNewStatus(ticket.status);
    }
  }, [ticket]);

  const loadTicket = async () => {
    try {
      const data = await api.getTicketDetails(ticketId);
      setTicket(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!ticket) {
    return <div className="p-8 text-center text-gray-500">Ticket not found</div>;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await api.replyToTicket(ticketId, replyText);
      await loadTicket(); // Refresh
      setReplyText('');
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message.");
    }
  };


  const updateStatus = async (newStatus: string) => {
    try {
      await api.updateTicketStatus(ticketId, newStatus);
      await loadTicket();
    } catch (e) { console.error(e); }
  };

  const updatePriority = async (newPriority: string) => {
    // Simulate API call
    try {
      // await fetch(`/api/v1/support/tickets/${ticketId}/priority`, { ... });
      await new Promise(resolve => setTimeout(resolve, 300));
      setTicket(prev => prev ? { ...prev, priority: newPriority as any } : null);
    } catch (e) { console.error(e); }
  };

  const handleResolveTicket = async () => {
    if (!resolution.trim() || !reason.trim()) {
      alert("Please provide both a resolution message and a reason.");
      return;
    }

    setIsSubmittingResolution(true);
    try {
      await api.replyToTicketWithResolution(ticketId, resolution, reason, newStatus);
      await loadTicket();
      alert("Ticket updated and notification email sent to user.");
    } catch (error) {
      console.error("Failed to resolve ticket", error);
      alert("Failed to update ticket.");
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSupportTicket(ticket.subject, ticket.messages);
    setIsAnalyzing(false);

    if (result) {
      setTicket(prev => prev ? {
        ...prev,
        category: result.category,
        priority: result.priority as any,
        assignedTeam: result.assignedTeam,
        summary: result.summary
      } : null);
    }
  };

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
      case 'Open': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Tickets
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">#{ticket.ticketId}</h2>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <h3 className="text-base font-medium text-gray-800 mb-2">{ticket.subject}</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center"><User size={12} className="mr-1" /> {ticket.requesterName || (ticket.createdByRole + ' #' + ticket.createdById)}</span>
                <span className="flex items-center"><Clock size={12} className="mr-1" /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</span>
                <span className={`flex items-center px-2 py-0.5 rounded ${getPriorityColor(ticket.priority || 'Medium')}`}>
                  {ticket.priority || 'Medium'} Priority
                </span>
              </div>
            </div>
            <div>
              {/* <button
                onClick={handleAutoAssign}
                disabled={isAnalyzing}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-70"
              >
                {isAnalyzing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                {isAnalyzing ? 'Analyzing...' : 'Smart Analysis'}
              </button> */}
            </div>
          </div>

          {/* AI Summary Panel */}
          {(ticket.assignedTeam || ticket.summary) && (
            <div className="px-6 py-4 bg-indigo-50/40 border-b border-indigo-100">
              <div className="flex flex-col gap-2">
                {ticket.assignedTeam && (
                  <div className="flex items-center text-sm">
                    <span className="text-indigo-800 font-bold w-28 flex items-center"><Users size={14} className="mr-2" /> Assigned To:</span>
                    <span className="bg-white px-3 py-0.5 rounded border border-indigo-200 text-indigo-700 font-medium text-xs">{ticket.assignedTeam}</span>
                  </div>
                )}
                {ticket.summary && (
                  <div className="flex items-start text-sm mt-1">
                    <span className="text-indigo-800 font-bold w-28 shrink-0 flex items-center"><FileText size={14} className="mr-2" /> Summary:</span>
                    <p className="text-gray-700 italic leading-relaxed text-sm">{ticket.summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {/* Ticket Description as Origin */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                <FileText size={12} className="mr-1" /> Issue Origin
              </p>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                {ticket.description || "No description provided."}
              </p>
            </div>

            {(ticket.messages || []).map((msg) => (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.senderRole === 'ADMIN' ? 'ml-auto items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-xl text-sm shadow-sm leading-relaxed ${msg.senderRole === 'ADMIN'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}>
                  {msg.message}
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.senderRole === 'ADMIN' ? 'You' : (ticket.requesterName || 'User')} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
            {ticket.status === 'RESOLVED' && (
              <div className="flex flex-col items-center my-6 space-y-3">
                <span className="text-sm bg-green-100 text-green-700 px-4 py-1.5 rounded-full border border-green-200 font-medium flex items-center shadow-sm">
                  <CheckCircle size={14} className="mr-2" /> Ticket marked as Resolved
                </span>
                <div className="max-w-md bg-green-50/50 p-4 rounded-xl border border-green-100 text-center">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Final Resolution</p>
                  <p className="text-sm text-green-900 font-medium">{ticket.adminResponse}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reply Input - Only for Vendors */}
          {ticket.createdByRole === 'VENDOR' && (
            <div className="p-4 bg-primary/5 border-t border-primary/10">
              <div className="mb-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Sparkles size={10} /> Official Vendor Support Chat
                </span>
              </div>
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  placeholder="Reply to vendor..."
                  className="w-full pl-4 pr-14 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm placeholder-gray-400 shadow-sm"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Ticket Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => updatePriority(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resolution Form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center">
              <Sparkles size={16} className="mr-2 text-primary" /> Formal Resolution
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 text-gray-400">Resolution Message</label>
                <textarea
                  placeholder="Official fix or response..."
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-medium"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 text-gray-400">Reason for Outcome</label>
                <input
                  type="text"
                  placeholder="Internal reason/category..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 text-gray-400">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                >
                  <option value="IN_PROGRESS">Keep In Progress</option>
                  <option value="RESOLVED">Resolve Ticket</option>
                  <option value="CLOSED">Close Ticket</option>
                </select>
              </div>

              <button
                onClick={handleResolveTicket}
                disabled={isSubmittingResolution || !resolution || !reason}
                className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingResolution ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {isSubmittingResolution ? 'Notifying User...' : 'Resolve & Notify User'}
              </button>
            </div>
          </div>

          {/* Requester Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs mr-3">
                  {(ticket.requesterName || 'U').charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{ticket.requesterName || 'Anonymous User'}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    {ticket.source === 'Vendor' ? <span className="bg-purple-100 text-purple-700 px-1 rounded mr-1 text-[9px] font-bold uppercase">Vendor</span> : <span className="bg-blue-100 text-blue-700 px-1 rounded mr-1 text-[9px] font-bold uppercase">Customer</span>}
                    ID: {ticket.createdById}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  <span className="truncate" title={ticket.email || 'N/A'}>{ticket.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={14} className="mr-2 text-gray-400" /> {ticket.phone || "No phone provided"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
