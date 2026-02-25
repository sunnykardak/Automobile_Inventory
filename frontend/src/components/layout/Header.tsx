'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu, Search, Bell, User, Settings, LogOut, X, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
    }
  };

  const notifications = [
    { id: 1, title: 'Low stock alert', message: 'Engine Oil running low', time: '5 min ago', unread: true },
    { id: 2, title: 'Job completed', message: 'Job #1234 has been completed', time: '1 hour ago', unread: true },
    { id: 3, title: 'New job assigned', message: 'You have a new job assignment', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search jobs, vehicles, products..."
                className="pl-10 pr-4 py-2.5 w-80 lg:w-96 rounded-xl text-sm
                  bg-gray-50/80 border border-gray-200/60
                  focus:ring-0 focus:border-brand-500 focus:bg-white 
                  transition-all text-gray-800 placeholder-gray-400"
                style={{ outline: 'none' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#00b4d8';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 180, 216, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={18} />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <div ref={notificationRef} className="relative">
            <button
              className="relative p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span 
                  className="absolute top-1.5 right-1.5 w-4.5 h-4.5 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  style={{ 
                    background: '#ef4444',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="dropdown-menu w-80 right-0 mt-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <span className="text-xs font-medium" style={{ color: '#00b4d8' }}>
                      {unreadCount} new
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${
                        notif.unread ? 'bg-brand-50/30' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: notif.unread ? '#00b4d8' : '#d1d5db' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100">
                  <button
                    className="text-xs font-semibold w-full text-center py-1"
                    style={{ color: '#00b4d8' }}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1.5" />

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                }}
              >
                <span className="text-white font-semibold text-xs">
                  {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.first_name || user?.username || 'User'}
                </p>
                <p className="text-[11px] text-gray-500">{user?.role_name || 'Employee'}</p>
              </div>
              <ChevronDown
                size={14}
                className={`hidden lg:block text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showProfileMenu && (
              <div className="dropdown-menu w-56">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user?.first_name || user?.username}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    className="dropdown-item w-full rounded-lg"
                    onClick={() => { router.push('/account'); setShowProfileMenu(false); }}
                  >
                    <User size={16} />
                    <span className="text-sm">My Profile</span>
                  </button>
                  <button
                    className="dropdown-item w-full rounded-lg"
                    onClick={() => { router.push('/account'); setShowProfileMenu(false); }}
                  >
                    <Settings size={16} />
                    <span className="text-sm">Settings</span>
                  </button>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    className="dropdown-item w-full rounded-lg text-red-500 hover:!bg-red-50"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3 animate-slide-down">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-10 py-2.5 w-full rounded-xl text-sm
                  bg-gray-50 border border-gray-200
                  text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              >
                <X size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
