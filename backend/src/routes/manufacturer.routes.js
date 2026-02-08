const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get all manufacturers
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM manufacturers
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get manufacturer by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM manufacturers WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create manufacturer
router.post('/', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const { name, country, website, contactInfo } = req.body;
    
    const result = await query(`
      INSERT INTO manufacturers (name, country, website, contact_info)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, country, website, contactInfo]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update manufacturer
router.put('/:id', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const { name, country, website, contactInfo, isActive } = req.body;
    
    const result = await query(`
      UPDATE manufacturers SET
        name = COALESCE($1, name),
        country = COALESCE($2, country),
        website = COALESCE($3, website),
        contact_info = COALESCE($4, contact_info),
        is_active = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *
    `, [name, country, website, contactInfo, isActive, req.params.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
