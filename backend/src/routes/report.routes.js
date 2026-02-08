const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);
router.use(authorize('Admin', 'Owner', 'Manager'));

// Revenue report
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    let dateFormat;
    if (groupBy === 'month') {
      dateFormat = 'YYYY-MM';
    } else if (groupBy === 'year') {
      dateFormat = 'YYYY';
    } else {
      dateFormat = 'YYYY-MM-DD';
    }
    
    const result = await query(`
      SELECT 
        TO_CHAR(created_at, $1) as period,
        COUNT(*) as bill_count,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as collected_amount,
        COALESCE(SUM(total_amount - paid_amount), 0) as pending_amount
      FROM bills
      WHERE created_at >= COALESCE($2::date, CURRENT_DATE - INTERVAL '30 days')
        AND created_at <= COALESCE($3::date, CURRENT_DATE)
      GROUP BY TO_CHAR(created_at, $1)
      ORDER BY TO_CHAR(created_at, $1) DESC
    `, [dateFormat, startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inventory usage report
router.get('/inventory-usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await query(`
      SELECT 
        i.barcode,
        pm.name as product_name,
        m.name as manufacturer,
        SUM(jp.quantity) as total_used,
        SUM(jp.total_price) as total_value
      FROM job_products jp
      JOIN inventory i ON jp.inventory_id = i.id
      JOIN product_master pm ON i.product_master_id = pm.id
      LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
      JOIN job_cards jc ON jp.job_card_id = jc.id
      WHERE jc.created_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND jc.created_at <= COALESCE($2::date, CURRENT_DATE)
      GROUP BY i.barcode, pm.name, m.name
      ORDER BY total_used DESC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Employee performance report
router.get('/employee-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await query(`
      SELECT 
        e.id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.designation,
        COUNT(DISTINCT jc.id) as jobs_completed,
        COALESCE(SUM(ec.commission_amount), 0) as total_commission,
        COALESCE(SUM(CASE WHEN ec.status = 'Pending' THEN ec.commission_amount ELSE 0 END), 0) as pending_commission
      FROM employees e
      LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id 
        AND jc.status = 'Completed'
        AND jc.completed_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND jc.completed_at <= COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN employee_commissions ec ON e.id = ec.employee_id
        AND ec.created_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND ec.created_at <= COALESCE($2::date, CURRENT_DATE)
      WHERE e.is_active = true
      GROUP BY e.id, e.first_name, e.last_name, e.designation
      ORDER BY jobs_completed DESC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Vehicle servicing report
router.get('/vehicle-servicing', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await query(`
      SELECT 
        vehicle_type,
        vehicle_brand,
        COUNT(*) as service_count,
        AVG(actual_cost) as avg_cost
      FROM job_cards
      WHERE status = 'Completed'
        AND completed_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND completed_at <= COALESCE($2::date, CURRENT_DATE)
      GROUP BY vehicle_type, vehicle_brand
      ORDER BY service_count DESC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
