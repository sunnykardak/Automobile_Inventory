'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, ClipboardList, Package, BarChart3,
  User, HelpCircle, X, LogOut, Ticket, Users, Wrench,
  ChevronRight, UserCog,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Cards', href: '/dashboard/jobs', icon: ClipboardList },
  { name: 'Service Tokens', href: '/dashboard/tokens', icon: Ticket },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Employees', href: '/dashboard/employees', icon: UserCog },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'My Account', href: '/dashboard/account', icon: User },
  { name: 'Help & Support', href: '/dashboard/help', icon: HelpCircle },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[270px] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, #023e73 0%, #0077b6 50%, #023e73 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
              }}
            >
              <Wrench className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-display tracking-tight">
                {process.env.NEXT_PUBLIC_GARAGE_NAME || 'Auto Garage'}
              </h1>
              <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: '#89bff8' }}>
                Service Centre
              </p>
            </div>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#89bff8' }}>
            Main Menu
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl
                  transition-all duration-200 group relative text-sm
                  ${isActive
                    ? 'text-white font-medium'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }
                `}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.15) 0%, rgba(0, 180, 216, 0.05) 100%)',
                } : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: '#00b4d8' }}
                  />
                )}
                <Icon
                  size={18}
                  className="flex-shrink-0"
                  style={isActive ? { color: '#00b4d8' } : { color: 'inherit' }}
                />
                <span className={isActive ? 'font-medium' : 'font-normal'}>{item.name}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto" style={{ color: '#89bff8' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="mx-3 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Logout */}
        <div className="px-3 pb-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm"
          >
            <LogOut size={18} />
            <span className="font-normal">Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3">
          <div
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(0, 180, 216, 0.08)' }}
          >
            <p className="text-[11px]" style={{ color: '#89bff8' }}>
              v1.0.0 · © 2026 Auto Garage
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
