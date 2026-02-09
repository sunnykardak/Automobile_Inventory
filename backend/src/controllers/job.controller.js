const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

// @desc    Get all job cards
// @route   GET /api/v1/jobs
// @access  Private
exports.getAllJobs = async (req, res) => {
  try {
    const { status, mechanicId, page = 1, limit = 20 } = req.query;
    
    let queryText = `
      SELECT jc.*, 
             e.first_name || ' ' || e.last_name as mechanic_name,
             u.username as created_by_name
      FROM job_cards jc
      LEFT JOIN employees e ON jc.assigned_mechanic_id = e.id
      LEFT JOIN users u ON jc.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      queryText += ` AND jc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (mechanicId) {
      queryText += ` AND jc.assigned_mechanic_id = $${paramIndex}`;
      params.push(mechanicId);
      paramIndex++;
    }
    
    // If user is a mechanic, only show their jobs
    if (req.user.role_name === 'Mechanic') {
      const employeeResult = await query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (employeeResult.rows.length > 0) {
        queryText += ` AND jc.assigned_mechanic_id = $${paramIndex}`;
        params.push(employeeResult.rows[0].id);
        paramIndex++;
      }
    }
    
    queryText += ` ORDER BY jc.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(queryText, params);
    
    const countResult = await query(
      `SELECT COUNT(*) FROM job_cards WHERE 1=1 ${status ? 'AND status = $1' : ''}`,
      status ? [status] : []
    );
    
    res.status(200).json({
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
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: error.message,
    });
  }
};

// @desc    Get single job card
// @route   GET /api/v1/jobs/:id
// @access  Private
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT jc.*,
              e.first_name || ' ' || e.last_name as mechanic_name,
              e.commission_percentage,
              u.username as created_by_name
       FROM job_cards jc
       LEFT JOIN employees e ON jc.assigned_mechanic_id = e.id
       LEFT JOIN users u ON jc.created_by = u.id
       WHERE jc.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }
    
    // Get job products
    const productsResult = await query(
      `SELECT jp.*, 
              i.barcode,
              pm.name as product_name,
              i.brand
       FROM job_products jp
       LEFT JOIN inventory i ON jp.inventory_id = i.id
       LEFT JOIN product_master pm ON i.product_master_id = pm.id
       WHERE jp.job_card_id = $1`,
      [id]
    );
    
    const jobCard = {
      ...result.rows[0],
      products: productsResult.rows,
    };
    
    res.status(200).json({
      success: true,
      data: jobCard,
    });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: error.message,
    });
  }
};

// @desc    Create new job card
// @route   POST /api/v1/jobs
// @access  Private
exports.createJob = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      vehicleNumber,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      reportedIssues,
      assignedMechanicId,
      estimatedCost,
      labourChargeIds,
      includeWashing,
      washingVehicleType,
      washingType,
      washingDieselWash,
      washingAddons,
      washingCharges,
    } = req.body;
    
    // Validation
    if (!customerName || !customerPhone || !vehicleNumber || !vehicleType || !reportedIssues) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }
    
    // If labourChargeIds provided, compute labour total server-side
    let labourIds = Array.isArray(labourChargeIds) ? labourChargeIds : [];
    let labourTotal = 0;
    if (labourIds.length > 0) {
      const vals = labourIds.map((_, i) => `$${i + 1}`).join(',');
      const labourRes = await query(`SELECT id, amount FROM labour_charges WHERE id IN (${vals})`, labourIds);
      labourTotal = labourRes.rows.reduce((s, r) => s + parseFloat(r.amount), 0);
    }

    const result = await query(
      `INSERT INTO job_cards (
        customer_name, customer_phone, customer_email,
        vehicle_number, vehicle_type, vehicle_brand, vehicle_model,
        reported_issues, assigned_mechanic_id, estimated_cost,
        labor_charges, labour_charge_ids, created_by,
        include_washing, washing_vehicle_type, washing_type,
        washing_diesel_wash, washing_addons, washing_charges
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        customerName, customerPhone, customerEmail || null,
        vehicleNumber, vehicleType, vehicleBrand || null, vehicleModel || null,
        reportedIssues, assignedMechanicId || null, estimatedCost || null,
        labourTotal || 0, labourIds.length > 0 ? labourIds : null, req.user.id,
        includeWashing || false, washingVehicleType || null, washingType || null,
        washingDieselWash || false, washingAddons || null, washingCharges || 0,
      ]
    );
    
    logger.info(`Job card created: ${result.rows[0].job_number} by ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      message: 'Job card created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message,
    });
  }
};

// @desc    Update job card
// @route   PUT /api/v1/jobs/:id
// @access  Private
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      customerEmail,
      vehicleNumber,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      reportedIssues,
      assignedMechanicId,
      estimatedCost,
      actualCost,
      labourChargeIds,
      status,
      includeWashing,
      washingVehicleType,
      washingType,
      washingDieselWash,
      washingAddons,
      washingCharges,
    } = req.body;
    
    // If labourChargeIds provided, compute labour total
    let labourIds = Array.isArray(labourChargeIds) ? labourChargeIds : [];
    let labourTotal = 0;
    if (labourIds.length > 0) {
      const vals = labourIds.map((_, i) => `$${i + 1}`).join(',');
      const labourRes = await query(`SELECT id, amount FROM labour_charges WHERE id IN (${vals})`, labourIds);
      labourTotal = labourRes.rows.reduce((s, r) => s + parseFloat(r.amount), 0);
    }

    const result = await query(
      `UPDATE job_cards SET
        customer_name = COALESCE($1, customer_name),
        customer_phone = COALESCE($2, customer_phone),
        customer_email = COALESCE($3, customer_email),
        vehicle_number = COALESCE($4, vehicle_number),
        vehicle_type = COALESCE($5, vehicle_type),
        vehicle_brand = COALESCE($6, vehicle_brand),
        vehicle_model = COALESCE($7, vehicle_model),
        reported_issues = COALESCE($8, reported_issues),
        assigned_mechanic_id = COALESCE($9, assigned_mechanic_id),
        estimated_cost = COALESCE($10, estimated_cost),
        actual_cost = COALESCE($11, actual_cost),
        labor_charges = COALESCE($12, labor_charges),
        labour_charge_ids = COALESCE($13, labour_charge_ids),
        status = COALESCE($14, status),
        include_washing = COALESCE($15, include_washing),
        washing_vehicle_type = COALESCE($16, washing_vehicle_type),
        washing_type = COALESCE($17, washing_type),
        washing_diesel_wash = COALESCE($18, washing_diesel_wash),
        washing_addons = COALESCE($19, washing_addons),
        washing_charges = COALESCE($20, washing_charges),
        completed_at = CASE WHEN COALESCE($14, status) = 'Completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $21
       RETURNING *`,
      [
        customerName, customerPhone, customerEmail,
        vehicleNumber, vehicleType, vehicleBrand, vehicleModel,
        reportedIssues, assignedMechanicId, estimatedCost,
        actualCost, labourTotal, labourIds.length > 0 ? labourIds : null, status,
        includeWashing, washingVehicleType, washingType,
        washingDieselWash, washingAddons, washingCharges, id,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job card not found',
      });
    }
    
    logger.info(`Job card updated: ${result.rows[0].job_number}`);
    
    res.status(200).json({
      success: true,
      message: 'Job card updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message,
    });
  }
};

// @desc    Add product to job
// @route   POST /api/v1/jobs/:id/products
// @access  Private
exports.addProductToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { inventoryId, quantity } = req.body;
    
    if (!inventoryId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide inventoryId and quantity',
      });
    }
    
    // Get product price
    const inventoryResult = await query(
      'SELECT selling_price FROM inventory WHERE id = $1 AND is_active = true',
      [inventoryId]
    );
    
    if (inventoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in inventory',
      });
    }
    
    const unitPrice = inventoryResult.rows[0].selling_price;
    const totalPrice = unitPrice * quantity;
    
    // Add product to job
    const result = await query(
      `INSERT INTO job_products (job_card_id, inventory_id, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, inventoryId, quantity, unitPrice, totalPrice]
    );
    
    logger.info(`Product added to job ${id}`);
    
    res.status(201).json({
      success: true,
      message: 'Product added to job successfully',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Add product to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to job',
      error: error.message,
    });
  }
};

// @desc    Remove product from job
// @route   DELETE /api/v1/jobs/:id/products/:productId
// @access  Private
exports.removeProductFromJob = async (req, res) => {
  try {
    const { id, productId } = req.params;
    
    const result = await query(
      'DELETE FROM job_products WHERE id = $1 AND job_card_id = $2 RETURNING *',
      [productId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in job',
      });
    }
    
    logger.info(`Product removed from job ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Product removed from job successfully',
    });
  } catch (error) {
    logger.error('Remove product from job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from job',
      error: error.message,
    });
  }
};

// @desc    Complete job and generate bill
// @route   POST /api/v1/jobs/:id/complete
// @access  Private
exports.completeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, taxPercentage, discountAmount } = req.body;
    
    await transaction(async (client) => {
      // Get job details
      const jobResult = await client.query(
        `SELECT jc.*, e.commission_percentage
         FROM job_cards jc
         LEFT JOIN employees e ON jc.assigned_mechanic_id = e.id
         WHERE jc.id = $1`,
        [id]
      );
      
      if (jobResult.rows.length === 0) {
        throw new Error('Job card not found');
      }
      
      const job = jobResult.rows[0];
      
      if (job.status === 'Completed') {
        throw new Error('Job already completed');
      }
      
      // Get job products
      const productsResult = await client.query(
        'SELECT * FROM job_products WHERE job_card_id = $1',
        [id]
      );
      
      const products = productsResult.rows;
      
      // Calculate totals
      const productsTotal = products.reduce((sum, p) => sum + parseFloat(p.total_price), 0);
        // Recompute labour charges from labour_charge_ids if present
        let laborCharges = parseFloat(job.labor_charges) || 0;
        if (job.labour_charge_ids && Array.isArray(job.labour_charge_ids) && job.labour_charge_ids.length > 0) {
          const vals = job.labour_charge_ids.map((_, i) => `$${i + 1}`).join(',');
          const labourRes = await client.query(`SELECT amount FROM labour_charges WHERE id IN (${vals})`, job.labour_charge_ids);
          laborCharges = labourRes.rows.reduce((s, r) => s + parseFloat(r.amount), 0);
        }
      const subtotal = productsTotal + laborCharges;
      const taxAmount = subtotal * (parseFloat(taxPercentage || process.env.TAX_PERCENTAGE) / 100);
      const discount = parseFloat(discountAmount) || 0;
      const totalAmount = subtotal + taxAmount - discount;
      
      // Create bill
      const billResult = await client.query(
        `INSERT INTO bills (
          job_card_id, customer_name, customer_phone, subtotal,
          tax_amount, discount_amount, total_amount, payment_method,
          payment_status, paid_amount, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          id, job.customer_name, job.customer_phone, subtotal,
          taxAmount, discount, totalAmount, paymentMethod,
          'Pending', 0, req.user.id,
        ]
      );
      
      const bill = billResult.rows[0];
      
      // Add bill items
      for (const product of products) {
        await client.query(
          `INSERT INTO bill_items (bill_id, item_type, description, quantity, unit_price, total_price)
           VALUES ($1, 'Product', (SELECT pm.name FROM inventory i JOIN product_master pm ON i.product_master_id = pm.id WHERE i.id = $2), $3, $4, $5)`,
          [bill.id, product.inventory_id, product.quantity, product.unit_price, product.total_price]
        );
        
        // Deduct from inventory
        await client.query(
          'UPDATE inventory SET current_quantity = current_quantity - $1 WHERE id = $2',
          [product.quantity, product.inventory_id]
        );
      }
      
      // Add labor charges as bill item
      if (laborCharges > 0) {
        await client.query(
          `INSERT INTO bill_items (bill_id, item_type, description, quantity, unit_price, total_price)
           VALUES ($1, 'Labor', 'Labor Charges', 1, $2, $2)`,
          [bill.id, laborCharges]
        );
      }
      
      // Calculate and record commission
      if (job.assigned_mechanic_id && job.commission_percentage > 0) {
        const commissionAmount = totalAmount * (job.commission_percentage / 100);
        
        await client.query(
          `INSERT INTO employee_commissions (
            employee_id, bill_id, job_card_id, commission_amount, commission_percentage
          ) VALUES ($1, $2, $3, $4, $5)`,
          [job.assigned_mechanic_id, bill.id, id, commissionAmount, job.commission_percentage]
        );
      }
      
      // Update job status
      await client.query(
        `UPDATE job_cards SET status = 'Completed', completed_at = CURRENT_TIMESTAMP, actual_cost = $1
         WHERE id = $2`,
        [totalAmount, id]
      );
      
      logger.info(`Job ${job.job_number} completed and bill ${bill.bill_number} generated`);
      
      res.status(200).json({
        success: true,
        message: 'Job completed and bill generated successfully',
        data: {
          job: { ...job, status: 'Completed' },
          bill,
        },
      });
    });
  } catch (error) {
    logger.error('Complete job error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete job',
    });
  }
};
