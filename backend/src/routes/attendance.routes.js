const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get attendance records
router.get('/', async (req, res) => {
  try {
    const { employeeId, startDate, endDate, page = 1, limit = 30 } = req.query;
    
    let queryText = `
      SELECT a.*, 
             e.first_name || ' ' || e.last_name as employee_name,
             u.username as marked_by_name
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN users u ON a.marked_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (employeeId) {
      queryText += ` AND a.employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }
    
    if (startDate) {
      queryText += ` AND a.date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      queryText += ` AND a.date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    queryText += ` ORDER BY a.date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(queryText, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark attendance
router.post('/', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, leaveType, notes } = req.body;
    
    const result = await query(`
      INSERT INTO attendance (
        employee_id, date, check_in, check_out, status, leave_type, notes, marked_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (employee_id, date) DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        status = EXCLUDED.status,
        leave_type = EXCLUDED.leave_type,
        notes = EXCLUDED.notes,
        marked_by = EXCLUDED.marked_by
      RETURNING *
    `, [employeeId, date, checkIn, checkOut, status, leaveType, notes, req.user.id]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get today's attendance summary
router.get('/today', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        e.id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.designation,
        a.status,
        a.check_in,
        a.check_out
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = CURRENT_DATE
      WHERE e.is_active = true
      ORDER BY e.first_name
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
