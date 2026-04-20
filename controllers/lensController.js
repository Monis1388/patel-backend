const Lens = require('../models/Lens');

// @desc    Get all lenses
// @route   GET /api/lenses
exports.getLenses = async (req, res) => {
    try {
        const lenses = await Lens.find({});
        res.json(lenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a lens
// @route   POST /api/lenses
exports.createLens = async (req, res) => {
    try {
        const { name, category, description, price, icon } = req.body;
        const lens = new Lens({ name, category, description, price, icon });
        const createdLens = await lens.save();
        res.status(201).json(createdLens);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a lens
// @route   PUT /api/lenses/:id
exports.updateLens = async (req, res) => {
    try {
        const { name, category, description, price, icon } = req.body;
        const lens = await Lens.findById(req.params.id);

        if (lens) {
            lens.name = name || lens.name;
            lens.category = category || lens.category;
            lens.description = description || lens.description;
            lens.price = price || lens.price;
            lens.icon = icon || lens.icon;

            const updatedLens = await lens.save();
            res.json(updatedLens);
        } else {
            res.status(404).json({ message: 'Lens not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a lens
// @route   DELETE /api/lenses/:id
exports.deleteLens = async (req, res) => {
    try {
        const lens = await Lens.findById(req.params.id);
        if (lens) {
            await lens.deleteOne();
            res.json({ message: 'Lens removed' });
        } else {
            res.status(404).json({ message: 'Lens not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
