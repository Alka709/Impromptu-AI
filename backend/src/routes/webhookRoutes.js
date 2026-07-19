const express = require('express');
const { handleEvaluationResult } = require('../controllers/webhookController');
const { internalAuthMiddleware } = require('../middleware/internalAuth.middleware');

const router = express.Router();

// Webhook endpoint to receive evaluation result from FastAPI
router.post('/evaluation-result', internalAuthMiddleware, handleEvaluationResult);

module.exports = router;
