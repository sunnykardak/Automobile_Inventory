const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// Get all vehicle models (with optional manufacturer filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const { manufacturer_id, vehicle_type, search } = req.query;
    
    let queryText = `
      SELECT 
        vm.id,
        vm.manufacturer_id,
        vm.model_name,
        vm.model_year_start,
        vm.model_year_end,
        vm.vehicle_type,
        vm.engine_capacity,
        vm.is_active,
        vm.created_at,
        vm.updated_at,
        m.name as manufacturer_name
      FROM vehicle_models vm
      LEFT JOIN manufacturers m ON vm.manufacturer_id = m.id
      WHERE vm.is_active = true
    `;
    
    const params = [];
    
    if (manufacturer_id) {
      params.push(manufacturer_id);
      queryText += ` AND vm.manufacturer_id = $${params.length}`;
    }
    
    if (vehicle_type) {
      params.push(vehicle_type);
      queryText += ` AND vm.vehicle_type = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND vm.model_name ILIKE $${params.length}`;
    }
    
    queryText += ` ORDER BY m.name, vm.model_name ASC`;
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vehicle models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle models',
      error: error.message
    });
  }
});

// Get single vehicle model by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        vm.*,
        m.name as manufacturer_name
      FROM vehicle_models vm
      LEFT JOIN manufacturers m ON vm.manufacturer_id = m.id
      WHERE vm.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle model not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching vehicle model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle model',
      error: error.message
    });
  }
});

module.exports = router;
