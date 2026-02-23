'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Search, Eye, CheckCircle, Droplets, Wrench, Package,
  Trash2, X, Car, User, AlertCircle, DollarSign, Download,
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
  bill_id?: number;
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
}

const STATUS_COLORS: Record<string, string> = {
  'Created': 'bg-sky-50 text-sky-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  'Washing': 'bg-cyan-50 text-cyan-700',
  'Completed': 'bg-emerald-50 text-emerald-700',
};

const STATUS_OPTIONS = ['Created', 'In Progress', 'Washing', 'Completed'];

const WASHING_VEHICLE_TYPES = [
  { value: 'bike_125', label: 'Bike 125cc or  Less', waterWash: 50, foamWash: 90, dieselWash: 100 },
  { value: 'sport_bike', label: 'Sport Bike', waterWash: 60, foamWash: 100, dieselWash: 120 },
  { value: 'heavy_bike', label: 'Heavy Bike', waterWash: 70, foamWash: 110, dieselWash: 150 },
  { value: 'car', label: 'Car', waterWash: 250, foamWash: 400, dieselWash: 250 },
  { value: 'suv', label: 'SUV', waterWash: 350, foamWash: 500, dieselWash: 250 },
];

const WASHING_TYPES = [
  { value: 'water_wash', label: 'Water Wash' },
  { value: 'foam_wash', label: 'Foam Wash' },
];

const WASHING_ADDON_SERVICES = [
  { value: 'chain_lubing', label: 'Chain Lubing', price: 50 },
  { value: 'chain_cleaning', label: 'Chain Cleaning', price: 50 },
];

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
  const [statusFilter, setStatusFilter] = useState('All');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);

  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', customerEmail: '',
    vehicleNumber: '', vehicleType: 'Bike', vehicleBrand: '', vehicleModel: '',
    reportedIssues: '', assignedMechanicId: '', estimatedCost: 0, laborCharges: 0,
    labourChargeIds: [] as number[],
    includeWashing: false,
    washingVehicleType: 'bike_125',
    washingType: 'water_wash',
    washingDieselWash: false,
    washingAddons: [] as string[],
    washingCharges: 0,
  });

  const [productForm, setProductForm] = useState({ inventoryId: '', quantity: 1 });
  const [completeForm, setCompleteForm] = useState({
    paymentMethod: 'Cash', taxPercentage: 18, discountAmount: 0,
  });

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${token}` } });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  useEffect(() => {
    if (token) {
      fetchJobs();
      fetchEmployees();
      fetchInventory();
      fetchManufacturers();
      fetchVehicleModels();
      fetchLabourCharges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const [labourChargeOptions, setLabourChargeOptions] = useState<{ id: number; name: string; amount: number }[]>([]);

  const fetchLabourCharges = async () => {
    try {
      const res = await axios.get(`${API_URL}/labour-charges`, getAuthHeader());
      if (res.data.success) setLabourChargeOptions(res.data.data);
    } catch {
      console.error('Failed to fetch labour charges');
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/jobs`, getAuthHeader());
      if (response.data.success) setJobs(response.data.data);
    } catch {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`, getAuthHeader());
      if (response.data.success) setEmployees(response.data.data);
    } catch {
      console.error('Failed to fetch employees');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory`, getAuthHeader());
      if (response.data.success) setInventory(response.data.data);
    } catch {
      console.error('Failed to fetch inventory');
    }
  };

  const fetchManufacturers = async () => {
    try {
      const response = await axios.get(`${API_URL}/manufacturers`, getAuthHeader());
      if (response.data.success) setManufacturers(response.data.data);
    } catch {
      console.error('Failed to fetch manufacturers');
    }
  };

  const fetchVehicleModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicle-models`, getAuthHeader());
      if (response.data.success) setVehicleModels(response.data.data);
    } catch {
      console.error('Failed to fetch models');
    }
  };

  const fetchJobDetails = async (jobId: number) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}`, getAuthHeader());
      if (response.data.success) setSelectedJob(response.data.data);
    } catch {
      toast.error('Failed to fetch job details');
    }
  };

  const calculateWashingCharges = (vehicleType: string, washType: string, dieselWash: boolean, addons: string[]) => {
    const vehicle = WASHING_VEHICLE_TYPES.find(v => v.value === vehicleType);
    if (!vehicle) return 0;
    
    let amount = washType === 'water_wash' ? vehicle.waterWash : vehicle.foamWash;
    if (dieselWash) amount += vehicle.dieselWash;
    
    addons.forEach(addon => {
      const service = WASHING_ADDON_SERVICES.find(a => a.value === addon);
      if (service) amount += service.price;
    });
    
    return amount;
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/jobs`, {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail,
        vehicle_number: formData.vehicleNumber.toUpperCase(),
        vehicle_type: formData.vehicleType,
        vehicle_brand: formData.vehicleBrand,
        vehicle_model: formData.vehicleModel,
        reported_issues: formData.reportedIssues,
        assigned_mechanic_id: formData.assignedMechanicId || null,
        estimated_cost: formData.estimatedCost,
        labourChargeIds: formData.labourChargeIds,
        includeWashing: formData.includeWashing,
        washingVehicleType: formData.includeWashing ? formData.washingVehicleType : null,
        washingType: formData.includeWashing ? formData.washingType : null,
        washingDieselWash: formData.includeWashing ? formData.washingDieselWash : false,
        washingAddons: formData.includeWashing ? formData.washingAddons : [],
        washingCharges: formData.includeWashing ? formData.washingCharges : 0,
      }, getAuthHeader());
      if (response.data.success) {
        toast.success('Job created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create job');
    }
  };
  const handleWashingToggle = (checked: boolean) => {
    if (checked) {
      const charges = calculateWashingCharges(
        formData.washingVehicleType,
        formData.washingType,
        formData.washingDieselWash,
        formData.washingAddons
      );
      setFormData({ ...formData, includeWashing: true, washingCharges: charges });
    } else {
      setFormData({ ...formData, includeWashing: false, washingCharges: 0 });
    }
  };

  const handleWashingChange = (field: string, value: string | boolean | string[]) => {
    const updatedData = { ...formData, [field]: value };
    const charges = calculateWashingCharges(
      field === 'washingVehicleType' ? value as string : formData.washingVehicleType,
      field === 'washingType' ? value as string : formData.washingType,
      field === 'washingDieselWash' ? value as boolean : formData.washingDieselWash,
      field === 'washingAddons' ? value as string[] : formData.washingAddons
    );
    setFormData({ ...updatedData, washingCharges: charges });
  };

  const handleWashingAddonToggle = (addon: string) => {
    const newAddons = formData.washingAddons.includes(addon)
      ? formData.washingAddons.filter(a => a !== addon)
      : [...formData.washingAddons, addon];
    handleWashingChange('washingAddons', newAddons);
  };
  const handleUpdateStatus = async (jobId: number, newStatus: string) => {
    try {
      const response = await axios.put(`${API_URL}/jobs/${jobId}`, { status: newStatus }, getAuthHeader());
      if (response.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchJobs();
        if (selectedJob) fetchJobDetails(jobId);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddProduct = async () => {
    if (!selectedJob || !productForm.inventoryId) return;
    try {
      const response = await axios.post(
        `${API_URL}/jobs/${selectedJob.id}/products`,
        { inventoryId: productForm.inventoryId, quantity: productForm.quantity },
        getAuthHeader()
      );
      if (response.data.success) {
        toast.success('Product added');
        setProductForm({ inventoryId: '', quantity: 1 });
        fetchJobDetails(selectedJob.id);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!selectedJob) return;
    try {
      await axios.delete(`${API_URL}/jobs/${selectedJob.id}/products/${productId}`, getAuthHeader());
      toast.success('Product removed');
      fetchJobDetails(selectedJob.id);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to remove product');
    }
  };

  const handleCompleteJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      const response = await axios.post(
        `${API_URL}/jobs/${selectedJob.id}/complete`,
        {
          payment_method: completeForm.paymentMethod,
          tax_percentage: completeForm.taxPercentage,
          discount_amount: completeForm.discountAmount,
        },
        getAuthHeader()
      );
      if (response.data.success) {
        toast.success('Job completed and bill generated!');
        setShowCompleteModal(false);
        setShowViewModal(false);
        setSelectedJob(null);
        fetchJobs();
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to complete job');
    }
  };

  const handleDownloadPDF = async (billId: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/bills/${billId}/pdf`,
        {
          ...getAuthHeader(),
          responseType: 'blob',
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${selectedJob?.job_number || billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error('PDF download error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '', customerPhone: '', customerEmail: '',
      vehicleNumber: '', vehicleType: 'Bike', vehicleBrand: '', vehicleModel: '',
      reportedIssues: '', assignedMechanicId: '', estimatedCost: 0, laborCharges: 0,
      labourChargeIds: [],
      includeWashing: false,
      washingVehicleType: 'bike_125',
      washingType: 'water_wash',
      washingDieselWash: false,
      washingAddons: [],
      washingCharges: 0,
    });
  };

  const handleBrandChange = (brandName: string) => {
    setFormData({ ...formData, vehicleBrand: brandName, vehicleModel: '' });
    const manufacturer = manufacturers.find(m => m.name === brandName);
    if (manufacturer) {
      setFilteredModels(vehicleModels.filter(m => m.manufacturer_id === manufacturer.id));
    } else {
      setFilteredModels([]);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const statusCounts: Record<string, number> = { All: jobs.length, Created: 0, 'In Progress': 0, Washing: 0, Completed: 0 };
  jobs.forEach(job => { if (statusCounts[job.status] !== undefined) statusCounts[job.status]++; });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Tasks / Jobs</h1>
          <p className="text-gray-600 mt-1">Manage job cards and track service progress</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Create Job Card
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {['All', ...STATUS_OPTIONS].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              statusFilter === status ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by job number, customer, or vehicle..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">No jobs found</p>
            <p className="mt-2 text-gray-500">Create your first job card to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Number</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Mechanic</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td><span className="font-mono font-medium text-brand-600">{job.job_number}</span></td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{job.customer_name}</p>
                        <p className="text-xs text-gray-500">{job.customer_phone}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-mono font-medium text-gray-900">{job.vehicle_number}</p>
                        <p className="text-xs text-gray-500">{job.vehicle_brand} {job.vehicle_model}</p>
                      </div>
                    </td>
                    <td>{job.mechanic_name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td><span className={`badge ${STATUS_COLORS[job.status]}`}>{job.status}</span></td>
                    <td className="text-gray-500">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => { fetchJobDetails(job.id); setShowViewModal(true); }}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Create Job Card</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="modal-body space-y-4 max-h-[60vh]">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Name *</label><input type="text" className="input" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required /></div>
                  <div><label className="label">Phone *</label><input type="tel" className="input" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} required /></div>
                  <div className="col-span-2"><label className="label">Email</label><input type="email" className="input" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} /></div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Number *</label><input type="text" className="input uppercase" value={formData.vehicleNumber} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })} required placeholder="MH12AB1234" /></div>
                  <div><label className="label">Type *</label><select className="select" value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} required><option value="Bike">Bike</option><option value="Scooter">Scooter</option><option value="Car">Car</option><option value="Auto">Auto</option><option value="Truck">Truck</option></select></div>
                  <div><label className="label">Brand *</label><select className="select" value={formData.vehicleBrand} onChange={e => handleBrandChange(e.target.value)} required><option value="">Select Brand</option>{manufacturers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
                  <div><label className="label">Model</label><select className="select" value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}><option value="">Select Model</option>{filteredModels.map(m => <option key={m.id} value={m.model_name}>{m.model_name}</option>)}</select></div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">Job Details</h3>
                <div><label className="label">Reported Issues *</label><textarea className="input" rows={3} value={formData.reportedIssues} onChange={e => setFormData({ ...formData, reportedIssues: e.target.value })} required placeholder="Describe the issues..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Mechanic</label><select className="select" value={formData.assignedMechanicId} onChange={e => setFormData({ ...formData, assignedMechanicId: e.target.value })}><option value="">Assign Later</option>{employees.filter(e => e.designation?.includes('Mechanic')).map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}</select></div>
                  <div><label className="label">Estimated Cost (₹)</label><input type="number" min="0" className="input" value={formData.estimatedCost} onChange={e => setFormData({ ...formData, estimatedCost: Number(e.target.value) })} /></div>
                  <div>
                    <label className="label">Labor Charges (₹)</label>
                    <input type="number" min="0" className="input" value={formData.laborCharges} onChange={e => setFormData({ ...formData, laborCharges: Number(e.target.value) })} />
                    {labourChargeOptions.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="text-xs text-gray-500 mb-1">Or select labour items:</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {labourChargeOptions.map(opt => (
                            <label key={opt.id} className="flex items-center gap-2">
                              <input type="checkbox" checked={formData.labourChargeIds.includes(opt.id)} onChange={e => {
                                setFormData({
                                  ...formData,
                                  labourChargeIds: e.target.checked ? [...formData.labourChargeIds, opt.id] : formData.labourChargeIds.filter(id => id !== opt.id)
                                });
                              }} />
                              <span>{opt.name} — ₹{Number(opt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Washing Services Section */}
                <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4 flex items-center gap-2">
                  <Droplets size={20} />
                  Washing Services
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.includeWashing}
                      onChange={e => handleWashingToggle(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Include Washing Service</span>
                  </label>

                  {formData.includeWashing && (
                    <div className="bg-brand-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Vehicle Category *</label>
                          <select
                            className="select"
                            value={formData.washingVehicleType}
                            onChange={e => handleWashingChange('washingVehicleType', e.target.value)}
                          >
                            {WASHING_VEHICLE_TYPES.map(v => (
                              <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Wash Type *</label>
                          <select
                            className="select"
                            value={formData.washingType}
                            onChange={e => handleWashingChange('washingType', e.target.value)}
                          >
                            {WASHING_TYPES.map(w => (
                              <option key={w.value} value={w.value}>{w.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-medium text-sm">Add-ons</label>
                        <div className="grid grid-cols-3 gap-3">
                          <label className={`p-2 border-2 rounded-lg cursor-pointer transition ${formData.washingDieselWash ? 'border-brand-500 bg-brand-100' : 'border-gray-300'}`}>
                            <input
                              type="checkbox"
                              checked={formData.washingDieselWash}
                              onChange={e => handleWashingChange('washingDieselWash', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm">Diesel Wash (+₹{WASHING_VEHICLE_TYPES.find(v => v.value === formData.washingVehicleType)?.dieselWash})</span>
                          </label>
                          {WASHING_ADDON_SERVICES.map(addon => (
                            <label
                              key={addon.value}
                              className={`p-2 border-2 rounded-lg cursor-pointer transition ${formData.washingAddons.includes(addon.value) ? 'border-brand-500 bg-brand-100' : 'border-gray-300'}`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.washingAddons.includes(addon.value)}
                                onChange={() => handleWashingAddonToggle(addon.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">{addon.label} (+₹{addon.price})</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border border-brand-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Washing Charges:</span>
                          <span className="text-lg font-bold text-brand-600">₹{formData.washingCharges}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Job Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedJob && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setSelectedJob(null); }}>
          <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Job: <span className="text-brand-600 font-mono">{selectedJob.job_number}</span></h2>
                <span className={`badge mt-1 ${STATUS_COLORS[selectedJob.status]}`}>{selectedJob.status}</span>
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedJob(null); }} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="modal-body max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><User size={16} /> Customer</h3>
                    <p><span className="text-gray-500">Name:</span> {selectedJob.customer_name}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedJob.customer_phone}</p>
                    {selectedJob.customer_email && <p><span className="text-gray-500">Email:</span> {selectedJob.customer_email}</p>}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Car size={16} /> Vehicle</h3>
                    <p><span className="text-gray-500">Number:</span> <span className="font-mono">{selectedJob.vehicle_number}</span></p>
                    <p><span className="text-gray-500">Type:</span> {selectedJob.vehicle_type}</p>
                    <p><span className="text-gray-500">Brand/Model:</span> {selectedJob.vehicle_brand} {selectedJob.vehicle_model}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><AlertCircle size={16} /> Issues</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedJob.reported_issues}</p>
                    <p className="mt-2"><span className="text-gray-500">Mechanic:</span> {selectedJob.mechanic_name || 'Not assigned'}</p>
                  </div>
                  {selectedJob.status !== 'Completed' && (
                    <div className="bg-brand-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Update Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.filter(s => s !== selectedJob.status).map(status => (
                          <button key={status} onClick={() => handleUpdateStatus(selectedJob.id, status)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${status === 'Completed' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Products */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package size={16} /> Products Used</h3>
                    {selectedJob.products && selectedJob.products.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedJob.products.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div>
                              <p className="font-medium text-sm">{p.product_name}</p>
                              <p className="text-xs text-gray-500">{p.quantity} x ₹{p.unit_price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">₹{p.total_price}</span>
                              {selectedJob.status !== 'Completed' && (
                                <button onClick={() => handleRemoveProduct(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No products added yet</p>
                    )}
                    
                    {selectedJob.status !== 'Completed' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex gap-2">
                          <select className="select flex-1" value={productForm.inventoryId} onChange={e => setProductForm({ ...productForm, inventoryId: e.target.value })}>
                            <option value="">Select Product</option>
                            {inventory.filter(i => i.current_quantity > 0).map(i => (
                              <option key={i.id} value={i.id}>{i.product_name} ({i.brand}) - ₹{i.selling_price} ({i.current_quantity} in stock)</option>
                            ))}
                          </select>
                          <input type="number" min="1" className="input w-20" value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: Number(e.target.value) })} />
                          <button onClick={handleAddProduct} disabled={!productForm.inventoryId} className="btn-primary">Add</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><DollarSign size={16} /> Cost Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Products:</span><span>₹{calculateJobTotal().products.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Labor:</span><span>₹{calculateJobTotal().labor.toLocaleString()}</span></div>
                      <div className="flex justify-between font-medium border-t pt-2"><span>Subtotal:</span><span>₹{calculateJobTotal().subtotal.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Tax ({completeForm.taxPercentage}%):</span><span>₹{calculateJobTotal().tax.toLocaleString()}</span></div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total:</span><span className="text-green-600">₹{calculateJobTotal().total.toLocaleString()}</span></div>
                    </div>
                  </div>

                  {selectedJob.status !== 'Completed' && (
                    <button onClick={() => setShowCompleteModal(true)} className="w-full btn-success flex items-center justify-center gap-2">
                      <CheckCircle size={20} /> Complete Job & Generate Bill
                    </button>
                  )}
                  
                  {selectedJob.status === 'Completed' && selectedJob.bill_id && (
                    <button 
                      onClick={() => handleDownloadPDF(selectedJob.bill_id!)} 
                      className="w-full gradient-brand text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-brand-700 hover:to-brand-900 transition-all shadow-lg shadow-brand-500/30"
                    >
                      <Download size={20} /> Download Invoice PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Complete Job & Generate Bill</h2>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handleCompleteJob}>
              <div className="modal-body space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Job Number</p>
                  <p className="font-mono font-bold text-brand-600">{selectedJob.job_number}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Products:</span><span>₹{calculateJobTotal().products.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Labor:</span><span>₹{calculateJobTotal().labor.toLocaleString()}</span></div>
                  <div className="flex justify-between font-medium"><span>Subtotal:</span><span>₹{calculateJobTotal().subtotal.toLocaleString()}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Tax %</label><input type="number" min="0" max="100" className="input" value={completeForm.taxPercentage} onChange={e => setCompleteForm({ ...completeForm, taxPercentage: Number(e.target.value) })} /></div>
                  <div><label className="label">Discount (₹)</label><input type="number" min="0" className="input" value={completeForm.discountAmount} onChange={e => setCompleteForm({ ...completeForm, discountAmount: Number(e.target.value) })} /></div>
                </div>
                
                <div><label className="label">Payment Method</label><select className="select" value={completeForm.paymentMethod} onChange={e => setCompleteForm({ ...completeForm, paymentMethod: e.target.value })}><option value="Cash">Cash</option><option value="Card">Card</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option></select></div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between text-lg font-bold"><span>Final Total:</span><span className="text-green-600">₹{calculateJobTotal().total.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCompleteModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-success">Complete & Generate Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
