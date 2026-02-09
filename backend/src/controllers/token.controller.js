const { pool } = require('../config/database');

// Get all service tokens with optional filtering
exports.getAllTokens = async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    
    let query = `
      SELECT 
        st.*,
        u.username as created_by_name
      FROM service_tokens st
      LEFT JOIN users u ON st.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND st.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (startDate) {
      query += ` AND st.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND st.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (st.token_number ILIKE $${paramCount} OR st.customer_name ILIKE $${paramCount} OR st.bike_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY st.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching service tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service tokens',
      error: error.message
    });
  }
};

// Get single token by ID
exports.getTokenById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        st.*,
        u.username as created_by_name
      FROM service_tokens st
      LEFT JOIN users u ON st.created_by = u.id
      WHERE st.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service token not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching service token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service token',
      error: error.message
    });
  }
};

// Create new service token
exports.createToken = async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_phone, 
      bike_number, 
      service_type, 
      amount,
      notes 
    } = req.body;
    
    const userId = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO service_tokens (
        customer_name, customer_phone, bike_number, 
        service_type, amount, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [customer_name, customer_phone || null, bike_number || null, 
       service_type, amount || 0, notes || null, userId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Service token created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating service token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service token',
      error: error.message
    });
  }
};

// Update service token
exports.updateToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_name, 
      customer_phone, 
      bike_number, 
      service_type, 
      amount,
      status,
      notes 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE service_tokens 
      SET customer_name = $1, 
          customer_phone = $2, 
          bike_number = $3, 
          service_type = $4, 
          amount = $5,
          status = $6,
          notes = $7,
          completed_at = CASE WHEN $6 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $8
      RETURNING *`,
      [customer_name, customer_phone || null, bike_number || null, 
       service_type, amount || 0, status || 'pending', notes || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service token not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service token updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating service token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service token',
      error: error.message
    });
  }
};

// Complete service token
exports.completeToken = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE service_tokens 
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service token not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service token completed successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing service token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete service token',
      error: error.message
    });
  }
};

// Delete service token
exports.deleteToken = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM service_tokens WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service token not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service token deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service token',
      error: error.message
    });
  }
};

// Get token statistics
exports.getTokenStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
      params.push(startDate, endDate);
    }
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_tokens,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tokens,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tokens,
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as completed_revenue
      FROM service_tokens
      ${dateFilter}`,
      params
    );
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching token statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
