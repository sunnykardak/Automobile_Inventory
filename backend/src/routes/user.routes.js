const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get all users
router.get('/', authorize('Admin', 'Owner'), async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.is_active, u.created_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.is_active, u.created_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/:id', authorize('Admin', 'Owner'), async (req, res) => {
  try {
    const { isActive, roleId } = req.body;
    const result = await query(`
      UPDATE users SET
        is_active = COALESCE($1, is_active),
        role_id = COALESCE($2, role_id)
      WHERE id = $3
      RETURNING id, username, email, is_active
    `, [isActive, roleId, req.params.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
