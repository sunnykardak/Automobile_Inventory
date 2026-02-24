'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiPrinter, FiCheck, FiPlus, FiSearch, FiX } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

const VEHICLE_TYPES = [
  { label: 'Bike below 125cc', value: 'bike_125', waterWash: 50, foamWash: 90, dieselWash: 100 },
  { label: 'Sport Bike 350cc', value: 'sport_bike', waterWash: 60, foamWash: 100, dieselWash: 120 },
  { label: 'Heavy Bike 350cc+', value: 'heavy_bike', waterWash: 70, foamWash: 110, dieselWash: 150 },
  { label: 'Car', value: 'car', waterWash: 250, foamWash: 400, dieselWash: 250 },
  { label: 'SUV', value: 'suv', waterWash: 350, foamWash: 500, dieselWash: 250 },
];

const WASH_TYPES = [
  { label: 'Water Wash', value: 'water_wash' },
  { label: 'Foam Wash', value: 'foam_wash' },
];

const ADDON_SERVICES = [
  { label: 'Chain Lubing', value: 'chain_lubing', price: 50 },
  { label: 'Chain Cleaning', value: 'chain_cleaning', price: 50 },
];

interface Token {
  id: number;
  token_number: string;
  customer_name: string;
  customer_phone?: string;
  bike_number?: string;
  service_type: string;
  amount: number;
  status: string;
  created_at: string;
  notes?: string;
}

interface Stats {
  total_tokens: number;
  pending_tokens: number;
  completed_tokens: number;
  total_revenue: number;
}

export default function ServiceTokensPage() {
  const { token } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<Stats | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    bike_number: '',
    vehicle_type: '',
    wash_type: '',
    diesel_wash: false,
    addon_services: [] as string[],
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchTokens();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, searchTerm, statusFilter]);

  const getAuthHeader = () => ({
    Authorization: `Bearer ${token}`
  });

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/service-tokens`, {
        headers: getAuthHeader()
      });
      if (response.data.success) {
        setTokens(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/service-tokens/stats`, {
        headers: getAuthHeader()
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterTokens = () => {
    let filtered = [...tokens];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.token_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.bike_number && t.bike_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.service_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTokens(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Auto-calculate amount when vehicle type, wash type, or addons change
      if (name === 'vehicle_type' || name === 'wash_type' || name === 'diesel_wash') {
        updated.amount = calculateAmount(
          name === 'vehicle_type' ? value : prev.vehicle_type,
          name === 'wash_type' ? value : prev.wash_type,
          name === 'diesel_wash' ? checked : prev.diesel_wash,
          prev.addon_services
        );
      }
      
      return updated;
    });
  };

  const handleAddonToggle = (addonValue: string) => {
    setFormData(prev => {
      const addonServices = prev.addon_services.includes(addonValue)
        ? prev.addon_services.filter(s => s !== addonValue)
        : [...prev.addon_services, addonValue];
      
      return {
        ...prev,
        addon_services: addonServices,
        amount: calculateAmount(prev.vehicle_type, prev.wash_type, prev.diesel_wash, addonServices)
      };
    });
  };

  const calculateAmount = (vehicleType: string, washType: string, dieselWash: boolean, addonServices: string[]) => {
    if (!vehicleType || !washType) return 0;
    
    const vehicle = VEHICLE_TYPES.find(v => v.value === vehicleType);
    if (!vehicle) return 0;
    
    let amount = 0;
    if (washType === 'water_wash') {
      amount = vehicle.waterWash;
    } else if (washType === 'foam_wash') {
      amount = vehicle.foamWash;
    }
    
    if (dieselWash) {
      amount += vehicle.dieselWash;
    }
    
    // Add addon services
    addonServices.forEach(addonValue => {
      const addon = ADDON_SERVICES.find(a => a.value === addonValue);
      if (addon) {
        amount += addon.price;
      }
    });
    
    return amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.vehicle_type || !formData.wash_type) {
      toast.error('Please fill in customer name, vehicle type, and wash type');
      return;
    }

    try {
      setLoading(true);
      
      // Format service type for display
      const vehicleLabel = VEHICLE_TYPES.find(v => v.value === formData.vehicle_type)?.label || '';
      const washLabel = WASH_TYPES.find(w => w.value === formData.wash_type)?.label || '';
      const dieselLabel = formData.diesel_wash ? ' + Diesel Wash' : '';
      const addonsLabel = formData.addon_services.length > 0
        ? ' + ' + formData.addon_services.map(a => ADDON_SERVICES.find(s => s.value === a)?.label).join(' + ')
        : '';
      const serviceType = `${vehicleLabel} - ${washLabel}${dieselLabel}${addonsLabel}`;
      
      const submitData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        bike_number: formData.bike_number || null,
        service_type: serviceType,
        amount: formData.amount,
        notes: formData.notes || null
      };
      
      const response = await axios.post(
        `${API_URL}/service-tokens`,
        submitData,
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        toast.success('Token created successfully!');
        setFormData({
          customer_name: '',
          customer_phone: '',
          bike_number: '',
          vehicle_type: '',
          wash_type: '',
          diesel_wash: false,
          addon_services: [],
          amount: 0,
          notes: ''
        });
        setShowForm(false);
        fetchTokens();
        fetchStats();
        
        // Auto-print the newly created token
        setTimeout(() => printToken(response.data.data), 100);
      }
    } catch (error: unknown) {
      console.error('Error creating token:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create token');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (tokenItem: Token) => {
    setSelectedToken(tokenItem);
    setShowViewModal(true);
  };

  const completeToken = async (id: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/service-tokens/${id}/complete`,
        {},
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        toast.success('Token completed!');
        fetchTokens();
        fetchStats();
        // Update selected token if modal is open
        if (selectedToken && selectedToken.id === id) {
          setSelectedToken({ ...selectedToken, status: 'completed' });
        }
      }
    } catch (error) {
      console.error('Error completing token:', error);
      toast.error('Failed to complete token');
    }
  };

  const printToken = (tokenData: Token) => {
    const printWindow = window.open('', '', 'width=300,height=400');
    if (!printWindow) return;
    const tokenDate = new Date(tokenData.created_at).toLocaleString('en-IN');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Token - ${tokenData.token_number}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .token-number {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            letter-spacing: 2px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            border-bottom: 1px dotted #ccc;
            padding: 3px 0;
          }
          .label {
            font-weight: bold;
          }
          .value {
            text-align: right;
          }
          .amount {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            border: 2px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 2px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
        </style>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 100);
          }
        </script>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 5px 0;">SERVICE TOKEN</h2>
          <p style="margin: 5px 0;">Automobile Service Center</p>
        </div>
        
        <div class="token-number">${tokenData.token_number}</div>
        
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${tokenDate}</span>
        </div>
        
        <div class="row">
          <span class="label">Customer:</span>
          <span class="value">${tokenData.customer_name}</span>
        </div>
        
        ${tokenData.customer_phone ? `
        <div class="row">
          <span class="label">Phone:</span>
          <span class="value">${tokenData.customer_phone}</span>
        </div>
        ` : ''}
        
        ${tokenData.bike_number ? `
        <div class="row">
          <span class="label">Bike Number:</span>
          <span class="value">${tokenData.bike_number}</span>
        </div>
        ` : ''}
        
        <div class="row">
          <span class="label">Service:</span>
          <span class="value">${tokenData.service_type}</span>
        </div>
        
        ${tokenData.amount > 0 ? `
        <div class="amount">
          Amount: ₹${Number(tokenData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        ` : ''}
        
        ${tokenData.notes ? `
        <div style="margin: 10px 0; padding: 5px; border: 1px solid #ccc;">
          <div class="label">Notes:</div>
          <div>${tokenData.notes}</div>
        </div>
        ` : ''}
        
        <div class="footer">
          <p style="margin: 5px 0;">Thank you for your business!</p>
          <p style="margin: 5px 0;">Please collect your bike after service</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 font-display">Service Tokens</h1>
          <p className="text-gray-600 mt-1">Quick service tokens for washing, cleaning, and lubing</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Total Tokens</div>
              <div className="text-xl font-bold text-gray-900 font-display">{stats.total_tokens}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-6">
              <div className="text-sm text-yellow-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pending_tokens}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="text-sm text-green-600">Completed</div>
              <div className="text-2xl font-bold text-green-900">{stats.completed_tokens}</div>
            </div>
            <div className="bg-brand-50 rounded-lg shadow p-6">
              <div className="text-sm text-brand-600">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-900">
                ₹{Number(stats.total_revenue || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlus /> New Token
              </button>
              <button
                onClick={fetchTokens}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Token Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="text-xl font-bold text-gray-900">Create New Token</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="modal-body px-4 sm:px-6 py-4 space-y-4">
              {/* Pricing Reference Card */}
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Pricing Chart</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-200">
                        <th className="text-left py-2 px-2 text-blue-900">Vehicle Type</th>
                        <th className="text-right py-2 px-2 text-blue-900">Water Wash</th>
                        <th className="text-right py-2 px-2 text-blue-900">Foam Wash</th>
                        <th className="text-right py-2 px-2 text-blue-900">+Diesel Wash</th>
                      </tr>
                    </thead>
                    <tbody className="text-brand-800">
                      {VEHICLE_TYPES.map(v => (
                        <tr key={v.value} className="border-b border-blue-100">
                          <td className="py-2 px-2 font-medium">{v.label}</td>
                          <td className="text-right py-2 px-2">₹{v.waterWash}</td>
                          <td className="text-right py-2 px-2">₹{v.foamWash}</td>
                          <td className="text-right py-2 px-2">+₹{v.dieselWash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bike/Vehicle Number
                </label>
                <input
                  type="text"
                  name="bike_number"
                  value={formData.bike_number}
                  onChange={handleInputChange}
                  placeholder="e.g., MH12AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Select vehicle type</option>
                  {VEHICLE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wash Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="wash_type"
                  value={formData.wash_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Select wash type</option>
                  {WASH_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add-ons
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      name="diesel_wash"
                      checked={formData.diesel_wash}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium">Diesel Wash (+₹{formData.vehicle_type ? VEHICLE_TYPES.find(v => v.value === formData.vehicle_type)?.dieselWash || 0 : 0})</span>
                  </label>
                  
                  {ADDON_SERVICES.map(addon => (
                    <label 
                      key={addon.value}
                      className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.addon_services.includes(addon.value)
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.addon_services.includes(addon.value)}
                        onChange={() => handleAddonToggle(addon.value)}
                        className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                      />
                      <span className="text-sm font-medium">{addon.label} (+₹{addon.price})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 font-semibold text-lg text-brand-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create & Print Token'}
                </button>
              </div>
            </form>
            </div>
            </div>
          </div>
        )}

        {/* Tokens Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bike Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No tokens found
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((tokenItem) => (
                    <tr 
                      key={tokenItem.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openViewModal(tokenItem)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-brand-600">
                          {tokenItem.token_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{tokenItem.customer_name}</div>
                          {tokenItem.customer_phone && (
                            <div className="text-sm text-gray-500">{tokenItem.customer_phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tokenItem.bike_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tokenItem.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{Number(tokenItem.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tokenItem.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : tokenItem.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tokenItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tokenItem.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Token Details Modal */}
        {showViewModal && selectedToken && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="modal-header">
                <h2 className="text-xl font-bold text-gray-900">Token Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                {/* Token Number Badge */}
                <div className="text-center mb-6">
                  <div className="inline-block bg-brand-50 px-6 py-3 rounded-xl">
                    <div className="text-xs text-gray-500 uppercase mb-1">Token Number</div>
                    <div className="text-2xl font-bold text-brand-600 font-mono">
                      {selectedToken.token_number}
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      selectedToken.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : selectedToken.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedToken.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer Details</h3>
                    <div>
                      <label className="text-xs text-gray-500">Customer Name</label>
                      <p className="text-base font-medium text-gray-900">{selectedToken.customer_name}</p>
                    </div>
                    {selectedToken.customer_phone && (
                      <div>
                        <label className="text-xs text-gray-500">Phone</label>
                        <p className="text-base font-medium text-gray-900">{selectedToken.customer_phone}</p>
                      </div>
                    )}
                    {selectedToken.bike_number && (
                      <div>
                        <label className="text-xs text-gray-500">Bike Number</label>
                        <p className="text-base font-medium text-gray-900">{selectedToken.bike_number}</p>
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Service Details</h3>
                    <div>
                      <label className="text-xs text-gray-500">Service Type</label>
                      <p className="text-base font-medium text-gray-900">{selectedToken.service_type}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Amount</label>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{Number(selectedToken.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Date Created</label>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(selectedToken.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedToken.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <label className="text-xs text-gray-500 uppercase font-semibold">Notes</label>
                    <p className="text-sm text-gray-700 mt-2">{selectedToken.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      printToken(selectedToken);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <FiPrinter size={18} />
                    Print Token
                  </button>
                </div>
                <div className="flex gap-2">
                  {selectedToken.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        completeToken(selectedToken.id);
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiCheck size={18} />
                      Mark as Complete
                    </button>
                  )}
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
