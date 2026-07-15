const express = require('express');
const { getRecentSessionRecords } = require('../controllers/userController');

const router = express.Router();

router.get('/:userId/sessions/recent', getRecentSessionRecords);

module.exports = router;
