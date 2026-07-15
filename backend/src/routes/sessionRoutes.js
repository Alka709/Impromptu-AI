const express = require('express');
const multer = require('multer');
const { createSession, getSessionEvaluation, getSession } = require('../controllers/sessionController');
const { uploadAudio } = require('../controllers/audioController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authMiddleware, createSession);
router.get('/:id', authMiddleware, getSession);
router.post('/:id/audio', authMiddleware, upload.single('audio'), uploadAudio);
router.get('/:id/evaluation', authMiddleware, getSessionEvaluation);

module.exports = router;
