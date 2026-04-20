const mongoose = require('mongoose');
const dotenv = require('dotenv');
const users = require('./data/users');
const products = require('./data/products');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const connectDB = require('./config/db'); // We need to extract connection logic if not already exported, or just copy it here.

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        // Hash passwords manually since insertMany doesn't trigger pre-save hook
        // Or use User.create which might be slower but triggers hooks. 
        // Let's use a loop with create for safety and correct hashing.
        const createdUsers = [];
        for (const user of users) {
            const createdUser = await User.create(user);
            createdUsers.push(createdUser);
        }

        // const createdUsers = await User.insertMany(users); // Replaced by loop above
        const adminUser = createdUsers[0]._id;

        const sampleProducts = products.map((product) => {
            return { ...product, user: adminUser };
        });

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
