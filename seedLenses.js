const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lens = require('./models/Lens');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding lenses'))
  .catch(err => console.error(err));

const lenses = [
    { name: 'Anti-Glare', description: 'Eliminates reflections, night driving', price: 500, icon: 'Sparkles' },
    { name: 'Blue-Cut', description: 'Protects from screen light', price: 700, icon: 'Zap' },
    { name: 'Photochromic', description: 'Transitions in sunlight', price: 1000, icon: 'ShieldCheck' },
    { name: 'Mari Blue', description: 'Advanced blue light coating', price: 1200, icon: 'Droplets' },
    { name: 'Night Vision', description: 'Enhanced clarity for night driving', price: 1500, icon: 'Moon' }
];

const seedLenses = async () => {
    try {
        await Lens.deleteMany();
        await Lens.insertMany(lenses);
        console.log('Lenses seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding lenses:', error);
        process.exit(1);
    }
};

seedLenses();
