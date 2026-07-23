const express = require('express');
const { createSession, getSessionEvaluation, getSession } = require('../controllers/sessionController');
const { generateUploadUrl, confirmUpload } = require('../controllers/audioController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createSession);
router.get('/:id', authMiddleware, getSession);
router.post('/:id/audio/url', authMiddleware, generateUploadUrl);
router.post('/:id/audio/confirm', authMiddleware, confirmUpload);
router.get('/:id/evaluation', authMiddleware, getSessionEvaluation);

module.exports = router;
