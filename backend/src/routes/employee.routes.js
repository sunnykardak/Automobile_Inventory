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

module.exports = router;
