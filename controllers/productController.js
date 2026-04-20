const Product = require('../models/Product');
const { clearCache } = require('../middleware/cacheMiddleware');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.pageNumber) || 1;

        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword, $options: 'i' } },
                    { brand: { $regex: req.query.keyword, $options: 'i' } },
                    { description: { $regex: req.query.keyword, $options: 'i' } },
                    { category: { $regex: req.query.keyword, $options: 'i' } },
                    { frameShape: { $regex: req.query.keyword, $options: 'i' } },
                ],
            }
            : {};

        // Filters
        const filters = { ...keyword };
        if (req.query.category) filters.category = req.query.category;
        if (req.query.brand) filters.brand = req.query.brand;
        if (req.query.gender) filters.gender = req.query.gender;
        if (req.query.frameType) filters.frameType = req.query.frameType;
        if (req.query.frameShape) filters.frameShape = req.query.frameShape;

        // Price Filter
        if (req.query.minPrice || req.query.maxPrice) {
            filters.price = {};
            if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
        }

        // Rating Filter
        if (req.query.minRating) {
            filters.rating = { $gte: Number(req.query.minRating) };
        }


        const count = await Product.countDocuments(filters);
        const products = await Product.find(filters)
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ products, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        console.error('getProducts Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(`[PRODUCT] Error fetching product ${JSON.stringify(req.params.id)}:`, error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne(); // or findByIdAndDelete
            await clearCache('/api/products*');
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            image,
            brand,
            category,
            countInStock,
            gender,
            frameType,
            frameShape,
            frameColor,
            images
        } = req.body;

        const product = new Product({
            name: name || 'Sample Name',
            price: price || 0,
            user: req.user._id,
            image: image || '/images/sample.jpg',
            images: images || [],
            brand: brand || 'Sample Brand',
            category: category || 'Eyeglasses',
            countInStock: countInStock || 0,
            numReviews: 0,
            description: description || 'Sample description',
            gender: gender || 'Unisex',
            frameType: frameType || 'Full Rim',
            frameShape: frameShape || 'Rectangle',
            frameColor: frameColor || 'Black'
        });

        const createdProduct = await product.save();
        await clearCache('/api/products*');
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            image,
            brand,
            category,
            countInStock,
            gender,
            frameType,
            frameShape,
            frameColor,
            images
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name !== undefined ? name : product.name;
            product.price = price !== undefined ? price : product.price;
            product.description = description !== undefined ? description : product.description;
            product.image = image !== undefined ? image : product.image;
            product.brand = brand !== undefined ? brand : product.brand;
            product.category = category !== undefined ? category : product.category;
            product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
            product.gender = gender !== undefined ? gender : product.gender;
            product.frameType = frameType !== undefined ? frameType : product.frameType;
            product.frameShape = frameShape !== undefined ? frameShape : product.frameShape;
            product.frameColor = frameColor !== undefined ? frameColor : product.frameColor;
            if (images) product.images = images;

            const updatedProduct = await product.save();
            await clearCache('/api/products*');
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
    createProductReview
};
