const express = require('express');
const router = express.Router();
const { getLenses, createLens, updateLens, deleteLens } = require('../controllers/lensController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getLenses)
    .post(protect, admin, createLens);

router.route('/:id')
    .put(protect, admin, updateLens)
    .delete(protect, admin, deleteLens);

module.exports = router;
