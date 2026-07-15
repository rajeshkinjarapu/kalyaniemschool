import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Save, School, CalendarDays, Users, Edit, Trash2, Plus, Search, Shield, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'users'>('system');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // System Settings States
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [currentYear, setCurrentYear] = useState('2024-2025');

  // Users Management States
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // User Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('ADMIN');
  const [formPhone, setFormPhone] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const fetchSettings = async () => {
    try {
      const res: any = await api.get('/api/settings');
      const settings = res.data;
      if (settings) {
        setSchoolName(settings.schoolName);
        setAddress(settings.address || '');
        setPhone(settings.phone || '');
        setEmail(settings.email || '');
        setWebsite(settings.website || '');
        setCurrentYear(settings.currentYear || '2024-2025');
      }
    } catch (e) {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res: any = await api.get('/api/users', {
        params: {
          page: usersPage,
          limit: 6,
          search: userSearch,
          role: userRoleFilter,
        },
      });
      setUsers(res.data.data || res.data || []);
      setTotalUsers(res.data.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users directory');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, usersPage, userRoleFilter]);

  // Debounced user search
  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = setTimeout(() => {
      setUsersPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/api/settings', {
        schoolName,
        address,
        phone,
        email,
        website,
        currentYear,
      });
      toast.success('System settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('ADMIN');
    setFormPhone('');
    setShowModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(''); // blank to keep current
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setShowModal(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const payload: any = {
        name: formName,
        email: formEmail,
        role: formRole,
        phone: formPhone || null,
      };
      if (formPassword) payload.password = formPassword;

      if (selectedUser) {
        // Edit User
        await api.put(`/api/users/${selectedUser.id}`, payload);
        toast.success('User updated successfully!');
      } else {
        // Create User
        if (!formPassword) {
          toast.error('Password is required for new user account');
          setIsSavingUser(false);
          return;
        }
        await api.post('/api/users', payload);
        toast.success('New user account registered successfully!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error saving user details');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user account?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success('User account deactivated successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user');
    }
  };

  if (loadingSettings) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('system')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          System Configurations
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Roles & Users Control
        </button>
      </div>

      {activeTab === 'system' ? (
        <div className="card p-6 space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Branding & System Configuration</h2>
            <p className="text-xs text-gray-400">Configure global metadata tags and default academic session years.</p>
          </div>

          <form onSubmit={handleSystemSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="label">School Branding Name</label>
                <div className="relative">
                  <School className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Springfield High"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="input pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="label">Default Academic Session Year</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(e.target.value)}
                    className="input pl-11"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Office Telephone</label>
                  <input
                    type="text"
                    placeholder="+91-9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Office Email</label>
                  <input
                    type="email"
                    placeholder="admin@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Branding Website URL</label>
                <input
                  type="text"
                  placeholder="https://school.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Physical Address</label>
                <textarea
                  rows={3}
                  placeholder="Location details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Saving Configurations...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or Email ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input pl-10 py-3"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
              <button
                onClick={handleOpenCreateModal}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Create User</span>
              </button>
            </div>
          </div>

          {/* User Table list */}
          {loadingUsers ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">User Login ID (Email/StudentID)</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? 'danger' : 'info'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              user.isActive
                                ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 cursor-pointer"
                              title="Edit Credentials"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={!user.isActive}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer disabled:opacity-30"
                              title="Deactivate Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalUsers > 6 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                  <button
                    disabled={usersPage === 1}
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {usersPage} of {Math.ceil(totalUsers / 6)}
                  </span>
                  <button
                    disabled={usersPage * 6 >= totalUsers}
                    onClick={() => setUsersPage(p => p + 1)}
                    className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-6 animate-scale-in z-10 bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedUser ? 'Edit User Credentials & Role' : 'Create Staff/User Account'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Configure profile data, roles, login credentials, and passcode keys.
              </p>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input text-sm"
                  placeholder="e.g. Principal John Doe"
                />
              </div>

              <div>
                <label className="label">User Login ID (Email or Student ID)</label>
                <input
                  type="text"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="input text-sm"
                  placeholder="e.g. principal@school.com or JY26-0001"
                />
              </div>

              <div>
                <label className="label">
                  Password {selectedUser && '(Leave blank to keep unchanged)'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required={!selectedUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="input pl-10 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="label">Security Role Group</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="input pl-10 text-sm"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Phone (Optional)</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="input text-sm"
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingUser ? 'Saving...' : 'Save User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
