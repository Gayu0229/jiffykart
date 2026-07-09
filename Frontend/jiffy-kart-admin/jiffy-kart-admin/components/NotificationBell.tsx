import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, Shield, Sparkles, X } from 'lucide-react';
import { api } from '../services/api';
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

    const userStr = localStorage.getItem('admin_user');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        if (user && user.id) {
            loadNotifications();

            const socketClient = createSocketClient((topic, body) => {
                // Subscribe to both user-specific and admin global topics
                if (topic === '/user/queue/notifications' || topic === '/topic/admin' || topic === '/topic/notifications') {
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
                className={`p-2 rounded-full transition-all relative group flex items-center justify-center ${isOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-indigo-600" />
                            <h3 className="font-bold text-gray-900 text-sm">System Alerts</h3>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold text-indigo-600 uppercase hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center gap-2">
                                <Bell className="w-8 h-8 text-gray-200" />
                                <p className="text-xs font-medium text-gray-400">System is healthy. No new alerts.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                        className={`p-4 flex gap-3 transition cursor-pointer hover:bg-gray-50 relative ${!notif.isRead ? 'bg-indigo-50/30' : ''
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${notif.type === 'SYSTEM_ERROR' ? 'bg-red-50 text-red-600' :
                                                notif.type === 'NEW_VENDOR' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            <Sparkles size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-xs font-bold truncate pr-4 ${!notif.isRead ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1"></div>}
                                            </div>
                                            <p className={`text-[11px] mt-1 leading-relaxed ${!notif.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 font-medium">
                                                <Clock size={10} className="text-gray-300" />
                                                <span className="text-[9px] text-gray-400">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
