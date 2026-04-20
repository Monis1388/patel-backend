const express = require('express');
const router = express.Router();
const {
    submitContact,
    getContacts,
    markAsRead,
    deleteContact
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(submitContact).get(protect, admin, getContacts);
router.route('/:id/read').put(protect, admin, markAsRead);
router.route('/:id').delete(protect, admin, deleteContact);

module.exports = router;
