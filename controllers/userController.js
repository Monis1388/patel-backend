const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                address: user.address,
                savedPrescriptions: user.savedPrescriptions,
                specsyAiEnabled: user.specsyAiEnabled ?? true,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            if (req.body.password) {
                user.password = req.body.password;
            }
            if (req.body.address) {
                user.address = req.body.address;
            }
            if (req.body.specsyAiEnabled !== undefined) {
                user.specsyAiEnabled = req.body.specsyAiEnabled;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                address: updatedUser.address,
                specsyAiEnabled: updatedUser.specsyAiEnabled,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload Prescription
// @route   POST /api/users/upload-prescription
// @access  Private
const uploadPrescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }
        const user = await User.findById(req.user._id);
        if (user) {
            // In a real app, upload to Cloudinary/S3 here and save URL
            // For now, save local path
            const filePath = req.file.path.replace('\\', '/'); // Fix windows paths
            user.savedPrescriptions.push(filePath);
            await user.save();
            res.json({ message: 'Prescription uploaded', filePath: filePath });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc Get user cart
// @route GET /api/users/cart
// @access Private
const getUserCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart.product');

        // AUTO-HEALING: Ensure cart prices match current product prices (skipping lens orders which carry extra charges)
        let modified = false;
        user.cart.forEach(item => {
            const isFrameOnly = !item.lensPower || !item.lensPower.lensType || item.lensPower.lensType === 'Default' || item.lensPower.lensType === 'Frame Only';
            if (isFrameOnly && item.product && item.price !== item.product.price) {
                item.price = item.product.price;
                modified = true;
            }
        });

        if (modified) await user.save();

        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Cart retrieval failed' });
    }
}

// @desc Add to cart
// @route POST /api/users/cart
// @access Private
const addToCart = async (req, res) => {
    const { productId, name, image, qty, lensPower } = req.body;
    const user = await User.findById(req.user._id);
    const productItem = await Product.findById(productId);

    if (!productItem) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // CALCULATE FINAL PRICE: Prefer price from body (Frame + Lens), fallback to calculation
    let basePrice = productItem.price;
    let lensCharge = 0;

    if (lensPower && lensPower.lensType) {
        const type = lensPower.lensType;
        if (type.includes('Anti-Glare')) lensCharge = 500;
        else if (type.includes('Blue-Cut')) lensCharge = 700;
        else if (type.includes('Photochromic')) lensCharge = 1000;
        else if (type.includes('Progressive')) lensCharge = 1500;
    }

    const price = req.body.price || (basePrice + lensCharge);
    const itemExists = user.cart.find(x => x.product.toString() === productId);

    if (itemExists) {
        itemExists.qty = qty;
        itemExists.price = price;
        if (lensPower) itemExists.lensPower = lensPower;
    } else {
        user.cart.push({ product: productId, name: name || productItem.name, image: image || productItem.image, price, qty, lensPower });
    }
    await user.save();
    res.json(user.cart);
}

// @desc Remove from cart
// @route DELETE /api/users/cart/:id
// @access Private
const removeFromCart = async (req, res) => {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(x => x.product.toString() !== req.params.id);
    await user.save();
    res.json(user.cart);
}

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.error('getUsers Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
}

// @desc    Get wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Add to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.id);
        await user.save();
        res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Sync guest cart with user cart
// @route   POST /api/users/cart/sync
// @access  Private
const syncCart = async (req, res) => {
    try {
        const { guestCart } = req.body;
        const user = await User.findById(req.user._id);

        if (guestCart && Array.isArray(guestCart)) {
            guestCart.forEach(guestItem => {
                // Ensure the product ID is valid
                if (!guestItem.product) return;
                
                const itemExists = user.cart.find(x => x.product.toString() === (guestItem.product._id || guestItem.product));
                if (itemExists) {
                    itemExists.qty = Math.max(itemExists.qty, guestItem.qty);
                } else {
                    user.cart.push({
                        product: guestItem.product._id || guestItem.product,
                        name: guestItem.name,
                        image: guestItem.image,
                        price: guestItem.price,
                        qty: guestItem.qty,
                        lensPower: guestItem.lensPower
                    });
                }
            });
            await user.save();
        }
        res.json(user.cart);
    } catch (error) {
        res.status(500).json({ message: 'Cart sync failed' });
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    uploadPrescription,
    getUserCart,
    addToCart,
    removeFromCart,
    getUsers,
    deleteUser,
    updateUser,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    syncCart
};
