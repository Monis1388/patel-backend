const mongoose = require('mongoose');

const lensSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, enum: ['Single Vision', 'Zero Power', 'Bifocal', 'Progressive'], required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    icon: { type: String, default: 'Sparkles' },
}, { timestamps: true });

module.exports = mongoose.model('Lens', lensSchema);
