const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Banner = require('./models/Banner');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const banners = [
    {
        title: "Manushi's Statement Eyes",
        subtitle: "10% Off* with Gold Membership",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=2670&auto=format&fit=crop",
        link: "/shop",
        order: 1
    },
    {
        title: "Eco-Friendly Collection",
        subtitle: "Sustainably Sourced, Elegantly Designed",
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2560&auto=format&fit=crop",
        link: "/shop?category=Eco",
        order: 2
    },
    {
        title: "Blue Light Protection",
        subtitle: "Save your eyes from digital strain",
        image: "https://images.unsplash.com/photo-1591010885068-07e110cb1624?q=80&w=2560&auto=format&fit=crop",
        link: "/shop?category=Computer",
        order: 3
    }
];

const seedBanners = async () => {
    try {
        await Banner.deleteMany();
        await Banner.insertMany(banners);
        console.log('Banners Seeded!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedBanners();
