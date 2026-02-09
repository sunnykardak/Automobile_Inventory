const { query } = require('../config/database');
const logger = require('../utils/logger');

// Get all labour charge policies
exports.getAllLabourCharges = async (req, res) => {
  try {
    const result = await query('SELECT * FROM labour_charges ORDER BY id');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get labour charges error:', error);
    res.status(500).json({ success: false, message: 'Failed to get labour charges', error: error.message });
  }
};

// Create a labour charge policy
exports.createLabourCharge = async (req, res) => {
  try {
    const { name, amount } = req.body;
    if (!name || amount == null) {
      return res.status(400).json({ success: false, message: 'Please provide name and amount' });
    }

    const result = await query(
      `INSERT INTO labour_charges (name, amount, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [name, amount, req.user.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Create labour charge error:', error);
    res.status(500).json({ success: false, message: 'Failed to create labour charge', error: error.message });
  }
};

// Delete a labour charge
exports.deleteLabourCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM labour_charges WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Labour charge not found' });
    }
    res.status(200).json({ success: true, message: 'Deleted', data: result.rows[0] });
  } catch (error) {
    logger.error('Delete labour charge error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete labour charge', error: error.message });
  }
};
