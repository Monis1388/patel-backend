const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
    },
    image: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        default: '/',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
