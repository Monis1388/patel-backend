const path = require('path');
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'frame_sunglasses_uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => file.fieldname + '-' + Date.now(),
    },
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Increase to 50MB
});

// MAIN UPLOAD ROUTE
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('SERVER: Detailed Upload Error:', err);
            
            // Send the ACTUAL error message to the frontend so the user can see it
            return res.status(500).json({ 
                success: false, 
                message: err.message || 'Upload failed at Cloudinary',
                details: err
            });
        }
        
        if (!req.file) {
            console.warn('SERVER: Upload attempt failed - No file in request. Body:', req.body);
            return res.status(400).json({ 
                success: false, 
                message: 'No image file received. Ensure field name is "image" and body is multipart/form-data.' 
            });
        }
        
        console.log('SERVER: Upload Successful to Cloudinary:', req.file.path);
        // Returns the full Cloudinary URL
        res.json(req.file.path);
    });
});

// GET ALL MEDIA
router.get('/', async (req, res) => {
    try {
        const { resources } = await cloudinary.search
            .expression('folder:patel_optical_uploads')
            .sort_by('public_id', 'desc')
            .max_results(30)
            .execute();
        res.json(resources.map(file => file.secure_url));
    } catch (err) {
        res.status(500).json({ message: 'Unable to fetch files' });
    }
});

module.exports = router;
