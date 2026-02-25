const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all tax routes
router.use(authenticate);

// =========================================
// GST RATES ROUTES
// =========================================

// Get all GST rates
router.get('/gst-rates', taxController.getAllGSTRates);

// Get GST rate by ID
router.get('/gst-rates/:id', taxController.getGSTRateById);

// Create new GST rate
router.post('/gst-rates', taxController.createGSTRate);

// Update GST rate
router.put('/gst-rates/:id', taxController.updateGSTRate);

// Delete GST rate
router.delete('/gst-rates/:id', taxController.deleteGSTRate);

// =========================================
// TAX CONFIGURATION ROUTES
// =========================================

// Get all tax configurations
router.get('/configuration', taxController.getTaxConfiguration);

// Update single tax configuration
router.post('/configuration', taxController.updateTaxConfiguration);

// Bulk update tax configurations
router.post('/configuration/bulk', taxController.bulkUpdateTaxConfiguration);

// =========================================
// GST REPORTS ROUTES
// =========================================

// Get GST dashboard statistics
router.get('/reports/dashboard-stats', taxController.getGSTDashboardStats);

// Get GST sales register (GSTR-1 format)
router.get('/reports/sales-register', taxController.getGSTSalesRegister);

// Get GST monthly summary
router.get('/reports/monthly-summary', taxController.getGSTMonthlySummary);

// Get HSN-wise summary
router.get('/reports/hsn-summary', taxController.getHSNWiseSummary);

// Get GST liability
router.get('/reports/liability', taxController.getGSTLiability);

// =========================================
// UTILITY ROUTES
// =========================================

// Calculate GST breakdown
router.post('/calculate', taxController.calculateGSTBreakdown);

module.exports = router;
