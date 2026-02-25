'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, BellOff, Plus, Edit, Trash2, Play, Pause, AlertCircle, 
  CheckCircle, Info, Search, Filter, RefreshCw, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

const CONDITION_TYPES = [
  { value: 'low_stock', label: 'Low Stock', description: 'Alert when stock falls below threshold' },
  { value: 'out_of_stock', label: 'Out of Stock', description: 'Alert when product is completely out of stock' },
  { value: 'overstock', label: 'Overstock', description: 'Alert when stock exceeds maximum threshold' },
  { value: 'reorder_point', label: 'Reorder Point', description: 'Alert when stock reaches minimum level' },
  { value: 'fast_moving_low', label: 'Fast Moving Low Stock', description: 'Alert for high-demand items with low stock' },
  { value: 'no_movement', label: 'No Movement', description: 'Alert for items with no sales in X days' },
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
];

export default function AlertRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    rule_name: '',
    description: '',
    condition_type: 'low_stock',
    priority: 'medium',
    threshold_value: '',
    threshold_percentage: '',
    days_threshold: '',
    category_filter: '',
    manufacturer_filter: '',
    specific_product_filter: '',
    is_active: true,
    send_email: false,
    send_notification: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [rulesRes, categoriesRes, manufacturersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/alert-rules/rules`, { headers }),
        fetch(`${API_BASE_URL}/alert-rules/categories`, { headers }),
        fetch(`${API_BASE_URL}/alert-rules/manufacturers`, { headers }),
      ]);

      const rulesData = await rulesRes.json();
      const categoriesData = await categoriesRes.json();
      const manufacturersData = await manufacturersRes.json();

      if (rulesData.success) setRules(rulesData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (manufacturersData.success) setManufacturers(manufacturersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingRule 
        ? `${API_BASE_URL}/alert-rules/rules/${editingRule.rule_id}`
        : `${API_BASE_URL}/alert-rules/rules`;
      
      const method = editingRule ? 'PUT' : 'POST';

      // Clean up form data - convert empty strings to null
      const cleanedData = {
        ...formData,
        threshold_value: formData.threshold_value || null,
        threshold_percentage: formData.threshold_percentage || null,
        days_threshold: formData.days_threshold || null,
        category_filter: formData.category_filter || null,
        manufacturer_filter: formData.manufacturer_filter || null,
        specific_product_filter: formData.specific_product_filter || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        setEditingRule(null);
        resetForm();
        fetchData();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule');
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/alert-rules/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Rule deleted successfully');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleStatus = async (ruleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/alert-rules/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const handleCheckRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/alert-rules/check`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Checked ${data.data.rules_checked} rules, created ${data.data.alerts_created} new alerts`);
      } else {
        toast.error(data.message || 'Failed to check rules');
      }
    } catch (error) {
      console.error('Error checking rules:', error);
      toast.error('Failed to check rules');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name || '',
      description: rule.description || '',
      condition_type: rule.condition_type || 'low_stock',
      priority: rule.priority || 'medium',
      threshold_value: rule.threshold_value || '',
      threshold_percentage: rule.threshold_percentage || '',
      days_threshold: rule.days_threshold || '',
      category_filter: rule.category_filter || '',
      manufacturer_filter: rule.manufacturer_filter || '',
      specific_product_filter: rule.specific_product_filter || '',
      is_active: rule.is_active !== false,
      send_email: rule.send_email || false,
      send_notification: rule.send_notification !== false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      description: '',
      condition_type: 'low_stock',
      priority: 'medium',
      threshold_value: '',
      threshold_percentage: '',
      days_threshold: '',
      category_filter: '',
      manufacturer_filter: '',
      specific_product_filter: '',
      is_active: true,
      send_email: false,
      send_notification: true,
    });
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchTerm || 
      rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = !filterPriority || rule.priority === filterPriority;
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'active' && rule.is_active) ||
      (filterStatus === 'inactive' && !rule.is_active);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityStyle = (priority) => {
    const style = PRIORITY_LEVELS.find(p => p.value === priority);
    return style || PRIORITY_LEVELS[1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/inventory/alerts')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Alerts
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          Smart Inventory Alert Rules
        </h1>
        <p className="text-gray-600 mt-2">Configure custom rules to automatically monitor your inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rules</p>
              <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.is_active).length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Rules</p>
              <p className="text-2xl font-bold text-gray-600">{rules.filter(r => !r.is_active).length}</p>
            </div>
            <BellOff className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Priority</p>
              <p className="text-2xl font-bold text-red-600">{rules.filter(r => r.priority === 'critical').length}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              {PRIORITY_LEVELS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckRules}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Check Rules Now
            </button>
            <button
              onClick={() => {
                setEditingRule(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Bell className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No alert rules found</p>
                      <p className="text-sm">Create your first rule to start monitoring inventory</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map(rule => {
                  const priorityStyle = getPriorityStyle(rule.priority);
                  const conditionLabel = CONDITION_TYPES.find(c => c.value === rule.condition_type)?.label || rule.condition_type;

                  return (
                    <tr key={rule.rule_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{rule.rule_name}</div>
                          {rule.description && (
                            <div className="text-sm text-gray-500">{rule.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{conditionLabel}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.threshold_value && `${rule.threshold_value} units`}
                        {rule.threshold_percentage && `${rule.threshold_percentage}%`}
                        {rule.days_threshold && `${rule.days_threshold} days`}
                        {!rule.threshold_value && !rule.threshold_percentage && !rule.days_threshold && '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityStyle.bg} ${priorityStyle.color}`}>
                          {priorityStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rule.is_active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <Play className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Pause className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-semibold text-blue-600">{rule.active_alerts_count || 0}</span>
                        {rule.alerts_today > 0 && (
                          <span className="ml-2 text-gray-500">({rule.alerts_today} today)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(rule.rule_id)}
                            className="text-blue-600 hover:text-blue-800"
                            title={rule.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {rule.is_active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleEdit(rule)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.rule_id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit Rule */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingRule ? 'Edit Alert Rule' : 'Create New Alert Rule'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rule_name}
                    onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Low Stock Warning - Brake Pads"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description..."
                  />
                </div>

                {/* Condition Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition Type *
                    </label>
                    <select
                      required
                      value={formData.condition_type}
                      onChange={(e) => setFormData({...formData, condition_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {CONDITION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Thresholds */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Threshold Settings (at least one required)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Absolute Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.threshold_value}
                        onChange={(e) => setFormData({...formData, threshold_value: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Percentage %</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.threshold_percentage}
                        onChange={(e) => setFormData({...formData, threshold_percentage: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Days</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.days_threshold}
                        onChange={(e) => setFormData({...formData, days_threshold: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 30"
                      />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Filters (optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Category</label>
                      <select
                        value={formData.category_filter}
                        onChange={(e) => setFormData({...formData, category_filter: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Manufacturer</label>
                      <select
                        value={formData.manufacturer_filter}
                        onChange={(e) => setFormData({...formData, manufacturer_filter: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Manufacturers</option>
                        {manufacturers.map(mfr => (
                          <option key={mfr.id} value={mfr.id}>{mfr.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.send_notification}
                        onChange={(e) => setFormData({...formData, send_notification: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Send Notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.send_email}
                        onChange={(e) => setFormData({...formData, send_email: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Send Email Alerts</span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
