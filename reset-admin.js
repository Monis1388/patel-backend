const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminEmail = 'admin@example.com';
        const newPassword = 'admin123';

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.findOneAndUpdate(
            { email: adminEmail },
            { password: hashedPassword, role: 'admin' },
            { upsert: true, new: true }
        );

        console.log(`-----------------------------------`);
        console.log(`ADMIN ACCOUNT UPDATED SUCCESSFULLY`);
        console.log(`Email: ${adminEmail}`);
        console.log(`New Password: ${newPassword}`);
        console.log(`-----------------------------------`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

resetAdmin();
