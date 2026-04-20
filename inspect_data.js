const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const Banner = require('./models/Banner');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- MongoDB Connected Properly ---');

        const product = await Product.findOne();
        if (product) {
            console.log('\nSample Product Image Path:', product.image);
            if (product.image.includes('cloudinary')) {
                console.log('Result: Products seem to use Cloudinary.');
            } else if (product.image.startsWith('/uploads')) {
                console.log('Result: Products use local server storage (/uploads).');
            } else {
                console.log('Result: Products use external URL:', product.image);
            }
        } else {
            console.log('No products found in database.');
        }

        const banner = await Banner.findOne();
        if (banner) {
            console.log('\nSample Banner Image Path:', banner.image);
            if (banner.image.includes('cloudinary')) {
                console.log('Result: Banners seem to use Cloudinary.');
            } else if (banner.image.startsWith('/uploads')) {
                console.log('Result: Banners use local server storage (/uploads).');
            } else {
                console.log('Result: Banners use external URL:', banner.image);
            }
        } else {
            console.log('No banners found in database.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Inspection failed:', err);
        process.exit(1);
    }
}

inspect();
