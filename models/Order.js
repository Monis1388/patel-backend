const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [
            {
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Product',
                },
                lensStats: { type: mongoose.Schema.Types.Mixed }, // Optional prescription details
            },
        ],
        shippingAddress: {
            fullName: { type: String },
            phone: { type: String },
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'Prepaid'],
            default: 'COD',
            required: true,
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        itemsPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        orderStatus: { // Confirmed, Shipped, Out for Delivery, Delivered, Cancelled
            type: String,
            default: 'Confirmed'
        },
        trackingId: { type: String }, // Delhivery forward AWB

        // ── Return & Refund ──────────────────────────────────────────
        returnStatus: {
            type: String,
            enum: ['None', 'Requested', 'Approved', 'Picked Up', 'Refunded', 'Rejected'],
            default: 'None'
        },
        returnReason: { type: String, default: '' },
        returnRequestedAt: { type: Date },
        returnTrackingId: { type: String }, // Delhivery reverse pickup AWB
        isRefunded: { type: Boolean, default: false },
        refundedAt: { type: Date }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Order', orderSchema);
