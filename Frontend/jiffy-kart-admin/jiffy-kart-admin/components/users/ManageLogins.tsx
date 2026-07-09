
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Edit, Ban, CheckCircle, Lock, User, 
  Briefcase, Store, X, Save, AlertTriangle, 
  Mail, Key, Copy, Eye, Loader2, RefreshCw,
  ShieldCheck, ShieldAlert, Clock
} from 'lucide-react';
import { UserAccount } from '../../types';
import { api } from '../../services/api';

const ManageLogins: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // UI States
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserAccount>>({});

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'reset_password' | 'toggle_status' | null;
    user: UserAccount | null;
  }>({ isOpen: false, type: null, user: null });

  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    password: string;
    username: string;
  }>({ isOpen: false, password: '', username: '' });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.getUserAccounts();
      setUsers(data);
    } catch (e) {
      showToast("Failed to sync accounts.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'All' || user.userType === filterRole;
      const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status !== 'Active').length,
    sellers: users.filter(u => u.userType === 'Seller').length
  }), [users]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // --- Handlers ---

  const handleEditClick = (user: UserAccount) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
        await api.updateUserAccount(editingUser.id, editForm);
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id ? { ...u, ...editForm } as UserAccount : u
        ));
        
        showToast("Credential profile updated.", 'success');
        setIsEditModalOpen(false);
        setEditingUser(null);
    } catch (e) {
        showToast("Update failed.", 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const confirmAction = async () => {
    const { type, user } = confirmModal;
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (type === 'reset_password') {
          const newPass = Math.random().toString(36).slice(-6) + "@" + Math.floor(100 + Math.random() * 900);
          // Password reset is typically just an API call, we simulate the secret generation
          await api.updateUserAccount(user.id, { lastLogin: 'Password Reset Req.' });
          
          setPasswordModal({ isOpen: true, password: newPass, username: user.username || user.name });
          showToast("New credentials generated.", 'success');
      } 
      else if (type === 'toggle_status') {
          const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
          await api.updateUserAccount(user.id, { status: newStatus as any });
          
          setUsers(prev => prev.map(u => u.id === user.id ? {...u, status: newStatus as any} : u));
          showToast(`Account ${newStatus === 'Active' ? 'activated' : 'disabled'}.`, 'success');
      }
    } catch (e) {
      showToast("Operation failed.", 'error');
    } finally {
      setIsSubmitting(false);
      setConfirmModal({ isOpen: false, type: null, user: null });
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(passwordModal.password);
    showToast("Password copied to clipboard!", "success");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium animate-pulse">Synchronizing security protocols...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
           {toast.type === 'success' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
           <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Logins</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Now</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Disabled/Locked</div>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
         </div>
         <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100 text-white">
            <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Vendor Accounts</div>
            <div className="text-2xl font-bold">{stats.sellers}</div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credential Management Hub</h2>
          <p className="text-sm text-gray-500">Reset passwords, update profiles, or suspend access for all partners.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={loadAccounts} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw size={20} className={isSubmitting ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Name, Username or ID..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-900 border border-transparent rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
           <select 
             className="bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm cursor-pointer font-medium"
             value={filterRole}
             onChange={(e) => setFilterRole(e.target.value)}
           >
             <option value="All">Partner Type: All</option>
             <option value="Seller">Partner Type: Vendors</option>
             <option value="Franchise">Partner Type: Field Managers</option>
           </select>
           <select 
             className="bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm cursor-pointer font-medium"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
           >
             <option value="All">Status: All</option>
             <option value="Active">Status: Active</option>
             <option value="Inactive">Status: Disabled</option>
           </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">System Identifier</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Entity Context</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Access Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Last Activity</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isDisabled = user.status !== 'Active';
                return (
                  <tr key={user.id} className={`transition-colors group ${isDisabled ? 'bg-gray-50/30' : 'hover:bg-indigo-50/20'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                         <div className="relative">
                            <img 
                              src={user.avatarUrl} 
                              alt="" 
                              className={`w-10 h-10 rounded-xl mr-3 bg-gray-200 object-cover border-2 transition-all ${isDisabled ? 'grayscale opacity-50 border-gray-300' : 'border-white group-hover:border-indigo-100 shadow-sm'}`} 
                            />
                            {isDisabled && (
                              <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white">
                                <X size={8} className="text-white" />
                              </div>
                            )}
                         </div>
                         <div>
                            <div className={`text-sm font-bold ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>{user.name}</div>
                            <div className="text-xs text-gray-400 flex items-center">
                               {user.userType === 'Franchise' ? <Briefcase size={10} className="mr-1"/> : <Store size={10} className="mr-1"/>}
                               {user.role}
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${isDisabled ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-700'}`}>
                        @{user.username}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-xs font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>{user.territoryOrShop}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                         <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                         {user.status === 'Active' ? 'Live' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs text-gray-500">
                         <Clock size={12} className="mr-1.5 text-gray-300" />
                         {user.lastLogin}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button 
                           onClick={() => setConfirmModal({ isOpen: true, type: 'reset_password', user })}
                           className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90" 
                           title="Reset Credentials"
                         >
                            <Key size={18} />
                         </button>
                         <button 
                           onClick={() => setConfirmModal({ isOpen: true, type: 'toggle_status', user })}
                           className={`p-2 rounded-xl transition-all active:scale-90 ${user.status === 'Active' ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} 
                           title={user.status === 'Active' ? 'Suspend Access' : 'Restore Access'}
                         >
                            {user.status === 'Active' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                         </button>
                         <button 
                           onClick={() => handleEditClick(user)}
                           className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-90" 
                           title="Edit Account Profile"
                         >
                            <Edit size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center text-gray-500 flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No partner accounts found</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or use a more specific search term.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    <User size={18} className="mr-2 text-indigo-600" /> 
                    Edit Partner Profile
                 </h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                 
                 <div className="flex items-center gap-4 mb-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <img src={editingUser.avatarUrl} className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-sm" alt="" />
                    <div>
                       <div className="font-black text-indigo-900 leading-none">@{editingUser.username}</div>
                       <div className="text-[10px] text-indigo-600 uppercase font-bold mt-1.5 tracking-widest">{editingUser.id}</div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                    <div className="relative">
                       <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         type="text" 
                         required
                         className="w-full pl-10 pr-3 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all font-medium"
                         value={editForm.name || ''}
                         onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                       />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Communication Email</label>
                    <div className="relative">
                       <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         type="email" 
                         required
                         className="w-full pl-10 pr-3 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all font-medium"
                         value={editForm.email || ''}
                         onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Partner Role</label>
                       <select 
                         className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all font-medium cursor-pointer"
                         value={editForm.role || ''}
                         onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}
                       >
                          <option value="Franchise Owner">Field Manager</option>
                          <option value="Seller">Vendor (Owner)</option>
                          <option value="Seller Staff">Vendor (Staff)</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current Status</label>
                       <select 
                         className="w-full px-3 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all font-medium cursor-pointer"
                         value={editForm.status || ''}
                         onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                       >
                          <option value="Active">Active</option>
                          <option value="Inactive">Disabled</option>
                       </select>
                    </div>
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                      disabled={isSubmitting}
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex justify-center items-center"
                    >
                       {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Save Changes</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.user && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 transform scale-100 transition-all">
              <div className="flex flex-col items-center text-center mb-8">
                 <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-inner ${
                    confirmModal.type === 'reset_password' ? 'bg-orange-100 text-orange-600' :
                    confirmModal.user.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                 }`}>
                    {confirmModal.type === 'reset_password' && <Lock size={32} />}
                    {confirmModal.type === 'toggle_status' && (confirmModal.user.status === 'Active' ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />)}
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {confirmModal.type === 'reset_password' ? 'Confirm Reset' : 
                     confirmModal.user.status === 'Active' ? 'Revoke Access?' : 'Grant Access?'}
                 </h3>
                 <p className="text-gray-500 text-sm leading-relaxed px-4">
                    {confirmModal.type === 'reset_password' 
                      ? <>This will expire the current password for <span className="font-bold text-gray-800">@{confirmModal.user.username}</span> and generate a temporary one.</>
                      : <>Are you sure you want to {confirmModal.user.status === 'Active' ? 'disable' : 'activate'} access for <span className="font-bold text-gray-800">@{confirmModal.user.username}</span>?</>
                    }
                 </p>
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setConfirmModal({ isOpen: false, type: null, user: null })}
                   className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                   disabled={isSubmitting}
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={confirmAction}
                   disabled={isSubmitting}
                   className={`flex-1 py-3.5 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex justify-center items-center ${
                      confirmModal.type === 'reset_password' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' :
                      confirmModal.user.status === 'Active' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                   }`}
                 >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Confirm</>}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Password Result Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-10 transform scale-100 transition-all text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Secret Generated</h3>
              <p className="text-gray-500 text-sm mb-8">
                 A one-time temporary password is ready for <strong>{passwordModal.username}</strong>.
              </p>
              
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-5 mb-8 group relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Temporary Secret</p>
                 <div className="flex items-center justify-center gap-4">
                    <code className="text-2xl font-mono font-black text-indigo-600 tracking-tighter selection:bg-indigo-100">{passwordModal.password}</code>
                    <button 
                      onClick={copyPassword}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-indigo-100 shadow-sm"
                      title="Copy to Clipboard"
                    >
                       <Copy size={20} />
                    </button>
                 </div>
              </div>

              <button 
                onClick={() => setPasswordModal({ isOpen: false, password: '', username: '' })}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95"
              >
                 Close & Secure
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default ManageLogins;
