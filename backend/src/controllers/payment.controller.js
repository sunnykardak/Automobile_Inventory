const { query, pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Payment Controller
 * Handles all payment-related operations including digital payments, payment links, reconciliation
 */

// =========================================
// PAYMENT METHODS
// =========================================

/**
 * Get all available payment methods
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    
    let queryText = 'SELECT * FROM payment_methods';
    const params = [];
    
    if (active_only === 'true') {
      queryText += ' WHERE is_active = true';
    }
    
    queryText += ' ORDER BY display_order, method_name';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
};

/**
 * Update payment method configuration
 */
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      method_name,
      is_active,
      gateway_name,
      gateway_config,
      transaction_fee_percentage,
      transaction_fee_fixed,
      display_order
    } = req.body;
    
    const result = await query(`
      UPDATE payment_methods
      SET 
        method_name = COALESCE($1, method_name),
        is_active = COALESCE($2, is_active),
        gateway_name = COALESCE($3, gateway_name),
        gateway_config = COALESCE($4, gateway_config),
        transaction_fee_percentage = COALESCE($5, transaction_fee_percentage),
        transaction_fee_fixed = COALESCE($6, transaction_fee_fixed),
        display_order = COALESCE($7, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      method_name,
      is_active,
      gateway_name,
      gateway_config,
      transaction_fee_percentage,
      transaction_fee_fixed,
      display_order,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
      error: error.message
    });
  }
};

// =========================================
// PAYMENT TRANSACTIONS
// =========================================

/**
 * Process a payment
 */
exports.processPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      bill_id,
      job_card_id,
      transaction_type = 'BILL_PAYMENT',
      amount,
      payment_mode,
      payment_method_id,
      
      // Gateway details (for digital payments)
      gateway_name,
      gateway_transaction_id,
      gateway_order_id,
      gateway_payment_id,
      gateway_response,
      
      // UPI details
      upi_id,
      upi_transaction_ref,
      
      // Card details
      card_last4,
      card_brand,
      card_type,
      
      // Cheque details
      cheque_number,
      cheque_date,
      bank_name,
      
      // Wallet details
      wallet_name,
      wallet_transaction_id,
      
      // Customer details
      customer_name,
      customer_phone,
      customer_email,
      
      // Other details
      notes,
      processed_by
    } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }
    
    if (!payment_mode) {
      throw new Error('Payment mode is required');
    }
    
    // Generate transaction ID
    const transactionIdResult = await client.query('SELECT generate_transaction_id() as id');
    const transaction_id = transactionIdResult.rows[0].id;
    
    // Calculate transaction fee
    let transaction_fee = 0;
    let net_amount = amount;
    
    if (payment_method_id) {
      const methodResult = await client.query(
        'SELECT transaction_fee_percentage, transaction_fee_fixed FROM payment_methods WHERE id = $1',
        [payment_method_id]
      );
      
      if (methodResult.rows.length > 0) {
        const method = methodResult.rows[0];
        transaction_fee = (amount * method.transaction_fee_percentage / 100) + parseFloat(method.transaction_fee_fixed);
        net_amount = amount - transaction_fee;
      }
    }
    
    // Determine initial status
    let status = 'SUCCESS'; // Default for cash and immediate confirmation
    
    if (payment_mode === 'CHEQUE') {
      status = 'PENDING'; // Cheques need clearance
    } else if (gateway_transaction_id && !gateway_payment_id) {
      status = 'PROCESSING'; // Digital payment in process
    }
    
    // Insert payment transaction
    const transactionResult = await client.query(`
      INSERT INTO payment_transactions (
        transaction_id, bill_id, job_card_id, transaction_type, amount, payment_mode,
        payment_method_id, gateway_name, gateway_transaction_id, gateway_order_id,
        gateway_payment_id, gateway_response, upi_id, upi_transaction_ref,
        card_last4, card_brand, card_type, cheque_number, cheque_date, bank_name,
        cheque_status, wallet_name, wallet_transaction_id, status, transaction_fee,
        net_amount, customer_name, customer_phone, customer_email, notes, processed_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      )
      RETURNING *
    `, [
      transaction_id, bill_id, job_card_id, transaction_type, amount, payment_mode,
      payment_method_id, gateway_name, gateway_transaction_id, gateway_order_id,
      gateway_payment_id, gateway_response ? JSON.stringify(gateway_response) : null,
      upi_id, upi_transaction_ref, card_last4, card_brand, card_type,
      cheque_number, cheque_date, bank_name,
      payment_mode === 'CHEQUE' ? 'PENDING' : null,
      wallet_name, wallet_transaction_id, status, transaction_fee, net_amount,
      customer_name, customer_phone, customer_email, notes,
      processed_by || req.user?.id
    ]);
    
    await client.query('COMMIT');
    
    logger.info(`Payment processed: ${transaction_id}, Amount: ${amount}, Mode: ${payment_mode}`);
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: transactionResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Get payment transactions with filters
 */
exports.getPaymentTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      bill_id,
      job_card_id,
      payment_mode,
      status,
      from_date,
      to_date,
      customer_phone,
      is_reconciled
    } = req.query;
    
    let queryText = `
      SELECT 
        pt.*,
        pm.method_name,
        b.bill_number,
        b.customer_name as bill_customer_name,
        jc.job_number
      FROM payment_transactions pt
      LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
      LEFT JOIN bills b ON pt.bill_id = b.id
      LEFT JOIN job_cards jc ON pt.job_card_id = jc.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (bill_id) {
      paramCount++;
      queryText += ` AND pt.bill_id = $${paramCount}`;
      params.push(bill_id);
    }
    
    if (job_card_id) {
      paramCount++;
      queryText += ` AND pt.job_card_id = $${paramCount}`;
      params.push(job_card_id);
    }
    
    if (payment_mode) {
      paramCount++;
      queryText += ` AND pt.payment_mode = $${paramCount}`;
      params.push(payment_mode);
    }
    
    if (status) {
      paramCount++;
      queryText += ` AND pt.status = $${paramCount}`;
      params.push(status);
    }
    
    if (from_date) {
      paramCount++;
      queryText += ` AND pt.created_at >= $${paramCount}`;
      params.push(from_date);
    }
    
    if (to_date) {
      paramCount++;
      queryText += ` AND pt.created_at <= $${paramCount}`;
      params.push(to_date);
    }
    
    if (customer_phone) {
      paramCount++;
      queryText += ` AND pt.customer_phone = $${paramCount}`;
      params.push(customer_phone);
    }
    
    if (is_reconciled !== undefined) {
      paramCount++;
      queryText += ` AND pt.is_reconciled = $${paramCount}`;
      params.push(is_reconciled === 'true');
    }
    
    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM (${queryText}) as count_query`, params);
    const totalRecords = parseInt(countResult.rows[0].count);
    
    // Add pagination
    queryText += ` ORDER BY pt.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching payment transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment transactions',
      error: error.message
    });
  }
};

/**
 * Get payment transaction by ID
 */
exports.getPaymentTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        pt.*,
        pm.method_name,
        b.bill_number,
        b.customer_name as bill_customer_name,
        jc.job_number,
        u.full_name as processed_by_name
      FROM payment_transactions pt
      LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
      LEFT JOIN bills b ON pt.bill_id = b.id
      LEFT JOIN job_cards jc ON pt.job_card_id = jc.id
      LEFT JOIN users u ON pt.processed_by = u.id
      WHERE pt.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching payment transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment transaction',
      error: error.message
    });
  }
};

/**
 * Update payment transaction status
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      failure_reason,
      gateway_payment_id,
      gateway_response,
      cheque_status
    } = req.body;
    
    const result = await query(`
      UPDATE payment_transactions
      SET 
        status = COALESCE($1, status),
        failure_reason = COALESCE($2, failure_reason),
        gateway_payment_id = COALESCE($3, gateway_payment_id),
        gateway_response = COALESCE($4, gateway_response),
        cheque_status = COALESCE($5, cheque_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      status,
      failure_reason,
      gateway_payment_id,
      gateway_response ? JSON.stringify(gateway_response) : null,
      cheque_status,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found'
      });
    }
    
    logger.info(`Payment status updated: ${id} -> ${status}`);
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

// =========================================
// PAYMENT LINKS
// =========================================

/**
 * Create payment link
 */
exports.createPaymentLink = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      bill_id,
      job_card_id,
      amount,
      description,
      customer_name,
      customer_phone,
      customer_email,
      expires_in_hours = 72,
      send_via, // 'SMS', 'EMAIL', 'WHATSAPP'
      created_by
    } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }
    
    if (!customer_name || !customer_phone) {
      throw new Error('Customer name and phone are required');
    }
    
    // Generate link ID
    const linkIdResult = await client.query('SELECT generate_payment_link_id() as id');
    const link_id = linkIdResult.rows[0].id;
    
    // Generate link URL (in production, this would be your actual domain)
    const link_url = `${process.env.APP_URL || 'http://localhost:3000'}/pay/${link_id}`;
    
    // Calculate expiry
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + expires_in_hours);
    
    // Insert payment link
    const linkResult = await client.query(`
      INSERT INTO payment_links (
        link_id, bill_id, job_card_id, amount, description,
        customer_name, customer_phone, customer_email,
        link_url, expires_at, sent_via, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      link_id, bill_id, job_card_id, amount, description,
      customer_name, customer_phone, customer_email,
      link_url, expires_at, send_via, created_by || req.user?.id
    ]);
    
    // TODO: Send payment link via SMS/Email/WhatsApp based on send_via parameter
    // This would integrate with your SMS/Email/WhatsApp service
    
    await client.query('COMMIT');
    
    logger.info(`Payment link created: ${link_id} for amount: ${amount}`);
    
    res.json({
      success: true,
      message: 'Payment link created successfully',
      data: linkResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating payment link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment link',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Get all payment links
 */
exports.getPaymentLinks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      bill_id,
      customer_phone
    } = req.query;
    
    let queryText = `
      SELECT 
        pl.*,
        b.bill_number,
        jc.job_number
      FROM payment_links pl
      LEFT JOIN bills b ON pl.bill_id = b.id
      LEFT JOIN job_cards jc ON pl.job_card_id = jc.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      queryText += ` AND pl.status = $${paramCount}`;
      params.push(status);
    }
    
    if (bill_id) {
      paramCount++;
      queryText += ` AND pl.bill_id = $${paramCount}`;
      params.push(bill_id);
    }
    
    if (customer_phone) {
      paramCount++;
      queryText += ` AND pl.customer_phone = $${paramCount}`;
      params.push(customer_phone);
    }
    
    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM (${queryText}) as count_query`, params);
    const totalRecords = parseInt(countResult.rows[0].count);
    
    queryText += ` ORDER BY pl.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        pages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching payment links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment links',
      error: error.message
    });
  }
};

/**
 * Get payment link by link_id (for customer access)
 */
exports.getPaymentLinkByLinkId = async (req, res) => {
  try {
    const { link_id } = req.params;
    
    const result = await query(`
      SELECT 
        pl.*,
        b.bill_number,
        b.subtotal,
        b.tax_amount,
        jc.job_number,
        jc.vehicle_number
      FROM payment_links pl
      LEFT JOIN bills b ON pl.bill_id = b.id
      LEFT JOIN job_cards jc ON pl.job_card_id = jc.id
      WHERE pl.link_id = $1
    `, [link_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment link not found'
      });
    }
    
    const link = result.rows[0];
    
    // Check if link is expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      // Update status to expired
      await query(`
        UPDATE payment_links SET status = 'EXPIRED' WHERE link_id = $1
      `, [link_id]);
      
      return res.status(400).json({
        success: false,
        message: 'Payment link has expired'
      });
    }
    
    // Check if already paid
    if (link.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Payment link has already been used'
      });
    }
    
    // Increment view count
    await query(`
      UPDATE payment_links 
      SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP
      WHERE link_id = $1
    `, [link_id]);
    
    res.json({
      success: true,
      data: link
    });
  } catch (error) {
    logger.error('Error fetching payment link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment link',
      error: error.message
    });
  }
};

// =========================================
// PAYMENT ANALYTICS
// =========================================

/**
 * Get payment dashboard stats
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (from_date && to_date) {
      dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
      params.push(from_date, to_date);
    } else if (from_date) {
      dateFilter = 'WHERE created_at >= $1';
      params.push(from_date);
    } else {
      // Default to current month
      dateFilter = "WHERE created_at >= date_trunc('month', CURRENT_DATE)";
    }
    
    // Total transactions and amounts
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as total_amount,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
        SUM(transaction_fee) as total_fees,
        SUM(CASE WHEN status = 'SUCCESS' THEN net_amount ELSE 0 END) as net_amount
      FROM payment_transactions
      ${dateFilter}
    `, params);
    
    // By payment mode
    const modeResult = await query(`
      SELECT 
        payment_mode,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as total_amount
      FROM payment_transactions
      ${dateFilter}
      GROUP BY payment_mode
      ORDER BY total_amount DESC
    `, params);
    
    // Daily trend
    const trendResult = await query(`
SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as amount
      FROM payment_transactions
      ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, params);
    
    res.json({
      success: true,
      data: {
        overview: statsResult.rows[0],
        by_payment_mode: modeResult.rows,
        daily_trend: trendResult.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats',
      error: error.message
    });
  }
};

/**
 * Get pending payments
 */
exports.getPendingPayments = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_pending_payments
      ORDER BY days_pending DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payments',
      error: error.message
    });
  }
};

/**
 * Get reconciliation dashboard
 */
exports.getReconciliationDashboard = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM vw_reconciliation_dashboard
      ORDER BY transaction_date DESC
      LIMIT 30
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching reconciliation dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reconciliation dashboard',
      error: error.message
    });
  }
};

/**
 * Mark transaction as reconciled
 */
exports.markReconciled = async (req, res) => {
  try {
    const { id } = req.params;
    const { reconciliation_notes } = req.body;
    
    const result = await query(`
      UPDATE payment_transactions
      SET 
        is_reconciled = true,
        reconciled_at = CURRENT_TIMESTAMP,
        reconciled_by = $1,
        reconciliation_notes = $2
      WHERE id = $3
      RETURNING *
    `, [req.user?.id, reconciliation_notes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Transaction marked as reconciled',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error marking transaction as reconciled:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark transaction as reconciled',
      error: error.message
    });
  }
};

// =========================================
// PAYMENT REMINDERS
// =========================================

/**
 * Create payment reminder
 */
exports.createPaymentReminder = async (req, res) => {
  try {
    const {
      bill_id,
      customer_name,
      customer_phone,
      customer_email,
      pending_amount,
      due_date,
      reminder_type,
      notes
    } = req.body;
    
    const result = await query(`
      INSERT INTO payment_reminders (
        bill_id, customer_name, customer_phone, customer_email,
        pending_amount, due_date, reminder_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      bill_id, customer_name, customer_phone, customer_email,
      pending_amount, due_date, reminder_type, notes
    ]);
    
    // TODO: Send reminder via SMS/Email/WhatsApp based on reminder_type
    
    logger.info(`Payment reminder created for bill: ${bill_id}`);
    
    res.json({
      success: true,
      message: 'Payment reminder created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment reminder',
      error: error.message
    });
  }
};

/**
 * Get payment reminders
 */
exports.getPaymentReminders = async (req, res) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    
    const result = await query(`
      SELECT 
        pr.*,
        b.bill_number,
        b.total_amount,
        b.paid_amount
      FROM payment_reminders pr
      LEFT JOIN bills b ON pr.bill_id = b.id
      WHERE pr.status = $1
      ORDER BY pr.created_at DESC
    `, [status]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching payment reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment reminders',
      error: error.message
    });
  }
};

module.exports = exports;
