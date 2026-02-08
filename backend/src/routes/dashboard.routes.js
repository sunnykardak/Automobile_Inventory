const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', dashboardController.getDashboard);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/activities', dashboardController.getRecentActivities);

module.exports = router;
