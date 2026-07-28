
import React, { useState } from 'react';
import {
  Shield, Plus, Lock, Check, User, Users, MoreHorizontal,
  Trash2, Edit, Save, X, Eye
} from 'lucide-react';
import { SYSTEM_MODULES } from '../../constants';
import { Role, RolePermission } from '../../types';

const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Temporary state for edits
  const [tempRole, setTempRole] = useState<Role | null>(null);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setTempRole(role);
    setIsEditing(false);
  };

  const togglePermission = (moduleName: string, action: keyof RolePermission) => {
    if (!isEditing && !isCreating) return;
    if (action === 'module') return; // Should not happen

    setTempRole(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.module === moduleName ? { ...p, [action]: !p[action] } : p
      )
    }));
  };

  const handleSave = async () => {
    try {
      // Mock API Call: POST/PUT /api/v1/roles
      // const url = isCreating ? '/api/v1/roles' : `/api/v1/roles/${tempRole.id}`;
      // const method = isCreating ? 'POST' : 'PUT';
      // await fetch(url, {
      //   method,
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(tempRole),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      if (isCreating) {
        const newRole = { ...tempRole, id: `ROLE-${Date.now()}`, usersCount: 0, isSystem: false };
        setRoles(prev => [...prev, newRole]);
        setSelectedRole(newRole);
        setIsCreating(false);
      } else {
        setRoles(prev => prev.map(r => r.id === tempRole.id ? tempRole : r));
        setSelectedRole(tempRole);
        setIsEditing(false);
      }
      alert("Role settings saved successfully.");
    } catch (error) {
      console.error("Failed to save role", error);
      alert("Failed to save role settings.");
    }
  };

  const handleCreateNew = () => {
    const newRole: Role = {
      id: 'temp',
      name: 'New Role',
      description: 'Describe the role...',
      usersCount: 0,
      isSystem: false,
      permissions: SYSTEM_MODULES.map(m => ({ module: m, view: false, edit: false, delete: false, export: false }))
    };
    setTempRole(newRole);
    setSelectedRole(newRole); // Just visually select it
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleDelete = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        // Mock API Call: DELETE /api/v1/roles/:id
        // await fetch(`/api/v1/roles/${roleId}`, { method: 'DELETE' });
        await new Promise(resolve => setTimeout(resolve, 300));

        const newRoles = roles.filter(r => r.id !== roleId);
        setRoles(newRoles);
        if (selectedRole?.id === roleId) {
          handleSelectRole(newRoles[0] || null);
        }
        alert("Role deleted.");
      } catch (error) {
        console.error("Failed to delete role", error);
        alert("Failed to delete role.");
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">

      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Roles & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage access levels and control system security.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Create New Role
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">

        {/* Left Sidebar: Role List */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Available Roles</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full text-left p-4 rounded-lg transition-all border ${selectedRole?.id === role.id
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200'
                    : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold ${selectedRole?.id === role.id ? 'text-indigo-800' : 'text-gray-800'}`}>
                    {role.name}
                  </span>
                  {role.isSystem && (
                    <span title="System Role">
                      <Lock size={14} className="text-gray-400" />
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Users size={12} className="mr-1" /> {role.usersCount} Users
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {role.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Permission Matrix */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex-1 mr-4">
              {(isEditing || isCreating) && tempRole ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={tempRole.name}
                    onChange={(e) => setTempRole({ ...tempRole!, name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-indigo-500 outline-none w-full bg-transparent pb-1"
                    placeholder="Role Name"
                  />
                  <input
                    type="text"
                    value={tempRole.description}
                    onChange={(e) => setTempRole({ ...tempRole!, description: e.target.value })}
                    className="text-sm text-gray-500 border-b border-gray-300 focus:border-indigo-500 outline-none w-full bg-transparent pb-1"
                    placeholder="Role Description"
                  />
                </div>
              ) : selectedRole ? (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRole.name}</h2>
                    {selectedRole.isSystem && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded uppercase">System Default</span>
                    )}
                  </div>
                  <p className="text-gray-500">{selectedRole.description}</p>
                </>
              ) : (
                <div className="text-gray-400 italic">Select a role from the left to view and edit its permissions.</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(isEditing || isCreating) && tempRole ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                      setTempRole(selectedRole); // Reset
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium flex items-center"
                  >
                    <X size={16} className="mr-2" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center shadow-sm"
                  >
                    <Save size={16} className="mr-2" /> Save Role
                  </button>
                </>
              ) : selectedRole ? (
                <>
                  <button
                    onClick={() => handleDelete(selectedRole.id)}
                    disabled={selectedRole.isSystem}
                    className={`px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center transition-opacity ${selectedRole.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 size={16} className="mr-2" /> Delete
                  </button>
                  <button
                    onClick={() => { setTempRole(selectedRole); setIsEditing(true); }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-medium flex items-center"
                  >
                    <Edit size={16} className="mr-2" /> Edit Permissions
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Module Access</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">View</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Create / Edit</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Delete</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Export Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(isEditing || isCreating ? tempRole : selectedRole)?.permissions?.map((perm) => (
                    <tr key={perm.module} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-800">{perm.module}</span>
                      </td>
                      {(['view', 'edit', 'delete', 'export'] as const).map(action => (
                        <td key={action} className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <label className={`relative flex items-center justify-center w-5 h-5 rounded border ${(isEditing || isCreating) ? 'cursor-pointer' : 'cursor-default'
                              } ${perm[action]
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'bg-white border-gray-300'
                              }`}>
                              <input
                                type="checkbox"
                                className="opacity-0 absolute inset-0 cursor-pointer"
                                checked={perm[action]}
                                onChange={() => togglePermission(perm.module, action)}
                                disabled={!isEditing && !isCreating}
                              />
                              {perm[action] && <Check size={12} className="text-white" />}
                            </label>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!((isEditing || isCreating ? tempRole : selectedRole)) && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 italic">No role selected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RolesPermissions;
