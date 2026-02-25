'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Package,
  AlertCircle,
  Download,
  RefreshCw,
  XCircle,
  Clock,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Alert {
  id: number;
  barcode: string;
  product_name: string;
  brand: string;
  manufacturer: string;
  category: string;
  alert_type: string;
  severity: string;
  current_quantity: number;
  minimum_stock_level: number;
  unit_price: number;
  selling_price: number;
  supplier_name: string | null;
  alert_message: string;
  days_indicator: number | null;
  last_restocked_date: string | null;
}

interface AlertStats {
  total_alerts: number;
  critical_alerts: number;
  out_of_stock_count: number;
  low_stock_count: number;
  fast_moving_low_count: number;
  dead_stock_count: number;
  dead_stock_value: number;
}

interface PurchaseSuggestion {
  inventory_id: number;
  barcode: string;
  product_name: string;
  brand: string;
  manufacturer: string;
  category: string;
  current_quantity: number;
  minimum_stock_level: number;
  unit_price: number;
  supplier_name: string;
  avg_daily_sales: number;
  qty_sold_last_30days: number;
  recommended_order_quantity: number;
  quantity_to_order: number;
  estimated_cost: number;
  priority: string;
  days_of_stock_remaining: number;
  last_restocked_date: string | null;
}

export default function InventoryAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showPurchaseOrders, setShowPurchaseOrders] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch alert statistics
      const statsRes = await fetch(`${baseURL}/api/v1/inventory/alerts/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Fetch alerts
      const alertType = activeTab === 'all' ? '' : activeTab.toUpperCase().replace(/-/g, '_');
      const alertsRes = await fetch(
        `${baseURL}/api/v1/inventory/alerts${alertType ? `?alertType=${alertType}` : ''}`,
        { headers }
      );
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.data);
      }

      // Fetch purchase suggestions if viewing that tab
      if (showPurchaseOrders) {
        const purchaseRes = await fetch(`${baseURL}/api/v1/inventory/alerts/purchase-suggestions`, { headers });
        if (purchaseRes.ok) {
          const purchaseData = await purchaseRes.json();
          setPurchaseSuggestions(purchaseData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, showPurchaseOrders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'OUT_OF_STOCK':
        return <XCircle className="w-5 h-5" />;
      case 'LOW_STOCK':
        return <AlertCircle className="w-5 h-5" />;
      case 'FAST_MOVING_LOW':
        return <TrendingUp className="w-5 h-5" />;
      case 'DEAD_STOCK':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels: { [key: string]: string } = {
      'OUT_OF_STOCK': 'Out of Stock',
      'LOW_STOCK': 'Low Stock',
      'FAST_MOVING_LOW': 'Fast Moving - Low',
      'DEAD_STOCK': 'Dead Stock',
    };
    return labels[alertType] || alertType;
  };

  const getPriorityColor = (priority: string) => {
    if (priority.includes('URGENT')) return 'bg-red-100 text-red-800';
    if (priority.includes('HIGH')) return 'bg-orange-100 text-orange-800';
    if (priority.includes('MEDIUM')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const downloadPurchaseOrder = () => {
    const headers = ['Product Name', 'Brand', 'Supplier', 'Current Qty', 'Order Qty', 'Unit Price', 'Total Cost', 'Priority'];
    const rows = purchaseSuggestions.map(item => [
      item.product_name,
      item.brand || '',
      item.supplier_name,
      item.current_quantity,
      item.quantity_to_order,
      item.unit_price.toFixed(2),
      item.estimated_cost.toFixed(2),
      item.priority
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-order-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Inventory Alerts</h1>
          <p className="mt-1 text-gray-600">Monitor stock levels and get intelligent recommendations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/inventory/alerts/rules')}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Rules
          </button>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.critical_alerts}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.low_stock_count}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fast Moving - Low</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.fast_moving_low_count}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dead Stock</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.dead_stock_count}</p>
                <p className="text-xs text-gray-500 mt-1">₹{Number(stats.dead_stock_value || 0).toFixed(2)} value</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex bg-white border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setShowPurchaseOrders(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !showPurchaseOrders ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setShowPurchaseOrders(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              showPurchaseOrders ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Purchase Orders
          </button>
        </div>
      </div>

      {/* Purchase Orders View */}
      {showPurchaseOrders ? (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Purchase Order Suggestions</h2>
            <button
              onClick={downloadPurchaseOrder}
              disabled={purchaseSuggestions.length === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseSuggestions.map((item) => (
                  <tr key={item.inventory_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.brand} • {item.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.supplier_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.current_quantity}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-blue-600">{item.quantity_to_order}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{Number(item.unit_price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{Number(item.estimated_cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.days_of_stock_remaining < 999 ? `${Math.round(item.days_of_stock_remaining)} days` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {purchaseSuggestions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No purchase orders needed at this time
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Alert Type Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { id: 'all', label: 'All Alerts', count: stats?.total_alerts || 0 },
                  { id: 'out-of-stock', label: 'Out of Stock', count: stats?.out_of_stock_count || 0 },
                  { id: 'low-stock', label: 'Low Stock', count: stats?.low_stock_count || 0 },
                  { id: 'fast-moving-low', label: 'Fast Moving', count: stats?.fast_moving_low_count || 0 },
                  { id: 'dead-stock', label: 'Dead Stock', count: stats?.dead_stock_count || 0 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Alerts Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={`${alert.id}-${alert.alert_type}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alert.product_name}</div>
                          <div className="text-sm text-gray-500">{alert.brand} • {alert.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getAlertTypeIcon(alert.alert_type)}
                          <span className="text-sm text-gray-900">{getAlertTypeLabel(alert.alert_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${alert.current_quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {alert.current_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{alert.minimum_stock_level}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">{alert.alert_message}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {alert.supplier_name || <span className="text-gray-400 italic">No supplier</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {alerts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No alerts to display
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
