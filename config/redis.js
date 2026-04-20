const redis = require('redis');

let redisClient;

const connectRedis = async () => {
    try {
        const REDIS_URL = process.env.REDIS_URL;
        
        if (!REDIS_URL) {
            console.warn('⚠️ REDIS_URL not found in .env. Falling back to local Redis (defaulting to 127.0.0.1:6379).');
        }

        const clientOptions = {
            url: REDIS_URL || 'redis://127.0.0.1:6379',
            socket: {
                // Better timeout handling for cloud connections
                connectTimeout: 10000,
                keepAlive: 1000,
            }
        };

        // Automatic TLS support for rediss:// (common for Upstash/managed redis)
        if (REDIS_URL && REDIS_URL.startsWith('rediss://')) {
            clientOptions.socket.tls = true;
            clientOptions.socket.rejectUnauthorized = false; // Often needed for some managed services
        }

        redisClient = redis.createClient(clientOptions);

        redisClient.on('error', (err) => {
            // Log only critical errors, ignore common connection retries in development
            if (process.env.NODE_ENV === 'production' || !err.message.includes('ECONNREFUSED')) {
                console.warn('⚠️ Redis Client Error:', err.message);
            }
        });

        redisClient.on('connect', () => {
            console.log('🚀 Redis Connected Successfully');
        });

        await redisClient.connect();
    } catch (error) {
        console.warn('❌ Failed to connect to Redis. Running without server-side caching.');
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
