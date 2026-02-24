const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);
router.use(authorize('Admin', 'Owner', 'Manager'));

// Revenue report (Combined Bills + Service Tokens)
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate, type = 'daily' } = req.query;
    
    let dateFormat;
    if (type === 'monthly') {
      dateFormat = 'YYYY-MM';
    } else if (type === 'yearly') {
      dateFormat = 'YYYY';
    } else {
      dateFormat = 'YYYY-MM-DD';
    }
    
    // Combined revenue from bills and service tokens
    const result = await query(`
      WITH bill_revenue AS (
        SELECT 
          DATE(created_at) as date,
          TO_CHAR(created_at, $1) as period,
          COUNT(*) as bill_count,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(paid_amount), 0) as collected,
          COALESCE(SUM(total_amount - paid_amount), 0) as pending
        FROM bills
        WHERE DATE(created_at) >= COALESCE($2::date, CURRENT_DATE - INTERVAL '30 days')
          AND DATE(created_at) <= COALESCE($3::date, CURRENT_DATE)
        GROUP BY DATE(created_at), TO_CHAR(created_at, $1)
      ),
      token_revenue AS (
        SELECT 
          DATE(completed_at) as date,
          TO_CHAR(completed_at, $1) as period,
          COUNT(*) as token_count,
          COALESCE(SUM(amount), 0) as revenue
        FROM service_tokens
        WHERE status = 'completed'
          AND DATE(completed_at) >= COALESCE($2::date, CURRENT_DATE - INTERVAL '30 days')
          AND DATE(completed_at) <= COALESCE($3::date, CURRENT_DATE)
        GROUP BY DATE(completed_at), TO_CHAR(completed_at, $1)
      ),
      all_dates AS (
        SELECT DISTINCT period, date FROM (
          SELECT period, date FROM bill_revenue
          UNION
          SELECT period, date FROM token_revenue
        ) combined
      )
      SELECT 
        ad.period as date,
        COALESCE(br.bill_count, 0) + COALESCE(tr.token_count, 0) as total_bills,
        COALESCE(br.revenue, 0) + COALESCE(tr.revenue, 0) as total_revenue,
        COALESCE(br.collected, 0) + COALESCE(tr.revenue, 0) as collected_amount,
        COALESCE(br.pending, 0) as pending_amount
      FROM all_dates ad
      LEFT JOIN bill_revenue br ON ad.period = br.period
      LEFT JOIN token_revenue tr ON ad.period = tr.period
      ORDER BY ad.date DESC
    `, [dateFormat, startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inventory usage report
router.get('/inventory-usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await query(`
      SELECT 
        pm.name as product_name,
        COALESCE(m.name, i.brand) as brand,
        SUM(jp.quantity) as total_quantity_used,
        SUM(jp.total_price) as total_value
      FROM job_products jp
      JOIN inventory i ON jp.inventory_id = i.id
      JOIN product_master pm ON i.product_master_id = pm.id
      LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
      JOIN job_cards jc ON jp.job_card_id = jc.id
      WHERE DATE(jc.created_at) >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND DATE(jc.created_at) <= COALESCE($2::date, CURRENT_DATE)
      GROUP BY pm.name, m.name, i.brand
      ORDER BY total_quantity_used DESC
      LIMIT 20
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Inventory usage error:', error);
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
        COUNT(DISTINCT jc.id) as total_jobs_completed,
        COALESCE(SUM(ec.commission_amount), 0) as total_commission_earned
      FROM employees e
      LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id 
        AND jc.status = 'Completed'
        AND DATE(jc.completed_at) >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND DATE(jc.completed_at) <= COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN employee_commissions ec ON e.id = ec.employee_id
        AND DATE(ec.created_at) >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND DATE(ec.created_at) <= COALESCE($2::date, CURRENT_DATE)
      WHERE e.is_active = true
      GROUP BY e.id, e.first_name, e.last_name, e.designation
      HAVING COUNT(DISTINCT jc.id) > 0
      ORDER BY total_jobs_completed DESC
      LIMIT 20
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Employee performance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Vehicle servicing report (alias for vehicle-stats)
router.get('/vehicle-servicing', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await query(`
      SELECT 
        vehicle_brand,
        vehicle_model,
        COUNT(*) as total_services,
        AVG(actual_cost) as avg_cost
      FROM job_cards
      WHERE status = 'Completed'
        AND DATE(completed_at) >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND DATE(completed_at) <= COALESCE($2::date, CURRENT_DATE)
      GROUP BY vehicle_brand, vehicle_model
      ORDER BY total_services DESC
      LIMIT 20
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Vehicle servicing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Vehicle stats (same as vehicle-servicing for compatibility)
router.get('/vehicle-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await query(`
      SELECT 
        vehicle_brand,
        vehicle_model,
        COUNT(*) as total_services,
        AVG(actual_cost) as avg_cost
      FROM job_cards
      WHERE status = 'Completed'
        AND DATE(completed_at) >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND DATE(completed_at) <= COALESCE($2::date, CURRENT_DATE)
      GROUP BY vehicle_brand, vehicle_model
      ORDER BY total_services DESC
      LIMIT 20
    `, [startDate, endDate]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Vehicle stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
