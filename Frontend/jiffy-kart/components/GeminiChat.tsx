
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Phone, Paperclip, Smile, ArrowLeft, CheckCheck, Sparkles, Zap, Package, HelpCircle, ShoppingCart } from 'lucide-react';
import { generateShoppingAdvice } from '../services/geminiService';

interface GeminiChatProps {
  isOpen: boolean;
  onToggle: () => void;
  onBrowse: () => void;
  onJiffyStreet: () => void;
  onTrackOrder: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  type: 'text' | 'options' | 'whatsapp-link';
  options?: { label: string; action: string }[];
  whatsappNumber?: string;
}

export const GeminiChat: React.FC<GeminiChatProps & { view?: string }> = ({ 
  isOpen, 
  onToggle, 
  onBrowse, 
  onJiffyStreet, 
  onTrackOrder,
  view
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [awaitingOrderId, setAwaitOrderId] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: '👋 Hey! I am your **Jiffy AI Assistant**. \n\nI can help you track orders, find the best gadgets, or answer questions about our 30-min delivery. \n\nWhat can I do for you today?',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'options',
          options: [
            { label: '📦 Track My Order', action: 'track' },
            { label: '🛍️ Browse Electronics', action: 'browse' },
            { label: '🛒 Sunday Jiffy Street', action: 'jiffy' },
            { label: '❓ Delivery FAQs', action: 'faq_delivery' },
            { label: '📞 Talk to Human', action: 'support' },
          ]
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOptionClick = (action: string, label: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: label,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(async () => {
      let botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      switch (action) {
        case 'browse':
          botMsg.text = 'Opening our premium store catalog for you... ⚡';
          setMessages(prev => [...prev, botMsg]);
          setTimeout(() => onBrowse(), 1000);
          break;
        case 'track':
          botMsg.text = 'Please enter your **Order ID** (e.g., ORD-12345) and I will check the status for you.';
          setAwaitOrderId(true);
          setMessages(prev => [...prev, botMsg]);
          break;
        case 'faq_delivery':
          const faqResponse = await generateShoppingAdvice("Tell me about your delivery times and locations.", messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text })));
          botMsg.text = faqResponse;
          setMessages(prev => [...prev, botMsg]);
          break;
        case 'jiffy':
          botMsg.text = '🎉 **Jiffy Street** is our legendary Sunday sale! We offer huge discounts on Baby Products & Fashion from 10 AM to 10 PM every Sunday.';
          botMsg.type = 'options';
          botMsg.options = [
            { label: '🔥 View Today’s Deals', action: 'go_jiffy' },
            { label: '⏰ Remind Me Next Sunday', action: 'whatsapp_jiffy' }
          ];
          setMessages(prev => [...prev, botMsg]);
          break;
        case 'go_jiffy':
           botMsg.text = 'Taking you to the Street... 🛍️';
           setMessages(prev => [...prev, botMsg]);
           setTimeout(() => onJiffyStreet(), 1000);
           break;
        case 'support':
           botMsg.text = 'Our support squad is available on WhatsApp for deep dives into any issues.';
           botMsg.type = 'whatsapp-link';
           botMsg.whatsappNumber = '919066390736';
           setMessages(prev => [...prev, botMsg]);
           break;
        default:
           const aiRes = await generateShoppingAdvice(label, messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text })));
           botMsg.text = aiRes;
           setMessages(prev => [...prev, botMsg]);
      }
      setIsTyping(false);
    }, 800);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue('');
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    if (awaitingOrderId) {
        setTimeout(() => {
            setAwaitOrderId(false);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: `I've received Order ID: **${text}**. \n\nI am pinging our delivery partner. While I wait for a response, you can track it live here:`,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'text'
            };
            setMessages(prev => [...prev, botMsg]);
            setTimeout(() => onTrackOrder(), 1500);
            setIsTyping(false);
        }, 1200);
        return;
    }

    try {
        const history = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text }));
        const response = await generateShoppingAdvice(text, history);
        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };
        setMessages(prev => [...prev, botMsg]);
    } catch (e) {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "My AI circuits are a bit warm! 🤖🔥 Please try again shortly.",
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'whatsapp-link'
        }]);
    }
    setIsTyping(false);
  };

  return (
    <>
      {!isOpen && (
        <button 
            onClick={onToggle}
            className={`fixed ${view === 'product-detail' ? 'bottom-28' : 'bottom-6'} right-6 z-[110] w-16 h-16 rounded-full shadow-[0_10px_40px_rgba(80,80,129,0.4)] transition-all duration-300 hover:scale-110 bg-secondary text-white flex items-center justify-center group`}
        >
            <div className="relative">
              <MessageCircle size={32} fill="white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-highlight rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <span className="absolute right-full mr-4 bg-dark text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                Chat with AI
            </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[85vh] bg-slate-100 rounded-[2.5rem] shadow-2xl z-[110] flex flex-col overflow-hidden animate-slide-up font-sans border border-white/20">
          <div className="bg-dark px-5 py-4 flex items-center justify-between shadow-lg z-10">
            <div className="flex items-center gap-3">
               <div className="relative">
                   <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center overflow-hidden border border-white/20">
                       <Sparkles className="text-accent" size={24} />
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-dark"></div>
               </div>
               <div>
                   <h3 className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                     Jiffy AI Assistant <Zap size={12} className="fill-accent text-accent"/>
                   </h3>
                   <p className="text-accent text-[10px] font-bold uppercase tracking-wider">Eclipse Mode • Active</p>
               </div>
            </div>
            <button onClick={onToggle} className="text-white/60 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
                <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-200 relative scroll-smooth custom-scrollbar">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] pointer-events-none"></div>

            <div className="flex justify-center mb-6 relative z-10">
                <span className="bg-white/80 backdrop-blur-sm text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    Secure AI Channel
                </span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col relative z-10 ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                <div 
                    className={`max-w-[88%] px-4 py-3 text-sm shadow-sm relative ${
                        msg.sender === 'user' 
                        ? 'bg-secondary text-white rounded-[1.5rem] rounded-tr-none' 
                        : 'bg-white text-dark rounded-[1.5rem] rounded-tl-none border border-gray-100'
                    }`}
                >
                    <div className="whitespace-pre-line leading-relaxed prose prose-sm max-w-none">
                      {msg.text}
                    </div>
                    <div className={`flex items-center justify-end gap-1 mt-2 ${msg.sender === 'user' ? 'opacity-60' : 'opacity-40'}`}>
                        <span className="text-[9px] font-bold">{msg.timestamp}</span>
                        {msg.sender === 'user' && <CheckCheck size={12} className="text-blue-300" />}
                    </div>

                    {msg.type === 'whatsapp-link' && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                             <a 
                                href={`https://wa.me/${msg.whatsappNumber || '919066390736'}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-center gap-3 bg-secondary hover:bg-dark text-white font-black py-3 px-4 rounded-2xl transition shadow-lg text-xs w-full active:scale-95"
                             >
                                <MessageCircle size={16} fill="white"/>
                                Customer Support
                             </a>
                        </div>
                    )}
                </div>

                {msg.type === 'options' && msg.options && (
                    <div className="flex flex-col items-start gap-2 mt-3 w-full max-w-[85%]">
                        {msg.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionClick(opt.action, opt.label)}
                                className="w-full text-left px-5 py-3 rounded-2xl shadow-sm text-xs font-bold transition-all active:scale-95 flex items-center justify-between group bg-white text-primary hover:bg-primary hover:text-white border border-slate-100"
                            >
                                {opt.label}
                                <ArrowLeft size={14} className="rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start relative z-10">
                <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 border border-gray-50">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-50 flex flex-col z-20 gap-3 border-t border-slate-200">
            <div className="flex items-center gap-3">
                <div className="bg-white flex-1 rounded-[1.5rem] flex items-center px-4 py-1 shadow-sm border-2 border-transparent focus-within:border-primary transition-all">
                    <button className="text-slate-400 hover:text-slate-600 mr-2 transition"><Smile size={20}/></button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me anything..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-dark placeholder-slate-400 h-11 font-medium"
                    />
                </div>
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className={`p-3.5 rounded-2xl shadow-xl transition-all transform active:scale-90 flex items-center justify-center ${inputValue.trim() && !isTyping ? 'bg-secondary text-white' : 'bg-slate-300 text-slate-500'}`}
                >
                    <Send size={20} fill={inputValue.trim() ? "currentColor" : "none"} />
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
