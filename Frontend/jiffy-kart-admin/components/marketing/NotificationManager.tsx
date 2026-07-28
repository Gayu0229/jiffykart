
import React, { useState } from 'react';
import { Send, Bell, History, Users, Store, Search } from 'lucide-react';
import { AppNotification } from '../../types';

const NotificationManager: React.FC = () => {
  const [history, setHistory] = useState<AppNotification[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('All Users');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    try {
      // Mock API Call: POST /api/v1/notifications/send
      // await fetch('/api/v1/notifications/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ title, message, recipient }),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      const newNotif: AppNotification = {
        id: `NOT-${Math.floor(Math.random() * 1000)}`,
        title,
        message,
        recipientType: recipient as any,
        sentDate: new Date().toLocaleString(),
        status: 'Sent'
      };

      setHistory([newNotif, ...history]);
      setTitle('');
      setMessage('');
      alert('Notification sent successfully!');
    } catch (error) {
      console.error("Failed to send notification", error);
      alert('Failed to send notification.');
    }
  };

  const filteredHistory = history.filter(notif =>
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* Compose Section */}
      <div className="lg:w-1/2 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Send size={20} className="mr-2 text-primary" />
            Send Push Notification
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none placeholder-gray-400"
                placeholder="e.g., Mega Flash Sale Starts Now!"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea
                className="w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none h-32 resize-none placeholder-gray-400"
                placeholder="Write your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <select
                className="w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              >
                <option>All Users</option>
                <option>All Vendors</option>
                <option>Specific Category</option>
                <option>Specific Shop</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              Send Notification
            </button>
          </form>
        </div>
      </div>

      {/* History Section */}
      <div className="lg:w-1/2">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full max-h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center">
                <History size={18} className="mr-2 text-gray-500" />
                Recent History
              </h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search history..."
                className="w-full pl-9 pr-4 py-2 bg-white text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto p-4 space-y-4 flex-1">
            {filteredHistory.length > 0 ? filteredHistory.map((notif) => (
              <div key={notif.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 text-sm">{notif.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${notif.status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {notif.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{notif.message}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center">
                      {notif.recipientType.includes('Vendor') ? <Store size={12} className="mr-1" /> : <Users size={12} className="mr-1" />}
                      {notif.recipientType}
                    </span>
                  </div>
                  <span>{notif.sentDate}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No notifications found.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default NotificationManager;
