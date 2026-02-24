'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Car, Calendar, Wrench, DollarSign, Package,
  TrendingUp, AlertCircle, FileText, Phone, User, MapPin,
  Clock, XCircle, Eye, History,
} from 'lucide-react';

interface VehicleInfo {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vin_number: string;
  registration_date: string;
  insurance_expiry: string;
  last_service_date: string;
  next_service_due: string;
  odometer_reading: number;
  customer_id: number;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

interface JobCard {
  id: number;
  job_number: string;
  customer_name: string;
  vehicle_number: string;
  reported_issues: string;
  status: string;
  actual_cost: number;
  labor_charges: number;
  mechanic_name: string;
  bill_number: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  completed_at: string;
}

interface Part {
  job_card_id: number;
  part_name: string;
  brand: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
}

interface Statistics {
  total_jobs: number;
  completed_jobs: number;
  ongoing_jobs: number;
  total_spent: number;
  total_paid: number;
  pending_amount: number;
  avg_job_cost: number;
  last_service_date: string;
  first_service_date: string;
}

interface TopPart {
  part_name: string;
  brand: string;
  total_quantity: number;
  times_used: number;
  total_cost: number;
}

interface ServiceToken {
  id: number;
  token_number: string;
  service_type: string;
  status: string;
  created_at: string;
}

interface Issue {
  reported_issues: string;
  status: string;
  created_at: string;
  actual_cost: number;
}

interface VehicleHistory {
  vehicle: VehicleInfo;
  jobs: JobCard[];
  parts: Part[];
  tokens: ServiceToken[];
  statistics: Statistics;
  topParts: TopPart[];
  recentIssues: Issue[];
}

export default function VehicleHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleNumber = searchParams.get('number');
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'parts' | 'issues'>('overview');

  const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${token}` } });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  useEffect(() => {
    if (token && vehicleNumber) {
      fetchVehicleHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vehicleNumber]);

  const fetchVehicleHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/customers/vehicle-history/${vehicleNumber}`,
        getAuthHeader()
      );

      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Fetch vehicle history error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch vehicle history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Created': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Washing': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-red-100 text-red-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const viewJobDetails = (job: JobCard) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicle history...</p>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Not Found</h2>
          <p className="text-gray-600 mt-2">No history found for vehicle number: {vehicleNumber}</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary mt-4"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { vehicle, jobs, statistics, topParts, recentIssues } = history;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <History size={32} className="text-blue-600" />
              Vehicle Service History
            </h1>
            <p className="text-gray-600 mt-1">Complete service records and maintenance history</p>
          </div>
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Car size={20} />
              <span className="text-blue-100 text-sm font-medium">Vehicle Details</span>
            </div>
            <p className="text-2xl font-bold">{vehicle.vehicle_number}</p>
            <p className="text-blue-100 text-sm mt-1">
              {vehicle.vehicle_brand} {vehicle.vehicle_model} ({vehicle.vehicle_year})
            </p>
            <p className="text-blue-100 text-xs mt-1">{vehicle.vehicle_type}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <User size={20} />
              <span className="text-blue-100 text-sm font-medium">Owner Information</span>
            </div>
            <p className="text-lg font-semibold">{vehicle.customer_name}</p>
            <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
              <Phone size={14} />
              {vehicle.phone}
            </p>
            {vehicle.city && (
              <p className="text-blue-100 text-xs mt-1 flex items-center gap-1">
                <MapPin size={12} />
                {vehicle.city}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} />
              <span className="text-blue-100 text-sm font-medium">Important Dates</span>
            </div>
            <div className="space-y-1 text-sm">
              {vehicle.last_service_date && (
                <p>
                  <span className="text-blue-100">Last Service:</span>
                  <br />
                  <span className="font-semibold">{formatDate(vehicle.last_service_date)}</span>
                </p>
              )}
              {vehicle.insurance_expiry && (
                <p className="mt-2">
                  <span className="text-blue-100">Insurance:</span>
                  <br />
                  <span className={`font-semibold ${new Date(vehicle.insurance_expiry) < new Date() ? 'text-red-300' : ''}`}>
                    {formatDate(vehicle.insurance_expiry)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} />
              <span className="text-blue-100 text-sm font-medium">Odometer</span>
            </div>
            <p className="text-2xl font-bold">
              {vehicle.odometer_reading ? `${vehicle.odometer_reading.toLocaleString()} km` : 'Not recorded'}
            </p>
            {vehicle.next_service_due && (
              <p className="text-blue-100 text-sm mt-1">
                Next Service: {formatDate(vehicle.next_service_due)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{statistics.total_jobs}</p>
              <p className="text-xs text-green-600 mt-1">{statistics.completed_jobs} completed</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wrench size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(statistics.total_spent)}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Job Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(statistics.avg_job_cost)}</p>
              <p className="text-xs text-gray-500 mt-1">Per service</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Payment</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(statistics.pending_amount)}</p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={18} />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'jobs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={18} />
                Service Jobs ({jobs.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'parts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={18} />
                Parts Used
              </div>
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'issues'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                Issue History
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Used Parts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Most Used Parts
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity Used</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Times Used</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topParts && topParts.length > 0 ? (
                        topParts.map((part, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.part_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{part.brand}</td>
                            <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">{part.total_quantity}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">{part.times_used}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(part.total_cost)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No parts data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Service Timeline */}
              {statistics.first_service_date && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    Service Timeline
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">First Service</p>
                        <p className="font-semibold text-gray-900">{formatDate(statistics.first_service_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Service</p>
                        <p className="font-semibold text-gray-900">{formatDate(statistics.last_service_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Customer Since</p>
                        <p className="font-semibold text-gray-900">
                          {Math.floor((new Date().getTime() - new Date(statistics.first_service_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Service Frequency</p>
                        <p className="font-semibold text-gray-900">
                          {statistics.total_jobs > 1 
                            ? `Every ${Math.floor((new Date().getTime() - new Date(statistics.first_service_date).getTime()) / (1000 * 60 * 60 * 24) / statistics.total_jobs)} days` 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono font-bold text-lg text-blue-600">{job.job_number}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          {job.payment_status && (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(job.payment_status)}`}>
                              {job.payment_status}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{job.reported_issues}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(job.created_at)}
                          </span>
                          {job.mechanic_name && (
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {job.mechanic_name}
                            </span>
                          )}
                          {job.bill_number && (
                            <span className="flex items-center gap-1">
                              <FileText size={14} />
                              {job.bill_number}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(job.actual_cost || 0)}</p>
                        {job.total_amount && job.paid_amount && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid: {formatCurrency(job.paid_amount)}
                          </p>
                        )}
                        <button
                          onClick={() => viewJobDetails(job)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No service jobs found</p>
                </div>
              )}
            </div>
          )}

          {/* Parts Tab */}
          {activeTab === 'parts' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.parts && history.parts.length > 0 ? (
                    history.parts.map((part, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(part.added_at)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.part_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{part.brand}</td>
                        <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">{part.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(part.unit_price)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(part.total_price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        No parts used yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-3">
              {recentIssues && recentIssues.length > 0 ? (
                recentIssues.map((issue, index) => (
                  <div key={index} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{issue.reported_issues}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatDate(issue.created_at)}</span>
                          <span className={`px-2 py-1 rounded ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                      </div>
                      {issue.actual_cost && (
                        <span className="text-sm font-semibold text-gray-900 ml-4">
                          {formatCurrency(issue.actual_cost)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No issue history found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedJob.job_number}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedJob.vehicle_number}</p>
              </div>
              <button onClick={() => setShowJobModal(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className={`mt-1 px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <p className={`mt-1 px-3 py-1 rounded-full text-sm font-medium inline-block ${getPaymentStatusColor(selectedJob.payment_status)}`}>
                    {selectedJob.payment_status}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Reported Issues</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">{selectedJob.reported_issues}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Mechanic</label>
                  <p className="mt-1 text-gray-900">{selectedJob.mechanic_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created Date</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedJob.created_at)}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Billing Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Cost:</span>
                    <span className="font-semibold">{formatCurrency(selectedJob.actual_cost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor Charges:</span>
                    <span className="font-semibold">{formatCurrency(selectedJob.labor_charges || 0)}</span>
                  </div>
                  {selectedJob.bill_number && (
                    <>
                      <div className="border-t border-blue-200 pt-2 mt-2"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bill Number:</span>
                        <span className="font-mono font-semibold">{selectedJob.bill_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedJob.total_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Amount:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedJob.paid_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-semibold text-red-600">{formatCurrency((selectedJob.total_amount || 0) - (selectedJob.paid_amount || 0))}</span>
                      </div>
                      {selectedJob.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-semibold">{selectedJob.payment_method}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowJobModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .modal-content {
          background: white;
          border-radius: 0.5rem;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
