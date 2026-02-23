const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

router.use(authenticate);

// Get all customers with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    
    let queryText = `
      SELECT 
        c.*,
        COUNT(DISTINCT cv.id) as vehicle_count,
        COUNT(DISTINCT jc.id) as job_count,
        COALESCE(SUM(b.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN customer_vehicles cv ON c.id = cv.customer_id
      LEFT JOIN job_cards jc ON c.phone = jc.customer_phone
      LEFT JOIN bills b ON jc.id = b.job_card_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      queryText += ` AND (c.customer_name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status !== 'all') {
      queryText += ` AND c.is_active = $${paramIndex}`;
      params.push(status === 'active');
      paramIndex++;
    }
    
    queryText += ` 
      GROUP BY c.id
      ORDER BY c.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(queryText, params);
    
    const countResult = await query(
      `SELECT COUNT(*) FROM customers WHERE 1=1 
       ${search ? 'AND (customer_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)' : ''}
       ${status !== 'all' ? `AND is_active = ${status === 'active'}` : ''}`,
      search ? [`%${search}%`] : []
    );
    
    res.json({
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
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get customer by ID with vehicles
router.get('/:id', async (req, res) => {
  try {
    const customerResult = await query(
      'SELECT * FROM customers WHERE id = $1',
      [req.params.id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const vehiclesResult = await query(
      'SELECT * FROM customer_vehicles WHERE customer_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    
    const jobsResult = await query(
      `SELECT jc.*, b.bill_number, b.total_amount 
       FROM job_cards jc
       LEFT JOIN bills b ON jc.id = b.job_card_id
       WHERE jc.customer_phone = $1
       ORDER BY jc.created_at DESC
       LIMIT 10`,
      [customerResult.rows[0].phone]
    );
    
    res.json({
      success: true,
      data: {
        ...customerResult.rows[0],
        vehicles: vehiclesResult.rows,
        recentJobs: jobsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new customer
router.post('/', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstNumber,
      customerType,
      notes,
    } = req.body;
    
    if (!customerName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required',
      });
    }
    
    const result = await query(
      `INSERT INTO customers (
        customer_name, phone, email, address, city, state, 
        pincode, gst_number, customer_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [customerName, phone, email, address, city, state, pincode, gstNumber, customerType || 'Individual', notes]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists',
      });
    }
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update customer
router.put('/:id', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstNumber,
      customerType,
      notes,
      isActive,
    } = req.body;
    
    const result = await query(
      `UPDATE customers SET
        customer_name = COALESCE($1, customer_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        pincode = COALESCE($7, pincode),
        gst_number = COALESCE($8, gst_number),
        customer_type = COALESCE($9, customer_type),
        notes = COALESCE($10, notes),
        is_active = COALESCE($11, is_active)
      WHERE id = $12
      RETURNING *`,
      [customerName, phone, email, address, city, state, pincode, gstNumber, customerType, notes, isActive, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete customer
router.delete('/:id', authorize('Admin', 'Owner'), async (req, res) => {
  try {
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add vehicle to customer
router.post('/:id/vehicles', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vinNumber,
      registrationDate,
      insuranceExpiry,
      notes,
    } = req.body;
    
    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number and type are required',
      });
    }
    
    const result = await query(
      `INSERT INTO customer_vehicles (
        customer_id, vehicle_number, vehicle_type, vehicle_brand, vehicle_model,
        vehicle_year, vin_number, registration_date, insurance_expiry, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [req.params.id, vehicleNumber.toUpperCase(), vehicleType, vehicleBrand, vehicleModel, vehicleYear, vinNumber, registrationDate, insuranceExpiry, notes]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this number already exists',
      });
    }
    console.error('Add vehicle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update vehicle
router.put('/:id/vehicles/:vehicleId', authorize('Admin', 'Owner', 'Manager'), async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vinNumber,
      registrationDate,
      insuranceExpiry,
      lastServiceDate,
      nextServiceDue,
      odometerReading,
      notes,
      isActive,
    } = req.body;
    
    const result = await query(
      `UPDATE customer_vehicles SET
        vehicle_number = COALESCE($1, vehicle_number),
        vehicle_type = COALESCE($2, vehicle_type),
        vehicle_brand = COALESCE($3, vehicle_brand),
        vehicle_model = COALESCE($4, vehicle_model),
        vehicle_year = COALESCE($5, vehicle_year),
        vin_number = COALESCE($6, vin_number),
        registration_date = COALESCE($7, registration_date),
        insurance_expiry = COALESCE($8, insurance_expiry),
        last_service_date = COALESCE($9, last_service_date),
        next_service_due = COALESCE($10, next_service_due),
        odometer_reading = COALESCE($11, odometer_reading),
        notes = COALESCE($12, notes),
        is_active = COALESCE($13, is_active)
      WHERE id = $14 AND customer_id = $15
      RETURNING *`,
      [vehicleNumber, vehicleType, vehicleBrand, vehicleModel, vehicleYear, vinNumber, registrationDate, insuranceExpiry, lastServiceDate, nextServiceDue, odometerReading, notes, isActive, req.params.vehicleId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete vehicle
router.delete('/:id/vehicles/:vehicleId', authorize('Admin', 'Owner'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM customer_vehicles WHERE id = $1 AND customer_id = $2 RETURNING *',
      [req.params.vehicleId, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
