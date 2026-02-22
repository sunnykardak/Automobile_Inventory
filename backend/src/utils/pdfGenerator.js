const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Invoice PDF
 * @param {Object} billData - Bill data with items
 * @param {Stream} outputStream - Output stream for PDF
 */
function generateInvoicePDF(billData, outputStream) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Invoice ${billData.bill_number}`,
          Author: process.env.GARAGE_NAME || 'Auto Garage'
        }
      });

      doc.pipe(outputStream);

      // Colors
      const primaryColor = '#2563eb';
      const secondaryColor = '#64748b';
      const darkColor = '#1e293b';

      // Header Section
      doc.fontSize(28)
         .fillColor(primaryColor)
         .text(process.env.GARAGE_NAME || 'Auto Garage', 50, 50);

      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text(process.env.GARAGE_ADDRESS || '123 Main Street, City', 50, 85)
         .text(`Phone: ${process.env.GARAGE_PHONE || '+91-1234567890'}`, 50, 100)
         .text(`Email: ${process.env.GARAGE_EMAIL || 'info@autogarage.com'}`, 50, 115);

      if (process.env.GARAGE_GST) {
        doc.text(`GST No: ${process.env.GARAGE_GST}`, 50, 130);
      }

      // Invoice Title
      doc.fontSize(24)
         .fillColor(darkColor)
         .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      const invoiceBoxY = 160;
      doc.rect(350, invoiceBoxY, 200, 90)
         .fillAndStroke('#f1f5f9', '#e2e8f0');

      doc.fontSize(9)
         .fillColor(secondaryColor)
         .text('Invoice No:', 360, invoiceBoxY + 10)
         .text('Date:', 360, invoiceBoxY + 30)
         .text('Job No:', 360, invoiceBoxY + 50)
         .text('Payment Status:', 360, invoiceBoxY + 70);

      doc.fillColor(darkColor)
         .text(billData.bill_number, 440, invoiceBoxY + 10)
         .text(formatDate(billData.created_at), 440, invoiceBoxY + 30)
         .text(billData.job_number || 'N/A', 440, invoiceBoxY + 50)
         .text(billData.payment_status || 'Pending', 440, invoiceBoxY + 70);

      // Customer Details
      const customerY = invoiceBoxY;
      doc.fontSize(11)
         .fillColor(primaryColor)
         .text('BILL TO:', 50, customerY);

      doc.fontSize(10)
         .fillColor(darkColor)
         .text(billData.customer_name || 'N/A', 50, customerY + 20)
         .fillColor(secondaryColor)
         .text(billData.customer_phone || '', 50, customerY + 35);

      if (billData.vehicle_number) {
        doc.text(`Vehicle: ${billData.vehicle_number}`, 50, customerY + 50);
      }

      if (billData.vehicle_type) {
        doc.text(`Type: ${billData.vehicle_type}`, 50, customerY + 65);
      }

      // Line separator
      const tableTop = 280;
      doc.moveTo(50, tableTop - 20)
         .lineTo(550, tableTop - 20)
         .strokeColor('#e2e8f0')
         .stroke();

      // Table Header
      doc.rect(50, tableTop, 500, 30)
         .fillAndStroke(primaryColor, primaryColor);

      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('Description', 60, tableTop + 10)
         .text('Type', 280, tableTop + 10)
         .text('Qty', 360, tableTop + 10)
         .text('Rate', 410, tableTop + 10)
         .text('Amount', 480, tableTop + 10);

      // Table Rows
      let yPosition = tableTop + 40;
      const items = billData.items || [];

      items.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(50, yPosition - 5, 500, 25)
             .fillAndStroke('#f8fafc', '#f8fafc');
        }

        doc.fontSize(9)
           .fillColor(darkColor)
           .text(item.description || '', 60, yPosition, { width: 210, ellipsis: true })
           .text(item.item_type || 'Product', 280, yPosition)
           .text(item.quantity || 1, 360, yPosition)
           .text(`₹${parseFloat(item.unit_price || 0).toFixed(2)}`, 410, yPosition)
           .text(`₹${parseFloat(item.total_price || 0).toFixed(2)}`, 480, yPosition);

        yPosition += 25;

        // Add new page if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });

      // Summary Section
      yPosition += 20;
      const summaryX = 350;

      doc.fontSize(10)
         .fillColor(secondaryColor);

      // Subtotal
      doc.text('Subtotal:', summaryX, yPosition)
         .fillColor(darkColor)
         .text(`₹${parseFloat(billData.subtotal || 0).toFixed(2)}`, 480, yPosition, { align: 'right' });

      yPosition += 20;

      // Discount
      if (billData.discount_amount && billData.discount_amount > 0) {
        doc.fillColor(secondaryColor)
           .text('Discount:', summaryX, yPosition)
           .fillColor('#dc2626')
           .text(`-₹${parseFloat(billData.discount_amount).toFixed(2)}`, 480, yPosition, { align: 'right' });
        yPosition += 20;
      }

      // Tax
      doc.fillColor(secondaryColor)
         .text(`Tax (${process.env.TAX_PERCENTAGE || 18}%):`, summaryX, yPosition)
         .fillColor(darkColor)
         .text(`₹${parseFloat(billData.tax_amount || 0).toFixed(2)}`, 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Total - Highlighted
      doc.rect(summaryX - 10, yPosition - 5, 210, 30)
         .fillAndStroke(primaryColor, primaryColor);

      doc.fontSize(12)
         .fillColor('#ffffff')
         .text('TOTAL:', summaryX, yPosition)
         .fontSize(14)
         .text(`₹${parseFloat(billData.total_amount || 0).toFixed(2)}`, 480, yPosition, { align: 'right' });

      yPosition += 40;

      // Paid Amount
      if (billData.paid_amount && billData.paid_amount > 0) {
        doc.fontSize(10)
           .fillColor(secondaryColor)
           .text('Paid Amount:', summaryX, yPosition)
           .fillColor('#059669')
           .text(`₹${parseFloat(billData.paid_amount).toFixed(2)}`, 480, yPosition, { align: 'right' });
        yPosition += 20;

        // Balance Due
        const balance = billData.total_amount - billData.paid_amount;
        if (balance > 0) {
          doc.fillColor(secondaryColor)
             .text('Balance Due:', summaryX, yPosition)
             .fillColor('#dc2626')
             .text(`₹${balance.toFixed(2)}`, 480, yPosition, { align: 'right' });
        }
      }

      // Footer
      const footerY = 750;
      doc.moveTo(50, footerY)
         .lineTo(550, footerY)
         .strokeColor('#e2e8f0')
         .stroke();

      doc.fontSize(9)
         .fillColor(secondaryColor)
         .text('Terms & Conditions:', 50, footerY + 10)
         .fontSize(8)
         .text('1. Payment is due within 15 days', 50, footerY + 25)
         .text('2. Please include invoice number with payment', 50, footerY + 38);

      doc.fontSize(8)
         .text('Thank you for your business!', 350, footerY + 25, { align: 'right' })
         .fontSize(7)
         .fillColor('#94a3b8')
         .text(`Generated on ${formatDate(new Date())}`, 350, footerY + 40, { align: 'right' });

      // Finalize PDF
      doc.end();

      outputStream.on('finish', () => {
        resolve();
      });

      outputStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format date to readable string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

module.exports = {
  generateInvoicePDF
};
