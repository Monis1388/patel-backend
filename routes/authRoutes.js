const express = require('express');
const router = express.Router();
const { registerUser, loginUser, sendOTP, verifyOTP, googleLogin } = require('../controllers/authController');
const {
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
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware'); // Import admin middleware
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/google-login', googleLogin);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/upload-prescription', protect, upload.single('prescription'), uploadPrescription);
router.route('/cart').get(protect, getUserCart).post(protect, addToCart);
router.post('/cart/sync', protect, syncCart);
router.route('/cart/:id').delete(protect, removeFromCart);
router.route('/wishlist').get(protect, getWishlist).post(protect, addToWishlist);
router.route('/wishlist/:id').delete(protect, removeFromWishlist);
router.route('/').get(protect, admin, getUsers);
router.route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

module.exports = router;
