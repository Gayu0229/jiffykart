import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Clock, Inbox, Sparkles, X } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { createSocketClient } from '../services/socket';

interface NotificationDTO {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    metadata: string;
    createdAt: string;
}

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const user = JSON.parse(localStorage.getItem('jiffykart_user') || '{}');
    const token = localStorage.getItem('jiffykart_token');

    useEffect(() => {
        // Only connect and fetch if we have both a user ID and a valid auth token
        if (user.id && token) {
            loadNotifications();

            // Listen for real-time notifications
            const socketClient = createSocketClient((topic, body) => {
                if (topic === '/user/queue/notifications') {
                    setNotifications(prev => [body, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            });

            return () => { socketClient.deactivate(); };
        }
    }, [user.id, token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await ApiService.getNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await ApiService.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await ApiService.markAllNotificationsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-2xl transition duration-300 relative group active:scale-95 border border-slate-100 ${isOpen ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:text-primary'
                    }`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-[swing_2s_ease-in-out_infinite]' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-highlight text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300 shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-primary/10 text-primary rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-1">
                                <Inbox size={12} /> Inbox
                            </span>
                            <h3 className="font-black text-slate-800 text-sm">Notifications</h3>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-2 py-1"
                            >
                                Mark All Read
                            </button>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-600 lg:hidden">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="max-h-[min(450px,70vh)] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <Bell size={32} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-sm">All caught up!</p>
                                    <p className="text-xs text-slate-400 font-bold mt-1">Check back later for updates</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                        className={`p-5 flex gap-4 transition cursor-pointer hover:bg-slate-50 group relative ${!notif.isRead ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${notif.type === 'NEW_ORDER' ? 'bg-emerald-100 text-emerald-600' :
                                                notif.type === 'ORDER_STATUS' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-indigo-100 text-indigo-600'
                                            }`}>
                                            <Sparkles size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-xs font-black truncate pr-4 ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                                            </div>
                                            <p className={`text-[11px] leading-relaxed line-clamp-2 ${!notif.isRead ? 'text-slate-700 font-bold' : 'text-slate-500 font-medium'}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-[9px] font-black text-slate-300 flex items-center gap-1 uppercase tracking-tight">
                                                    <Clock size={10} /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {!notif.isRead && (
                                                    <button className="text-[9px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        <Check size={10} /> Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jiffy Real-time Alerts</p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes swing {
                    0%, 100% { transform: rotate(0); }
                    10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
                    20%, 40%, 60%, 80% { transform: rotate(-10deg); }
                }
            `}</style>
        </div>
    );
};
