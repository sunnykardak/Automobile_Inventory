const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.post('/', jobController.createJob);
router.put('/:id', jobController.updateJob);
router.post('/:id/products', jobController.addProductToJob);
router.delete('/:id/products/:productId', jobController.removeProductFromJob);
router.post('/:id/complete', jobController.completeJob);

module.exports = router;
