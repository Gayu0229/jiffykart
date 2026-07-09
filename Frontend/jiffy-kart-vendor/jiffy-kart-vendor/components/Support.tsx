
import React, { useState, useMemo, useEffect } from 'react';
import {
  HelpCircle, FileText, Search,
  ChevronRight, ArrowRight, Clock,
  CheckCircle2, AlertCircle, Plus, Send,
  Paperclip, Phone, Mail, Sparkles, X,
  Loader2, ShieldCheck, Headphones,
  MessageSquare, LifeBuoy, Zap, Filter,
  ClipboardList, User, MoreHorizontal,
  ChevronDown, MapPin, CreditCard, ShoppingBag,
  BarChart2, Settings, Smartphone, Tag,
  LayoutGrid, CreditCard as BillingIcon, Settings2 as TechIcon,
  Truck as LogisticsIcon, HelpCircle as GeneralIcon
} from 'lucide-react';
import { Ticket, TicketMessage } from '../types';
import { api } from '../vendor.api.ts';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  icon: React.ReactNode;
}

const FAQ_DATABASE: FAQItem[] = [
  {
    id: '1',
    question: "How do I update my shop location?",
    answer: "To update your location, navigate to the 'Shop Location' tab in the sidebar. There you can edit your physical address, adjust your GPS coordinates on the map, and update pickup instructions for couriers. Ensure you save changes to sync with our logistics engine.",
    category: "Profile",
    tags: ['address', 'location', 'map'],
    icon: <MapPin className="w-4 h-4" />
  },
  {
    id: '2',
    question: "What is the settlement cycle for payouts?",
    answer: "JiffyKart processes settlements every Sunday. Once initiated, the funds usually take 2-3 business days to reflect in your bank account depending on IMPS/NEFT processing times. You can track all payouts in the 'Payments' section.",
    category: "Payments",
    tags: ['money', 'bank', 'cycle'],
    icon: <CreditCard className="w-4 h-4" />
  },
  {
    id: '3',
    question: "How to handle returns from customers?",
    answer: "When a customer requests a return, you'll receive a notification. Go to 'Order History', select the specific order, and review the return request details. You can approve or reject based on our 48-hour return policy and item condition.",
    category: "Orders",
    tags: ['return', 'refund', 'policy'],
    icon: <ShoppingBag className="w-4 h-4" />
  },
  {
    id: '4',
    question: "Integrating JiffyKart with my inventory software?",
    answer: "We offer robust REST APIs for inventory sync. Navigate to 'Settings > Security Vault' to generate your API keys. You can find the full technical documentation at developers.jiffykart.com or request assistance from our technical concierge.",
    category: "Technical",
    tags: ['api', 'sync', 'inventory'],
    icon: <Smartphone className="w-4 h-4" />
  },
  {
    id: '5',
    question: "Can I offer multiple discount codes at once?",
    answer: "Yes, you can create multiple active campaigns in the 'Discounts' tab. However, customers can only apply one code per transaction. You can set priority levels for automatic application of the best deal for the user.",
    category: "Marketing",
    tags: ['discount', 'promo', 'coupon'],
    icon: <Zap className="w-4 h-4" />
  },
  {
    id: '6',
    question: "How to export monthly sales tax reports?",
    answer: "Head to the 'Analytics' section and click on the 'Board Report' button. You can select 'Tax Registry (CSV/PDF)' as the format and choose your desired month. Reports are ready for download instantly.",
    category: "Analytics",
    tags: ['report', 'tax', 'csv'],
    icon: <BarChart2 className="w-4 h-4" />
  },
  {
    id: '7',
    question: "How to boost store visibility on Home page?",
    answer: "Active stores with high fulfillment rates and positive reviews are automatically featured. You can also use the 'Promotions' hub to launch sponsored placement campaigns for specific SKUs.",
    category: "Marketing",
    tags: ['ads', 'visibility', 'feature'],
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    id: '8',
    question: "What is the procedure for account deactivation?",
    answer: "If you wish to pause or deactivate your vendor account, please contact your account manager. Note that all pending orders must be fulfilled or cancelled before deactivation can be finalized.",
    category: "Profile",
    tags: ['account', 'delete', 'close'],
    icon: <User className="w-4 h-4" />
  }
];

interface SupportProps {
  initialTickets: Ticket[];
  onUpdateTickets: (tickets: Ticket[]) => void;
  preSelectedTicketId?: string | null;
  onClearPreSelected?: () => void;
}

const Support: React.FC<SupportProps> = ({ preSelectedTicketId, onClearPreSelected }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'HELP' | 'TICKETS'>(preSelectedTicketId ? 'TICKETS' : 'HELP');
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('All');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // New Ticket Form State
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<string>('General Inquiry');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const data = await api.fetchTickets();
      setTickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Handle pre-selected ticket (deep linking)
  useEffect(() => {
    if (preSelectedTicketId) {
      setActiveTab('TICKETS');
      setSelectedTicketId(preSelectedTicketId);
      onClearPreSelected?.();
    }
  }, [preSelectedTicketId, onClearPreSelected]);

  // Derived state: Get the actual ticket object based on the ID
  const selectedTicket = useMemo(() =>
    selectedTicketId ? tickets.find(t => t.ticketId === selectedTicketId) : null,
    [selectedTicketId, tickets]);

  // Effect to mark ticket as read when opened
  useEffect(() => {
    if (selectedTicketId && selectedTicket?.unreadByVendor) {
      // In a real system, you might call an API here to mark as read
      // For now, we update local state
      setTickets(prev => prev.map(t =>
        t.ticketId === selectedTicketId ? { ...t, unreadByVendor: false } : t
      ));
    }
  }, [selectedTicketId, selectedTicket]);

  const faqCategories = useMemo(() => {
    const cats = Array.from(new Set(FAQ_DATABASE.map(faq => faq.category)));
    return ['All', ...cats.sort()];
  }, []);

  const filteredFAQs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATABASE.filter(faq => {
      const matchesSearch = !q || (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.tags.some(t => t.toLowerCase().includes(q))
      );
      const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedFaqCategory]);

  const groupedFAQs = useMemo<Record<string, FAQItem[]>>(() => {
    if (selectedFaqCategory !== 'All' && !searchQuery) return { [selectedFaqCategory]: filteredFAQs };

    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach(faq => {
      if (!groups[faq.category]) groups[faq.category] = [];
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFAQs, selectedFaqCategory, searchQuery]);

  const filteredTickets = useMemo(() => {
    const q = ticketSearchQuery.toLowerCase().trim();
    return tickets.filter(ticket =>
      ticket.ticketId.toLowerCase().includes(q) ||
      ticket.subject.toLowerCase().includes(q) ||
      ticket.category.toLowerCase().includes(q)
    );
  }, [ticketSearchQuery, tickets]);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const renderStatusBadge = (status: Ticket['status']) => {
    const config = {
      'OPEN': 'bg-blue-50 text-blue-600 border-blue-100',
      'RESOLVED': 'bg-green-50 text-green-600 border-green-100',
      'IN_PROGRESS': 'bg-orange-50 text-orange-600 border-orange-100',
      'CLOSED': 'bg-gray-50 text-gray-600 border-gray-100',
    };
    return (
      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config[status] || config['OPEN']}`}>
        {status}
      </span>
    );
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;

    setIsSending(true);
    try {
      await api.addReply(selectedTicketId, replyText);
      await fetchTickets(); // Refresh
      setReplyText('');
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const TICKET_CATEGORIES = [
    { id: 'Billing', label: 'Billing', icon: <BillingIcon className="w-4 h-4" />, color: 'bg-green-50 text-green-600' },
    { id: 'Technical', label: 'Technical', icon: <TechIcon className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600' },
    { id: 'Logistics', label: 'Logistics', icon: <LogisticsIcon className="w-4 h-4" />, color: 'bg-orange-50 text-orange-600' },
    { id: 'General Inquiry', label: 'General Inquiry', icon: <GeneralIcon className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto relative">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Partner Success Center</span>
          </div>
          <h2 className="text-4xl font-black text-brand-900 tracking-tighter uppercase text-ellipsis overflow-hidden">Support Desk</h2>
          <p className="text-sm font-medium text-gray-500">Self-service resources and human-led assistance</p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-brand-900 transition-all group">
            <Filter className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
          <button
            onClick={() => setIsNewTicketModalOpen(true)}
            className="flex items-center space-x-3 bg-brand-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-black transition-all shadow-xl shadow-brand-900/10"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="whitespace-nowrap">Open New Ticket</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex space-x-8">
          {[
            { id: 'HELP', label: 'Knowledge Hub', icon: LifeBuoy },
            { id: 'TICKETS', label: 'My Tickets', icon: ClipboardList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center space-x-3 ${activeTab === tab.id ? 'text-brand-900' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-500' : ''}`} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-[-1px] left-0 w-full h-1 bg-brand-900 rounded-full animate-in slide-in-from-bottom-2 duration-300"></div>
              )}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Avg Response: 42m</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Expert Staff Active</span>
          </div>
        </div>
      </div>

      {activeTab === 'HELP' && (
        <div className="space-y-12 animate-in slide-in-from-left-4 duration-500">
          {/* Hero Search & Category Filter */}
          <div className="space-y-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for solutions, documentation, or policies..."
                className="block w-full pl-20 pr-8 py-8 bg-white border border-gray-100 rounded-[32px] text-lg font-bold text-gray-900 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/30 outline-none transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Filter Category:</span>
              {faqCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedFaqCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedFaqCategory === cat
                    ? 'bg-brand-900 text-white border-brand-900 shadow-lg scale-105'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
              {Object.keys(groupedFAQs).length > 0 ? (
                Object.entries(groupedFAQs).map(([category, faqs]: [string, FAQItem[]]) => (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center justify-between px-4 border-l-4 border-brand-900 ml-1">
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black text-brand-900 uppercase tracking-[0.2em]">{category} Hub</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{faqs.length} Helpful Articles</p>
                      </div>
                      <LayoutGrid className="w-4 h-4 text-gray-200" />
                    </div>

                    <div className="space-y-4">
                      {faqs.map((faq) => (
                        <div
                          key={faq.id}
                          className={`bg-white border rounded-[32px] overflow-hidden transition-all duration-300 ${expandedFaqId === faq.id ? 'border-brand-500/30 shadow-xl shadow-brand-500/5 ring-1 ring-brand-500/10' : 'border-gray-50'
                            }`}
                        >
                          <button
                            onClick={() => toggleFaq(faq.id)}
                            className="w-full flex items-center justify-between p-8 text-left hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="flex items-center space-x-6">
                              <div className={`p-4 rounded-2xl transition-colors ${expandedFaqId === faq.id ? 'bg-brand-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400'
                                }`}>
                                {faq.icon}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">{faq.category}</span>
                                <p className={`text-base font-black transition-colors ${expandedFaqId === faq.id ? 'text-brand-900' : 'text-gray-800'}`}>
                                  {faq.question}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${expandedFaqId === faq.id ? 'rotate-90 text-brand-900' : 'text-gray-300'
                              }`} />
                          </button>

                          {expandedFaqId === faq.id && (
                            <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                              <div className="pl-[76px] pr-10">
                                <div className="h-px bg-gray-100 mb-6 w-full" />
                                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                  {faq.answer}
                                </p>
                                <div className="flex items-center space-x-4 mt-6">
                                  <button className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center hover:underline">
                                    Was this helpful? <ThumbsUp className="w-3 h-3 ml-2" />
                                  </button>
                                  <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                  <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-900 transition-colors">
                                    Report Issue
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-20 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No matching help articles found.</p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Try adjusting your search query or category filter</p>
                  </div>
                  <button onClick={() => { setSearchQuery(''); setSelectedFaqCategory('All'); }} className="text-xs font-black text-brand-500 hover:underline uppercase tracking-widest mt-4">Reset All Filters</button>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-brand-900 p-10 rounded-[48px] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between min-h-[480px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-300/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>

                <div className="space-y-4 relative z-10">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[24px] flex items-center justify-center border border-white/20">
                    <Headphones className="w-8 h-8 text-brand-200" />
                  </div>
                  <h4 className="text-3xl font-black tracking-tight leading-none uppercase">Priority<br />Concierge</h4>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">
                    Direct access to our senior support engineering team for mission-critical escalations.
                  </p>
                </div>

                <div className="space-y-3 relative z-10">
                  <button className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[28px] hover:bg-white hover:text-brand-900 transition-all group">
                    <div className="flex items-center space-x-4">
                      <Phone className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">Request Callback</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="https://wa.me/919066390736?text=Hello%20JiffyKart%20Support!%20I%20am%20a%20vendor%20and%20I%20need%20assistance%20with%20my%20store."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[28px] hover:bg-white hover:text-brand-900 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">Connect Live</span>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/20">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-brand-900 uppercase tracking-[0.2em]">Active Records</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Historical and real-time support requests</p>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Ticket ID or Subject..."
                  className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm placeholder:text-gray-300"
                  value={ticketSearchQuery}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <th className="px-10 py-6 border-b border-gray-50">Token</th>
                    <th className="px-10 py-6 border-b border-gray-50">Issue Summary</th>
                    <th className="px-10 py-6 border-b border-gray-50">Status</th>
                    <th className="px-10 py-6 border-b border-gray-50">Priority</th>
                    <th className="px-10 py-6 text-right border-b border-gray-50">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-gray-50/50 transition-all group cursor-pointer ${ticket.unreadByVendor ? 'bg-brand-50/30' : ''}`}
                      onClick={() => setSelectedTicketId(ticket.ticketId)}
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center space-x-3">
                          {ticket.unreadByVendor && <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>}
                          <span className="text-xs font-black text-brand-900 group-hover:text-brand-600 transition-colors">#{ticket.ticketId}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="space-y-1">
                          <p className={`text-sm font-bold ${ticket.unreadByVendor ? 'text-gray-900' : 'text-gray-700'}`}>{ticket.subject}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{ticket.category}</span>
                            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                            <span className="text-[9px] font-bold text-gray-400">Last activity {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">{renderStatusBadge(ticket.status)}</td>
                      <td className="px-10 py-6">
                        <span className={`text-[10px] font-black uppercase ${ticket.priority === 'High' ? 'text-red-500' :
                          ticket.priority === 'Medium' ? 'text-orange-500' : 'text-gray-400'
                          }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-900 hover:bg-white transition-all shadow-sm">
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details & Chat Modal */}
      {selectedTicketId && selectedTicket && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] p-0 max-w-3xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden h-[90vh] flex flex-col">
            <div className="px-10 py-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-900 text-white p-3 rounded-2xl shadow-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-black text-brand-900 uppercase tracking-tight">Case #{selectedTicket.ticketId}</h3>
                    {renderStatusBadge(selectedTicket.status)}
                  </div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{selectedTicket.category} • Updated {new Date(selectedTicket.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="p-3 text-gray-400 hover:text-brand-900 transition-all hover:bg-brand-50 rounded-2xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white">
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Issue Origin</p>
                <h4 className="text-lg font-black text-gray-900 mb-2">{selectedTicket.subject}</h4>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">{selectedTicket.description}</p>
              </div>

              <div className="space-y-6">
                {selectedTicket.messages?.map((msg) => (
                  <div key={msg.id} className={`flex items-start space-x-4 ${msg.senderRole === 'VENDOR' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${msg.senderRole === 'ADMIN' ? 'bg-brand-900 text-brand-200' : 'bg-gray-100 text-gray-400'}`}>
                      {msg.senderRole === 'ADMIN' ? <Headphones className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className={`max-w-[80%] space-y-1.5 ${msg.senderRole === 'VENDOR' ? 'text-right' : ''}`}>
                      <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed ${msg.senderRole === 'ADMIN' ? 'bg-brand-50 text-brand-900' : 'bg-gray-50 text-gray-700'
                        }`}>
                        {msg.message}
                      </div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{msg.senderRole === 'VENDOR' ? 'You' : 'Admin'} • {new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <div className="relative group">
                <textarea
                  rows={2}
                  placeholder="Send a message to your support agent..."
                  className="w-full pl-6 pr-16 py-5 bg-white border border-gray-200 rounded-[32px] text-sm font-medium text-gray-900 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/30 transition-all resize-none shadow-sm"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <div className="absolute right-4 bottom-4 flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-brand-900 transition-all"><Paperclip className="w-5 h-5" /></button>
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                    className="p-3 bg-brand-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] md:rounded-[48px] p-0 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-500 shrink-0"></div>
            <button onClick={() => setIsNewTicketModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-900 transition-all hover:bg-brand-50 rounded-2xl z-10">
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 pt-10 md:pt-14 custom-scrollbar">
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-black text-brand-900 tracking-tight uppercase">Open Help Ticket</h3>
                <p className="text-sm md:text-base font-medium text-gray-500 mt-2">Describe your issue in detail for faster resolution</p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSending(true);
                try {
                  await api.createTicket({
                    subject: newTicketSubject,
                    description: newTicketDescription,
                    category: newTicketCategory,
                    priority: 'MEDIUM'
                  });
                  await fetchTickets();
                  setIsNewTicketModalOpen(false);
                  setNewTicketSubject('');
                  setNewTicketDescription('');
                } catch (error) {
                  console.error("Failed to create ticket:", error);
                } finally {
                  setIsSending(false);
                }
              }} className="space-y-6 md:space-y-8">
                <div className="space-y-6">

                  {/* Categorization step before other details */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Select Issue Category</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {TICKET_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewTicketCategory(cat.id)}
                          className={`flex items-center space-x-4 p-4 md:p-5 rounded-[20px] md:rounded-[24px] border transition-all text-left ${newTicketCategory === cat.id
                            ? 'bg-white border-brand-900 shadow-lg ring-1 ring-brand-900'
                            : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'
                            }`}
                        >
                          <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${cat.color}`}>
                            {cat.icon}
                          </div>
                          <span className={`text-[11px] md:text-xs font-black uppercase tracking-tight ${newTicketCategory === cat.id ? 'text-brand-900' : 'text-gray-500'}`}>
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Brief Summary</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Settlement missing for week 42"
                      className="w-full px-5 md:px-6 py-4 md:py-5 bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl text-sm md:text-base font-bold text-brand-900 outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-inner"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Urgency Level</label>
                    <div className="relative">
                      <select required className="w-full pl-5 md:pl-6 pr-12 py-4 md:py-5 bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl text-xs md:text-sm font-bold text-brand-900 outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer appearance-none">
                        <option>Standard Response (24-48h)</option>
                        <option>Urgent (4-8h)</option>
                        <option>Critical (System Down / Store Error)</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Detailed Narrative</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Include transaction IDs, product SKUs, etc."
                      className="w-full px-5 md:px-6 py-4 md:py-5 bg-gray-50 border border-gray-100 rounded-2xl md:rounded-[32px] text-xs md:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all resize-none shadow-inner"
                      value={newTicketDescription}
                      onChange={(e) => setNewTicketDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 md:pt-4 flex items-center space-x-4 sticky bottom-0 bg-white">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 bg-brand-900 text-white py-5 md:py-6 rounded-full text-xs md:text-[13px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-2xl disabled:opacity-50"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSending ? 'Syncing...' : 'Dispatch Ticket'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ThumbsUp = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

export default Support;
