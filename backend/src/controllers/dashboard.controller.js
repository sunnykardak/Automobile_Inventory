const { query } = require('../config/database');
const logger = require('../utils/logger');

// @desc    Get dashboard overview
// @route   GET /api/v1/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Total jobs today
    const totalJobsTodayResult = await query(
      `SELECT COUNT(*) as count FROM job_cards WHERE DATE(created_at) = $1`,
      [today]
    );
    
    // Pending jobs
    const pendingJobsResult = await query(
      `SELECT COUNT(*) as count FROM job_cards 
       WHERE status IN ('Created', 'In Progress', 'Washing')`
    );
    
    // Completed jobs today
    const completedJobsTodayResult = await query(
      `SELECT COUNT(*) as count FROM job_cards 
       WHERE DATE(completed_at) = $1 AND status = 'Completed'`,
      [today]
    );
    
    // Today's revenue
    const todayRevenueResult = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue 
       FROM bills WHERE DATE(created_at) = $1`,
      [today]
    );
    
    // Monthly revenue
    const monthlyRevenueResult = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue 
       FROM bills 
       WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );
    
    // Low stock alerts
    const lowStockResult = await query(
      `SELECT COUNT(*) as count FROM inventory 
       WHERE current_quantity <= minimum_stock_level AND is_active = true`
    );
    
    // Top used spare parts (last 30 days)
    const topPartsResult = await query(
      `SELECT i.barcode, pm.name, m.name as manufacturer, 
              SUM(jp.quantity) as total_used
       FROM job_products jp
       JOIN inventory i ON jp.inventory_id = i.id
       JOIN product_master pm ON i.product_master_id = pm.id
       LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
       JOIN job_cards jc ON jp.job_card_id = jc.id
       WHERE jc.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY i.barcode, pm.name, m.name
       ORDER BY total_used DESC
       LIMIT 10`
    );
    
    // Top performing mechanics (last 30 days)
    const topMechanicsResult = await query(
      `SELECT e.id, e.first_name, e.last_name,
              COUNT(jc.id) as jobs_completed,
              COALESCE(SUM(ec.commission_amount), 0) as total_commission
       FROM employees e
       LEFT JOIN job_cards jc ON e.id = jc.assigned_mechanic_id 
         AND jc.status = 'Completed'
         AND jc.completed_at >= CURRENT_DATE - INTERVAL '30 days'
       LEFT JOIN employee_commissions ec ON e.id = ec.employee_id
         AND ec.created_at >= CURRENT_DATE - INTERVAL '30 days'
       WHERE e.is_active = true
       GROUP BY e.id, e.first_name, e.last_name
       ORDER BY jobs_completed DESC
       LIMIT 10`
    );
    
    // Revenue graph data (last 7 days)
    const revenueGraphResult = await query(
      `SELECT DATE(created_at) as date, 
              COALESCE(SUM(total_amount), 0) as revenue
       FROM bills
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`
    );
    
    // Active jobs status distribution
    const jobsStatusResult = await query(
      `SELECT status, COUNT(*) as count
       FROM job_cards
       WHERE status IN ('Created', 'In Progress', 'Washing')
       GROUP BY status`
    );
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalJobsToday: parseInt(totalJobsTodayResult.rows[0].count),
          pendingJobs: parseInt(pendingJobsResult.rows[0].count),
          completedJobsToday: parseInt(completedJobsTodayResult.rows[0].count),
          todayRevenue: parseFloat(todayRevenueResult.rows[0].revenue),
          monthlyRevenue: parseFloat(monthlyRevenueResult.rows[0].revenue),
          lowStockItems: parseInt(lowStockResult.rows[0].count),
        },
        topUsedParts: topPartsResult.rows,
        topMechanics: topMechanicsResult.rows,
        revenueGraph: revenueGraphResult.rows,
        jobsStatus: jobsStatusResult.rows,
      },
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message,
    });
  }
};

// @desc    Get monthly revenue chart data
// @route   GET /api/v1/dashboard/revenue-chart
// @access  Private
exports.getRevenueChart = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const result = await query(
      `SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(DISTINCT id) as bill_count
       FROM bills
       WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
       GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC`
    );
    
    res. status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Get revenue chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue chart data',
      error: error.message,
    });
  }
};

// @desc    Get recent activities
// @route   GET /api/v1/dashboard/activities
// @access  Private
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const result = await query(
      `SELECT 
        al.id,
        al.action,
        al.table_name,
        al.created_at,
        u.username
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activities',
      error: error.message,
    });
  }
};
