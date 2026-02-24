# WhatsApp Integration Setup Guide

This guide explains how to set up WhatsApp messaging for sending job cards, invoices, and service tokens to customers.

## 🚀 Overview

The system uses **Twilio WhatsApp API** to send messages to customers. You can send:
- **Job Card Details** - Send job information to customers
- **Invoice/Bills** - Send invoice copies after job completion
- **Service Tokens** - Send service token receipts
- **Reminders** - Send pickup reminders, payment reminders, and service reminders

## 📋 Prerequisites

1. A Twilio account (Sign up at https://www.twilio.com)
2. WhatsApp Business API access through Twilio
3. Node.js backend with Twilio SDK installed (already done)

## 🔧 Setup Steps

### Step 1: Create a Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number

### Step 2: Get Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these credentials - you'll need them for configuration

### Step 3: Set Up WhatsApp Sandbox (for Testing)

For development/testing, use Twilio's WhatsApp Sandbox:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox:
   - Send a WhatsApp message to the number shown (usually +1 415 523 8886)
   - Send the code shown (e.g., "join <your-sandbox-code>")
3. Note down the sandbox WhatsApp number (e.g., `whatsapp:+14155238886`)

### Step 4: Configure Environment Variables

Add these variables to your backend `.env` file:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Business Information (optional)
BUSINESS_PHONE=+919876543210
```

**Example:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_secret_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
BUSINESS_PHONE=+919876543210
```

### Step 5: Restart the Backend Server

After adding the environment variables, restart your backend server:

```bash
cd backend
npm run dev
```

You should see: `WhatsApp Service initialized successfully` in the console.

## 📱 Phone Number Format

The system automatically formats Indian phone numbers:
- **Input:** `9876543210` or `+919876543210` or `91-9876543210`
- **Output:** `whatsapp:+919876543210`

For other countries, ensure the number includes the country code.

## 🎯 Using WhatsApp Features

### From Jobs Page

1. **Send Job Card:**
   - Click the WhatsApp icon (💬) next to any job in the table
   - OR open job details and click "Send Job Card via WhatsApp"

2. **Send Invoice:**
   - For completed jobs with invoices, click "Send Invoice via WhatsApp"

### From Service Tokens Page

1. **Send Token Receipt:**
   - Open a token's details
   - Click "Send via WhatsApp" button

### Message Templates

**Job Card Message:**
```
🔧 *Job Card Details*

*Job Number:* JB-00123
*Customer:* John Doe
*Vehicle:* KA01AB1234 (Bike)

*Reported Issues:* 
Engine making noise, brakes need service

*Status:* In Progress
*Estimated Cost:* ₹2,500
*Mechanic:* Raju Kumar

📍 Thank you for choosing our service!
```

**Invoice Message:**
```
🧾 *Invoice - INV-00045*

*Customer:* John Doe
*Job Number:* JB-00123

*Amount Details:*
Subtotal: ₹2,300
Tax: ₹230
━━━━━━━━━━━━━━━━
*Total Amount:* ₹2,530
*Paid Amount:* ₹2,530
*Balance:* ₹0

*Payment Status:* Paid

💰 Thank you for your business!
```

**Service Token Message:**
```
🎫 *Service Token - TOK-00089*

*Customer:* John Doe
*Bike Number:* KA01AB1234
*Service Type:* Bike Wash - Water Wash
*Amount:* ₹50
*Status:* completed

*Token Generated:* 24/02/2026, 10:30 AM
*Completed At:* 24/02/2026, 11:00 AM

✨ Your vehicle is ready for pickup!
```

## 🔒 Production Setup

For production use, you need to:

1. **Upgrade to a paid Twilio account**
2. **Get WhatsApp Business API approved:**
   - Go to Twilio Console → Messaging → Senders → WhatsApp senders
   - Click "Request to enable my WhatsApp account"
   - Follow the verification process
3. **Use your own WhatsApp Business Number:**
   - Update `TWILIO_WHATSAPP_NUMBER` with your approved number
   - Format: `whatsapp:+919876543210`

## 🧪 Testing

### Test WhatsApp Service Status

You can check if WhatsApp is configured correctly:

```bash
curl http://localhost:5001/api/v1/whatsapp/status
```

Response when configured:
```json
{
  "success": true,
  "enabled": true,
  "message": "WhatsApp service is active"
}
```

### Test Sending a Message

1. Make sure you've joined the Twilio sandbox
2. Create a job card with your phone number
3. Click the WhatsApp button
4. Check your WhatsApp for the message

## ⚠️ Important Notes

### Sandbox Limitations
- Only works with numbers that have joined the sandbox
- Messages expire after 72 hours of inactivity
- Has "sent via sandbox" watermark

### Customer Phone Numbers
- Must be valid WhatsApp numbers
- Must join the sandbox in development
- In production, can send to any WhatsApp number

### Rate Limits
- Twilio trial accounts have sending limits
- Upgrade to paid account for higher limits
- See: https://www.twilio.com/docs/usage/limits

## 🎨 Customization

### Modify Message Templates

Edit `/backend/src/utils/whatsapp.js` to customize messages:

```javascript
async sendJobCard(jobData) {
  const message = `
🔧 *Your Custom Message*
  
*Job:* ${jobData.job_number}
... customize as needed ...
  `;
  return this.sendMessage(jobData.customer_phone, message);
}
```

### Add New Message Types

Add new methods in `whatsapp.js`:

```javascript
async sendCustomNotification(phone, details) {
  const message = `Your custom message here`;
  return this.sendMessage(phone, message);
}
```

Then create a route in `/backend/src/routes/whatsapp.routes.js`.

## 🔍 Troubleshooting

### "WhatsApp service is disabled"
- Check if `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set in `.env`
- Restart the backend server after adding credentials

### "Failed to send WhatsApp message"
- Verify the customer's phone number is valid
- In sandbox mode, ensure the recipient has joined the sandbox
- Check Twilio console for error logs

### "Customer phone number not available"
- Make sure the customer phone is filled when creating jobs/tokens
- Phone field is optional but required for WhatsApp

### Rate limit errors
- Upgrade from trial account
- Check your Twilio usage dashboard

## 📚 Resources

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business API Guidelines](https://www.whatsapp.com/legal/business-policy)
- [Twilio Console](https://console.twilio.com)
- [Twilio Support](https://support.twilio.com)

## 💡 Tips

1. **Test thoroughly** in sandbox before going to production
2. **Keep messages concise** - WhatsApp has character limits
3. **Include business info** - Add your shop address/contact in messages
4. **Monitor costs** - WhatsApp messages cost per message sent
5. **Get customer consent** - Only send messages to customers who want them

## 🚀 Next Steps

Want to add more features?

- **Scheduled Reminders** - Automatically send service reminders
- **Bulk Messaging** - Send promotions to multiple customers
- **Two-way Chat** - Receive responses from customers
- **Rich Media** - Send images, PDFs, location
- **Message Templates** - Use approved templates for better delivery

These features require additional setup and possibly Facebook Business Manager integration.

---

**Need Help?**

If you encounter issues, check:
1. Twilio console logs
2. Backend console output
3. Browser console (F12) for frontend errors

For Twilio-specific issues, contact Twilio support or check their documentation.
