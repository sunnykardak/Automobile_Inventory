const express = require('express');
const router = express.Router();
const alertRulesController = require('../controllers/alertRules.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// Alert Rules Routes
// ============================================

// Get all alert rules
router.get('/rules', alertRulesController.getAllRules);

// Get single alert rule
router.get('/rules/:id', alertRulesController.getRuleById);

// Create new alert rule
router.post('/rules', alertRulesController.createRule);

// Update alert rule
router.put('/rules/:id', alertRulesController.updateRule);

// Delete alert rule
router.delete('/rules/:id', alertRulesController.deleteRule);

// Toggle rule active status
router.patch('/rules/:id/toggle', alertRulesController.toggleRuleStatus);

// ============================================
// Alert Checking Routes
// ============================================

// Run alert rules check
router.post('/check', alertRulesController.checkAlertRules);

// ============================================
// Alerts Routes
// ============================================

// Get all alerts
router.get('/alerts', alertRulesController.getAllAlerts);

// Get alert statistics
router.get('/stats', alertRulesController.getAlertStats);

// Acknowledge an alert
router.post('/alerts/:id/acknowledge', alertRulesController.acknowledgeAlert);

// Resolve an alert
router.post('/alerts/:id/resolve', alertRulesController.resolveAlert);

// ============================================
// Helper Routes (for dropdowns in UI)
// ============================================

// Get categories
router.get('/categories', alertRulesController.getCategories);

// Get manufacturers
router.get('/manufacturers', alertRulesController.getManufacturers);

module.exports = router;
