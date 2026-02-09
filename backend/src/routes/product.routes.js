const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Get all products from product_master
router.get('/', authenticate, async (req, res) => {
  try {
    const { manufacturer_id, category_id, search } = req.query;
    
    let queryText = `
      SELECT 
        pm.id,
        pm.manufacturer_id,
        pm.category_id,
        pm.name,
        pm.part_number,
        pm.description,
        pm.specifications,
        pm.is_active,
        pm.created_at,
        pm.updated_at,
        m.name as manufacturer_name,
        c.name as category_name
      FROM product_master pm
      LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
      LEFT JOIN categories c ON pm.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (manufacturer_id) {
      params.push(manufacturer_id);
      queryText += ` AND pm.manufacturer_id = $${params.length}`;
    }
    
    if (category_id) {
      params.push(category_id);
      queryText += ` AND pm.category_id = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (pm.name ILIKE $${params.length} OR pm.part_number ILIKE $${params.length})`;
    }
    
    queryText += ` ORDER BY pm.name ASC`;
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// Get single product by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        pm.*,
        m.name as manufacturer_name,
        c.name as category_name
      FROM product_master pm
      LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
      LEFT JOIN categories c ON pm.category_id = c.id
      WHERE pm.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// Create new product
router.post('/', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const {
      manufacturer_id,
      category_id,
      name,
      part_number,
      description,
      specifications,
      unit_price,
      reorder_level
    } = req.body;
    
    const result = await query(`
      INSERT INTO product_master (
        manufacturer_id,
        category_id,
        name,
        part_number,
        description,
        specifications,
        unit_price,
        reorder_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      manufacturer_id,
      category_id,
      name,
      part_number,
      description,
      specifications || null,
      unit_price || null,
      reorder_level || null
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Update product
router.put('/:id', authenticate, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      manufacturer_id,
      category_id,
      name,
      part_number,
      description,
      specifications,
      unit_price,
      reorder_level
    } = req.body;
    
    const result = await query(`
      UPDATE product_master
      SET
        manufacturer_id = COALESCE($1, manufacturer_id),
        category_id = COALESCE($2, category_id),
        name = COALESCE($3, name),
        part_number = COALESCE($4, part_number),
        description = COALESCE($5, description),
        specifications = COALESCE($6, specifications),
        unit_price = COALESCE($7, unit_price),
        reorder_level = COALESCE($8, reorder_level),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      manufacturer_id,
      category_id,
      name,
      part_number,
      description,
      specifications,
      unit_price,
      reorder_level,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// Delete product
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product is used in inventory
    const inventoryCheck = await query(
      'SELECT COUNT(*) FROM inventory WHERE product_master_id = $1',
      [id]
    );
    
    if (parseInt(inventoryCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product as it is used in inventory'
      });
    }
    
    const result = await query(
      'DELETE FROM product_master WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

module.exports = router;
