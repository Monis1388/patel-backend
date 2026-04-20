const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    updateOrderToShipped,
    getDashboardStats,
    getMyOrders,
    getOrders,
    getServiceability,
    createRazorpayOrder,
    trackOrder,
    deleteOrder,
    requestReturn,
    approveReturn,
    rejectReturn,
    markRefunded,
    cancelOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/razorpay').post(protect, createRazorpayOrder);
router.route('/serviceability/:pincode').get(protect, getServiceability);
router.route('/stats').get(protect, admin, getDashboardStats);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route('/:id/track').get(protect, trackOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/ship').put(protect, admin, updateOrderToShipped);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

// Return & Refund routes
router.route('/:id/return-request').put(protect, requestReturn);
router.route('/:id/return-approve').put(protect, admin, approveReturn);
router.route('/:id/return-reject').put(protect, admin, rejectReturn);
router.route('/:id/refund').put(protect, admin, markRefunded);
router.route('/:id/cancel').put(protect, cancelOrder);

module.exports = router;

