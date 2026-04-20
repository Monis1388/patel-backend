const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for social/OTP login
    phone: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    savedPrescriptions: [{ type: String }], // URLs to uploaded images
    otp: { type: String },
    otpExpiry: { type: Date },
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: String,
            image: String,
            price: Number,
            qty: { type: Number, default: 1 },
            lensPower: {
                od: { sph: String, cyl: String, axis: String, add: String },
                os: { sph: String, cyl: String, axis: String, add: String },
                pd: String,
                lensType: String,
                prescriptionImage: String
            }
        }
    ], // Persistent cart
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    specsyAiEnabled: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
