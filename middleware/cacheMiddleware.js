const { getRedisClient } = require('../config/redis');

/**
 * Middleware to cache express responses in Redis
 * @param {number} duration - Time in seconds to cache the response
 */
const cacheMiddleware = (duration = 3600) => {
    return async (req, res, next) => {
        const client = getRedisClient();
        
        // If redis isn't connected or client isn't available, skip silently
        if (!client || !client.isReady) {
            return next();
        }

        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;
        
        try {
            const cachedResponse = await client.get(key);
            
            if (cachedResponse) {
                return res.json(JSON.parse(cachedResponse));
            } else {
                // Store the original send/json method
                res.originalJson = res.json;
                
                // Override res.json to catch the data and store it in redis
                res.json = (body) => {
                    client.setEx(key, duration, JSON.stringify(body))
                        .catch(err => console.error('Redis Set Error:', err));
                    
                    return res.originalJson(body);
                };
                next();
            }
        } catch (error) {
            console.error('Cache Middleware Error:', error);
            next();
        }
    };
};

/**
 * Utility to clear redis cache for specific patterns
 * @param {string} pattern - Pattern to match keys (e.g. '/api/products*')
 */
const clearCache = async (pattern) => {
    const client = getRedisClient();
    if (!client || !client.isReady) return;

    try {
        const keyPattern = `__express__${pattern}`;
        const keys = await client.keys(keyPattern);
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`[CACHE] Cleared ${keys.length} keys matching ${pattern}`);
        }
    } catch (error) {
        console.error('Redis Clear Error:', error);
    }
};

module.exports = { cacheMiddleware, clearCache };
