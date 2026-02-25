'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Receipt,
  Settings,
  TrendingUp,
  Download,
  FileText,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  BarChart3,
  Percent
} from 'lucide-react';

interface GSTRate {
  id: number;
  category_name: string;
  gst_percentage: number;
  cgst_percentage: number;
  sgst_percentage: number;
  igst_percentage: number;
  cess_percentage: number;
  hsn_code: string;
  description: string;
  is_active: boolean;
}

interface TaxConfig {
  [key: string]: {
    value: string;
    description: string;
    updated_at: string;
  };
}

interface DashboardStats {
  current_month: {
    total_invoices: number;
    total_taxable_value: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    total_tax_collected: number;
    tax_growth_percentage: number;
  };
  pending: {
    pending_invoices: number;
    pending_amount: number;
    pending_tax: number;
  };
  transaction_breakdown: Array<{
    transaction_type: string;
    count: number;
    total_value: number;
  }>;
}

interface MonthlySummary {
  month: string;
  month_name: string;
  total_invoices: number;
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_cess: number;
  total_tax: number;
  total_invoice_value: number;
  paid_amount: number;
  pending_amount: number;
}

export default function TaxManagementPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gst-rates' | 'reports' | 'settings'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // GST Rates data
  const [gstRates, setGstRates] = useState<GSTRate[]>([]);
  const [showGSTForm, setShowGSTForm] = useState(false);
  const [editingGST, setEditingGST] = useState<GSTRate | null>(null);
  
  // Reports data
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [reportType, setReportType] = useState<'monthly' | 'sales' | 'hsn' | 'liability'>('monthly');
  
  // Configuration data
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({});
  const [configEditing, setConfigEditing] = useState<{[key: string]: boolean}>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats();
    } else if (activeTab === 'gst-rates') {
      fetchGSTRates();
    } else if (activeTab === 'reports') {
      fetchMonthlyReports();
    } else if (activeTab === 'settings') {
      fetchTaxConfiguration();
    }
  }, [activeTab]);

  // =========================================
  // DASHBOARD FUNCTIONS
  // =========================================

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tax/reports/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load dashboard statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // GST RATES FUNCTIONS
  // =========================================

  const fetchGSTRates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tax/gst-rates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGstRates(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load GST rates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGSTRate = async (data: Partial<GSTRate>) => {
    try {
      if (editingGST) {
        await axios.put(`${API_URL}/tax/gst-rates/${editingGST.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('GST rate updated successfully');
      } else {
        await axios.post(`${API_URL}/tax/gst-rates`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('GST rate created successfully');
      }
      fetchGSTRates();
      setShowGSTForm(false);
      setEditingGST(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save GST rate');
    }
  };

  const handleDeleteGSTRate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this GST rate?')) return;
    
    try {
      await axios.delete(`${API_URL}/tax/gst-rates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('GST rate deleted successfully');
      fetchGSTRates();
    } catch (error: any) {
      toast.error('Failed to delete GST rate');
    }
  };

  // =========================================
  // REPORTS FUNCTIONS
  // =========================================

  const fetchMonthlyReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tax/reports/monthly-summary?months=12`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonthlySummary(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load monthly reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await axios.get(`${API_URL}/tax/reports/sales-register`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Convert to CSV
      const data = response.data.data;
      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: any) => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gst-sales-register-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.error('Failed to export report');
    }
  };

  // =========================================
  // CONFIGURATION FUNCTIONS
  // =========================================

  const fetchTaxConfiguration = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tax/configuration`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTaxConfig(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load tax configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      await axios.post(`${API_URL}/tax/configuration`, {
        config_key: key,
        config_value: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Configuration updated successfully');
      fetchTaxConfiguration();
      setConfigEditing({...configEditing, [key]: false});
    } catch (error: any) {
      toast.error('Failed to update configuration');
    }
  };

  // =========================================
  // RENDER FUNCTIONS
  // =========================================

  const renderDashboard = () => {
    if (!dashboardStats) return <div className="p-6">Loading...</div>;

    const stats = dashboardStats.current_month;
    const pending = dashboardStats.pending;

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-card-bg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Tax Collected</p>
                <IndianRupee className="text-purple-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{Number(stats.total_tax_collected || 0).toFixed(2)}</p>
              <p className={`text-sm mt-1 ${stats.tax_growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.tax_growth_percentage >= 0 ? '+' : ''}{stats.tax_growth_percentage.toFixed(1)}% from last month
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-bg" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">CGST Collected</p>
                <Receipt className="text-pink-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{Number(stats.total_cgst || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Central GST</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-bg" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">SGST Collected</p>
                <Receipt className="text-blue-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{Number(stats.total_sgst || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">State GST</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-bg" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Pending Tax</p>
                <AlertCircle className="text-orange-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">₹{Number(pending.pending_tax || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{pending.pending_invoices} unpaid invoices</p>
            </div>
          </div>
        </div>

        {/* Transaction Type Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Type Breakdown</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardStats.transaction_breakdown.map((item) => (
                <div key={item.transaction_type} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">{item.transaction_type}</p>
                  <p className="text-xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-500">₹{Number(item.total_value || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Current Month Summary</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Invoices</span>
                <span className="font-semibold">{stats.total_invoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxable Value</span>
                <span className="font-semibold">₹{Number(stats.total_taxable_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">IGST Collected</span>
                <span className="font-semibold">₹{Number(stats.total_igst || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Pending Collections</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Invoices</span>
                <span className="font-semibold">{pending.pending_invoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Pending Amount</span>
                <span className="font-semibold text-orange-600">₹{Number(pending.pending_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Tax Amount</span>
                <span className="font-semibold text-red-600">₹{Number(pending.pending_tax || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGSTRates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">GST Rate Configuration</h3>
        <button
          onClick={() => {
            setEditingGST(null);
            setShowGSTForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add GST Rate
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>HSN Code</th>
              <th>GST %</th>
              <th>CGST %</th>
              <th>SGST %</th>
              <th>IGST %</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gstRates.map((rate) => (
              <tr key={rate.id}>
                <td>
                  <div>
                    <div className="font-medium">{rate.category_name}</div>
                    {rate.description && (
                      <div className="text-xs text-gray-500">{rate.description}</div>
                    )}
                  </div>
                </td>
                <td>{rate.hsn_code || '-'}</td>
                <td><span className="badge badge-info">{rate.gst_percentage}%</span></td>
                <td>{rate.cgst_percentage}%</td>
                <td>{rate.sgst_percentage}%</td>
                <td>{rate.igst_percentage}%</td>
                <td>
                  {rate.is_active ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-default">Inactive</span>
                  )}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingGST(rate);
                        setShowGSTForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGSTRate(rate.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GST Rate Form Modal */}
      {showGSTForm && (
        <GSTRateForm
          rate={editingGST}
          onSave={handleSaveGSTRate}
          onCancel={() => {
            setShowGSTForm(false);
            setEditingGST(null);
          }}
        />
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">GST Reports</h3>
        <button
          onClick={handleExportReport}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={18} />
          Export Sales Register
        </button>
      </div>

      {/* Monthly Summary Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Invoices</th>
              <th>Taxable Value</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Total Tax</th>
              <th>Invoice Value</th>
            </tr>
          </thead>
          <tbody>
            {monthlySummary.map((month) => (
              <tr key={month.month}>
                <td className="font-medium">{month.month_name}</td>
                <td>{month.total_invoices}</td>
                <td>₹{Number(month.total_taxable_value || 0).toFixed(2)}</td>
                <td>₹{Number(month.total_cgst || 0).toFixed(2)}</td>
                <td>₹{Number(month.total_sgst || 0).toFixed(2)}</td>
                <td>₹{Number(month.total_igst || 0).toFixed(2)}</td>
                <td className="font-semibold">₹{Number(month.total_tax || 0).toFixed(2)}</td>
                <td className="font-semibold text-green-600">₹{Number(month.total_invoice_value || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tax Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(taxConfig).map(([key, config]) => (
          <div key={key} className="card">
            <div className="card-body">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{key.replace(/_/g, ' ').toUpperCase()}</h4>
                  <p className="text-sm text-gray-500">{config.description}</p>
                </div>
                <button
                  onClick={() => setConfigEditing({...configEditing, [key]: !configEditing[key]})}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              {configEditing[key] ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    defaultValue={config.value}
                    className="input-field flex-1"
                    id={`config-${key}`}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`config-${key}`) as HTMLInputElement;
                      handleUpdateConfig(key, input.value);
                    }}
                    className="btn-primary"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-gray-900 font-medium mt-2">{config.value || '-'}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tax & GST Management</h1>
          <p className="page-subtitle">Manage tax configurations, GST rates, and generate compliance reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            Dashboard
          </div>
        </button>
        <button
          onClick={() => setActiveTab('gst-rates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'gst-rates'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Percent size={18} />
            GST Rates
          </div>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'reports'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            Reports
          </div>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings size={18} />
            Settings
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="spinner w-10 h-10"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'gst-rates' && renderGSTRates()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>
    </div>
  );
}

// =========================================
// GST RATE FORM COMPONENT
// =========================================

interface GSTRateFormProps {
  rate: GSTRate | null;
  onSave: (data: Partial<GSTRate>) => void;
  onCancel: () => void;
}

function GSTRateForm({ rate, onSave, onCancel }: GSTRateFormProps) {
  const [formData, setFormData] = useState<Partial<GSTRate>>(rate || {
    category_name: '',
    gst_percentage: 18,
    cgst_percentage: 9,
    sgst_percentage: 9,
    igst_percentage: 18,
    cess_percentage: 0,
    hsn_code: '',
    description: '',
    is_active: true
  });

  const handleGSTChange = (gst: number) => {
    setFormData({
      ...formData,
      gst_percentage: gst,
      cgst_percentage: gst / 2,
      sgst_percentage: gst / 2,
      igst_percentage: gst
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog max-w-2xl">
        <div className="modal-header">
          <h3 className="text-lg font-semibold">{rate ? 'Edit GST Rate' : 'Add GST Rate'}</h3>
        </div>
        <div className="modal-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Category Name*</label>
              <input
                type="text"
                className="input-field"
                value={formData.category_name}
                onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="form-label">HSN/SAC Code</label>
              <input
                type="text"
                className="input-field"
                value={formData.hsn_code}
                onChange={(e) => setFormData({...formData, hsn_code: e.target.value})}
              />
            </div>
            
            <div>
              <label className="form-label">GST Percentage*</label>
              <input
                type="number"
                className="input-field"
                value={formData.gst_percentage}
                onChange={(e) => handleGSTChange(parseFloat(e.target.value))}
                required
                step="0.01"
              />
            </div>
            
            <div>
              <label className="form-label">CGST %</label>
              <input
                type="number"
                className="input-field"
                value={formData.cgst_percentage}
                readOnly
                disabled
                step="0.01"
              />
            </div>
            
            <div>
              <label className="form-label">SGST %</label>
              <input
                type="number"
                className="input-field"
                value={formData.sgst_percentage}
                readOnly
                disabled
                step="0.01"
              />
            </div>
            
            <div>
              <label className="form-label">IGST %</label>
              <input
                type="number"
                className="input-field"
                value={formData.igst_percentage}
                readOnly
                disabled
                step="0.01"
              />
            </div>
            
            <div>
              <label className="form-label">Cess %</label>
              <input
                type="number"
                className="input-field"
                value={formData.cess_percentage}
                onChange={(e) => setFormData({...formData, cess_percentage: parseFloat(e.target.value)})}
                step="0.01"
              />
            </div>
            
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <textarea
                className="input-field"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="btn-primary"
            disabled={!formData.category_name || !formData.gst_percentage}
          >
            {rate ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
