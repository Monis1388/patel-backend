const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    name: { type: String, required: true },
    image: { type: String, required: true }, // Main image
    images: [{ type: String }], // Gallery
    brand: { type: String, required: true },
    category: { type: String, required: true }, // Eyeglasses, Sunglasses, Accessories
    description: { type: String, required: true },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },

    // Specific attributes
    gender: { type: String, enum: ['Men', 'Women', 'Kids', 'Unisex'], required: true },
    frameType: { type: String }, // Full Rim, Half Rim, Rimless
    frameShape: { type: String }, // Rectangle, Round, Aviator, etc.
    frameColor: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
