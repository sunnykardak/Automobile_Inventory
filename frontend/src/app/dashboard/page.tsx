'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Clipboard,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  Package,
  Wrench,
  BarChart3,
} from 'lucide-react';

interface DashboardData {
  overview: {
    totalJobsToday: number;
    pendingJobs: number;
    completedJobsToday: number;
    todayRevenue: number;
    monthlyRevenue: number;
    lowStockItems: number;
  };
  topUsedParts: any[];
  topMechanics: any[];
  revenueGraph: any[];
  jobsStatus: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (token) {
      fetchDashboardData();
    }
  }, [isAuthenticated, token]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      if (error.response?.status === 401) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner w-10 h-10 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalJobsToday: 0,
    pendingJobs: 0,
    completedJobsToday: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    lowStockItems: 0,
  };

  const stats = [
    {
      title: 'Total Jobs Today',
      value: overview.totalJobsToday,
      icon: Clipboard,
      gradient: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
      shadowColor: 'rgba(4, 201, 171, 0.2)',
      bgTint: 'rgba(4, 201, 171, 0.06)',
    },
    {
      title: 'Pending Jobs',
      value: overview.pendingJobs,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.2)',
      bgTint: 'rgba(245, 158, 11, 0.06)',
    },
    {
      title: 'Completed Today',
      value: overview.completedJobsToday,
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.2)',
      bgTint: 'rgba(16, 185, 129, 0.06)',
    },
    {
      title: "Today's Revenue",
      value: `₹${overview.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.2)',
      bgTint: 'rgba(139, 92, 246, 0.06)',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${overview.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.2)',
      bgTint: 'rgba(59, 130, 246, 0.06)',
    },
    {
      title: 'Low Stock Alerts',
      value: overview.lowStockItems,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadowColor: 'rgba(239, 68, 68, 0.2)',
      bgTint: 'rgba(239, 68, 68, 0.06)',
    },
  ];

  const quickActions = [
    {
      label: 'New Job Card',
      icon: ClipboardList,
      href: '/dashboard/jobs/create',
      gradient: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
      shadowColor: 'rgba(4, 201, 171, 0.25)',
    },
    {
      label: 'View Inventory',
      icon: Package,
      href: '/dashboard/inventory',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.25)',
    },
    {
      label: 'Active Jobs',
      icon: Wrench,
      href: '/dashboard/jobs',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'View Reports',
      icon: BarChart3,
      href: '/dashboard/reports',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      shadowColor: 'rgba(249, 115, 22, 0.25)',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Dashboard</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Welcome back! Here's your garage overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">
            {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid - Parkware Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-5 rounded-2xl border border-gray-100/80 
                         transition-all duration-300 hover:shadow-elevated group"
              style={{
                animationDelay: `${index * 60}ms`,
                animationFillMode: 'both',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 font-display tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                             transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: stat.gradient,
                    boxShadow: `0 4px 12px ${stat.shadowColor}`,
                  }}
                >
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Used Parts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 font-display">
              Top Used Spare Parts
            </h2>
            <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
          </div>
          <div className="space-y-2.5">
            {data?.topUsedParts && data.topUsedParts.length > 0 ? (
              data.topUsedParts.slice(0, 5).map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 rounded-xl transition-colors"
                  style={{ background: '#f8fafc' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                        opacity: 1 - index * 0.12,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{part.name}</p>
                      <p className="text-xs text-gray-400">{part.manufacturer}</p>
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-lg"
                    style={{ color: '#00b4d8', background: 'rgba(4, 201, 171, 0.08)' }}
                  >
                    {part.total_used}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-10 w-10 text-gray-300" />
                <p className="text-gray-400 text-sm mt-3">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Mechanics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 font-display">
              Top Performing Mechanics
            </h2>
            <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
          </div>
          <div className="space-y-2.5">
            {data?.topMechanics && data.topMechanics.length > 0 ? (
              data.topMechanics.slice(0, 5).map((mechanic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 rounded-xl"
                  style={{ background: '#f8fafc' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        opacity: 1 - index * 0.12,
                      }}
                    >
                      {mechanic.first_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {mechanic.first_name} {mechanic.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {mechanic.jobs_completed} jobs completed
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    ₹{parseFloat(mechanic.total_commission || 0).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Wrench className="mx-auto h-10 w-10 text-gray-300" />
                <p className="text-gray-400 text-sm mt-3">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft">
        <h2 className="text-base font-bold text-gray-900 font-display mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="group p-4 rounded-xl border border-gray-100 
                           transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                           flex flex-col items-center gap-3 text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center
                             transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background: action.gradient,
                    boxShadow: `0 4px 12px ${action.shadowColor}`,
                  }}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
