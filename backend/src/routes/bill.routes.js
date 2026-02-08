const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let queryText = `
      SELECT b.*, jc.job_number, jc.vehicle_number
      FROM bills b
      LEFT JOIN job_cards jc ON b.job_card_id = jc.id
      WHERE 1=1
    `;
    
    const params = [];
    if (status) {
      queryText += ' AND b.payment_status = $1';
      params.push(status);
    }
    
    queryText += ` ORDER BY b.created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    
    const result = await query(queryText, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bill by ID
router.get('/:id', async (req, res) => {
  try {
    const billResult = await query(`
      SELECT b.*, jc.job_number, jc.vehicle_number, jc.vehicle_type
      FROM bills b
      LEFT JOIN job_cards jc ON b.job_card_id = jc.id
      WHERE b.id = $1
    `, [req.params.id]);
    
    if (billResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    
    const itemsResult = await query(`
      SELECT * FROM bill_items WHERE bill_id = $1
    `, [req.params.id]);
    
    res.json({ 
      success: true, 
      data: {
        ...billResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update payment status
router.put('/:id/payment', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const { paymentStatus, paidAmount } = req.body;
    
    const result = await query(`
      UPDATE bills SET
        payment_status = COALESCE($1, payment_status),
        paid_amount = COALESCE($2, paid_amount)
      WHERE id = $3
      RETURNING *
    `, [paymentStatus, paidAmount, req.params.id]);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
