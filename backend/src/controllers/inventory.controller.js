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
    
    // Handle supplier_contact - convert empty string to null for JSONB field
    let contactData = null;
    if (supplierContact && supplierContact !== '') {
      try {
        contactData = typeof supplierContact === 'string' ? JSON.parse(supplierContact) : supplierContact;
      } catch (e) {
        // If it's a plain string (like phone number), convert it to JSON object
        contactData = { contact: supplierContact };
      }
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
        productMasterId, barcode || null, brand, currentQuantity,
        minimumStockLevel || 10, unitPrice, sellingPrice,
        storageLocation || null, supplierName || null, contactData,
      ]
    );
    
    logger.info(`Inventory item created: ${result.rows[0].id}`);
    
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

// @desc    Get all inventory alerts
// @route   GET /api/v1/inventory/alerts
// @access  Private
exports.getAllAlerts = async (req, res) => {
  try {
    const { alertType, severity } = req.query;
    
    let queryText = 'SELECT * FROM vw_inventory_alerts WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (alertType) {
      queryText += ` AND alert_type = $${paramIndex}`;
      params.push(alertType);
      paramIndex++;
    }
    
    if (severity) {
      queryText += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    
    queryText += ` ORDER BY 
      CASE severity 
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
      END,
      CASE alert_type 
        WHEN 'OUT_OF_STOCK' THEN 1
        WHEN 'LOW_STOCK' THEN 2
        WHEN 'FAST_MOVING_LOW' THEN 3
        WHEN 'DEAD_STOCK' THEN 4
      END`;
    
    const result = await query(queryText, params);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Get all alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message,
    });
  }
};

// @desc    Get alert statistics
// @route   GET /api/v1/inventory/alerts/stats
// @access  Private
exports.getAlertStats = async (req, res) => {
  try {
    const result = await query('SELECT * FROM get_inventory_alert_stats()');
    
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Get alert stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alert statistics',
      error: error.message,
    });
  }
};

// @desc    Get fast-moving items
// @route   GET /api/v1/inventory/alerts/fast-moving
// @access  Private
exports.getFastMovingItems = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_fast_moving_items
      ORDER BY total_quantity_sold_30days DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Get fast-moving items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fast-moving items',
      error: error.message,
    });
  }
};

// @desc    Get dead stock items
// @route   GET /api/v1/inventory/alerts/dead-stock
// @access  Private
exports.getDeadStock = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_dead_stock_items
      ORDER BY days_since_last_sale DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Get dead stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dead stock items',
      error: error.message,
    });
  }
};

// @desc    Get purchase order suggestions
// @route   GET /api/v1/inventory/alerts/purchase-suggestions
// @access  Private
exports.getPurchaseSuggestions = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_purchase_order_suggestions
      ORDER BY 
        CASE priority
          WHEN 'URGENT - Out of Stock' THEN 1
          WHEN 'HIGH - Below Minimum' THEN 2
          WHEN 'MEDIUM - Fast Moving' THEN 3
          ELSE 4
        END,
        estimated_cost DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      totalEstimatedCost: result.rows.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0).toFixed(2),
    });
  } catch (error) {
    logger.error('Get purchase suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get purchase suggestions',
      error: error.message,
    });
  }
};

// @desc    Get inventory movement analysis
// @route   GET /api/v1/inventory/alerts/movement-analysis
// @access  Private
exports.getMovementAnalysis = async (req, res) => {
  try {
    const { minSales } = req.query;
    
    let queryText = 'SELECT * FROM vw_inventory_movement_analysis WHERE 1=1';
    const params = [];
    
    if (minSales) {
      queryText += ' AND qty_sold_30days >= $1';
      params.push(minSales);
    }
    
    queryText += ' ORDER BY qty_sold_30days DESC';
    
    const result = await query(queryText, params);
    
    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Get movement analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get movement analysis',
      error: error.message,
    });
  }
};

// @desc    Update minimum stock level
// @route   PATCH /api/v1/inventory/:id/minimum-stock
// @access  Private (Admin, Owner, Manager)
exports.updateMinimumStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { minimum_stock_level } = req.body;
    
    if (!minimum_stock_level || minimum_stock_level < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid minimum stock level is required',
      });
    }
    
    const result = await query(
      `UPDATE inventory 
       SET minimum_stock_level = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND is_active = true
       RETURNING *`,
      [minimum_stock_level, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    logger.info(`Minimum stock level updated for inventory ${id} to ${minimum_stock_level}`);
    
    res.status(200).json({
      success: true,
      message: 'Minimum stock level updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Update minimum stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update minimum stock level',
      error: error.message,
    });
  }
};

