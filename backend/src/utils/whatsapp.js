const twilio = require('twilio');
const logger = require('./logger');

class WhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox number
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.enabled = true;
      logger.info('WhatsApp Service initialized successfully');
    } else {
      this.enabled = false;
      logger.warn('WhatsApp Service disabled - Missing Twilio credentials');
    }
  }

  /**
   * Format phone number to WhatsApp format
   * @param {string} phone - Phone number
   * @returns {string} - Formatted WhatsApp number
   */
  formatWhatsAppNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If number doesn't start with country code, assume India (+91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return `whatsapp:+${cleaned}`;
  }

  /**
   * Send WhatsApp message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise} - Twilio response
   */
  async sendMessage(to, message) {
    if (!this.enabled) {
      logger.warn('WhatsApp Service is disabled - skipping message');
      return { success: false, message: 'WhatsApp service not configured' };
    }

    try {
      const formattedNumber = this.formatWhatsAppNumber(to);
      
      logger.info(`Sending WhatsApp message to ${formattedNumber}`);
      
      const response = await this.client.messages.create({
        from: this.whatsappNumber,
        to: formattedNumber,
        body: message
      });

      logger.info(`WhatsApp message sent successfully. SID: ${response.sid}`);
      
      return {
        success: true,
        messageSid: response.sid,
        status: response.status
      };
    } catch (error) {
      logger.error('WhatsApp send error:', error);
      throw error;
    }
  }

  /**
   * Send Job Card details to customer
   * @param {object} jobData - Job card data
   * @returns {Promise}
   */
  async sendJobCard(jobData) {
    const message = `🔧 *Job Card Details*

*Job Number:* ${jobData.job_number}
*Customer:* ${jobData.customer_name}
*Vehicle:* ${jobData.vehicle_number} (${jobData.vehicle_type})

*Reported Issues:* 
${jobData.reported_issues}

*Status:* ${jobData.status}
*Estimated Cost:* ₹${jobData.estimated_cost || 'TBD'}
${jobData.assigned_mechanic ? `*Mechanic:* ${jobData.assigned_mechanic}` : ''}

📍 Thank you for choosing our service!
For queries, contact: ${process.env.BUSINESS_PHONE || 'our workshop'}`;

    return this.sendMessage(jobData.customer_phone, message);
  }

  /**
   * Send Invoice/Bill to customer
   * @param {object} billData - Bill data
   * @returns {Promise}
   */
  async sendInvoice(billData) {
    const message = `🧾 *Invoice - ${billData.bill_number}*

*Customer:* ${billData.customer_name}
*Job Number:* ${billData.job_number || 'N/A'}

*Amount Details:*
Subtotal: ₹${billData.subtotal}
${billData.tax_amount > 0 ? `Tax: ₹${billData.tax_amount}` : ''}
${billData.discount_amount > 0 ? `Discount: -₹${billData.discount_amount}` : ''}
━━━━━━━━━━━━━━━━
*Total Amount:* ₹${billData.total_amount}
*Paid Amount:* ₹${billData.paid_amount}
*Balance:* ₹${billData.total_amount - billData.paid_amount}

*Payment Status:* ${billData.payment_status}

💰 Thank you for your business!`;

    return this.sendMessage(billData.customer_phone, message);
  }

  /**
   * Send Service Token to customer
   * @param {object} tokenData - Token data
   * @returns {Promise}
   */
  async sendServiceToken(tokenData) {
    const message = `🎫 *Service Token - ${tokenData.token_number}*

*Customer:* ${tokenData.customer_name}
${tokenData.bike_number ? `*Bike Number:* ${tokenData.bike_number}` : ''}
*Service Type:* ${tokenData.service_type}
*Amount:* ₹${tokenData.amount}
*Status:* ${tokenData.status}

*Token Generated:* ${new Date(tokenData.created_at).toLocaleString('en-IN')}
${tokenData.completed_at ? `*Completed At:* ${new Date(tokenData.completed_at).toLocaleString('en-IN')}` : ''}

✨ Your vehicle will be ready soon!`;

    return this.sendMessage(tokenData.customer_phone, message);
  }

  /**
   * Send reminder message
   * @param {string} phone - Customer phone
   * @param {string} customerName - Customer name
   * @param {string} reminderType - Type of reminder
   * @param {object} details - Additional details
   * @returns {Promise}
   */
  async sendReminder(phone, customerName, reminderType, details = {}) {
    let message = '';

    switch (reminderType) {
      case 'pickup':
        message = `🚗 *Pickup Reminder*

Hello ${customerName},

Your vehicle ${details.vehicleNumber || ''} is ready for pickup!

*Job Number:* ${details.jobNumber}
*Amount Due:* ₹${details.amountDue || 0}

Please collect your vehicle at your earliest convenience.

Thank you! 🙏`;
        break;

      case 'payment':
        message = `💰 *Payment Reminder*

Hello ${customerName},

This is a friendly reminder about pending payment.

*Invoice:* ${details.billNumber}
*Amount Due:* ₹${details.amountDue}
*Due Date:* ${details.dueDate || 'ASAP'}

Please clear the payment at your earliest convenience.

Thank you! 🙏`;
        break;

      case 'service':
        message = `🔧 *Service Reminder*

Hello ${customerName},

Your vehicle ${details.vehicleNumber || ''} is due for service!

Last Service: ${details.lastServiceDate || 'N/A'}
Recommended: ${details.serviceType || 'Regular Maintenance'}

Book your appointment today!

Contact: ${process.env.BUSINESS_PHONE || 'our workshop'}

Thank you! 🙏`;
        break;

      default:
        message = `Hello ${customerName},\n\n${details.customMessage}`;
    }

    return this.sendMessage(phone, message);
  }

  /**
   * Send custom message
   * @param {string} phone - Customer phone
   * @param {string} message - Custom message
   * @returns {Promise}
   */
  async sendCustomMessage(phone, message) {
    return this.sendMessage(phone, message);
  }
}

// Export singleton instance
module.exports = new WhatsAppService();
