'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart2, TrendingUp, TrendingDown, IndianRupee, Package,
  Users, Car, Calendar, Download, Filter, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Wrench,
} from 'lucide-react';

interface RevenueData {
  date: string;
  total_revenue: number;
  total_bills: number;
  collected_amount: number;
  pending_amount: number;
}

interface InventoryUsage {
  product_name: string;
  brand: string;
  total_quantity_used: number;
  total_value: number;
}

interface EmployeePerformance {
  employee_name: string;
  designation: string;
  total_jobs_completed: number;
  total_commission_earned: number;
}

interface VehicleStats {
  vehicle_brand: string;
  vehicle_model: string;
  total_services: number;
}

interface LowStockItem {
  id: number;
  product_name: string;
  brand: string;
  current_quantity: number;
  minimum_stock_level: number;
}

export default function ReportsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  // Report data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsage[]>([]);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Summary stats
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalJobs: 0,
    avgJobValue: 0,
    totalParts: 0,
    collectedAmount: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    if (token) {
      fetchAllReports();
    }
  }, [token, dateRange, reportType]);

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const fetchAllReports = async () => {
    setLoading(true);
    await Promise.all([
      fetchRevenueReport(),
      fetchInventoryUsage(),
      fetchEmployeePerformance(),
      fetchVehicleStats(),
      fetchLowStock(),
    ]);
    setLoading(false);
  };

  const fetchRevenueReport = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/revenue`,
        {
          headers: getAuthHeader(),
          params: { ...dateRange, type: reportType },
        }
      );
      if (response.data.success) {
        const data = response.data.data;
        setRevenueData(data);
        
        // Calculate summary
        const totalRevenue = data.reduce((sum: number, d: RevenueData) => sum + Number(d.total_revenue || 0), 0);
        const totalJobs = data.reduce((sum: number, d: RevenueData) => sum + Number(d.total_bills || 0), 0);
        const collectedAmount = data.reduce((sum: number, d: RevenueData) => sum + Number(d.collected_amount || 0), 0);
        const pendingAmount = data.reduce((sum: number, d: RevenueData) => sum + Number(d.pending_amount || 0), 0);
        
        setSummary(prev => ({
          ...prev,
          totalRevenue,
          totalJobs,
          avgJobValue: totalJobs > 0 ? totalRevenue / totalJobs : 0,
          collectedAmount,
          pendingAmount,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    }
  };

  const fetchInventoryUsage = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/inventory-usage`,
        {
          headers: getAuthHeader(),
          params: dateRange,
        }
      );
      if (response.data.success) {
        setInventoryUsage(response.data.data);
        const totalParts = response.data.data.reduce((sum: number, d: InventoryUsage) => sum + Number(d.total_quantity_used || 0), 0);
        setSummary(prev => ({ ...prev, totalParts }));
      }
    } catch (error) {
      console.error('Failed to fetch inventory usage:', error);
    }
  };

  const fetchEmployeePerformance = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/employee-performance`,
        {
          headers: getAuthHeader(),
          params: dateRange,
        }
      );
      if (response.data.success) {
        setEmployeePerformance(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employee performance:', error);
    }
  };

  const fetchVehicleStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/vehicle-stats`,
        {
          headers: getAuthHeader(),
          params: dateRange,
        }
      );
      if (response.data.success) {
        setVehicleStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle stats:', error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/alerts/low-stock`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setLowStockItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch low stock:', error);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${dateRange.startDate}_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Reports & Analysis</h1>
          <p className="text-gray-600 mt-1">Comprehensive business insights and analytics</p>
        </div>
        <button
          onClick={fetchAllReports}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="label">Report Type</label>
            <select
              className="select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            onClick={() => {
              const today = new Date();
              setDateRange({
                startDate: new Date(today.setDate(1)).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              });
            }}
            className="btn-secondary"
          >
            This Month
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
              <Wrench className="text-brand-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Jobs</p>
              <p className="text-lg font-bold text-gray-900">{summary.totalJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Job Value</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.avgJobValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Package className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Parts Used</p>
              <p className="text-lg font-bold text-gray-900">{summary.totalParts}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Collected</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.collectedAmount)}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.pendingAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Report */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 size={20} className="text-emerald-600" />
              Revenue Report
            </h3>
            <button
              onClick={() => handleExportCSV(revenueData, 'revenue_report')}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
            ) : revenueData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue data for selected period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-right">Bills</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="text-right">{item.total_bills}</td>
                        <td className="text-right text-emerald-600 font-medium">{formatCurrency(Number(item.total_revenue))}</td>
                        <td className="text-right">{formatCurrency(Number(item.collected_amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Usage */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package size={20} className="text-amber-600" />
              Top Used Parts
            </h3>
            <button
              onClick={() => handleExportCSV(inventoryUsage, 'inventory_usage')}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
            ) : inventoryUsage.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No inventory usage data</p>
            ) : (
              <div className="space-y-3">
                {inventoryUsage.slice(0, 8).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">{item.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.total_quantity_used} units</p>
                      <p className="text-sm text-emerald-600">{formatCurrency(Number(item.total_value))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Employee Performance */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-brand-600" />
              Employee Performance
            </h3>
            <button
              onClick={() => handleExportCSV(employeePerformance, 'employee_performance')}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
            ) : employeePerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No performance data</p>
            ) : (
              <div className="space-y-3">
                {employeePerformance.slice(0, 8).map((emp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-brand-800 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {emp.employee_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emp.employee_name}</p>
                        <p className="text-sm text-gray-500">{emp.designation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{emp.total_jobs_completed} jobs</p>
                      <p className="text-sm text-emerald-600">{formatCurrency(Number(emp.total_commission_earned))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Serviced Vehicles */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Car size={20} className="text-purple-600" />
              Most Serviced Vehicles
            </h3>
            <button
              onClick={() => handleExportCSV(vehicleStats, 'vehicle_stats')}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
            ) : vehicleStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No vehicle data</p>
            ) : (
              <div className="space-y-3">
                {vehicleStats.slice(0, 8).map((vehicle, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Car className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.vehicle_brand}</p>
                        <p className="text-sm text-gray-500">{vehicle.vehicle_model || 'Various models'}</p>
                      </div>
                    </div>
                    <span className="badge badge-primary">{vehicle.total_services} services</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            Low Stock Alerts
          </h3>
          <span className="badge badge-danger">{lowStockItems.length} items</span>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-2 text-gray-600">All items are well stocked!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">{item.brand}</p>
                    </div>
                    <AlertTriangle className="text-red-500" size={20} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current: <strong className="text-red-600">{item.current_quantity}</strong></span>
                    <span className="text-sm text-gray-600">Min: {item.minimum_stock_level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
