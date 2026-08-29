import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, Inbox, Sparkles, X } from 'lucide-react';
import { api } from '../vendor.api';
import { createSocketClient } from '../socket';

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

    const userStr = localStorage.getItem('vendor_user');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        if (user && user.id) {
            loadNotifications();

            const socketClient = createSocketClient((topic, body) => {
                if (topic === '/user/queue/notifications') {
                    setNotifications(prev => [body, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            });

            return () => socketClient.deactivate();
        }
    }, []);

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
            const data = await api.getNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllNotificationsRead(user.id);
            setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-full transition-all relative group flex items-center justify-center border ${isOpen ? 'bg-brand-500 text-white border-brand-500 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:text-brand-500 hover:shadow-md'
                    }`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[8px] flex items-center justify-center text-white font-black animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-50 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Inbox</h3>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline"
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                    <Bell size={24} />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                        className={`p-4 flex gap-3 transition cursor-pointer hover:bg-gray-50 relative ${!notif.isRead ? 'bg-brand-50/20' : ''
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${notif.type === 'NEW_ORDER' ? 'bg-emerald-50 text-emerald-600' :
                                                'bg-brand-50 text-brand-500'
                                            }`}>
                                            <Sparkles size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-xs font-black truncate pr-2 ${!notif.isRead ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1 shrink-0"></div>}
                                            </div>
                                            <p className={`text-[11px] mt-1 leading-snug line-clamp-2 ${!notif.isRead ? 'text-gray-700 font-bold' : 'text-gray-500 font-medium'}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] font-bold text-gray-300 uppercase flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="w-full p-4 bg-white text-center border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors">
                        View Dashboard Insights
                    </button>
                </div>
            )}
        </div>
    );
};
