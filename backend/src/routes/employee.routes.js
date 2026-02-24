const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.username, u.email, r.name as role_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE e.is_active = true
      ORDER BY e.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.username, u.email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create employee
router.post('/', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const {
      userId, firstName, lastName, phone, address, dateOfBirth,
      dateOfJoining, designation, commissionPercentage, baseSalary,
      idProofType, idProofNumber, pfNumber
    } = req.body;
    
    const result = await query(`
      INSERT INTO employees (
        user_id, first_name, last_name, phone, address, date_of_birth,
        date_of_joining, designation, commission_percentage, base_salary,
        id_proof_type, id_proof_number, pf_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      userId, firstName, lastName, phone, address, dateOfBirth,
      dateOfJoining, designation, commissionPercentage || 0, baseSalary || 0,
      idProofType, idProofNumber, pfNumber
    ]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update employee
router.put('/:id', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const {
      firstName, lastName, phone, address, designation,
      commissionPercentage, baseSalary, isActive
    } = req.body;
    
    const result = await query(`
      UPDATE employees SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        designation = COALESCE($5, designation),
        commission_percentage = COALESCE($6, commission_percentage),
        base_salary = COALESCE($7, base_salary),
        is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *
    `, [firstName, lastName, phone, address, designation, 
        commissionPercentage, baseSalary, isActive, req.params.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get employee commissions
router.get('/:id/commissions', async (req, res) => {
  try {
    const result = await query(`
      SELECT ec.*, b.bill_number, jc.job_number
      FROM employee_commissions ec
      LEFT JOIN bills b ON ec.bill_id = b.id
      LEFT JOIN job_cards jc ON ec.job_card_id = jc.id
      WHERE ec.employee_id = $1
      ORDER BY ec.created_at DESC
    `, [req.params.id]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================
// PERFORMANCE TRACKING ENDPOINTS
// =========================================

// Get all mechanics performance overview
router.get('/performance/overview', async (req, res) => {
  try {
    const { sortBy = 'total_revenue_generated', order = 'DESC', active = 'true' } = req.query;
    
    const validSortColumns = [
      'mechanic_name', 'total_jobs_assigned', 'jobs_completed', 
      'completion_rate_percentage', 'total_revenue_generated',
      'avg_job_value', 'avg_completion_days', 'total_commission_earned'
    ];
    
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'total_revenue_generated';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    let queryText = `SELECT * FROM mechanic_performance_overview`;
    
    if (active === 'true') {
      queryText += ` WHERE is_active = true`;
    }
    
    queryText += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    const result = await query(queryText);
    
    res.json({ 
      success: true, 
      data: result.rows,
      meta: {
        total: result.rows.length,
        sortBy: sortColumn,
        order: sortOrder
      }
    });
  } catch (error) {
    console.error('Get performance overview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific mechanic's detailed performance
router.get('/performance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Get overview data
    const overviewResult = await query(
      `SELECT * FROM mechanic_performance_overview WHERE mechanic_id = $1`,
      [id]
    );
    
    if (overviewResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mechanic not found' 
      });
    }
    
    // Get monthly performance
    const monthlyResult = await query(
      `SELECT * FROM mechanic_monthly_performance 
       WHERE mechanic_id = $1 
       ORDER BY performance_month DESC 
       LIMIT 12`,
      [id]
    );
    
    // Get recent jobs
    const recentJobsResult = await query(
      `SELECT 
        jc.*,
        b.total_amount,
        b.payment_status,
        EXTRACT(EPOCH FROM (jc.completed_at - jc.created_at)) / 3600.0 as completion_hours
       FROM job_cards jc
       LEFT JOIN bills b ON jc.id = b.job_card_id
       WHERE jc.assigned_mechanic_id = $1
       ORDER BY jc.created_at DESC
       LIMIT 20`,
      [id]
    );
    
    // Get attendance summary (last 30 days)
    const attendanceResult = await query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM attendance
       WHERE employee_id = $1
         AND date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY status`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        overview: overviewResult.rows[0],
        monthlyPerformance: monthlyResult.rows,
        recentJobs: recentJobsResult.rows,
        attendance: attendanceResult.rows
      }
    });
  } catch (error) {
    console.error('Get mechanic performance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get performance comparison between mechanics
router.get('/performance/compare', async (req, res) => {
  try {
    const { ids, startDate, endDate } = req.query;
    
    if (!ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mechanic IDs are required for comparison' 
      });
    }
    
    const mechanicIds = ids.split(',').map(id => parseInt(id));
    
    const result = await query(
      `SELECT * FROM mechanic_performance_overview 
       WHERE mechanic_id = ANY($1)
       ORDER BY total_revenue_generated DESC`,
      [mechanicIds]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get performance comparison error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get performance trends (monthly data for charts)
router.get('/performance/trends', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const result = await query(
      `SELECT 
        mechanic_id,
        mechanic_name,
        performance_month,
        month_name,
        jobs_assigned,
        jobs_completed,
        revenue_generated,
        commission_earned,
        days_present,
        avg_completion_days
       FROM mechanic_monthly_performance
       WHERE performance_month >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
       ORDER BY mechanic_id, performance_month ASC`
    );
    
    // Group by mechanic
    const groupedData = result.rows.reduce((acc, row) => {
      if (!acc[row.mechanic_id]) {
        acc[row.mechanic_id] = {
          mechanic_id: row.mechanic_id,
          mechanic_name: row.mechanic_name,
          data: []
        };
      }
      acc[row.mechanic_id].data.push({
        month: row.month_name,
        month_date: row.performance_month,
        jobs_assigned: row.jobs_assigned,
        jobs_completed: row.jobs_completed,
        revenue: parseFloat(row.revenue_generated),
        commission: parseFloat(row.commission_earned),
        attendance: row.days_present,
        avg_completion_days: parseFloat(row.avg_completion_days || 0)
      });
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: Object.values(groupedData)
    });
  } catch (error) {
    console.error('Get performance trends error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get leaderboard (top performers)
router.get('/performance/leaderboard', async (req, res) => {
  try {
    const { metric = 'revenue', period = '30', limit = 10 } = req.query;
    
    let orderColumn = 'total_revenue_generated';
    
    switch(metric) {
      case 'jobs':
        orderColumn = 'jobs_completed';
        break;
      case 'efficiency':
        orderColumn = 'completion_rate_percentage';
        break;
      case 'speed':
        orderColumn = 'avg_completion_days';
        break;
      default:
        orderColumn = 'total_revenue_generated';
    }
    
    const result = await query(
      `SELECT 
        mechanic_id,
        mechanic_name,
        designation,
        total_jobs_assigned,
        jobs_completed,
        completion_rate_percentage,
        total_revenue_generated,
        avg_completion_days,
        total_commission_earned,
        jobs_last_${period}_days
       FROM mechanic_performance_overview
       WHERE is_active = true
       ORDER BY ${orderColumn} ${metric === 'speed' ? 'ASC' : 'DESC'}
       LIMIT $1`,
      [parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        metric: metric,
        period: period,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
