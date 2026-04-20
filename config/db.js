const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to bypass restricted network DNS that blocks MongoDB SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 20000, // Wait 20 seconds for server selection
            connectTimeoutMS: 20000, // Wait 20 seconds for connection
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // If it's a DNS issue, try to log more info
        if (error.message.includes('ETIMEOUT')) {
            console.log('DNS Lookup timed out. Retrying might help, or use the non-SRV connection string.');
        }
        process.exit(1);
    }
}

module.exports = connectDB;
