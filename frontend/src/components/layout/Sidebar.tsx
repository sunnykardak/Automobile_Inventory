'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Clipboard,
  Package,
  Users,
  BarChart2,
  User,
  HelpCircle,
  X,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Tasks / Jobs', href: '/dashboard/jobs', icon: Clipboard },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart2 },
  { name: 'My Account', href: '/dashboard/account', icon: User },
  { name: 'Help & Support', href: '/dashboard/help', icon: HelpCircle },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-sidebar-bg text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h1 className="text-xl font-bold">
              {process.env.NEXT_PUBLIC_GARAGE_NAME || 'Auto Garage'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Inventory System</p>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center">
            <p>Version 1.0.0</p>
            <p className="mt-1">© 2026 Auto Garage</p>
          </div>
        </div>
      </aside>
    </>
  );
}
