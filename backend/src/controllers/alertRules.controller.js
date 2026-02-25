const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all alert rules
 */
exports.getAllRules = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM vw_active_alert_rules
      ORDER BY is_active DESC, priority ASC, created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching alert rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert rules',
      error: error.message
    });
  }
};

/**
 * Get single alert rule by ID
 */
exports.getRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM inventory_alert_rules WHERE rule_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert rule',
      error: error.message
    });
  }
};

/**
 * Create new alert rule
 */
exports.createRule = async (req, res) => {
  try {
    const {
      rule_name,
      description,
      condition_type,
      priority,
      threshold_value,
      threshold_percentage,
      days_threshold,
      category_filter,
      manufacturer_filter,
      specific_product_filter,
      is_active,
      send_email,
      send_notification
    } = req.body;

    const result = await pool.query(
      `INSERT INTO inventory_alert_rules (
        rule_name, description, condition_type, priority,
        threshold_value, threshold_percentage, days_threshold,
        category_filter, manufacturer_filter, specific_product_filter,
        is_active, send_email, send_notification, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        rule_name,
        description,
        condition_type,
        priority || 'medium',
        threshold_value,
        threshold_percentage,
        days_threshold,
        category_filter,
        manufacturer_filter,
        specific_product_filter,
        is_active !== false,
        send_email || false,
        send_notification !== false,
        req.user?.userId || null
      ]
    );

    logger.info(`Alert rule created: ${rule_name}`);

    res.status(201).json({
      success: true,
      message: 'Alert rule created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert rule',
      error: error.message
    });
  }
};

/**
 * Update alert rule
 */
exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rule_name,
      description,
      condition_type,
      priority,
      threshold_value,
      threshold_percentage,
      days_threshold,
      category_filter,
      manufacturer_filter,
      specific_product_filter,
      is_active,
      send_email,
      send_notification
    } = req.body;

    const result = await pool.query(
      `UPDATE inventory_alert_rules SET
        rule_name = COALESCE($1, rule_name),
        description = COALESCE($2, description),
        condition_type = COALESCE($3, condition_type),
        priority = COALESCE($4, priority),
        threshold_value = $5,
        threshold_percentage = $6,
        days_threshold = $7,
        category_filter = $8,
        manufacturer_filter = $9,
        specific_product_filter = $10,
        is_active = COALESCE($11, is_active),
        send_email = COALESCE($12, send_email),
        send_notification = COALESCE($13, send_notification)
      WHERE rule_id = $14
      RETURNING *`,
      [
        rule_name,
        description,
        condition_type,
        priority,
        threshold_value,
        threshold_percentage,
        days_threshold,
        category_filter,
        manufacturer_filter,
        specific_product_filter,
        is_active,
        send_email,
        send_notification,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }

    logger.info(`Alert rule updated: ${id}`);

    res.json({
      success: true,
      message: 'Alert rule updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert rule',
      error: error.message
    });
  }
};

/**
 * Delete alert rule
 */
exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM inventory_alert_rules WHERE rule_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }

    logger.info(`Alert rule deleted: ${id}`);

    res.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert rule',
      error: error.message
    });
  }
};

/**
 * Toggle rule active status
 */
exports.toggleRuleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE inventory_alert_rules 
       SET is_active = NOT is_active
       WHERE rule_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert rule not found'
      });
    }

    res.json({
      success: true,
      message: `Alert rule ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error toggling rule status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle rule status',
      error: error.message
    });
  }
};

/**
 * Check all alert rules and create alerts
 */
exports.checkAlertRules = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM check_alert_rules()');

    res.json({
      success: true,
      message: 'Alert rules checked successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error checking alert rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check alert rules',
      error: error.message
    });
  }
};

/**
 * Get all alerts (active and acknowledged)
 */
exports.getAllAlerts = async (req, res) => {
  try {
    const { status, priority, limit } = req.query;

    let query = 'SELECT * FROM vw_alert_dashboard WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND alert_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += ' ORDER BY triggered_at DESC';

    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
};

/**
 * Get alert statistics
 */
exports.getAlertStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE alert_status = 'active') AS active_count,
        COUNT(*) FILTER (WHERE alert_status = 'acknowledged') AS acknowledged_count,
        COUNT(*) FILTER (WHERE priority = 'critical') AS critical_count,
        COUNT(*) FILTER (WHERE priority = 'high') AS high_count,
        COUNT(*) FILTER (WHERE priority = 'medium') AS medium_count,
        COUNT(*) FILTER (WHERE priority = 'low') AS low_count,
        COUNT(*) FILTER (WHERE triggered_at >= CURRENT_DATE) AS today_count,
        COUNT(*) FILTER (WHERE triggered_at >= CURRENT_DATE - INTERVAL '7 days') AS week_count
      FROM inventory_alert_history
      WHERE alert_status IN ('active', 'acknowledged')
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert statistics',
      error: error.message
    });
  }
};

/**
 * Acknowledge an alert
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const result = await pool.query(
      'SELECT acknowledge_alert($1, $2, $3) AS success',
      [id, req.user?.userId || null, note || null]
    );

    if (!result.rows[0].success) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or already acknowledged'
      });
    }

    logger.info(`Alert acknowledged: ${id}`);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message
    });
  }
};

/**
 * Resolve an alert
 */
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_note } = req.body;

    const result = await pool.query(
      'SELECT resolve_alert($1, $2, $3) AS success',
      [id, req.user?.userId || null, resolution_note || null]
    );

    if (!result.rows[0].success) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or already resolved'
      });
    }

    logger.info(`Alert resolved: ${id}`);

    res.json({
      success: true,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
};

/**
 * Get categories for filter dropdown
 */
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Get manufacturers for filter dropdown
 */
exports.getManufacturers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM manufacturers ORDER BY name');

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching manufacturers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manufacturers',
      error: error.message
    });
  }
};
