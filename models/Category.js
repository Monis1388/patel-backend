const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true }, // Men, Women, Kids, etc.
    type: { type: String, required: true }, // Eyeglasses, Sunglasses
    image: { type: String, required: true },
    priceText: { type: String }, // optional e.g. "Starts @₹500"
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
