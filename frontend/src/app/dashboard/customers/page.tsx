'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Search, Eye, Edit, Trash2, X, User, Phone, Mail,
  MapPin, Building, Car, FileText, Calendar, CheckCircle,
} from 'lucide-react';

interface Customer {
  id: number;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string;
  customer_type: 'Individual' | 'Business';
  notes: string;
  is_active: boolean;
  created_at: string;
  vehicle_count: number;
  job_count: number;
  total_spent: number;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vin_number: string;
  registration_date: string;
  insurance_expiry: string;
  notes: string;
  is_active: boolean;
}

export default function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    customerType: 'Individual' as 'Individual' | 'Business',
    notes: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'Bike',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vinNumber: '',
    registrationDate: '',
    insuranceExpiry: '',
    notes: '',
  });

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${token}` } });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token, searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/customers?search=${searchTerm}&status=${statusFilter}`,
        getAuthHeader()
      );
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: number) => {
    try {
      const response = await axios.get(`${API_URL}/customers/${customerId}`, getAuthHeader());
      if (response.data.success) {
        setSelectedCustomer(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch customer details');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/customers`, formData, getAuthHeader());
      if (response.data.success) {
        toast.success('Customer created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchCustomers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const response = await axios.put(
        `${API_URL}/customers/${selectedCustomer.id}`,
        formData,
        getAuthHeader()
      );
      if (response.data.success) {
        toast.success('Customer updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchCustomers();
        if (showViewModal) {
          fetchCustomerDetails(selectedCustomer.id);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await axios.delete(`${API_URL}/customers/${customerId}`, getAuthHeader());
      toast.success('Customer deleted successfully');
      fetchCustomers();
      if (showViewModal) {
        setShowViewModal(false);
        setSelectedCustomer(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const response = await axios.post(
        `${API_URL}/customers/${selectedCustomer.id}/vehicles`,
        vehicleForm,
        getAuthHeader()
      );
      if (response.data.success) {
        toast.success('Vehicle added successfully');
        setShowVehicleModal(false);
        resetVehicleForm();
        fetchCustomerDetails(selectedCustomer.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!selectedCustomer || !confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await axios.delete(
        `${API_URL}/customers/${selectedCustomer.id}/vehicles/${vehicleId}`,
        getAuthHeader()
      );
      toast.success('Vehicle deleted successfully');
      fetchCustomerDetails(selectedCustomer.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerName: customer.customer_name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      gstNumber: customer.gst_number || '',
      customerType: customer.customer_type,
      notes: customer.notes || '',
    });
    setShowEditModal(true);
  };

  const openViewModal = async (customer: Customer) => {
    await fetchCustomerDetails(customer.id);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      customerType: 'Individual',
      notes: '',
    });
    setSelectedCustomer(null);
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      vehicleNumber: '',
      vehicleType: 'Bike',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear(),
      vinNumber: '',
      registrationDate: '',
      insuranceExpiry: '',
      notes: '',
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Customers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Total: <span className="font-bold ml-1">{filteredCustomers.length}</span> customers
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-12 h-12"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {customer.customer_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.customer_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.customer_type === 'Business' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.customer_type}
                    </span>
                  </div>
                </div>
                {customer.is_active && (
                  <CheckCircle size={20} className="text-green-500" />
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.city && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{customer.city}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Vehicles</div>
                  <div className="font-bold text-gray-900">{customer.vehicle_count || 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Jobs</div>
                  <div className="font-bold text-gray-900">{customer.job_count || 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Spent</div>
                  <div className="font-bold text-gray-900">₹{Math.round(customer.total_spent || 0)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openViewModal(customer)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Eye size={16} /> View
                </button>
                <button
                  onClick={() => openEditModal(customer)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="px-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No customers found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4"
          >
            Add Your First Customer
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">
                {showEditModal ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={showEditModal ? handleUpdateCustomer : handleCreateCustomer}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Customer Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Customer Type</label>
                    <select
                      className="select"
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Address</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Pincode</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>

                {formData.customerType === 'Business' && (
                  <div>
                    <label className="label">GST Number</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {showEditModal ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}>
          <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.customer_name}</h2>
                <span className={`badge mt-1 ${selectedCustomer.customer_type === 'Business' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                  {selectedCustomer.customer_type}
                </span>
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p>{selectedCustomer.address}</p>
                            <p>{selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}</p>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.gst_number && (
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-gray-400" />
                          <span>GST: {selectedCustomer.gst_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>

                {/* Vehicles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Vehicles ({selectedCustomer.vehicles?.length || 0})</h3>
                    <button
                      onClick={() => setShowVehicleModal(true)}
                      className="btn-primary btn-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Vehicle
                    </button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? (
                      selectedCustomer.vehicles.map((vehicle: Vehicle) => (
                        <div key={vehicle.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Car size={20} className="text-blue-600" />
                              <div>
                                <p className="font-semibold text-gray-900 font-mono">{vehicle.vehicle_number}</p>
                                <p className="text-sm text-gray-600">{vehicle.vehicle_brand} {vehicle.vehicle_model}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="mr-3">{vehicle.vehicle_type}</span>
                            {vehicle.vehicle_year && <span>Year: {vehicle.vehicle_year}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No vehicles added</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Jobs */}
              {selectedCustomer.recentJobs && selectedCustomer.recentJobs.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Service History</h3>
                  <div className="space-y-2">
                    {selectedCustomer.recentJobs.slice(0, 5).map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm">
                        <div>
                          <span className="font-mono font-semibold">{job.job_number}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">{job.vehicle_number}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`badge ${job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {job.status}
                          </span>
                          {job.total_amount && (
                            <span className="font-semibold">₹{job.total_amount}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="modal-overlay" onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Add Vehicle</h2>
              <button onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddVehicle}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vehicle Number *</label>
                    <input
                      type="text"
                      className="input"
                      value={vehicleForm.vehicleNumber}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Vehicle Type *</label>
                    <select
                      className="select"
                      value={vehicleForm.vehicleType}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    >
                      <option>Bike</option>
                      <option>Car</option>
                      <option>SUV</option>
                      <option>Truck</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Brand</label>
                    <input
                      type="text"
                      className="input"
                      value={vehicleForm.vehicleBrand}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleBrand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input
                      type="text"
                      className="input"
                      value={vehicleForm.vehicleModel}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleModel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input
                      type="number"
                      className="input"
                      value={vehicleForm.vehicleYear}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleYear: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">VIN Number</label>
                  <input
                    type="text"
                    className="input"
                    value={vehicleForm.vinNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vinNumber: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Registration Date</label>
                    <input
                      type="date"
                      className="input"
                      value={vehicleForm.registrationDate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, registrationDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Insurance Expiry</label>
                    <input
                      type="date"
                      className="input"
                      value={vehicleForm.insuranceExpiry}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={vehicleForm.notes}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
