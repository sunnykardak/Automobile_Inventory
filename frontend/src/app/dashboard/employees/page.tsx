'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Search, Edit2, X, Phone, Mail,
  Calendar, DollarSign, Percent, FileText, CheckCircle,
  Users, Wallet, Trash2, Download, UserX, UserCheck,
  MapPin, User, CreditCard, Briefcase,
} from 'lucide-react';

interface Employee {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  date_of_birth: string;
  date_of_joining: string;
  designation: string;
  commission_percentage: number;
  base_salary: number;
  id_proof_type: string;
  id_proof_number: string;
  pf_number: string;
  is_active: boolean;
  role_name: string;
  total_jobs_completed?: number;
  total_commission_earned?: number;
  pending_commission?: number;
}

const DESIGNATIONS = [
  'Senior Mechanic',
  'Mechanic',
  'Junior Mechanic',
  'Helper',
  'Manager',
  'Receptionist',
  'Cleaner',
  'Supervisor',
  'Accountant',
];

const ID_PROOF_TYPES = [
  'Aadhar Card',
  'PAN Card',
  'Voter ID',
  'Driving License',
  'Passport',
];

export default function EmployeesPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [designationFilter, setDesignationFilter] = useState<string>('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'identity' | 'salary'>('personal');
  const [isEditingInView, setIsEditingInView] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    designation: '',
    commissionPercentage: 0,
    baseSalary: 0,
    idProofType: '',
    idProofNumber: '',
    pfNumber: '',
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    designation: 'Mechanic',
    commissionPercentage: 5,
    baseSalary: 15000,
    idProofType: 'Aadhar Card',
    idProofNumber: '',
    pfNumber: '',
    password: '',
  });
  
  const [salaryForm, setSalaryForm] = useState({
    amount: 0,
    month: new Date().toISOString().slice(0, 7),
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  useEffect(() => {
    if (token) fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/employees`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/employees`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth || null,
          dateOfJoining: formData.dateOfJoining,
          designation: formData.designation,
          commissionPercentage: formData.commissionPercentage,
          baseSalary: formData.baseSalary,
          idProofType: formData.idProofType,
          idProofNumber: formData.idProofNumber,
          pfNumber: formData.pfNumber || null,
          password: formData.password,
        },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Employee created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleToggleStatus = async (employeeId: number, currentStatus: boolean) => {
    try {
      const response = await axios.put(
        `${API_URL}/employees/${employeeId}`,
        { isActive: !currentStatus },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success(`Employee ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchEmployees();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await axios.delete(`${API_URL}/employees/${employeeId}`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        toast.success('Employee deleted successfully');
        fetchEmployees();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      const response = await axios.post(
        `${API_URL}/employees/${selectedEmployee.id}/salary`,
        {
          amount: salaryForm.amount,
          month: salaryForm.month,
          payment_method: salaryForm.paymentMethod,
          notes: salaryForm.notes,
        },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success('Salary paid successfully');
        setShowPaySalaryModal(false);
        fetchEmployees();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to pay salary');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      dateOfBirth: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      designation: 'Mechanic',
      commissionPercentage: 5,
      baseSalary: 15000,
      idProofType: 'Aadhar Card',
      idProofNumber: '',
      pfNumber: '',
      password: '',
    });
  };

  const enableEditMode = () => {
    if (selectedEmployee) {
      setEditFormData({
        firstName: selectedEmployee.first_name,
        lastName: selectedEmployee.last_name,
        phone: selectedEmployee.phone || '',
        email: selectedEmployee.email || '',
        address: selectedEmployee.address || '',
        dateOfBirth: selectedEmployee.date_of_birth
          ? new Date(selectedEmployee.date_of_birth).toISOString().split('T')[0]
          : '',
        designation: selectedEmployee.designation,
        commissionPercentage: selectedEmployee.commission_percentage,
        baseSalary: selectedEmployee.base_salary,
        idProofType: selectedEmployee.id_proof_type || 'Aadhar Card',
        idProofNumber: selectedEmployee.id_proof_number || '',
        pfNumber: selectedEmployee.pf_number || '',
      });
      setIsEditingInView(true);
    }
  };

  const cancelEditMode = () => {
    setIsEditingInView(false);
  };

  const saveEditedEmployee = async () => {
    if (!selectedEmployee || !token) return;

    try {
      const response = await fetch(`http://localhost:5001/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          phone: editFormData.phone,
          email: editFormData.email,
          address: editFormData.address,
          date_of_birth: editFormData.dateOfBirth || null,
          designation: editFormData.designation,
          commission_percentage: editFormData.commissionPercentage,
          base_salary: editFormData.baseSalary,
          id_proof_type: editFormData.idProofType,
          id_proof_number: editFormData.idProofNumber,
          pf_number: editFormData.pfNumber,
        }),
      });

      if (response.ok) {
        await fetchEmployees();
        setIsEditingInView(false);
        // Update selectedEmployee with new data
        const updatedEmployee = {
          ...selectedEmployee,
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          phone: editFormData.phone,
          email: editFormData.email,
          address: editFormData.address,
          date_of_birth: editFormData.dateOfBirth,
          designation: editFormData.designation,
          commission_percentage: editFormData.commissionPercentage,
          base_salary: editFormData.baseSalary,
          id_proof_type: editFormData.idProofType,
          id_proof_number: editFormData.idProofNumber,
          pf_number: editFormData.pfNumber,
        };
        setSelectedEmployee(updatedEmployee);
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      alert('Failed to update employee');
    }
  };

  const openPaySalaryModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSalaryForm({
      amount: emp.base_salary + (emp.pending_commission || 0),
      month: new Date().toISOString().slice(0, 7),
      paymentMethod: 'Bank Transfer',
      notes: '',
    });
    setShowPaySalaryModal(true);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Designation', 'Commission %', 'Base Salary', 'Status', 'Joined Date'];
    const csvData = filteredEmployees.map(emp => [
      `EMP-${String(emp.id).padStart(4, '0')}`,
      `${emp.first_name} ${emp.last_name}`,
      emp.phone || '',
      emp.email || '',
      emp.designation || '',
      emp.commission_percentage || 0,
      emp.base_salary || 0,
      emp.is_active ? 'Active' : 'Inactive',
      emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : '',
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Employee data exported');
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? emp.is_active : !emp.is_active);
    const matchesDesignation =
      designationFilter === 'all' || emp.designation === designationFilter;
    return matchesSearch && matchesStatus && matchesDesignation;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.is_active).length;
  const totalPendingCommission = employees.reduce(
    (sum, e) => sum + (parseFloat(String(e.pending_commission || 0))),
    0
  );
  const totalMonthlyPayroll = employees
    .filter((e) => e.is_active)
    .reduce((sum, e) => sum + (parseFloat(String(e.base_salary || 0))), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage your team and track performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-xl font-bold text-gray-900 font-display mt-1">
                {totalEmployees}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <Users className="text-brand-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-xl font-bold text-gray-900 font-display mt-1">
                {activeEmployees}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
              <p className="text-xl font-bold text-gray-900 font-display mt-1">
                ₹{totalPendingCommission.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
              <p className="text-xl font-bold text-gray-900 font-display mt-1">
                ₹{totalMonthlyPayroll.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, phone, email, or designation..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="select w-full lg:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <select
            className="select w-full lg:w-48"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
          >
            <option value="all">All Designations</option>
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">No employees found</p>
            <p className="mt-2 text-gray-500">
              {searchTerm || statusFilter !== 'all' || designationFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first employee'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact</th>
                  <th>Designation</th>
                  <th>Commission</th>
                  <th>Base Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowViewModal(true);
                    }}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-brand-800 rounded-full flex items-center justify-center text-white font-semibold">
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: EMP-{String(emp.id).padStart(4, '0')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <p className="text-gray-900">{emp.phone || '-'}</p>
                        <p className="text-gray-500 text-xs">{emp.email || '-'}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {emp.designation || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900">
                        {emp.commission_percentage || 0}%
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900">
                        ₹{(emp.base_salary || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(emp.id, emp.is_active);
                        }}
                        className={`badge cursor-pointer hover:opacity-80 transition-opacity ${
                          emp.is_active ? 'badge-success' : 'badge-danger'
                        }`}
                        title="Click to toggle status"
                      >
                        {emp.is_active ? (
                          <>
                            <UserCheck size={14} className="inline mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX size={14} className="inline mr-1" />
                            Inactive
                          </>
                        )}
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
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body space-y-4 max-h-[60vh]">
                <h3 className="font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Address</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Date of Joining *</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.dateOfJoining}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfJoining: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">
                  Employment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Designation *</label>
                    <select
                      className="select"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({ ...formData, designation: e.target.value })
                      }
                      required
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Commission %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      className="input"
                      value={formData.commissionPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commissionPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Base Salary (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={formData.baseSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          baseSalary: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">PF Number</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.pfNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, pfNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">ID Proof Type</label>
                    <select
                      className="select"
                      value={formData.idProofType}
                      onChange={(e) =>
                        setFormData({ ...formData, idProofType: e.target.value })
                      }
                    >
                      {ID_PROOF_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">ID Proof Number</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.idProofNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, idProofNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Password *</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => {
          setShowViewModal(false);
          setActiveTab('personal');
          setIsEditingInView(false);
        }}>
          <div className="modal-content max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setActiveTab('personal');
                  setIsEditingInView(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body p-6 flex-1 overflow-y-auto">
              {/* Employee Header */}
              <div className="text-center mb-6 pb-6 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-brand-800 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {selectedEmployee.first_name[0]}
                  {selectedEmployee.last_name[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-3">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h3>
                <p className="text-gray-600 flex items-center justify-center gap-2 mt-1">
                  <Briefcase size={16} />
                  {selectedEmployee.designation}
                </p>
                <span
                  className={`badge mt-2 ${
                    selectedEmployee.is_active ? 'badge-success' : 'badge-danger'
                  }`}
                >
                  {selectedEmployee.is_active ? 'Active' : 'Inactive'}
                </span>
                <p className="text-xs text-gray-500 mt-2">ID: EMP-{String(selectedEmployee.id).padStart(4, '0')}</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                    activeTab === 'personal'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User size={18} />
                    <span>Personal Details</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('identity')}
                  className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                    activeTab === 'identity'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard size={18} />
                    <span>Identity</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${
                    activeTab === 'salary'
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign size={18} />
                    <span>Salary</span>
                  </div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {/* Personal Details Tab */}
                {activeTab === 'personal' && (
                  <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">First Name</p>
                        {isEditingInView ? (
                          <input
                            type="text"
                            className="input"
                            value={editFormData.firstName}
                            onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                            required
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-blue-600" />
                            <span className="text-gray-900 font-medium">{selectedEmployee.first_name}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Last Name</p>
                        {isEditingInView ? (
                          <input
                            type="text"
                            className="input"
                            value={editFormData.lastName}
                            onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                            required
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-blue-600" />
                            <span className="text-gray-900 font-medium">{selectedEmployee.last_name}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Phone</p>
                        {isEditingInView ? (
                          <input
                            type="tel"
                            className="input"
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            required
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-blue-600" />
                            <span className="text-gray-900 font-medium">{selectedEmployee.phone || '-'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Email</p>
                        {isEditingInView ? (
                          <input
                            type="email"
                            className="input"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-blue-600" />
                            <span className="text-gray-900 font-medium break-all">{selectedEmployee.email || '-'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Address</p>
                      {isEditingInView ? (
                        <textarea
                          className="input"
                          rows={3}
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-blue-600 mt-0.5" />
                          <span className="text-gray-900 font-medium">{selectedEmployee.address || '-'}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Date of Birth</p>
                        {isEditingInView ? (
                          <input
                            type="date"
                            className="input"
                            value={editFormData.dateOfBirth}
                            onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span className="text-gray-900 font-medium">
                              {selectedEmployee.date_of_birth
                                ? new Date(selectedEmployee.date_of_birth).toLocaleDateString()
                                : '-'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Designation</p>
                        {isEditingInView ? (
                          <select
                            className="select"
                            value={editFormData.designation}
                            onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                          >
                            {DESIGNATIONS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-blue-600" />
                            <span className="text-gray-900 font-medium">{selectedEmployee.designation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Identity Tab */}
                {activeTab === 'identity' && (
                  <div className="bg-purple-50 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">ID Proof Type</p>
                      {isEditingInView ? (
                        <select
                          className="select"
                          value={editFormData.idProofType}
                          onChange={(e) => setEditFormData({ ...editFormData, idProofType: e.target.value })}
                        >
                          {ID_PROOF_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-600" />
                          <span className="text-gray-900 font-medium">{selectedEmployee.id_proof_type || '-'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">ID Proof Number</p>
                      {isEditingInView ? (
                        <input
                          type="text"
                          className="input"
                          value={editFormData.idProofNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, idProofNumber: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-600" />
                          <span className="text-gray-900 font-mono font-medium text-lg">{selectedEmployee.id_proof_number || '-'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">PF Number</p>
                      {isEditingInView ? (
                        <input
                          type="text"
                          className="input"
                          value={editFormData.pfNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, pfNumber: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-600" />
                          <span className="text-gray-900 font-mono font-medium text-lg">{selectedEmployee.pf_number || '-'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Salary Tab */}
                {activeTab === 'salary' && (
                  <div className="bg-green-50 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Base Salary</p>
                      {isEditingInView ? (
                        <input
                          type="number"
                          min="0"
                          className="input"
                          value={editFormData.baseSalary}
                          onChange={(e) => setEditFormData({ ...editFormData, baseSalary: parseFloat(e.target.value) || 0 })}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Wallet size={20} className="text-green-600" />
                          <span className="text-3xl font-bold text-green-600">
                            ₹{(selectedEmployee.base_salary || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Commission Rate</p>
                      {isEditingInView ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          className="input"
                          value={editFormData.commissionPercentage}
                          onChange={(e) => setEditFormData({ ...editFormData, commissionPercentage: parseFloat(e.target.value) || 0 })}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Percent size={18} className="text-green-600" />
                          <span className="text-2xl font-bold text-gray-900">
                            {selectedEmployee.commission_percentage || 0}%
                          </span>
                        </div>
                      )}
                    </div>
                    {!isEditingInView && selectedEmployee.total_jobs_completed !== undefined && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200">
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-2">Jobs Completed</p>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-xl font-bold text-gray-900">
                              {selectedEmployee.total_jobs_completed || 0}
                            </span>
                          </div>
                        </div>
                        {selectedEmployee.total_commission_earned !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase mb-2">Total Commission</p>
                            <div className="flex items-center gap-2">
                              <DollarSign size={16} className="text-green-600" />
                              <span className="text-xl font-bold text-gray-900">
                                ₹{(selectedEmployee.total_commission_earned || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedEmployee.pending_commission !== undefined && (
                      <div className="pt-4 border-t border-green-200">
                        <p className="text-xs text-gray-500 uppercase mb-2">Pending Commission</p>
                        <div className="flex items-center gap-2">
                          <Wallet size={18} className="text-amber-600" />
                          <span className="text-2xl font-bold text-amber-600">
                            ₹{(selectedEmployee.pending_commission || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer flex-shrink-0 flex justify-between items-center">
              {isEditingInView ? (
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={cancelEditMode}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedEmployee}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Save Changes
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openPaySalaryModal(selectedEmployee);
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <DollarSign size={18} />
                    Pay Salary
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={enableEditMode}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Edit2 size={18} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this employee?')) {
                          handleDeleteEmployee(selectedEmployee.id);
                          setShowViewModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPaySalaryModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowPaySalaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Pay Salary</h2>
              <button
                onClick={() => setShowPaySalaryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePaySalary}>
              <div className="modal-body space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-gray-900">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="font-medium text-gray-900">
                      ₹{(selectedEmployee.base_salary || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Commission</p>
                    <p className="font-medium text-emerald-600">
                      ₹{(selectedEmployee.pending_commission || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={salaryForm.amount}
                    onChange={(e) =>
                      setSalaryForm({
                        ...salaryForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">Month *</label>
                  <input
                    type="month"
                    className="input"
                    value={salaryForm.month}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, month: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    className="select"
                    value={salaryForm.paymentMethod}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })
                    }
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={salaryForm.notes}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, notes: e.target.value })
                    }
                    placeholder="Optional notes about this payment..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowPaySalaryModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-success">
                  Pay ₹{salaryForm.amount.toLocaleString()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
