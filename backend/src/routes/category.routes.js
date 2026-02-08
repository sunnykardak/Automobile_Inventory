const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.name ASC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create category
router.post('/', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const { name, parentId, description } = req.body;
    
    const result = await query(`
      INSERT INTO categories (name, parent_id, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, parentId, description]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update category
router.put('/:id', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const { name, parentId, description } = req.body;
    
    const result = await query(`
      UPDATE categories SET
        name = COALESCE($1, name),
        parent_id = COALESCE($2, parent_id),
        description = COALESCE($3, description)
      WHERE id = $4
      RETURNING *
    `, [name, parentId, description, req.params.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
