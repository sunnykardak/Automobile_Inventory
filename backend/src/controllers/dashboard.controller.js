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
    
    // Today's revenue (Bills + Completed Service Tokens)
    const todayRevenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as revenue 
       FROM bills WHERE DATE(created_at) = $1
       UNION ALL
       SELECT 
        COALESCE(SUM(amount), 0) as revenue 
       FROM service_tokens 
       WHERE DATE(completed_at) = $1 AND status = 'completed'`,
      [today]
    );
    
    const todayRevenue = todayRevenueResult.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0);
    
    // Monthly revenue (Bills + Completed Service Tokens)
    const monthlyRevenueResult = await query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as revenue 
       FROM bills 
       WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       UNION ALL
       SELECT 
        COALESCE(SUM(amount), 0) as revenue 
       FROM service_tokens 
       WHERE EXTRACT(MONTH FROM completed_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM completed_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND status = 'completed'`
    );
    
    const monthlyRevenue = monthlyRevenueResult.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0);
    
    // Service tokens today
    const serviceTokensTodayResult = await query(
      `SELECT COUNT(*) as count FROM service_tokens WHERE DATE(created_at) = $1`,
      [today]
    );
    
    // Completed service tokens today
    const completedTokensTodayResult = await query(
      `SELECT COUNT(*) as count FROM service_tokens 
       WHERE DATE(completed_at) = $1 AND status = 'completed'`,
      [today]
    );
    
    // Low stock alerts
    const lowStockResult = await query(
      `SELECT COUNT(*) as count FROM inventory 
       WHERE current_quantity <= minimum_stock_level AND is_active = true`
    );
    
    // Top used spare parts (last 30 days)
    const topPartsResult = await query(
      `SELECT pm.name, COALESCE(m.name, i.brand) as manufacturer, 
              SUM(jp.quantity) as total_used
       FROM job_products jp
       JOIN inventory i ON jp.inventory_id = i.id
       JOIN product_master pm ON i.product_master_id = pm.id
       LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
       JOIN job_cards jc ON jp.job_card_id = jc.id
       WHERE DATE(jc.created_at) >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY pm.name, m.name, i.brand
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
    
    // Revenue graph data (last 7 days) - Bills + Service Tokens
    const revenueGraphResult = await query(
      `WITH daily_bills AS (
        SELECT DATE(created_at) as date, 
               COALESCE(SUM(total_amount), 0) as revenue
        FROM bills
        WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(created_at)
      ),
      daily_tokens AS (
        SELECT DATE(completed_at) as date,
               COALESCE(SUM(amount), 0) as revenue
        FROM service_tokens
        WHERE DATE(completed_at) >= CURRENT_DATE - INTERVAL '6 days'
        AND status = 'completed'
        GROUP BY DATE(completed_at)
      ),
      all_dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date as date
      )
      SELECT 
        ad.date,
        COALESCE(db.revenue, 0) + COALESCE(dt.revenue, 0) as revenue
      FROM all_dates ad
      LEFT JOIN daily_bills db ON ad.date = db.date
      LEFT JOIN daily_tokens dt ON ad.date = dt.date
      ORDER BY ad.date ASC`
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
          todayRevenue: todayRevenue,
          monthlyRevenue: monthlyRevenue,
          lowStockItems: parseInt(lowStockResult.rows[0].count),
          serviceTokensToday: parseInt(serviceTokensTodayResult.rows[0].count),
          completedTokensToday: parseInt(completedTokensTodayResult.rows[0].count),
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
      `WITH bills_revenue AS (
        SELECT 
          TO_CHAR(created_at, 'Mon YYYY') as month,
          DATE_TRUNC('month', created_at) as month_date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(DISTINCT id) as bill_count
        FROM bills
        WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ),
      tokens_revenue AS (
        SELECT 
          TO_CHAR(completed_at, 'Mon YYYY') as month,
          DATE_TRUNC('month', completed_at) as month_date,
          COALESCE(SUM(amount), 0) as revenue,
          COUNT(DISTINCT id) as token_count
        FROM service_tokens
        WHERE completed_at >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
        AND status = 'completed'
        GROUP BY TO_CHAR(completed_at, 'Mon YYYY'), DATE_TRUNC('month', completed_at)
      )
      SELECT 
        COALESCE(br.month, tr.month) as month,
        COALESCE(br.month_date, tr.month_date) as month_date,
        COALESCE(br.revenue, 0) + COALESCE(tr.revenue, 0) as revenue,
        COALESCE(br.bill_count, 0) as bill_count,
        COALESCE(tr.token_count, 0) as token_count
      FROM bills_revenue br
      FULL OUTER JOIN tokens_revenue tr ON br.month_date = tr.month_date
      ORDER BY COALESCE(br.month_date, tr.month_date) ASC`
    );
    
    res.status(200).json({
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
