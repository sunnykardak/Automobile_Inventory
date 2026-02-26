const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

// Apply authentication to all routes
router.use(authenticate);

// =========================================
// PAYMENT METHODS ROUTES
// =========================================

/**
 * GET /api/v1/payments/methods
 * Get all payment methods
 */
router.get('/methods', paymentController.getPaymentMethods);

/**
 * PUT /api/v1/payments/methods/:id
 * Update payment method configuration
 * Access: Admin, Owner, Manager
 */
router.put('/methods/:id', authorize('Admin', 'Owner', 'Manager'), paymentController.updatePaymentMethod);

// =========================================
// PAYMENT TRANSACTIONS ROUTES
// =========================================

/**
 * POST /api/v1/payments/process
 * Process a payment
 * Access: Admin, Owner, Manager, Cashier
 */
router.post('/process', authorize('Admin', 'Owner', 'Manager', 'Cashier'), paymentController.processPayment);

/**
 * GET /api/v1/payments/transactions
 * Get all payment transactions with filters
 */
router.get('/transactions', paymentController.getPaymentTransactions);

/**
 * GET /api/v1/payments/transactions/:id
 * Get payment transaction by ID
 */
router.get('/transactions/:id', paymentController.getPaymentTransactionById);

/**
 * PUT /api/v1/payments/transactions/:id/status
 * Update payment transaction status
 * Access: Admin, Owner, Manager
 */
router.put('/transactions/:id/status', authorize('Admin', 'Owner', 'Manager'), paymentController.updatePaymentStatus);

/**
 * PUT /api/v1/payments/transactions/:id/reconcile
 * Mark transaction as reconciled
 * Access: Admin, Owner, Manager
 */
router.put('/transactions/:id/reconcile', authorize('Admin', 'Owner', 'Manager'), paymentController.markReconciled);

// =========================================
// PAYMENT LINKS ROUTES
// =========================================

/**
 * POST /api/v1/payments/links
 * Create a payment link
 * Access: Admin, Owner, Manager, Cashier
 */
router.post('/links', authorize('Admin', 'Owner', 'Manager', 'Cashier'), paymentController.createPaymentLink);

/**
 * GET /api/v1/payments/links
 * Get all payment links
 */
router.get('/links', paymentController.getPaymentLinks);

/**
 * GET /api/v1/payments/links/:link_id
 * Get payment link by link_id (public access for customers)
 * Note: This route doesn't require authentication for customer access
 */
router.get('/pay/:link_id', paymentController.getPaymentLinkByLinkId);

// =========================================
// PAYMENT ANALYTICS ROUTES
// =========================================

/**
 * GET /api/v1/payments/stats
 * Get payment statistics and dashboard data
 * Access: Admin, Owner, Manager
 */
router.get('/stats', authorize('Admin', 'Owner', 'Manager'), paymentController.getPaymentStats);

/**
 * GET /api/v1/payments/pending
 * Get all pending payments
 * Access: Admin, Owner, Manager, Cashier
 */
router.get('/pending', authorize('Admin', 'Owner', 'Manager', 'Cashier'), paymentController.getPendingPayments);

/**
 * GET /api/v1/payments/reconciliation
 * Get reconciliation dashboard
 * Access: Admin, Owner, Manager
 */
router.get('/reconciliation', authorize('Admin', 'Owner', 'Manager'), paymentController.getReconciliationDashboard);

// =========================================
// PAYMENT REMINDERS ROUTES
// =========================================

/**
 * POST /api/v1/payments/reminders
 * Create a payment reminder
 * Access: Admin, Owner, Manager, Cashier
 */
router.post('/reminders', authorize('Admin', 'Owner', 'Manager', 'Cashier'), paymentController.createPaymentReminder);

/**
 * GET /api/v1/payments/reminders
 * Get payment reminders
 * Access: Admin, Owner, Manager, Cashier
 */
router.get('/reminders', authorize('Admin', 'Owner', 'Manager', 'Cashier'), paymentController.getPaymentReminders);

module.exports = router;
