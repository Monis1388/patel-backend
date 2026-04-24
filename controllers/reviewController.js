const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    const { rating, comment, productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // 1. Check if user already reviewed this product (optional but recommended)
    const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        product: productId,
    });

    if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
    }

    // 2. Validate if the user has an order for that product with status: 'Delivered'
    const order = await Order.findOne({
        user: req.user._id,
        'orderItems.product': productId,
        orderStatus: 'Delivered'
    });

    if (!order) {
        return res.status(403).json({ 
            message: 'Only users who have received the delivery of this item can leave a review.' 
        });
    }

    const review = await Review.create({
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
        product: productId,
        order: order._id,
        isVerified: true
    });

    if (review) {
        // 3. Automatically calculate and update the average rating of the product
        const reviews = await Review.find({ product: productId });
        
        product.numReviews = reviews.length;
        product.rating = 
            reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await product.save();

        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(400).json({ message: 'Invalid review data' });
    }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getProductReviews = async (req, res) => {
    const reviews = await Review.find({ product: req.params.productId })
        .populate('user', 'name')
        .sort({ createdAt: -1 });

    res.json(reviews);
};

// @desc    Check if user is eligible to review
// @route   GET /api/reviews/check-eligibility/:productId
// @access  Private
const checkReviewEligibility = async (req, res) => {
    const order = await Order.findOne({
        user: req.user._id,
        'orderItems.product': req.params.productId,
        orderStatus: 'Delivered'
    });

    const alreadyReviewed = await Review.findOne({
        user: req.user._id,
        product: req.params.productId,
    });

    res.json({
        canReview: !!order && !alreadyReviewed,
        message: !order 
            ? 'Delivery not received yet' 
            : (alreadyReviewed ? 'Already reviewed' : 'Eligible')
    });
};

module.exports = {
    createReview,
    getProductReviews,
    checkReviewEligibility
};
