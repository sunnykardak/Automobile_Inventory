const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Get all tokens with filtering
router.get('/', tokenController.getAllTokens);

// Get token statistics
router.get('/stats', tokenController.getTokenStats);

// Get single token by ID
router.get('/:id', tokenController.getTokenById);

// Create new token
router.post('/', tokenController.createToken);

// Update token
router.put('/:id', tokenController.updateToken);

// Complete token
router.patch('/:id/complete', tokenController.completeToken);

// Delete token
router.delete('/:id', tokenController.deleteToken);

module.exports = router;
