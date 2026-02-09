'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  CheckCircle,
  Clock,
  Droplets,
  Wrench,
  Package,
  Trash2,
  X,
  Phone,
  Car,
  User,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface JobCard {
  id: number;
  job_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  reported_issues: string;
  assigned_mechanic_id: number;
  mechanic_name: string;
  estimated_cost: number;
  actual_cost: number;
  labor_charges: number;
  status: string;
  created_at: string;
  completed_at: string;
  products?: JobProduct[];
}

interface JobProduct {
  id: number;
  inventory_id: number;
  product_name: string;
  brand: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  designation: string;
  commission_percentage: number;
}

interface InventoryItem {
  id: number;
  product_name: string;
  brand: string;
  current_quantity: number;
  selling_price: number;
}

interface Manufacturer {
  id: number;
  name: string;
}

interface VehicleModel {
  id: number;
  manufacturer_id: number;
  model_name: string;
  engine_capacity: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Created': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Washing': 'bg-cyan-100 text-cyan-800',
  'Completed': 'bg-green-100 text-green-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'Created': <Clock size={16} />,
  'In Progress': <Wrench size={16} />,
  'Washing': <Droplets size={16} />,
  'Completed': <CheckCircle size={16} />,
};

const STATUS_OPTIONS = ['Created', 'In Progress', 'Washing', 'Completed'];

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);

  // Form data for creating new job
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleNumber: '',
    vehicleType: 'Bike',
    vehicleBrand: '',
    vehicleModel: '',
    reportedIssues: '',
    assignedMechanicId: '',
    estimatedCost: 0,
    laborCharges: 0,
  });

  // Product form for adding products to job
  const [productForm, setProductForm] = useState({
    inventoryId: '',
    quantity: 1,
  });

  // Completion form
  const [completeForm, setCompleteForm] = useState({
    paymentMethod: 'Cash',
    taxPercentage: 18,
    discountAmount: 0,
  });

  useEffect(() => {
    if (token) {
      fetchJobs();
      fetchEmployees();
      fetchInventory();
      fetchManufacturers();
      fetchVehicleModels();
    }
  }, [token, statusFilter]);

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs`,
        { headers: getAuthHeader(), params }
      );
      if (response.data.success) {
        setJobs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/employees`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        // Filter only mechanics
        const mechanics = response.data.data.filter(
          (e: Employee) => e.designation?.toLowerCase().includes('mechanic')
        );
        setEmployees(mechanics.length > 0 ? mechanics : response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/manufacturers`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setManufacturers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error);
    }
  };

  const fetchVehicleModels = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicle-models`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setVehicleModels(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle models:', error);
    }
  };

  const fetchJobDetails = async (jobId: number) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setSelectedJob(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to fetch job details');
    }
  };

  const handleBrandChange = (brandName: string) => {
    setFormData({ ...formData, vehicleBrand: brandName, vehicleModel: '' });
    const manufacturer = manufacturers.find(m => m.name === brandName);
    if (manufacturer) {
      const models = vehicleModels.filter(m => m.manufacturer_id === manufacturer.id);
      setFilteredModels(models);
    } else {
      setFilteredModels([]);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs`,
        formData,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Job card created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchJobs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create job');
    }
  };

  const handleUpdateStatus = async (jobId: number, newStatus: string) => {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`,
        { status: newStatus },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Status updated');
        fetchJobs();
        if (selectedJob?.id === jobId) {
          fetchJobDetails(jobId);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddProduct = async () => {
    if (!selectedJob || !productForm.inventoryId || productForm.quantity < 1) {
      toast.error('Please select a product and quantity');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${selectedJob.id}/products`,
        {
          inventoryId: parseInt(productForm.inventoryId),
          quantity: productForm.quantity,
        },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Product added to job');
        setProductForm({ inventoryId: '', quantity: 1 });
        fetchJobDetails(selectedJob.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!selectedJob) return;
    
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${selectedJob.id}/products/${productId}`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Product removed from job');
        fetchJobDetails(selectedJob.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove product');
    }
  };

  const handleCompleteJob = async () => {
    if (!selectedJob) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/${selectedJob.id}/complete`,
        completeForm,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Job completed and bill generated!');
        setShowCompleteModal(false);
        setShowViewModal(false);
        setSelectedJob(null);
        fetchJobs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete job');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      vehicleNumber: '',
      vehicleType: 'Bike',
      vehicleBrand: '',
      vehicleModel: '',
      reportedIssues: '',
      assignedMechanicId: '',
      estimatedCost: 0,
      laborCharges: 0,
    });
    setFilteredModels([]);
  };

  const openViewModal = async (job: JobCard) => {
    await fetchJobDetails(job.id);
    setShowViewModal(true);
  };

  const openCompleteModal = () => {
    setShowCompleteModal(true);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      'All': jobs.length,
      'Created': 0,
      'In Progress': 0,
      'Washing': 0,
      'Completed': 0,
    };
    jobs.forEach(job => {
      if (counts[job.status] !== undefined) counts[job.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const calculateJobTotal = () => {
    if (!selectedJob) return { products: 0, labor: 0, subtotal: 0, tax: 0, discount: 0, total: 0 };
    
    const productsTotal = selectedJob.products?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0;
    const laborCharges = Number(selectedJob.labor_charges) || 0;
    const subtotal = productsTotal + laborCharges;
    const tax = subtotal * (completeForm.taxPercentage / 100);
    const discount = completeForm.discountAmount;
    const total = subtotal + tax - discount;
    
    return { products: productsTotal, labor: laborCharges, subtotal, tax, discount, total };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks / Jobs</h1>
          <p className="text-gray-500 mt-1">Manage job cards and track service progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Job Card
        </button>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            !statusFilter ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">{statusCounts['All']}</div>
          <div className="text-sm text-gray-500">All Jobs</div>
        </button>
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              statusFilter === status ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded ${STATUS_COLORS[status]}`}>
                {STATUS_ICONS[status]}
              </span>
              <span className="text-2xl font-bold text-gray-900">{statusCounts[status]}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">{status}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by job number, customer name, or vehicle number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No jobs found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first job card
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-blue-600">{job.job_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.customer_name}</div>
                      <div className="text-sm text-gray-500">{job.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.vehicle_number}</div>
                      <div className="text-sm text-gray-500">{job.vehicle_brand} {job.vehicle_model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {job.mechanic_name || <span className="text-gray-400">Not assigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={job.status}
                        onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                        disabled={job.status === 'Completed'}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${STATUS_COLORS[job.status]} ${
                          job.status === 'Completed' ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ₹{Number(job.estimated_cost || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openViewModal(job)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Job Card</h2>
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-6">
                {/* Customer Information */}
                <div className="border-b pb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <User size={16} /> Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="Enter email (optional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="border-b pb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Car size={16} /> Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 uppercase"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g., KA01AB1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      >
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Car">Car</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.vehicleBrand}
                        onChange={(e) => handleBrandChange(e.target.value)}
                      >
                        <option value="">Select Brand</option>
                        {manufacturers.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.vehicleModel}
                        onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                        disabled={!formData.vehicleBrand}
                      >
                        <option value="">Select Model</option>
                        {filteredModels.map((m) => (
                          <option key={m.id} value={m.model_name}>
                            {m.model_name} ({m.engine_capacity})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="border-b pb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={16} /> Job Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reported Issues <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        value={formData.reportedIssues}
                        onChange={(e) => setFormData({ ...formData, reportedIssues: e.target.value })}
                        placeholder="Describe the issues reported by customer..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Mechanic</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          value={formData.assignedMechanicId}
                          onChange={(e) => setFormData({ ...formData, assignedMechanicId: e.target.value })}
                        >
                          <option value="">Select Mechanic</option>
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.first_name} {e.last_name} ({e.commission_percentage}% commission)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          value={formData.estimatedCost}
                          onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                          placeholder="₹0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Labor Charges</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          value={formData.laborCharges}
                          onChange={(e) => setFormData({ ...formData, laborCharges: parseFloat(e.target.value) || 0 })}
                          placeholder="₹0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Job Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Job Modal */}
      {showViewModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Job Card: <span className="text-blue-600 font-mono">{selectedJob.job_number}</span>
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${STATUS_COLORS[selectedJob.status]}`}>
                    {STATUS_ICONS[selectedJob.status]}
                    {selectedJob.status}
                  </span>
                </div>
                <button
                  onClick={() => { setShowViewModal(false); setSelectedJob(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Job Details */}
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <User size={16} /> Customer
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Name:</span> {selectedJob.customer_name}</p>
                      <p><span className="text-gray-500">Phone:</span> {selectedJob.customer_phone}</p>
                      {selectedJob.customer_email && (
                        <p><span className="text-gray-500">Email:</span> {selectedJob.customer_email}</p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Car size={16} /> Vehicle
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Number:</span> <span className="font-mono font-medium">{selectedJob.vehicle_number}</span></p>
                      <p><span className="text-gray-500">Type:</span> {selectedJob.vehicle_type}</p>
                      <p><span className="text-gray-500">Brand/Model:</span> {selectedJob.vehicle_brand} {selectedJob.vehicle_model}</p>
                    </div>
                  </div>

                  {/* Issues & Assignment */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle size={16} /> Reported Issues
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.reported_issues}</p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm">
                        <span className="text-gray-500">Assigned Mechanic:</span>{' '}
                        <span className="font-medium">{selectedJob.mechanic_name || 'Not assigned'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Update */}
                  {selectedJob.status !== 'Completed' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Update Status</h3>
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.filter(s => s !== 'Completed').map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(selectedJob.id, status)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              selectedJob.status === status
                                ? STATUS_COLORS[status]
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Products & Costs */}
                <div className="space-y-4">
                  {/* Add Products */}
                  {selectedJob.status !== 'Completed' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Package size={16} /> Add Products/Parts
                      </h3>
                      <div className="space-y-3">
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                          value={productForm.inventoryId}
                          onChange={(e) => setProductForm({ ...productForm, inventoryId: e.target.value })}
                        >
                          <option value="">Select Product</option>
                          {inventory.filter(i => i.current_quantity > 0).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.product_name} ({item.brand}) - ₹{item.selling_price} (Stock: {item.current_quantity})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                            value={productForm.quantity}
                            onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 1 })}
                            placeholder="Qty"
                          />
                          <button
                            onClick={handleAddProduct}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Add to Job
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products List */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Used Products</h3>
                    {selectedJob.products && selectedJob.products.length > 0 ? (
                      <div className="space-y-2">
                        {selectedJob.products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between bg-white p-2 rounded">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{product.product_name}</p>
                              <p className="text-gray-500">{product.quantity} x ₹{product.unit_price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">₹{product.total_price}</span>
                              {selectedJob.status !== 'Completed' && (
                                <button
                                  onClick={() => handleRemoveProduct(product.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No products added yet</p>
                    )}
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign size={16} /> Cost Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Products Total:</span>
                        <span>₹{selectedJob.products?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Labor Charges:</span>
                        <span>₹{selectedJob.labor_charges || 0}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Estimated Total:</span>
                        <span>₹{selectedJob.estimated_cost || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Complete Job Button */}
                  {selectedJob.status !== 'Completed' && (
                    <button
                      onClick={openCompleteModal}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Complete Job & Generate Bill
                    </button>
                  )}

                  {selectedJob.status === 'Completed' && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                      <p className="font-medium text-green-800">Job Completed</p>
                      <p className="text-sm text-green-600">
                        Final Cost: ₹{selectedJob.actual_cost?.toLocaleString()}
                      </p>
                      {selectedJob.completed_at && (
                        <p className="text-xs text-green-500 mt-1">
                          {new Date(selectedJob.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Job Modal */}
      {showCompleteModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Job & Generate Bill</h2>
              
              {/* Bill Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Products:</span>
                    <span>₹{calculateJobTotal().products.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Labor:</span>
                    <span>₹{calculateJobTotal().labor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>₹{calculateJobTotal().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ({completeForm.taxPercentage}%):</span>
                    <span>₹{calculateJobTotal().tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount:</span>
                    <span>-₹{calculateJobTotal().discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">₹{calculateJobTotal().total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={completeForm.paymentMethod}
                    onChange={(e) => setCompleteForm({ ...completeForm, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={completeForm.taxPercentage}
                    onChange={(e) => setCompleteForm({ ...completeForm, taxPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={completeForm.discountAmount}
                    onChange={(e) => setCompleteForm({ ...completeForm, discountAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 p-3 rounded-lg mt-4 text-sm text-amber-800">
                <p className="font-medium">⚠️ This action will:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Deduct used products from inventory</li>
                  <li>Generate invoice/bill</li>
                  <li>Add commission to mechanic account</li>
                  <li>Mark job as completed</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Complete & Generate Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
