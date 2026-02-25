const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * TAX & GST MANAGEMENT CONTROLLER
 * Handles all tax configuration, GST calculations, and reporting
 */

// =========================================
// GST RATES MANAGEMENT
// =========================================

/**
 * Get all GST rates
 */
exports.getAllGSTRates = async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let query = 'SELECT * FROM gst_rates';
    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY gst_percentage DESC, category_name';
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error getting GST rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GST rates',
      error: error.message
    });
  }
};

/**
 * Get GST rate by ID
 */
exports.getGSTRateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM gst_rates WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'GST rate not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error getting GST rate by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GST rate',
      error: error.message
    });
  }
};

/**
 * Create new GST rate
 */
exports.createGSTRate = async (req, res) => {
  try {
    const {
      category_name,
      gst_percentage,
      cgst_percentage,
      sgst_percentage,
      igst_percentage,
      cess_percentage,
      hsn_code,
      description,
      is_active
    } = req.body;
    
    // Validation
    if (!category_name || gst_percentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category name and GST percentage are required'
      });
    }
    
    const result = await db.query(
      `INSERT INTO gst_rates (
        category_name, gst_percentage, cgst_percentage, sgst_percentage,
        igst_percentage, cess_percentage, hsn_code, description, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        category_name,
        gst_percentage,
        cgst_percentage || gst_percentage / 2,
        sgst_percentage || gst_percentage / 2,
        igst_percentage || gst_percentage,
        cess_percentage || 0,
        hsn_code,
        description,
        is_active !== undefined ? is_active : true
      ]
    );
    
    logger.info(`GST rate created: ${category_name}`);
    
    res.status(201).json({
      success: true,
      message: 'GST rate created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating GST rate:', error);
    
    if (error.constraint === 'unique_category_name') {
      return res.status(409).json({
        success: false,
        message: 'A GST rate with this category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create GST rate',
      error: error.message
    });
  }
};

/**
 * Update GST rate
 */
exports.updateGSTRate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const allowedFields = [
      'category_name', 'gst_percentage', 'cgst_percentage', 'sgst_percentage',
      'igst_percentage', 'cess_percentage', 'hsn_code', 'description', 'is_active'
    ];
    
    const setClause = [];
    const values = [];
    let paramCount = 1;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }
    
    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    values.push(id);
    
    const result = await db.query(
      `UPDATE gst_rates 
       SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'GST rate not found'
      });
    }
    
    logger.info(`GST rate updated: ID ${id}`);
    
    res.json({
      success: true,
      message: 'GST rate updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating GST rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GST rate',
      error: error.message
    });
  }
};

/**
 * Delete GST rate
 */
exports.deleteGSTRate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM gst_rates WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'GST rate not found'
      });
    }
    
    logger.info(`GST rate deleted: ID ${id}`);
    
    res.json({
      success: true,
      message: 'GST rate deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting GST rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete GST rate',
      error: error.message
    });
  }
};

// =========================================
// TAX CONFIGURATION MANAGEMENT
// =========================================

/**
 * Get all tax configurations
 */
exports.getTaxConfiguration = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tax_configuration ORDER BY config_key'
    );
    
    // Convert to key-value object
    const config = {};
    result.rows.forEach(row => {
      config[row.config_key] = {
        value: row.config_value,
        description: row.description,
        updated_at: row.updated_at
      };
    });
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error getting tax configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tax configuration',
      error: error.message
    });
  }
};

/**
 * Update tax configuration
 */
exports.updateTaxConfiguration = async (req, res) => {
  try {
    const { config_key, config_value } = req.body;
    
    if (!config_key || config_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'config_key and config_value are required'
      });
    }
    
    const result = await db.query(
      `INSERT INTO tax_configuration (config_key, config_value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (config_key) 
       DO UPDATE SET 
         config_value = $2,
         updated_by = $3,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [config_key, config_value, req.user?.id || null]
    );
    
    logger.info(`Tax configuration updated: ${config_key}`);
    
    res.json({
      success: true,
      message: 'Tax configuration updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating tax configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tax configuration',
      error: error.message
    });
  }
};

/**
 * Bulk update tax configuration
 */
exports.bulkUpdateTaxConfiguration = async (req, res) => {
  try {
    const { configurations } = req.body;
    
    if (!Array.isArray(configurations) || configurations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'configurations array is required'
      });
    }
    
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const updates = [];
      for (const config of configurations) {
        const result = await client.query(
          `INSERT INTO tax_configuration (config_key, config_value, updated_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (config_key) 
           DO UPDATE SET 
             config_value = $2,
             updated_by = $3,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [config.config_key, config.config_value, req.user?.id || null]
        );
        updates.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      logger.info(`Bulk tax configuration updated: ${updates.length} items`);
      
      res.json({
        success: true,
        message: `${updates.length} configurations updated successfully`,
        data: updates
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error bulk updating tax configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tax configurations',
      error: error.message
    });
  }
};

// =========================================
// GST REPORTS
// =========================================

/**
 * Get GST sales register (GSTR-1 format)
 */
exports.getGSTSalesRegister = async (req, res) => {
  try {
    const { start_date, end_date, transaction_type } = req.query;
    
    let query = 'SELECT * FROM vw_gst_sales_register WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      query += ` AND invoice_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND invoice_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    if (transaction_type) {
      query += ` AND transaction_type = $${paramCount}`;
      params.push(transaction_type);
      paramCount++;
    }
    
    query += ' ORDER BY invoice_date DESC';
    
    const result = await db.query(query, params);
    
    // Calculate summary
    const summary = {
      total_invoices: result.rows.length,
      total_taxable_value: result.rows.reduce((sum, row) => sum + parseFloat(row.taxable_value || 0), 0),
      total_cgst: result.rows.reduce((sum, row) => sum + parseFloat(row.cgst_amount || 0), 0),
      total_sgst: result.rows.reduce((sum, row) => sum + parseFloat(row.sgst_amount || 0), 0),
      total_igst: result.rows.reduce((sum, row) => sum + parseFloat(row.igst_amount || 0), 0),
      total_invoice_value: result.rows.reduce((sum, row) => sum + parseFloat(row.invoice_value || 0), 0)
    };
    
    res.json({
      success: true,
      data: result.rows,
      summary
    });
  } catch (error) {
    logger.error('Error getting GST sales register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GST sales register',
      error: error.message
    });
  }
};

/**
 * Get GST monthly summary
 */
exports.getGSTMonthlySummary = async (req, res) => {
  try {
    const { months } = req.query;
    
    let query = 'SELECT * FROM vw_gst_monthly_summary';
    
    if (months) {
      query += ` LIMIT $1`;
      const result = await db.query(query, [parseInt(months)]);
      return res.json({
        success: true,
        data: result.rows
      });
    }
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error getting GST monthly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GST monthly summary',
      error: error.message
    });
  }
};

/**
 * Get HSN-wise summary
 */
exports.getHSNWiseSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM vw_hsn_wise_summary WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      query += ` AND month >= $${paramCount}::date`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND month <= $${paramCount}::date`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ' ORDER BY month DESC, total_taxable_value DESC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error getting HSN-wise summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve HSN-wise summary',
      error: error.message
    });
  }
};

/**
 * Get GST liability
 */
exports.getGSTLiability = async (req, res) => {
  try {
    const { months } = req.query;
    
    let query = 'SELECT * FROM vw_gst_liability';
    
    if (months) {
      query += ` LIMIT $1`;
      const result = await db.query(query, [parseInt(months)]);
      return res.json({
        success: true,
        data: result.rows
      });
    }
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error getting GST liability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GST liability',
      error: error.message
    });
  }
};

/**
 * Calculate GST breakdown
 */
exports.calculateGSTBreakdown = async (req, res) => {
  try {
    const { subtotal, gst_rate, tax_type } = req.body;
    
    if (!subtotal || !gst_rate) {
      return res.status(400).json({
        success: false,
        message: 'subtotal and gst_rate are required'
      });
    }
    
    const result = await db.query(
      'SELECT * FROM calculate_gst_breakdown($1, $2, $3)',
      [subtotal, gst_rate, tax_type || 'CGST_SGST']
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error calculating GST breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate GST breakdown',
      error: error.message
    });
  }
};

/**
 * Get GST dashboard statistics
 */
exports.getGSTDashboardStats = async (req, res) => {
  try {
    // Get current month stats
    const currentMonthResult = await db.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(subtotal), 0) as total_taxable_value,
        COALESCE(SUM(cgst_amount), 0) as total_cgst,
        COALESCE(SUM(sgst_amount), 0) as total_sgst,
        COALESCE(SUM(igst_amount), 0) as total_igst,
        COALESCE(SUM(tax_amount), 0) as total_tax_collected
      FROM bills
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // Get last month stats
    const lastMonthResult = await db.query(`
      SELECT 
        COALESCE(SUM(tax_amount), 0) as total_tax_collected
      FROM bills
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `);
    
    // Get pending payments with tax
    const pendingResult = await db.query(`
      SELECT 
        COUNT(*) as pending_invoices,
        COALESCE(SUM(total_amount), 0) as pending_amount,
        COALESCE(SUM(tax_amount), 0) as pending_tax
      FROM bills
      WHERE payment_status IN ('Pending', 'Partial')
    `);
    
    // Get transaction type breakdown
    const typeBreakdownResult = await db.query(`
      SELECT 
        CASE 
          WHEN c.gst_number IS NOT NULL AND c.gst_number != '' THEN 'B2B'
          WHEN b.total_amount >= 250000 THEN 'B2CL'
          ELSE 'B2CS'
        END as transaction_type,
        COUNT(*) as count,
        COALESCE(SUM(b.total_amount), 0) as total_value
      FROM bills b
      LEFT JOIN customers c ON b.customer_name = c.customer_name
      WHERE DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY transaction_type
    `);
    
    const currentMonth = currentMonthResult.rows[0];
    const lastMonth = lastMonthResult.rows[0];
    const pending = pendingResult.rows[0];
    
    // Calculate growth
    const taxGrowth = lastMonth.total_tax_collected > 0
      ? ((currentMonth.total_tax_collected - lastMonth.total_tax_collected) / lastMonth.total_tax_collected * 100)
      : 0;
    
    res.json({
      success: true,
      data: {
        current_month: {
          ...currentMonth,
          tax_growth_percentage: parseFloat(taxGrowth.toFixed(2))
        },
        pending: pending,
        transaction_breakdown: typeBreakdownResult.rows
      }
    });
  } catch (error) {
    logger.error('Error getting GST dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GST dashboard statistics',
      error: error.message
    });
  }
};

module.exports = exports;
