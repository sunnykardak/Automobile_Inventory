'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, Search, Edit2, Eye, X, User, Phone, Mail,
  Calendar, DollarSign, Percent, FileText, CheckCircle,
  Users, Wallet, Clock, TrendingUp,
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

const DESIGNATIONS = ['Senior Mechanic', 'Mechanic', 'Junior Mechanic', 'Helper', 'Manager', 'Receptionist'];
const ID_PROOF_TYPES = ['Aadhar Card', 'PAN Card', 'Voter ID', 'Driving License', 'Passport'];

export default function EmployeesPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', address: '',
    dateOfBirth: '', dateOfJoining: new Date().toISOString().split('T')[0],
    designation: 'Mechanic', commissionPercentage: 5, baseSalary: 15000,
    idProofType: 'Aadhar Card', idProofNumber: '', pfNumber: '', password: '',
  });
  
  const [salaryForm, setSalaryForm] = useState({
    amount: 0, month: new Date().toISOString().slice(0, 7),
    paymentMethod: 'Bank Transfer', notes: '',
  });

  useEffect(() => { if (token) fetchEmployees(); }, [token, statusFilter]);

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/employees`, { headers: getAuthHeader() });
      if (response.data.success) setEmployees(response.data.data);
    } catch { toast.error('Failed to fetch employees'); }
    finally { setLoading(false); }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/employees`, {
        first_name: formData.firstName, last_name: formData.lastName,
        phone: formData.phone, email: formData.email, address: formData.address,
        date_of_birth: formData.dateOfBirth || null, date_of_joining: formData.dateOfJoining,
        designation: formData.designation, commission_percentage: formData.commissionPercentage,
        base_salary: formData.baseSalary, id_proof_type: formData.idProofType,
        id_proof_number: formData.idProofNumber, pf_number: formData.pfNumber || null,
        password: formData.password,
      }, { headers: getAuthHeader() });
      if (response.data.success) {
        toast.success('Employee created successfully');
        setShowCreateModal(false); resetForm(); fetchEmployees();
      }
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to create employee'); }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}`, {
        first_name: formData.firstName, last_name: formData.lastName,
        phone: formData.phone, address: formData.address,
        date_of_birth: formData.dateOfBirth || null, designation: formData.designation,
        commission_percentage: formData.commissionPercentage, base_salary: formData.baseSalary,
        id_proof_type: formData.idProofType, id_proof_number: formData.idProofNumber,
        pf_number: formData.pfNumber || null,
      }, { headers: getAuthHeader() });
      if (response.data.success) {
        toast.success('Employee updated'); setShowEditModal(false); fetchEmployees();
      }
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed to update'); }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/employees/${selectedEmployee.id}/salary`, {
        amount: salaryForm.amount, month: salaryForm.month,
        payment_method: salaryForm.paymentMethod, notes: salaryForm.notes,
      }, { headers: getAuthHeader() });
      if (response.data.success) {
        toast.success('Salary paid'); setShowPaySalaryModal(false); fetchEmployees();
      }
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', phone: '', email: '', address: '',
      dateOfBirth: '', dateOfJoining: new Date().toISOString().split('T')[0],
      designation: 'Mechanic', commissionPercentage: 5, baseSalary: 15000,
      idProofType: 'Aadhar Card', idProofNumber: '', pfNumber: '', password: '',
    });
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.first_name, lastName: emp.last_name,
      phone: emp.phone || '', email: emp.email || '', address: emp.address || '',
      dateOfBirth: emp.date_of_birth ? new Date(emp.date_of_birth).toISOString().split('T')[0] : '',
      dateOfJoining: emp.date_of_joining ? new Date(emp.date_of_joining).toISOString().split('T')[0] : '',
      designation: emp.designation || 'Mechanic', commissionPercentage: emp.commission_percentage || 0,
      baseSalary: emp.base_salary || 0, idProofType: emp.id_proof_type || 'Aadhar Card',
      idProofNumber: emp.id_proof_number || '', pfNumber: emp.pf_number || '', password: '',
    });
    setShowEditModal(true);
  };

  const openPaySalaryModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSalaryForm({
      amount: emp.base_salary + (emp.pending_commission || 0),
      month: new Date().toISOString().slice(0, 7),
      paymentMethod: 'Bank Transfer', notes: '',
    });
    setShowPaySalaryModal(true);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm) || emp.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? emp.is_active : !emp.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.is_active).length;
  const totalPendingCommission = employees.reduce((sum, e) => sum + (e.pending_commission || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage your team and track performance</p>
        </div>
        <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeEmployees}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalPendingCommission.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search by name, phone, or designation..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="select w-full sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="spinner w-8 h-8"></div></div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">No employees found</p>
            <p className="mt-2 text-gray-500">Get started by adding your first employee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Contact</th><th>Designation</th><th>Commission</th><th>Base Salary</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-gray-500">ID: EMP-{String(emp.id).padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <p className="text-gray-900">{emp.phone || '-'}</p>
                        <p className="text-gray-500 text-xs">{emp.email || '-'}</p>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{emp.designation || 'N/A'}</span></td>
                    <td><span className="font-medium text-gray-900">{emp.commission_percentage || 0}%</span></td>
                    <td><span className="font-medium text-gray-900">₹{(emp.base_salary || 0).toLocaleString()}</span></td>
                    <td><span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>{emp.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedEmployee(emp); setShowViewModal(true); }} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={18} /></button>
                        <button onClick={() => openEditModal(emp)} className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit"><Edit2 size={18} /></button>
                        <button onClick={() => openPaySalaryModal(emp)} className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Pay Salary"><DollarSign size={18} /></button>
                      </div>
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
              <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body space-y-4 max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">First Name *</label><input type="text" className="input" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                  <div><label className="label">Last Name *</label><input type="text" className="input" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                  <div><label className="label">Phone *</label><input type="tel" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
                  <div><label className="label">Email *</label><input type="email" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                  <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                  <div><label className="label">Date of Birth</label><input type="date" className="input" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
                  <div><label className="label">Date of Joining *</label><input type="date" className="input" value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} required /></div>
                  <div><label className="label">Designation *</label><select className="select" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required>{DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div><label className="label">Commission %</label><input type="number" min="0" max="100" step="0.5" className="input" value={formData.commissionPercentage} onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label className="label">Base Salary (₹)</label><input type="number" min="0" className="input" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label className="label">PF Number</label><input type="text" className="input" value={formData.pfNumber} onChange={(e) => setFormData({ ...formData, pfNumber: e.target.value })} /></div>
                  <div><label className="label">ID Proof Type</label><select className="select" value={formData.idProofType} onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}>{ID_PROOF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="label">ID Proof Number</label><input type="text" className="input" value={formData.idProofNumber} onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })} /></div>
                  <div className="col-span-2"><label className="label">Password *</label><input type="password" className="input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateEmployee}>
              <div className="modal-body space-y-4 max-h-[60vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">First Name *</label><input type="text" className="input" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                  <div><label className="label">Last Name *</label><input type="text" className="input" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                  <div><label className="label">Phone *</label><input type="tel" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
                  <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                  <div><label className="label">Designation *</label><select className="select" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required>{DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div><label className="label">Commission %</label><input type="number" min="0" max="100" step="0.5" className="input" value={formData.commissionPercentage} onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label className="label">Base Salary (₹)</label><input type="number" min="0" className="input" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label className="label">PF Number</label><input type="text" className="input" value={formData.pfNumber} onChange={(e) => setFormData({ ...formData, pfNumber: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-3">{selectedEmployee.first_name} {selectedEmployee.last_name}</h3>
                <p className="text-gray-600">{selectedEmployee.designation}</p>
                <span className={`badge mt-2 ${selectedEmployee.is_active ? 'badge-success' : 'badge-danger'}`}>{selectedEmployee.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><Phone size={18} className="text-gray-400" /><span className="text-gray-900">{selectedEmployee.phone || '-'}</span></div>
                <div className="flex items-center gap-3"><Mail size={18} className="text-gray-400" /><span className="text-gray-900">{selectedEmployee.email || '-'}</span></div>
                <div className="flex items-center gap-3"><Calendar size={18} className="text-gray-400" /><span className="text-gray-900">Joined: {selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toLocaleDateString() : '-'}</span></div>
                <div className="flex items-center gap-3"><Percent size={18} className="text-gray-400" /><span className="text-gray-900">Commission: {selectedEmployee.commission_percentage || 0}%</span></div>
                <div className="flex items-center gap-3"><DollarSign size={18} className="text-gray-400" /><span className="text-gray-900">Base Salary: ₹{(selectedEmployee.base_salary || 0).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPaySalaryModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowPaySalaryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">Pay Salary</h2>
              <button onClick={() => setShowPaySalaryModal(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handlePaySalary}>
              <div className="modal-body space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-gray-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-sm text-gray-600">Base Salary</p><p className="font-medium text-gray-900">₹{(selectedEmployee.base_salary || 0).toLocaleString()}</p></div>
                  <div><p className="text-sm text-gray-600">Pending Commission</p><p className="font-medium text-emerald-600">₹{(selectedEmployee.pending_commission || 0).toLocaleString()}</p></div>
                </div>
                <div><label className="label">Amount (₹) *</label><input type="number" min="0" className="input" value={salaryForm.amount} onChange={(e) => setSalaryForm({ ...salaryForm, amount: parseFloat(e.target.value) || 0 })} required /></div>
                <div><label className="label">Month *</label><input type="month" className="input" value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })} required /></div>
                <div><label className="label">Payment Method</label><select className="select" value={salaryForm.paymentMethod} onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })}><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="UPI">UPI</option></select></div>
                <div><label className="label">Notes</label><textarea className="input" rows={2} value={salaryForm.notes} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaySalaryModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-success">Pay ₹{salaryForm.amount.toLocaleString()}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
