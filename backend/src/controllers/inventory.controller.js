const { query } = require('../config/database');
const logger = require('../utils/logger');

// @desc    Get all inventory items  
// @route   GET /api/v1/inventory
// @access  Private
exports.getAllInventory = async (req, res) => {
  try {
    const { search, categoryId, lowStock, page = 1, limit = 50 } = req.query;
    
    let queryText = `
      SELECT i.*,
             pm.name as product_name,
             pm.part_number,
             m.name as manufacturer_name,
             c.name as category_name
      FROM inventory i
      LEFT JOIN product_master pm ON i.product_master_id = pm.id
      LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
      LEFT JOIN categories c ON pm.category_id = c.id
      WHERE i.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      queryText += ` AND (pm.name ILIKE $${paramIndex} OR i.barcode ILIKE $${paramIndex} OR i.brand ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (categoryId) {
      queryText += ` AND pm.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }
    
    if (lowStock === 'true') {
      queryText += ` AND i.current_quantity <= i.minimum_stock_level`;
    }
    
    queryText += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(queryText, params);
    
    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM inventory WHERE is_active = true'
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory',
      error: error.message,
    });
  }
};

// @desc    Get single inventory item
// @route   GET /api/v1/inventory/:id
// @access  Private
exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT i.*,
              pm.name as product_name,
              pm.part_number,
              pm.description,
              m.name as manufacturer_name,
              c.name as category_name
       FROM inventory i
       LEFT JOIN product_master pm ON i.product_master_id = pm.id
       LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
       LEFT JOIN categories c ON pm.category_id = c.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory item',
      error: error.message,
    });
  }
};

// @desc    Create inventory item
// @route   POST /api/v1/inventory
// @access  Private (Admin, Owner, Manager)
exports.createInventory = async (req, res) => {
  try {
    const {
      productMasterId,
      barcode,
      brand,
      currentQuantity,
      minimumStockLevel,
      unitPrice,
      sellingPrice,
      storageLocation,
      supplierName,
      supplierContact,
    } = req.body;
    
    if (!productMasterId || !currentQuantity || !unitPrice || !sellingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }
    
    const result = await query(
      `INSERT INTO inventory (
        product_master_id, barcode, brand, current_quantity,
        minimum_stock_level, unit_price, selling_price,
        storage_location, supplier_name, supplier_contact,
        last_restocked_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
       RETURNING *`,
      [
        productMasterId, barcode, brand, currentQuantity,
        minimumStockLevel || 10, unitPrice, sellingPrice,
        storageLocation, supplierName, supplierContact,
      ]
    );
    
    logger.info(`Inventory item created: ${result.rows[0].barcode}`);
    
    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Create inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message,
    });
  }
};

// @desc    Update inventory item
// @route   PUT /api/v1/inventory/:id
// @access  Private (Admin, Owner, Manager)
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productMasterId,
      brand,
      currentQuantity,
      minimumStockLevel,
      unitPrice,
      sellingPrice,
      storageLocation,
      supplierName,
      supplierContact,
      isActive,
    } = req.body;
    
    const result = await query(
      `UPDATE inventory SET
        product_master_id = COALESCE($1, product_master_id),
        brand = COALESCE($2, brand),
        current_quantity = COALESCE($3, current_quantity),
        minimum_stock_level = COALESCE($4, minimum_stock_level),
        unit_price = COALESCE($5, unit_price),
        selling_price = COALESCE($6, selling_price),
        storage_location = COALESCE($7, storage_location),
        supplier_name = COALESCE($8, supplier_name),
        supplier_contact = COALESCE($9, supplier_contact),
        is_active = COALESCE($10, is_active)
       WHERE id = $11
       RETURNING *`,
      [
        productMasterId, brand, currentQuantity, minimumStockLevel,
        unitPrice, sellingPrice, storageLocation, supplierName,
        supplierContact, isActive, id,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    logger.info(`Inventory item updated: ${result.rows[0].barcode}`);
    
    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message,
    });
  }
};

// @desc    Restock inventory item
// @route   POST /api/v1/inventory/:id/restock
// @access  Private (Admin, Owner, Manager)
exports.restockInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unitPrice } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid quantity',
      });
    }
    
    const result = await query(
      `UPDATE inventory SET
        current_quantity = current_quantity + $1,
        unit_price = COALESCE($2, unit_price),
        last_restocked_date = CURRENT_DATE
       WHERE id = $3
       RETURNING *`,
      [quantity, unitPrice, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    logger.info(`Inventory restocked: ${result.rows[0].barcode}, Qty: ${quantity}`);
    
    res.status(200).json({
      success: true,
      message: 'Inventory restocked successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Restock inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restock inventory',
      error: error.message,
    });
  }
};

// @desc    Get low stock items
// @route   GET /api/v1/inventory/alerts/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
  try {
    const result = await query('SELECT * FROM vw_low_stock_items ORDER BY current_quantity ASC');
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock items',
      error: error.message,
    });
  }
};

// @desc    Search inventory by barcode
// @route   GET /api/v1/inventory/barcode/:barcode
// @access  Private
exports.searchByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const result = await query(
      `SELECT i.*,
              pm.name as product_name,
              m.name as manufacturer_name,
              c.name as category_name
       FROM inventory i
       LEFT JOIN product_master pm ON i.product_master_id = pm.id
       LEFT JOIN manufacturers m ON pm.manufacturer_id = m.id
       LEFT JOIN categories c ON pm.category_id = c.id
       WHERE i.barcode = $1 AND i.is_active = true`,
      [barcode]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Search by barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search product',
      error: error.message,
    });
  }
};
