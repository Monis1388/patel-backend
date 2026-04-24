const express = require('express');
const router = express.Router();
const {
    createReview,
    getProductReviews,
    checkReviewEligibility
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReview);

router.route('/:productId')
    .get(getProductReviews);

router.route('/check-eligibility/:productId')
    .get(protect, checkReviewEligibility);

module.exports = router;
