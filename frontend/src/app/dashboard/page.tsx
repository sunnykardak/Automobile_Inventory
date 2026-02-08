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

    fetchDashboardData();
  }, [isAuthenticated]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
      color: 'blue',
    },
    {
      title: 'Pending Jobs',
      value: overview.pendingJobs,
      icon: AlertTriangle,
      color: 'yellow',
    },
    {
      title: 'Completed Today',
      value: overview.completedJobsToday,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: "Today's Revenue",
      value: `₹${overview.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'indigo',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${overview.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'purple',
    },
    {
      title: 'Low Stock Alerts',
      value: overview.lowStockItems,
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  const colorClasses: any = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${colorClasses[stat.color]}`}
                >
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Used Parts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Used Spare Parts (Last 30 Days)
          </h2>
          <div className="space-y-3">
            {data?.topUsedParts && data.topUsedParts.length > 0 ? (
              data.topUsedParts.slice(0, 5).map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{part.name}</p>
                    <p className="text-sm text-gray-500">{part.manufacturer}</p>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">
                    {part.total_used}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Top Mechanics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Mechanics (Last 30 Days)
          </h2>
          <div className="space-y-3">
            {data?.topMechanics && data.topMechanics.length > 0 ? (
              data.topMechanics.slice(0, 5).map((mechanic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {mechanic.first_name} {mechanic.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mechanic.jobs_completed} jobs completed
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    ₹{parseFloat(mechanic.total_commission || 0).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/dashboard/jobs/create')}
            className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            + New Job Card
          </button>
          <button
            onClick={() => router.push('/dashboard/inventory')}
            className="p-4 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
          >
            View Inventory
          </button>
          <button
            onClick={() => router.push('/dashboard/jobs')}
            className="p-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold"
          >
            Active Jobs
          </button>
          <button
            onClick={() => router.push('/dashboard/reports')}
            className="p-4 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold"
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
