const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Alert routes (must come before /:id to avoid conflicts)
router.get('/alerts', inventoryController.getAllAlerts);
router.get('/alerts/stats', inventoryController.getAlertStats);
router.get('/alerts/fast-moving', inventoryController.getFastMovingItems);
router.get('/alerts/dead-stock', inventoryController.getDeadStock);
router.get('/alerts/purchase-suggestions', inventoryController.getPurchaseSuggestions);
router.get('/alerts/movement-analysis', inventoryController.getMovementAnalysis);
router.get('/alerts/low-stock', inventoryController.getLowStockItems); // Keep for backwards compatibility

// Inventory management routes
router.get('/', inventoryController.getAllInventory);
router.get('/barcode/:barcode', inventoryController.searchByBarcode);
router.get('/:id', inventoryController.getInventoryById);
router.post('/', authorize('Admin', 'Owner', 'Manager'), inventoryController.createInventory);
router.put('/:id', authorize('Admin', 'Owner', 'Manager'), inventoryController.updateInventory);
router.patch('/:id/minimum-stock', authorize('Admin', 'Owner', 'Manager'), inventoryController.updateMinimumStock);
router.post('/:id/restock', authorize('Admin', 'Owner', 'Manager'), inventoryController.restockInventory);

module.exports = router;
