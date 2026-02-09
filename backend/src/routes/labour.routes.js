const express = require('express');
const router = express.Router();
const labourController = require('../controllers/labour.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', labourController.getAllLabourCharges);
router.post('/', authorize('Admin', 'Owner', 'Manager'), labourController.createLabourCharge);
router.delete('/:id', authorize('Admin', 'Owner', 'Manager'), labourController.deleteLabourCharge);

module.exports = router;
