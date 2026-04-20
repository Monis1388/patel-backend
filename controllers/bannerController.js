const Banner = require('../models/Banner');
const { clearCache } = require('../middleware/cacheMiddleware');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
const getBanners = async (req, res) => {
    try {
        // If ?all=true is passed (admin only), return all banners regardless of isActive
        const filter = req.query.all === 'true' ? {} : { isActive: true };
        const banners = await Banner.find(filter).sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        console.error('getBanners Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, image, link, order } = req.body;
        const banner = new Banner({
            title,
            subtitle,
            image,
            link,
            order,
        });

        const createdBanner = await banner.save();
        await clearCache('/api/banners*');
        res.status(201).json(createdBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            banner.title = req.body.title || banner.title;
            banner.subtitle = req.body.subtitle || banner.subtitle;
            banner.image = req.body.image || banner.image;
            banner.link = req.body.link || banner.link;
            banner.isActive = req.body.isActive !== undefined ? req.body.isActive : banner.isActive;
            banner.order = req.body.order !== undefined ? req.body.order : banner.order;

            const updatedBanner = await banner.save();
            await clearCache('/api/banners*');
            res.json(updatedBanner);
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
            await banner.deleteOne();
            await clearCache('/api/banners*');
            res.json({ message: 'Banner removed' });
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
};
