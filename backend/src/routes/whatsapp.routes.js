const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const whatsappService = require('../utils/whatsapp');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * Send Job Card to customer via WhatsApp
 * POST /api/whatsapp/send-job-card
 */
router.post('/send-job-card', async (req, res) => {
  try {
    const { jobCardId } = req.body;

    if (!jobCardId) {
      return res.status(400).json({
        success: false,
        message: 'Job Card ID is required'
      });
    }

    // Fetch job card details
    const result = await query(
      `SELECT 
        jc.*,
        e.first_name || ' ' || e.last_name as assigned_mechanic
       FROM job_cards jc
       LEFT JOIN employees e ON jc.assigned_mechanic_id = e.id
       WHERE jc.id = $1`,
      [jobCardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found'
      });
    }

    const jobData = result.rows[0];

    if (!jobData.customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number not available'
      });
    }

    // Send WhatsApp message
    const response = await whatsappService.sendJobCard(jobData);

    res.status(200).json({
      success: true,
      message: 'Job card sent successfully via WhatsApp',
      data: response
    });
  } catch (error) {
    logger.error('Send job card WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send job card via WhatsApp',
      error: error.message
    });
  }
});

/**
 * Send Invoice/Bill to customer via WhatsApp
 * POST /api/whatsapp/send-invoice
 */
router.post('/send-invoice', async (req, res) => {
  try {
    const { billId } = req.body;

    if (!billId) {
      return res.status(400).json({
        success: false,
        message: 'Bill ID is required'
      });
    }

    // Fetch bill details
    const result = await query(
      `SELECT 
        b.*,
        jc.job_number
       FROM bills b
       LEFT JOIN job_cards jc ON b.job_card_id = jc.id
       WHERE b.id = $1`,
      [billId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const billData = result.rows[0];

    if (!billData.customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number not available'
      });
    }

    // Send WhatsApp message
    const response = await whatsappService.sendInvoice(billData);

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully via WhatsApp',
      data: response
    });
  } catch (error) {
    logger.error('Send invoice WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice via WhatsApp',
      error: error.message
    });
  }
});

/**
 * Send Service Token to customer via WhatsApp
 * POST /api/whatsapp/send-token
 */
router.post('/send-token', async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token ID is required'
      });
    }

    // Fetch token details
    const result = await query(
      'SELECT * FROM service_tokens WHERE id = $1',
      [tokenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service token not found'
      });
    }

    const tokenData = result.rows[0];

    if (!tokenData.customer_phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone number not available'
      });
    }

    // Send WhatsApp message
    const response = await whatsappService.sendServiceToken(tokenData);

    res.status(200).json({
      success: true,
      message: 'Service token sent successfully via WhatsApp',
      data: response
    });
  } catch (error) {
    logger.error('Send token WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send token via WhatsApp',
      error: error.message
    });
  }
});

/**
 * Send Reminder to customer via WhatsApp
 * POST /api/whatsapp/send-reminder
 */
router.post('/send-reminder', async (req, res) => {
  try {
    const { phone, customerName, reminderType, details } = req.body;

    if (!phone || !customerName || !reminderType) {
      return res.status(400).json({
        success: false,
        message: 'Phone, customer name, and reminder type are required'
      });
    }

    // Send WhatsApp reminder
    const response = await whatsappService.sendReminder(
      phone,
      customerName,
      reminderType,
      details
    );

    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully via WhatsApp',
      data: response
    });
  } catch (error) {
    logger.error('Send reminder WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder via WhatsApp',
      error: error.message
    });
  }
});

/**
 * Send Custom Message to customer via WhatsApp
 * POST /api/whatsapp/send-custom
 */
router.post('/send-custom', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone and message are required'
      });
    }

    // Send WhatsApp message
    const response = await whatsappService.sendCustomMessage(phone, message);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully via WhatsApp',
      data: response
    });
  } catch (error) {
    logger.error('Send custom WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message via WhatsApp',
      error: error.message
    });
  }
});

/**
 * Check WhatsApp service status
 * GET /api/whatsapp/status
 */
router.get('/status', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      enabled: whatsappService.enabled,
      message: whatsappService.enabled 
        ? 'WhatsApp service is active' 
        : 'WhatsApp service is not configured'
    });
  } catch (error) {
    logger.error('WhatsApp status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check WhatsApp status',
      error: error.message
    });
  }
});

module.exports = router;
