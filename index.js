const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { cacheMiddleware } = require('./middleware/cacheMiddleware');

const app = express();

// Environment Validation
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredEnv.forEach(key => {
    if (!process.env[key]) {
        console.error(`CRITICAL SETUP ERROR: Environment variable ${key} is NOT SET.`);
    }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
// Disable caching for all API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Database & Cache Connection
console.log('--- Connecting to Services... ---');
connectDB();
connectRedis();

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const contactRoutes = require('./routes/contactRoutes');
const aiRoutes = require('./routes/aiRoutes');
const lensRoutes = require('./routes/lensRoutes');

app.use('/api/users', authRoutes);
app.use('/api/products', cacheMiddleware(3600), productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', cacheMiddleware(3600), bannerRoutes);
app.use('/api/categories', cacheMiddleware(3600), categoryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/lenses', lensRoutes);
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Eyewear E-commerce API is running and ready.');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR RECOVERY:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message || 'Unknown error' });
});

const PORT = process.env.PORT || 5000;

// On Render (Non-Vercel), we MUST listen on the port
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`--- Server online on port ${PORT} ---`);
    console.log(`Mode: ${process.env.NODE_ENV}`);
  });
}

// Export for Vercel/Netlify Serverless
const serverless = require('serverless-http');
module.exports = app;
module.exports.handler = serverless(app);
 
