'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Trophy, Users, DollarSign, Wrench, Download } from 'lucide-react';

interface MechanicPerformance {
  mechanic_id: number;
  mechanic_name: string;
  designation: string;
  commission_percentage: number;
  is_active: boolean;
  date_of_joining: string;
  total_jobs_assigned: number;
  jobs_completed: number;
  jobs_in_progress: number;
  jobs_pending: number;
  completion_rate_percentage: number;
  total_revenue_generated: number;
  avg_job_value: number;
  total_estimated_cost: number;
  total_actual_cost: number;
  cost_efficiency_percentage: number;
  avg_completion_days: number;
  total_commission_earned: number;
  commission_paid: number;
  commission_pending: number;
  days_present_last_30: number;
  days_absent_last_30: number;
  last_job_completed_at: string;
  jobs_last_7_days: number;
  jobs_last_30_days: number;
  jobs_without_rework: number;
  employee_since: string;
}

export default function PerformancePage() {
  const [mechanics, setMechanics] = useState<MechanicPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof MechanicPerformance>('total_revenue_generated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [leaderboardMetric, setLeaderboardMetric] = useState<'revenue' | 'jobs' | 'efficiency' | 'speed'>('revenue');

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5001/api/v1/employees/performance/overview?sortBy=${sortBy}&order=${sortOrder}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();
      setMechanics(data.data || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const downloadReport = () => {
    const csv = convertToCSV(mechanics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mechanic-performance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: MechanicPerformance[]) => {
    const headers = [
      'Mechanic Name', 'Designation', 'Total Jobs', 'Completed', 'In Progress', 'Pending',
      'Completion Rate %', 'Total Revenue', 'Avg Value/Job', 'Total Commission',
      'Commission Paid', 'Commission Pending', 'Days Present (30d)', 'Days Absent (30d)', 
      'Avg Completion Days'
    ];
    
    const rows = data.map(m => [
      m.mechanic_name,
      m.designation,
      m.total_jobs_assigned,
      m.jobs_completed,
      m.jobs_in_progress,
      m.jobs_pending,
      (Number(m.completion_rate_percentage) || 0).toFixed(1),
      (Number(m.total_revenue_generated) || 0).toFixed(2),
      (Number(m.avg_job_value) || 0).toFixed(2),
      (Number(m.total_commission_earned) || 0).toFixed(2),
      (Number(m.commission_paid) || 0).toFixed(2),
      (Number(m.commission_pending) || 0).toFixed(2),
      m.days_present_last_30,
      m.days_absent_last_30,
      (Number(m.avg_completion_days) || 0).toFixed(1)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleSort = (column: keyof MechanicPerformance) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTopPerformers = () => {
    const sorted = [...mechanics].sort((a, b) => {
      switch (leaderboardMetric) {
        case 'revenue':
          return b.total_revenue_generated - a.total_revenue_generated;
        case 'jobs':
          return b.jobs_completed - a.jobs_completed;
        case 'efficiency':
          return b.completion_rate_percentage - a.completion_rate_percentage;
        case 'speed':
          return a.avg_completion_days - b.avg_completion_days;
        default:
          return 0;
      }
    });
    return sorted.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  const avgStats = mechanics.length > 0 ? {
    avgCompletionRate: (mechanics.reduce((sum, m) => sum + (Number(m.completion_rate_percentage) || 0), 0) / mechanics.length).toFixed(1),
    totalRevenue: mechanics.reduce((sum, m) => sum + (Number(m.total_revenue_generated) || 0), 0).toFixed(2),
    totalJobs: mechanics.reduce((sum, m) => sum + (Number(m.total_jobs_assigned) || 0), 0),
    avgAttendance: (mechanics.reduce((sum, m) => sum + (((Number(m.days_present_last_30) || 0) / 30) * 100), 0) / mechanics.length).toFixed(1),
  } : { avgCompletionRate: '0', totalRevenue: '0', totalJobs: 0, avgAttendance: '0' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mechanic Performance</h1>
          <p className="mt-1 text-gray-600">Track and analyze mechanic productivity</p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{avgStats.totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{avgStats.avgCompletionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{avgStats.totalRevenue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{avgStats.avgAttendance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Leaderboard */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">🏆 Top Performers</h2>
            <div className="flex space-x-2">
              {(['revenue', 'jobs', 'efficiency', 'speed'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setLeaderboardMetric(metric)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    leaderboardMetric === metric
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {getTopPerformers().map((mechanic, index) => (
              <div
                key={mechanic.mechanic_id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{mechanic.mechanic_name}</p>
                    <p className="text-sm text-gray-600">
                      {leaderboardMetric === 'revenue' && `₹${(Number(mechanic.total_revenue_generated) || 0).toFixed(2)} revenue`}
                      {leaderboardMetric === 'jobs' && `${mechanic.jobs_completed} jobs completed`}
                      {leaderboardMetric === 'efficiency' && `${(Number(mechanic.completion_rate_percentage) || 0).toFixed(1)}% completion rate`}
                      {leaderboardMetric === 'speed' && `${(Number(mechanic.avg_completion_days) || 0).toFixed(1)} days avg`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{mechanic.total_jobs_assigned} total jobs</p>
                  <p className="text-xs text-gray-500">{(((Number(mechanic.days_present_last_30) || 0) / 30) * 100).toFixed(1)}% attendance</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Detailed Performance Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('mechanic_name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Mechanic {sortBy === 'mechanic_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('total_jobs_assigned')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Jobs {sortBy === 'total_jobs_assigned' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('completion_rate_percentage')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Completion Rate {sortBy === 'completion_rate_percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('total_revenue_generated')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Revenue {sortBy === 'total_revenue_generated' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('avg_job_value')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Avg/Job {sortBy === 'avg_job_value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('commission_pending')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Commission Pending {sortBy === 'commission_pending' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('days_present_last_30')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Attendance {sortBy === 'days_present_last_30' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('avg_completion_days')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Avg Days {sortBy === 'avg_completion_days' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mechanics.map((mechanic) => (
                <tr key={mechanic.mechanic_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{mechanic.mechanic_name}</div>
                    <div className="text-sm text-gray-500">
                      {mechanic.jobs_completed} completed / {mechanic.jobs_pending} pending
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mechanic.total_jobs_assigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPerformanceColor(Number(mechanic.completion_rate_percentage) || 0)}`}>
                      {(Number(mechanic.completion_rate_percentage) || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{(Number(mechanic.total_revenue_generated) || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{(Number(mechanic.avg_job_value) || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{(Number(mechanic.commission_pending) || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      Paid: ₹{(Number(mechanic.commission_paid) || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPerformanceColor(((Number(mechanic.days_present_last_30) || 0) / 30) * 100)}`}>
                      {mechanic.days_present_last_30}/30 days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(Number(mechanic.avg_completion_days) || 0).toFixed(1)} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
