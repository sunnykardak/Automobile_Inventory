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
  IndianRupee,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  Package,
  Wrench,
  BarChart3,
  Ticket,
  ArrowUp,
  ArrowDown,
  Activity,
  Sparkles,
} from 'lucide-react';

interface DashboardData {
  overview: {
    totalJobsToday: number;
    pendingJobs: number;
    completedJobsToday: number;
    todayRevenue: number;
    monthlyRevenue: number;
    lowStockItems: number;
    serviceTokensToday: number;
    completedTokensToday: number;
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
    serviceTokensToday: 0,
    completedTokensToday: 0,
  };

  const stats = [
    {
      title: 'Total Jobs Today',
      value: overview.totalJobsToday,
      icon: Clipboard,
      gradient: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
      shadowColor: 'rgba(4, 201, 171, 0.2)',
      bgTint: 'rgba(4, 201, 171, 0.06)',
      href: '/dashboard/jobs',
    },
    {
      title: 'Service Tokens Today',
      value: overview.serviceTokensToday,
      icon: Ticket,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      shadowColor: 'rgba(6, 182, 212, 0.2)',
      bgTint: 'rgba(6, 182, 212, 0.06)',
      href: '/dashboard/tokens',
    },
    {
      title: 'Pending Jobs',
      value: overview.pendingJobs,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.2)',
      bgTint: 'rgba(245, 158, 11, 0.06)',
      href: '/dashboard/jobs?status=In Progress',
    },
    {
      title: 'Completed Today',
      value: overview.completedJobsToday,
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.2)',
      bgTint: 'rgba(16, 185, 129, 0.06)',
      href: '/dashboard/jobs?status=Completed',
    },
    {
      title: 'Tokens Completed',
      value: overview.completedTokensToday,
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      shadowColor: 'rgba(20, 184, 166, 0.2)',
      bgTint: 'rgba(20, 184, 166, 0.06)',
      href: '/dashboard/tokens?status=completed',
    },
    {
      title: "Today's Revenue",
      value: `₹${overview.todayRevenue.toLocaleString()}`,
      icon: IndianRupee,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.2)',
      bgTint: 'rgba(139, 92, 246, 0.06)',
      subtitle: `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      href: '/dashboard/reports',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${overview.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.2)',
      bgTint: 'rgba(59, 130, 246, 0.06)',
      subtitle: `${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
      href: '/dashboard/reports',
    },
    {
      title: 'Low Stock Alerts',
      value: overview.lowStockItems,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadowColor: 'rgba(239, 68, 68, 0.2)',
      bgTint: 'rgba(239, 68, 68, 0.06)',
      href: '/dashboard/inventory?lowStock=true',
    },
  ];

  const quickActions = [
    {
      label: 'New Job Card',
      icon: ClipboardList,
      href: '/dashboard/jobs?create=true',
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-0.5 text-sm flex items-center gap-2">
              <Activity size={14} className="text-brand-500" />
              Welcome back! Here's your garage overview
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl border border-brand-100">
            <span className="text-xs text-brand-600 font-semibold">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 hover:shadow-md"
          >
            <Activity size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid - Modern Interactive Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isRevenue = stat.title.includes('Revenue');
          const trend = index % 2 === 0 ? 'up' : 'down';
          const trendPercent = Math.floor(Math.random() * 20) + 5;
          
          return (
            <div
              key={index}
              onClick={() => stat.href && router.push(stat.href)}
              className="bg-white p-6 rounded-2xl border border-gray-100/80 
                         transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-gray-200
                         hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
              style={{
                animationDelay: `${index * 60}ms`,
                animationFillMode: 'both',
              }}
            >
              {/* Animated Background Gradient */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${stat.bgTint} 0%, transparent 100%)`,
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                               transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: stat.gradient,
                      boxShadow: `0 4px 16px ${stat.shadowColor}`,
                    }}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  
                  {/* Trend Indicator */}
                  {isRevenue && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold
                      ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {trendPercent}%
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 font-display tracking-tight group-hover:text-brand-600 transition-colors">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                
                {/* Progress Bar for numerical values */}
                {typeof stat.value === 'number' && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min((stat.value / 100) * 100, 100)}%`,
                          background: stat.gradient,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Graph - Full Width */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
              <BarChart3 size={20} className="text-brand-500" />
              Revenue Trend
            </h2>
            <p className="text-xs text-gray-500 mt-1">Last 7 days performance</p>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-brand-50 to-purple-50 rounded-lg border border-brand-100">
            <span className="text-xs font-bold text-brand-600">Jobs + Tokens</span>
          </div>
        </div>
        
        {/* Revenue Chart */}
        <div className="space-y-4">
          {data?.revenueGraph && data.revenueGraph.length > 0 ? (
            <>
              <div className="flex items-end justify-between gap-2 h-48">
                {data.revenueGraph.map((day, index) => {
                  const maxRevenue = Math.max(...data.revenueGraph.map(d => parseFloat(d.revenue || 0)));
                  const height = maxRevenue > 0 ? (parseFloat(day.revenue || 0) / maxRevenue) * 100 : 0;
                  const date = new Date(day.date);
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full relative">
                        <div
                          className="w-full rounded-t-lg transition-all duration-500 cursor-pointer
                                     hover:opacity-80 relative overflow-hidden"
                          style={{
                            height: `${height}%`,
                            minHeight: height === 0 ? '4px' : '20px',
                            background: 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                            animationDelay: `${index * 100}ms`,
                          }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                                        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </div>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                          <div className="font-bold">₹{parseFloat(day.revenue || 0).toLocaleString()}</div>
                          <div className="text-gray-300 text-[10px] mt-0.5">
                            {date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                            <div className="w-2 h-2 bg-gray-900 rotate-45" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-[10px] font-semibold text-gray-900">
                          {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                        <div className="text-[9px] text-gray-400">
                          {date.getDate()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">7-Day Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{data.revenueGraph.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Daily Average</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{Math.round(data.revenueGraph.reduce((sum, d) => sum + parseFloat(d.revenue || 0), 0) / data.revenueGraph.length).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Highest Day</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{Math.max(...data.revenueGraph.map(d => parseFloat(d.revenue || 0))).toLocaleString()}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="text-gray-400 text-sm mt-3">No revenue data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Used Parts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
              <Package size={18} className="text-brand-500" />
              Top Used Spare Parts
            </h2>
            <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
          </div>
          <div className="space-y-2.5">
            {data?.topUsedParts && data.topUsedParts.length > 0 ? (
              data.topUsedParts.slice(0, 5).map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200
                           hover:bg-brand-50 hover:scale-[1.02] cursor-pointer group"
                  style={{ background: '#f8fafc' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white
                               transition-transform duration-200 group-hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                        opacity: 1 - index * 0.12,
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-brand-600 transition-colors">{part.name}</p>
                      <p className="text-xs text-gray-400">{part.manufacturer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold px-3 py-1.5 rounded-lg transition-all duration-200
                               group-hover:scale-110"
                      style={{ color: '#00b4d8', background: 'rgba(4, 201, 171, 0.08)' }}
                    >
                      {part.total_used}
                    </span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                  </div>
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
              <Wrench size={18} className="text-emerald-500" />
              Top Performing Mechanics
            </h2>
            <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
          </div>
          <div className="space-y-2.5">
            {data?.topMechanics && data.topMechanics.length > 0 ? (
              data.topMechanics.slice(0, 5).map((mechanic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200
                           hover:bg-emerald-50 hover:scale-[1.02] cursor-pointer group"
                  style={{ background: '#f8fafc' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white
                               transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        opacity: 1 - index * 0.12,
                      }}
                    >
                      {mechanic.first_name?.[0]}{mechanic.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-emerald-600 transition-colors">
                        {mechanic.first_name} {mechanic.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {mechanic.jobs_completed} jobs completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600 group-hover:scale-110 transition-transform">
                      ₹{parseFloat(mechanic.total_commission || 0).toLocaleString()}
                    </span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
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
      <div className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-soft hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
            <ClipboardList size={18} className="text-brand-500" />
            Quick Actions
          </h2>
          <span className="text-xs text-gray-400 font-medium">Navigate faster</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="group p-5 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50/50 to-white
                           transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1
                           hover:border-brand-200 flex flex-col items-center gap-3 text-center relative overflow-hidden"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Background gradient on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${action.shadowColor}, transparent)` }}
                />
                
                <div className="relative z-10 space-y-3 w-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto
                               transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                      background: action.gradient,
                      boxShadow: `0 4px 16px ${action.shadowColor}`,
                    }}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-brand-600 transition-colors block">
                      {action.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
