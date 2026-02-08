const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', inventoryController.getAllInventory);
router.get('/alerts/low-stock', inventoryController.getLowStockItems);
router.get('/barcode/:barcode', inventoryController.searchByBarcode);
router.get('/:id', inventoryController.getInventoryById);
router.post('/', authorize('Admin', 'Owner', 'Manager'), inventoryController.createInventory);
router.put('/:id', authorize('Admin', 'Owner', 'Manager'), inventoryController.updateInventory);
router.post('/:id/restock', authorize('Admin', 'Owner', 'Manager'), inventoryController.restockInventory);

module.exports = router;
