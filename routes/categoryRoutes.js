const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { clearCache } = require('../middleware/cacheMiddleware');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (error) {
        console.error('getCategories Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a category
router.post('/', async (req, res) => {
    try {
        const category = new Category(req.body);
        const savedCategory = await category.save();
        await clearCache('/api/categories*');
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a category
router.put('/:id', async (req, res) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await clearCache('/api/categories*');
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a category
router.delete('/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        await clearCache('/api/categories*');
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
