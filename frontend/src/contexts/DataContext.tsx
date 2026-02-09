'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Types
export interface Employee {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
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
  created_at: string;
  updated_at: string;
  email?: string;
  role_name?: string;
}

export interface InventoryItem {
  id: number;
  product_master_id: number;
  product_name: string;
  part_number: string;
  barcode: string;
  brand: string;
  manufacturer_name: string;
  category_name: string;
  current_quantity: number;
  minimum_stock_level: number;
  unit_price: number;
  selling_price: number;
  storage_location: string;
  supplier_name: string;
  is_active: boolean;
}

export interface JobCard {
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
  status: 'Created' | 'In Progress' | 'Washing' | 'Completed' | 'Cancelled';
  created_at: string;
  completed_at: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string;
  website: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description: string;
}

export interface DashboardStats {
  overview: {
    totalJobsToday: number;
    pendingJobs: number;
    completedJobsToday: number;
    todayRevenue: number;
    monthlyRevenue: number;
    lowStockItems: number;
  };
  topUsedParts: any[];
  topMechanics: any[];
  revenueGraph: any[];
  jobsStatus: any[];
}

interface DataContextType {
  // Data
  employees: Employee[];
  inventory: InventoryItem[];
  jobs: JobCard[];
  manufacturers: Manufacturer[];
  categories: Category[];
  dashboardStats: DashboardStats | null;
  
  // Loading states
  loadingEmployees: boolean;
  loadingInventory: boolean;
  loadingJobs: boolean;
  loadingDashboard: boolean;
  
  // Fetch functions
  fetchEmployees: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchJobs: (status?: string) => Promise<void>;
  fetchManufacturers: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  
  // Utility
  refreshAll: () => Promise<void>;
  getEmployeeById: (id: number) => Employee | undefined;
  getMechanics: () => Employee[];
  getLowStockItems: () => InventoryItem[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function DataProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Loading states
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const getAuthHeader = useCallback(() => {
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingEmployees(true);
      const response = await axios.get(`${API_URL}/employees`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  }, [token, getAuthHeader]);

  const fetchInventory = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingInventory(true);
      const response = await axios.get(`${API_URL}/inventory`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoadingInventory(false);
    }
  }, [token, getAuthHeader]);

  const fetchJobs = useCallback(async (status?: string) => {
    if (!token) return;
    try {
      setLoadingJobs(true);
      const params: any = {};
      if (status) params.status = status;
      
      const response = await axios.get(`${API_URL}/jobs`, {
        headers: getAuthHeader(),
        params,
      });
      if (response.data.success) {
        setJobs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  }, [token, getAuthHeader]);

  const fetchManufacturers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/manufacturers`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setManufacturers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error);
    }
  }, [token, getAuthHeader]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [token, getAuthHeader]);

  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingDashboard(true);
      const response = await axios.get(`${API_URL}/dashboard`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoadingDashboard(false);
    }
  }, [token, getAuthHeader]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchEmployees(),
      fetchInventory(),
      fetchJobs(),
      fetchManufacturers(),
      fetchCategories(),
      fetchDashboardStats(),
    ]);
  }, [fetchEmployees, fetchInventory, fetchJobs, fetchManufacturers, fetchCategories, fetchDashboardStats]);

  // Utility functions
  const getEmployeeById = useCallback((id: number) => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const getMechanics = useCallback(() => {
    return employees.filter(emp => 
      emp.designation?.toLowerCase().includes('mechanic') && emp.is_active
    );
  }, [employees]);

  const getLowStockItems = useCallback(() => {
    return inventory.filter(item => item.current_quantity <= item.minimum_stock_level);
  }, [inventory]);

  // Initial data load
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchManufacturers();
      fetchCategories();
    }
  }, [isAuthenticated, token, fetchManufacturers, fetchCategories]);

  const value: DataContextType = {
    employees,
    inventory,
    jobs,
    manufacturers,
    categories,
    dashboardStats,
    loadingEmployees,
    loadingInventory,
    loadingJobs,
    loadingDashboard,
    fetchEmployees,
    fetchInventory,
    fetchJobs,
    fetchManufacturers,
    fetchCategories,
    fetchDashboardStats,
    refreshAll,
    getEmployeeById,
    getMechanics,
    getLowStockItems,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
