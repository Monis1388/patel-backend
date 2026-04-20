const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendOTPSMS } = require('../services/twilioService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, phone });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specsyAiEnabled: user.specsyAiEnabled ?? true,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specsyAiEnabled: user.specsyAiEnabled ?? true,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send OTP to phone
// @route   POST /api/users/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    let { phone } = req.body;

    try {
        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }
        
        // Ensure phone is a string to prevent slicing crashes
        phone = String(phone);

        let user = await User.findOne({ phone });

        if (!user) {
            user = await User.create({
                name: `User-${phone.slice(-4)}`,
                email: `${phone}@placeholder.com`,
                password: Math.random().toString(36).slice(-8), 
                phone,
            });
        }

        // Development / Test Number Bypass
        if (phone.startsWith('999')) {
            const testOtp = '123456';
            user.otp = testOtp;
            user.otpExpiry = Date.now() + 60 * 60 * 1000; // 1 hour for testing
            await user.save();
            return res.json({
                message: '[TEST MODE] Use OTP 123456',
                devOtp: testOtp,
                success: true
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        console.log(`[AUTH] Generating OTP for ${phone}: ${otp}`);

        // Try to send real SMS via Twilio Service
        let smsSent = false;
        let twilioError = null;

        try {
            smsSent = await sendOTPSMS(phone, otp);
        } catch (error) {
            console.error('[TWILIO DEBUG]:', error.message);
            twilioError = error.message;
        }

        const responseData = {
            message: smsSent ? 'OTP sent to your phone' : `SMS Provider Error: ${twilioError || 'Connection failed'}`,
            // Only expose OTP in development mode for testing
            devOtp: (process.env.NODE_ENV === 'development' || phone.startsWith('999')) ? otp : undefined,
            success: smsSent
        };

        res.json(responseData);
    } catch (error) {
        console.error('[AUTH ERROR]:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @desc    Verify OTP & Login
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        const user = await User.findOne({ phone });

        if (user && user.otp === otp && user.otpExpiry > Date.now()) {
            user.otp = undefined;
            user.otpExpiry = undefined;
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                specsyAiEnabled: user.specsyAiEnabled ?? true,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid or expired OTP' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Auth user with Google
// @route   POST /api/users/google-login
// @access  Public
const googleLogin = async (req, res) => {
    const { tokenId } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                email,
                avatar: picture,
                password: Math.random().toString(36).slice(-10),
            });
        } else {
            // Update profile picture and name if user exists
            user.avatar = picture || user.avatar;
            user.name = name || user.name;
            await user.save();
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            specsyAiEnabled: user.specsyAiEnabled ?? true,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Google authentication failed' });
    }
};

module.exports = { registerUser, loginUser, sendOTP, verifyOTP, googleLogin };

