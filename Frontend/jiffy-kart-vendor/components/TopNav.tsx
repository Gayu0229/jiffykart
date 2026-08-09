
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Mail, ChevronDown, X, CheckCircle2, Info, MessageSquare } from 'lucide-react';
import { View, Ticket, UserProfile } from '../types';
import { NotificationBell } from './NotificationBell';

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success';
  time: string;
  read: boolean;
  relatedId?: string;
  targetView?: View;
}

import { Menu } from 'lucide-react';

interface TopNavProps {
  title: string;
  notifications?: Notification[];
  openTicketsCount?: number;
  onMarkRead?: () => void;
  onClearNotifications?: () => void;
  onClearSupportNotifications?: () => void; // New prop for clearing support unread states
  onViewChange: (view: View) => void;
  onLogout: () => void;
  tickets?: Ticket[];
  onNavigateToTicket: (id: string) => void;
  onNotificationClick?: (notif: Notification) => void;
  userProfile: UserProfile;
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({
  title,
  notifications = [],
  openTicketsCount = 0,
  onMarkRead,
  onClearNotifications,
  onClearSupportNotifications,
  onViewChange,
  onLogout,
  tickets = [],
  onNavigateToTicket,
  onNotificationClick,
  userProfile,
  onMenuClick
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMailDropdown, setShowMailDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter recent active tickets for the dropdown
  const recentActiveTickets = useMemo(() =>
    tickets.filter(t => t.status !== 'Resolved').slice(0, 3),
    [tickets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifDropdown(false);
      if (mailRef.current && !mailRef.current.contains(event.target as Node)) setShowMailDropdown(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifDropdown(!showNotifDropdown);
    setShowMailDropdown(false);
    setShowProfileDropdown(false);
    if (!showNotifDropdown && onMarkRead) {
      onMarkRead();
    }
  };

  const handleMailClick = () => {
    setShowMailDropdown(!showMailDropdown);
    setShowNotifDropdown(false);
    setShowProfileDropdown(false);
  };

  const handleNavigateToSettings = () => {
    onViewChange(View.SETTINGS);
    setShowProfileDropdown(false);
  };

  return (
    <header className="h-20 bg-[#F9FAFB] flex items-center justify-between px-8 shrink-0 relative z-[100]">
      <div className="flex-1 flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 mr-4 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-500 hover:text-brand-500 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        {/* Remove search section as requested */}
      </div>

      <div className="flex items-center space-x-6">
        {/* Notifications (Bell) */}
        <NotificationBell />

        {/* Messages (Mail) */}
        <div className="relative" ref={mailRef}>
          <button
            onClick={handleMailClick}
            className={`p-3 bg-white border border-gray-100 rounded-full shadow-sm transition-all ${showMailDropdown ? 'text-brand-900 shadow-md ring-2 ring-brand-500/20' : 'text-gray-500 hover:text-brand-900 hover:shadow-md'}`}
          >
            <Mail className="w-5 h-5" />
          </button>
          {openTicketsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 border-2 border-[#F9FAFB] rounded-full text-[9px] flex items-center justify-center text-white font-black shadow-lg animate-in zoom-in duration-300">
              {openTicketsCount}
            </span>
          )}

          {showMailDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Support Messages</h4>
                  <div className="px-2 py-0.5 bg-brand-900 text-white text-[9px] font-black rounded-lg uppercase">{openTicketsCount}</div>
                </div>
                {openTicketsCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearSupportNotifications?.();
                    }}
                    className="text-[10px] font-black text-brand-500 uppercase hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recentActiveTickets.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active chats</p>
                    <p className="text-[10px] text-gray-400 mt-1">Your customer support inbox is caught up.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {recentActiveTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          onNavigateToTicket(ticket.id);
                          setShowMailDropdown(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border flex items-start space-x-3 hover:bg-white transition-all group ${ticket.unreadByVendor ? 'bg-brand-50 border-brand-100' : 'bg-gray-50 border-gray-100'}`}
                      >
                        <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5 text-brand-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-brand-900 uppercase tracking-tight">{ticket.category}</p>
                            {ticket.unreadByVendor && <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div>}
                          </div>
                          <p className="text-xs font-bold text-gray-600 line-clamp-2 mt-0.5">{ticket.subject}</p>
                          <p className="text-[9px] text-gray-400 mt-1 font-bold">Token #{ticket.id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  onViewChange(View.SUPPORT);
                  setShowMailDropdown(false);
                }}
                className="w-full p-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-t border-gray-50 hover:bg-gray-50 transition-colors"
              >
                Open Support Desk
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`flex items-center space-x-3 cursor-pointer group ml-4 p-1 pr-3 rounded-2xl transition-all shadow-sm ${showProfileDropdown ? 'bg-white ring-2 ring-brand-500/20' : 'hover:bg-white'}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">{userProfile.name}</p>
              <p className="text-[11px] text-gray-500 font-medium">{userProfile.role}</p>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center border-2 border-transparent group-hover:border-brand-500 transition-all overflow-hidden">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-white uppercase">{userProfile.name?.charAt(0) || 'V'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </div>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-xs font-black text-gray-900 truncate">{userProfile.email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={handleNavigateToSettings}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-brand-900 rounded-xl transition-all"
                >
                  My Profile
                </button>
                <div className="h-px bg-gray-50 my-1 mx-2"></div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
