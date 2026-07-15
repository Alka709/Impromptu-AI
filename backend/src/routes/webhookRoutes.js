const express = require('express');
const { handleEvaluationResult } = require('../controllers/webhookController');

const router = express.Router();

// Webhook endpoint to receive evaluation result from FastAPI
router.post('/evaluation-result', handleEvaluationResult);

module.exports = router;
