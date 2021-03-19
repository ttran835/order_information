require('dotenv').config();

const urls = { REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379' };

module.exports = { urls };
