const express = require('express');
const router = express.Router();
const { getAiResponse } = require('../controllers/aiController');

router.post('/chat', getAiResponse);

module.exports = router;
