const { createShipment, checkServiceability, trackShipment, createReversePickup } = require('../services/delhiveryService');
const { sendOrderSMS } = require('../services/twilioService');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            res.status(400).json({ message: 'No order items' });
            return;
        } else {
            const order = new Order({
                orderItems,
                user: req.user._id,
                shippingAddress,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            });

            const createdOrder = await order.save();
            
            // Generate Delhivery Shipment immediately upon booking
            try {
                const shipmentData = await createShipment(createdOrder);
                if (shipmentData && shipmentData.packages && shipmentData.packages.length > 0) {
                    createdOrder.trackingId = shipmentData.packages[0].waybill;
                    createdOrder.orderStatus = 'Confirmed'; // Or 'Processing'
                    await createdOrder.save();
                } else if (shipmentData.shipment_id) { // Mock fallback
                    createdOrder.trackingId = shipmentData.awb_code;
                    await createdOrder.save();
                }
            } catch (delhiErr) {
                console.error('Instant Delhivery CMU failed:', delhiErr.message);
                // We don't fail the order placement if shipping API is down
            }

            // Send Order Confirmation SMS
            if (req.user && req.user.phone) {
                try {
                    await sendOrderSMS(req.user.phone, createdOrder._id);
                } catch (smsErr) {
                    console.error('[ORDER SMS] Failed to send confirmation ripple:', smsErr.message);
                }
            }

            res.status(201).json(createdOrder);
        }
    } catch (error) {
        console.error('addOrderItems Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate(
            'user',
            'name email phone'
        );

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('getOrderById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.email_address,
            };

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('updateOrderToPaid Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json(orders);
    } catch (error) {
        console.error('getMyOrders Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name phone');
        res.json(orders);
    } catch (error) {
        console.error('getOrders Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.orderStatus = 'Delivered';

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            console.error('updateOrderToDelivered Error: Order not found');
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('updateOrderToDelivered Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order to shipped (Admin)
// @route   PUT /api/orders/:id/ship
// @access  Private/Admin
const updateOrderToShipped = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            let trackingId;
            try {
                const shipmentData = await createShipment(order);

                // Delhivery returns waybill inside the 'packages' array
                if (shipmentData && shipmentData.packages && shipmentData.packages.length > 0) {
                    trackingId = shipmentData.packages[0].waybill;
                } else if (shipmentData.shipment_id) { 
                    trackingId = shipmentData.awb_code;
                } else {
                    // Fallback: Generate manual ID if API sync fails
                    console.warn('[LOGISTICS] Delhivery sync failed, falling back to manual ID');
                    trackingId = `MANUAL-${Date.now().toString().slice(-6)}`;
                }
            } catch (err) {
                console.error('[LOGISTICS ERROR]:', err.message);
                trackingId = `MANUAL-${Date.now().toString().slice(-6)}`;
            }

            order.trackingId = trackingId;
            order.orderStatus = 'Shipped';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('updateOrderToShipped Error:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get Data Stats
// @route   GET /api/orders/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const ordersCount = await Order.countDocuments();
        const productsCount = await Product.countDocuments();
        const usersCount = await User.countDocuments();

        const salesResult = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
        ]);
        const totalSales = salesResult[0]?.totalSales || 0;

        res.json({ ordersCount, productsCount, usersCount, totalSales });
    } catch (error) {
        console.error('getDashboardStats Error:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Check pincode serviceability
// @route   GET /api/orders/serviceability/:pincode
// @access  Private
const getServiceability = async (req, res) => {
    try {
        const data = await checkServiceability(req.params.pincode);
        res.json(data);
    } catch (error) {
        console.error('getServiceability Error:', error);
        res.status(500).json({ message: error.message });
    }
}

const razorpay = require('../config/razorpay');

// @desc    Create Razorpay Order
// @route   POST /api/orders/razorpay
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ message: "Invalid amount provided" });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // amount in paise, must be an integer
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        console.log('Creating Razorpay order with options:', options);
        const order = await razorpay.orders.create(options);

        if (!order) {
            console.error('Razorpay order creation returned empty');
            return res.status(500).json({ message: "Failed to create Razorpay order" });
        }

        res.json(order);
    } catch (error) {
        console.error('createRazorpayOrder Error:', error);
        res.status(500).json({
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    User requests a return (within 7 days of delivery)
// @route   PUT /api/orders/:id/return-request
// @access  Private
const requestReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Must belong to the requesting user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Must be Delivered
        if (order.orderStatus !== 'Delivered' || !order.deliveredAt) {
            return res.status(400).json({ message: 'Order must be delivered before requesting a return' });
        }

        // 7-day return window check
        const daysSinceDelivery = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDelivery > 7) {
            return res.status(400).json({ message: '7-day return window has expired' });
        }

        if (order.returnStatus !== 'None') {
            return res.status(400).json({ message: `Return already ${order.returnStatus}` });
        }

        order.returnStatus = 'Requested';
        order.returnReason = req.body.reason || 'No reason provided';
        order.returnRequestedAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error('requestReturn Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin approves return & triggers Delhivery reverse pickup
// @route   PUT /api/orders/:id/return-approve
// @access  Private/Admin
const approveReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.returnStatus !== 'Requested') {
            return res.status(400).json({ message: 'No pending return request on this order' });
        }

        // Trigger Delhivery reverse pickup
        const reverseData = await createReversePickup(order);

        let reverseAWB = null;
        if (reverseData && reverseData.packages && reverseData.packages.length > 0) {
            reverseAWB = reverseData.packages[0].waybill;
        } else if (reverseData && reverseData.awb_code) {
            reverseAWB = reverseData.awb_code; // mock fallback
        }

        order.returnStatus = 'Approved';
        order.orderStatus = 'Return Approved';
        if (reverseAWB) order.returnTrackingId = reverseAWB;

        const updatedOrder = await order.save();
        res.json({ order: updatedOrder, reversePickup: reverseData });
    } catch (error) {
        console.error('approveReturn Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin rejects a return request
// @route   PUT /api/orders/:id/return-reject
// @access  Private/Admin
const rejectReturn = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.returnStatus = 'Rejected';
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error('rejectReturn Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin marks item as returned & refunded (once it reaches warehouse)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
const markRefunded = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.returnStatus = 'Refunded';
        order.orderStatus = 'Refunded';
        order.isRefunded = true;
        order.refundedAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error('markRefunded Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
    updateOrderToShipped,
    getDashboardStats,
    getServiceability,
    createRazorpayOrder,
    requestReturn,
    approveReturn,
    rejectReturn,
    markRefunded,
    trackOrder: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            if (!order.trackingId) {
                return res.status(400).json({ message: 'Tracking ID not found for this order' });
            }

            const trackingData = await trackShipment(order.trackingId);
            res.json(trackingData);
        } catch (error) {
            console.error('trackOrder Error:', error);
            res.status(500).json({ message: error.message });
        }
    },
    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            await Order.deleteOne({ _id: req.params.id });
            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            console.error('deleteOrder Error:', error);
            res.status(500).json({ message: error.message });
        }
    },
    cancelOrder: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) return res.status(404).json({ message: 'Order not found' });

            // Check if user owns the order
            if (order.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            // Can only cancel if Pending or Confirmed
            const cancellableStatuses = ['Pending', 'Confirmed', 'CONFIRMED', 'Processing'];
            if (!cancellableStatuses.includes(order.orderStatus)) {
                return res.status(400).json({ message: `Order cannot be cancelled at this stage (${order.orderStatus}).` });
            }

            order.orderStatus = 'Cancelled';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } catch (error) {
            console.error('cancelOrder Error:', error);
            res.status(500).json({ message: error.message });
        }
    }
};
