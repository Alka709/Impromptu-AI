const Redis = require('ioredis');

// Connect to Redis (used for OTP storage)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

/**
 * Generate a random 6-digit OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Stores an OTP in Redis with an expiration time
 * @param {string} prefix - e.g. "signup_otp" or "login_otp"
 * @param {string} email - The user's email
 * @param {string} otp - The 6 digit code
 * @param {number} expiresInSeconds - Expiration time (default 5 mins)
 */
const storeOtp = async (prefix, email, otp, expiresInSeconds = 300) => {
  const key = `${prefix}:${email}`;
  await redis.setex(key, expiresInSeconds, otp);
};

/**
 * Validates an OTP from Redis
 * @param {string} prefix - e.g. "signup_otp" or "login_otp"
 * @param {string} email - The user's email
 * @param {string} otp - The 6 digit code provided by the user
 * @returns {boolean} - true if valid, false if invalid or expired
 */
const validateOtp = async (prefix, email, otp) => {
  const key = `${prefix}:${email}`;
  const storedOtp = await redis.get(key);
  
  if (storedOtp && storedOtp === otp) {
    // Delete OTP after successful use to prevent reuse
    await redis.del(key);
    return true;
  }
  return false;
};

/**
 * Sets a temporary approval flag (e.g. after verifying email for signup, 
 * gives them 15 mins to enter their password)
 */
const setTemporaryApproval = async (prefix, email, expiresInSeconds = 900) => {
  const key = `${prefix}:${email}`;
  await redis.setex(key, expiresInSeconds, 'true');
};

/**
 * Checks if a temporary approval flag exists
 */
const checkTemporaryApproval = async (prefix, email) => {
  const key = `${prefix}:${email}`;
  const value = await redis.get(key);
  if (value === 'true') {
    await redis.del(key); // consume it
    return true;
  }
  return false;
};

module.exports = {
  generateOtp,
  storeOtp,
  validateOtp,
  setTemporaryApproval,
  checkTemporaryApproval
};
