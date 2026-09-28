import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, MessageSquare, Plus, Clock, ChevronRight,
    Send, User, Headphones, Loader2, AlertCircle, ShoppingBag,
    HelpCircle, ChevronDown, ChevronUp, History, Info, CheckCircle
} from 'lucide-react';
import { SupportTicket, TicketMessage } from '../../types';
import { ApiService } from '../../services/apiService';

const FAQ_DATABASE = [
    {
        id: 'f1',
        category: 'Ordering',
        question: 'How do I track my order?',
        answer: 'You can track your order in the "Active Orders" section of your profile. We provide real-time updates from order confirmation to delivery.'
    },
    {
        id: 'f2',
        category: 'Payments',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI (PhonePe, Google Pay), and net banking. Cash on Delivery is also available for most locations.'
    },
    {
        id: 'f3',
        category: 'Returns',
        question: 'How do I return a product?',
        answer: 'If you are not satisfied with your purchase, you can initiate a return request within 7 days of delivery through the "Order History" page.'
    }
];

const SupportDesk: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [activeTab, setActiveTab] = useState<'HELP' | 'TICKETS'>('HELP');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // New Ticket State
    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [newDescription, setNewDescription] = useState('');
    const [newOrderId, setNewOrderId] = useState('');

    const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.fetchTickets();
            setTickets(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedTicket = useMemo(() =>
        selectedTicketId ? tickets.find(t => t.ticketId === selectedTicketId) : null
        , [selectedTicketId, tickets]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicketId) return;
        setIsSending(true);
        try {
            await ApiService.addReply(selectedTicketId, replyText);
            await fetchTickets();
            setReplyText('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await ApiService.createTicket({
                subject: newSubject,
                category: newCategory,
                description: newDescription,
                orderId: newOrderId ? parseInt(newOrderId) : null,
                priority: 'MEDIUM'
            });
            await fetchTickets();
            setIsNewTicketModalOpen(false);
            setNewSubject('');
            setNewDescription('');
            setActiveTab('TICKETS');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'IN_PROGRESS': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'RESOLVED': return 'bg-green-50 text-green-600 border-green-100';
            case 'CLOSED': return 'bg-gray-50 text-gray-600 border-gray-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (selectedTicket) {
        return (
            <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <button onClick={() => setSelectedTicketId(null)} className="flex items-center text-sm font-bold text-gray-400 hover:text-brand-900 transition-colors">
                        <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Back to History
                    </button>
                    <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(selectedTicket.status)}`}>
                            {selectedTicket.status}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 italic text-gray-600 text-lg leading-relaxed relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 rounded-full"></div>
                            {selectedTicket.description}
                            <div className="mt-4 flex items-center justify-between not-italic">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-gray-300">{selectedTicket.category}</span>
                                    {selectedTicket.orderId && <span className="text-[9px] font-bold text-brand-500 mt-1">Order ID: #{selectedTicket.orderId}</span>}
                                </div>
                                <span className="text-[10px] font-medium text-gray-300">{new Date(selectedTicket.createdAt).toDateString()}</span>
                            </div>
                        </div>

                        {/* Admin Resolution Display */}
                        {(selectedTicket.adminResponse || selectedTicket.resolutionReason) && (
                            <div className="bg-brand-50/50 p-8 rounded-[32px] border border-brand-100/50 space-y-4">
                                <div className="flex items-center space-x-2 text-brand-900">
                                    <CheckCircle className="w-5 h-5" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Resolution from Support</h4>
                                </div>
                                {selectedTicket.adminResponse && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Official Response</p>
                                        <p className="text-sm font-medium text-brand-900 leading-relaxed">{selectedTicket.adminResponse}</p>
                                    </div>
                                )}
                                {selectedTicket.resolutionReason && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Resolution Reason</p>
                                        <p className="text-sm font-medium text-brand-900/80 italic">"{selectedTicket.resolutionReason}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-6">
                            {selectedTicket.messages?.map((msg) => (
                                <div key={msg.id} className={`flex items-start space-x-4 ${msg.senderRole === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.senderRole === 'ADMIN' ? 'bg-brand-900 text-brand-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                        {msg.senderRole === 'ADMIN' ? <Headphones className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div className={`max-w-[80%] space-y-1.5 ${msg.senderRole === 'USER' ? 'text-right' : ''}`}>
                                        <div className={`p-5 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm ${msg.senderRole === 'ADMIN' ? 'bg-brand-50 text-brand-900 rounded-tl-none border border-brand-100' : 'bg-white text-gray-700 rounded-tr-none border border-gray-50'}`}>
                                            {msg.message}
                                        </div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{msg.senderRole === 'ADMIN' ? 'Support Agent' : 'You'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {selectedTicket.status !== 'CLOSED' && (
                    <div className="p-8 bg-white border-t border-gray-50 sticky bottom-0">
                        <div className="max-w-3xl mx-auto relative group">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-[32px] px-8 py-5 pr-20 text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none resize-none shadow-inner"
                            />
                            <button
                                onClick={handleSendReply}
                                disabled={!replyText.trim() || isSending}
                                className="absolute right-3 bottom-3 p-4 bg-brand-900 text-white rounded-2xl hover:bg-brand-800 disabled:opacity-50 disabled:hover:bg-brand-900 transition-all shadow-lg active:scale-95"
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-brand-900 to-black p-10 rounded-[40px] text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black mb-3">Help Center</h1>
                        <p className="text-brand-200/80 text-sm font-medium max-w-md leading-relaxed">How can we assist you today? Search our knowledge base or start a technical session with our support engineers.</p>
                        <div className="mt-8 flex items-center space-x-6">
                            <button onClick={() => setIsNewTicketModalOpen(true)} className="px-8 py-4 bg-white text-brand-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 transition-all shadow-lg active:scale-95">New Ticket</button>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex items-center space-x-4">
                                <div className="text-center">
                                    <p className="text-xl font-black">{tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-400">Active Cases</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center group cursor-pointer hover:border-brand-500/20 transition-all">
                    <div className="w-16 h-16 bg-brand-50 text-brand-900 rounded-3xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest">Connect with Agent</h3>
                    <p className="text-xs text-gray-400 font-medium mt-2">Available 24/7 for premium users</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-12 px-2 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('HELP')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'HELP' ? 'text-brand-900' : 'text-gray-300 hover:text-gray-500'}`}
                >
                    Knowledge Base
                    {activeTab === 'HELP' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-900 rounded-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('TICKETS')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'TICKETS' ? 'text-brand-900' : 'text-gray-300 hover:text-gray-500'}`}
                >
                    Support Tickets
                    {activeTab === 'TICKETS' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-900 rounded-full"></div>}
                </button>
            </div>

            {activeTab === 'HELP' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        {FAQ_DATABASE.map((faq) => (
                            <div key={faq.id} className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden transition-all hover:border-brand-500/20">
                                <button
                                    onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                                    className="w-full px-8 py-6 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-2 py-1 rounded-lg uppercase tracking-widest">{faq.category}</span>
                                        <span className="text-sm font-bold text-gray-900">{faq.question}</span>
                                    </div>
                                    {expandedFaqId === faq.id ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                                </button>
                                {expandedFaqId === faq.id && (
                                    <div className="px-8 pb-8 text-sm text-gray-500 font-medium leading-relaxed animate-in slide-in-from-top-2 duration-300">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="bg-brand-50 rounded-[40px] p-10 flex flex-col justify-between">
                        <div>
                            <HelpCircle className="w-12 h-12 text-brand-900 mb-6" />
                            <h3 className="text-xl font-black text-brand-900">Need specific help?</h3>
                            <p className="text-sm text-brand-900/60 font-medium mt-4 leading-relaxed">Our documentation covers 90% of common issues. For everything else, our support team is ready to help.</p>
                        </div>
                        <button onClick={() => setIsNewTicketModalOpen(true)} className="w-full py-5 bg-white text-brand-900 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95">Open Support Ticket</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-gray-400 italic">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                            <p className="text-xs font-black uppercase tracking-widest">Retrieving cases...</p>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="bg-white rounded-[40px] p-20 text-center border border-gray-50 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                                <History className="w-10 h-10" />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Support History</h3>
                            <p className="text-xs text-gray-400 font-medium mt-2">When you open a help ticket, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.ticketId)}
                                    className="bg-white rounded-[32px] border border-gray-50 p-6 flex items-center justify-between hover:border-brand-500/20 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-900 transition-colors">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 mb-1 group-hover:text-brand-900 transition-colors">{ticket.subject}</h4>
                                            <div className="flex items-center space-x-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                <span>#{ticket.ticketId}</span>
                                                <span>•</span>
                                                <span>{ticket.category}</span>
                                                <span>•</span>
                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-brand-900 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* New Ticket Modal */}
            {isNewTicketModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-xl" onClick={() => setIsNewTicketModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-gray-50">
                            <h2 className="text-2xl font-black text-brand-900">Create Help Ticket</h2>
                            <p className="text-sm text-gray-400 font-medium mt-1">Our support team typically responds within 2 hours.</p>
                        </div>

                        <form onSubmit={handleCreateTicket} className="p-10 space-y-8 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Case Category</label>
                                        <select
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-brand-900 focus:bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                                        >
                                            <option value="General">General Inquiry</option>
                                            <option value="Ordering">Order Related</option>
                                            <option value="Payment">Payment & Billing</option>
                                            <option value="Account">Account Access</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Order ID (Optional)</label>
                                        <input
                                            type="number"
                                            value={newOrderId}
                                            onChange={(e) => setNewOrderId(e.target.value)}
                                            placeholder="e.g. 1024"
                                            className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-brand-900 focus:bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Subject</label>
                                    <input
                                        required
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        placeholder="Briefly describe your issue"
                                        className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-brand-900 focus:bg-white focus:border-brand-500 outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Detailed Narrative</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Include relevant details like Order IDs or timestamps..."
                                        className="w-full bg-gray-50 border border-transparent rounded-[24px] px-6 py-4 text-sm font-medium text-gray-700 focus:bg-white focus:border-brand-500 outline-none transition-all shadow-inner resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button type="button" onClick={() => setIsNewTicketModalOpen(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Discard</button>
                                <button type="submit" disabled={isSending} className="flex-[2] py-5 bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-900 transition-all shadow-lg active:scale-95 flex items-center justify-center">
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispatch Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportDesk;
