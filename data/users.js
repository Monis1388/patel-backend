const bcrypt = require('bcryptjs');

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // Will be hashed by pre-save hook? No, insertMany doesn't trigger middleware!
        // We need to hash it manually or use create (but create is slower for bulk).
        // Actually, let's just pre-hash it here for simplicity or handle it in seeder.
        // Ideally we rely on model, let's fix seeder to iterate or hash here.
        // For now, I will assume the pre-save hook WON'T run on insertMany. 
        // I'll update seeder to use create or hash manually.
        // Let's providing plain text and handling it in seeder is safer.
        role: 'admin',
        phone: '1234567890',
    },
    {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'password123',
        role: 'user',
        phone: '0987654321',
    },
];

module.exports = users;
