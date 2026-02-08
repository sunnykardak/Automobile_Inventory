'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiPackage, FiSearch, FiFilter, FiAlertCircle, FiBarcode2 } from 'react-icons/fi';

interface InventoryItem {
  id: number;
  product_name: string;
  part_number: string;
  barcode: string;
  brand: string;
  manufacturer_name: string;
  category_name: string;
  current_quantity: number;
  minimum_stock_level: number;
  maximum_stock_level: number;
  reorder_point: number;
  unit_price: number;
  selling_price: number;
  location: string;
  storage_location: string;
}

interface Category {
  id: number;
  name: string;
}

interface Manufacturer {
  id: number;
  name: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState({
    productMasterId: '',
    brand: '',
    barcode: '',
    currentQuantity: 0,
    minimumStockLevel: 10,
    maximumStockLevel: 100,
    reorderPoint: 20,
    unitPrice: 0,
    sellingPrice: 0,
    storageLocation: '',
    supplierName: '',
    supplierContact: '',
  });

  const [restockData, setRestockData] = useState({
    quantity: 0,
    unitPrice: 0,
    supplierName: '',
    invoiceNumber: '',
    notes: '',
  });

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    fetchManufacturers();
  }, [searchTerm, selectedCategory, showLowStock]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (showLowStock) params.lowStock = 'true';

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
        { headers: getAuthHeader(), params }
      );

      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/categories`,
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
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
      console.error('Failed to fetch manufacturers');
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
        formData,
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        toast.success('Inventory item added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchInventory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add inventory');
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/${selectedItem.id}`,
        formData,
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        toast.success('Inventory updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchInventory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update inventory');
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory/${selectedItem.id}/restock`,
        restockData,
        { headers: getAuthHeader() }
      );

      if (response.data.success) {
        toast.success('Inventory restocked successfully!');
        setShowRestockModal(false);
        setRestockData({
          quantity: 0,
          unitPrice: 0,
          supplierName: '',
          invoiceNumber: '',
          notes: '',
        });
        fetchInventory();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restock');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      productMasterId: '',
      brand: item.brand || '',
      barcode: item.barcode || '',
      currentQuantity: item.current_quantity || 0,
      minimumStockLevel: item.minimum_stock_level || 0,
      maximumStockLevel: item.maximum_stock_level || 100,
      reorderPoint: item.reorder_point || 0,
      unitPrice: Number(item.unit_price) || 0,
      sellingPrice: Number(item.selling_price) || 0,
      storageLocation: item.storage_location || '',
      supplierName: '',
      supplierContact: '',
    });
    setShowEditModal(true);
  };

  const openRestockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setRestockData({
      quantity: 0,
      unitPrice: Number(item.unit_price) || 0,
      supplierName: '',
      invoiceNumber: '',
      notes: '',
    });
    setShowRestockModal(true);
  };

  const resetForm = () => {
    setFormData({
      productMasterId: '',
      brand: '',
      barcode: '',
      currentQuantity: 0,
      minimumStockLevel: 10,
      maximumStockLevel: 100,
      reorderPoint: 20,
      unitPrice: 0,
      sellingPrice: 0,
      storageLocation: '',
      supplierName: '',
      supplierContact: '',
    });
    setSelectedItem(null);
  };

  const getStockStatus = (item: InventoryItem) => {
    const currentQty = item.current_quantity || 0;
    const minStock = item.minimum_stock_level || 0;
    const reorderPt = item.reorder_point || 0;
    
    if (currentQty <= minStock) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Low Stock</span>;
    } else if (currentQty <= reorderPt) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Reorder</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">In Stock</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Manage spare parts and inventory</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, barcode, brand..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              <span className="ml-2 text-gray-700 font-medium">Show Low Stock Only</span>
            </label>
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiPackage className="mx-auto text-5xl mb-4" />
            <p>No inventory items found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.part_number}</div>
                        <div className="text-xs text-gray-400">{item.brand}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <FiBarcode2 className="text-gray-400" />
                        {item.barcode}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.category_name}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{item.current_quantity || 0}</div>
                        <div className="text-xs text-gray-500">Min: {item.minimum_stock_level || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStockStatus(item)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">₹{(Number(item.selling_price) || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Cost: ₹{(Number(item.unit_price) || 0).toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{item.storage_location || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => openRestockModal(item)}
                          className="text-green-600 hover:text-green-800"
                          title="Restock"
                        >
                          <FiPackage />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Add Inventory Item</h2>
            </div>
            <form onSubmit={handleAddInventory} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.currentQuantity}
                    onChange={(e) => setFormData({ ...formData, currentQuantity: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.minimumStockLevel}
                    onChange={(e) => setFormData({ ...formData, minimumStockLevel: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.maximumStockLevel}
                    onChange={(e) => setFormData({ ...formData, maximumStockLevel: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, bin_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Edit Inventory Item</h2>
              <p className="text-gray-600">{selectedItem.product_name}</p>
            </div>
            <form onSubmit={handleUpdateInventory} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.minimumStockLevel}
                    onChange={(e) => setFormData({ ...formData, minimumStockLevel: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.maximumStockLevel}
                    onChange={(e) => setFormData({ ...formData, maximumStockLevel: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bin Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, bin_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Update Item
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Restock Item</h2>
              <p className="text-gray-600">{selectedItem.product_name}</p>
              <p className="text-sm text-gray-500">Current Stock: {selectedItem.current_quantity || 0}</p>
            </div>
            <form onSubmit={handleRestock} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={restockData.quantity}
                    onChange={(e) => setRestockData({ ...restockData, quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={restockData.unitPrice}
                    onChange={(e) => setRestockData({ ...restockData, unitPrice: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={restockData.supplierName}
                    onChange={(e) => setRestockData({ ...restockData, supplierName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={restockData.invoiceNumber}
                    onChange={(e) => setRestockData({ ...restockData, invoiceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={restockData.notes}
                    onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    New Stock: <span className="font-bold">{(selectedItem.current_quantity || 0) + (restockData.quantity || 0)}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Total Cost: <span className="font-bold">₹{((restockData.quantity || 0) * (restockData.unitPrice || 0)).toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Restock
                </button>
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
