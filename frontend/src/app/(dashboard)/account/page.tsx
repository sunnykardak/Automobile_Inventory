'use client';

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Mail, Phone, Shield, Key, Save, Eye, EyeOff,
  Calendar, Clock, Activity, CheckCircle, AlertCircle,
} from 'lucide-react';

export default function AccountPage() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile update form
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setChangingPassword(true);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdatingProfile(true);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        profileForm,
        { headers: getAuthHeader() }
      );
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 font-display">My Account</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-brand-800 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user?.first_name} {user?.last_name || user?.username}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-primary">{user?.role_name || 'User'}</span>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Username</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <User size={18} className="text-gray-400" />
                      {user?.username}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Email</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail size={18} className="text-gray-400" />
                      {user?.email}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Role</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Shield size={18} className="text-gray-400" />
                      {user?.role_name || 'User'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-500">Account Status</label>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-emerald-500" />
                      <span className="text-emerald-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-bold text-gray-900 font-display mb-4">Account Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Dashboard', 'Jobs', 'Inventory', 'Employees', 'Reports', 'Billing'].map((perm) => (
                    <div key={perm} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle size={16} className="text-emerald-500" />
                      <span className="text-sm text-gray-700">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
                  <Key size={20} />
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        className="input pr-10"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        className="input pr-10"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>
                  
                  <div>
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        className="input pr-10"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="btn-primary flex items-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <div className="spinner w-4 h-4"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key size={18} />
                        Change Password
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-bold text-gray-900 font-display mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <span className="badge badge-warning">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Session Management</p>
                      <p className="text-sm text-gray-500">Manage your active sessions</p>
                    </div>
                    <span className="badge badge-warning">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 font-display mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { action: 'Logged in', time: 'Just now', icon: CheckCircle, color: 'text-emerald-500' },
                  { action: 'Changed password', time: '2 days ago', icon: Key, color: 'text-blue-500' },
                  { action: 'Updated profile', time: '1 week ago', icon: User, color: 'text-purple-500' },
                  { action: 'Created job card', time: '1 week ago', icon: Activity, color: 'text-amber-500' },
                  { action: 'Logged in', time: '2 weeks ago', icon: CheckCircle, color: 'text-emerald-500' },
                ].map((activity, idx) => {
                  const Icon = activity.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${activity.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">Showing recent 5 activities</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">
            Once you log out, you will need to log in again to access your account.
          </p>
          <button
            onClick={logout}
            className="btn-danger"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
