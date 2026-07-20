// In-memory store for development/testing without Redis
const memoryStore = {};

/**
 * Generate a random 6-digit OTP
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Stores an OTP in memory with an expiration time
 */
const storeOtp = async (prefix, email, otp, expiresInSeconds = 300) => {
  const key = `${prefix}:${email}`;
  memoryStore[key] = {
    value: otp,
    expiresAt: Date.now() + expiresInSeconds * 1000
  };
};

/**
 * Validates an OTP from memory
 */
const validateOtp = async (prefix, email, otp) => {
  const key = `${prefix}:${email}`;
  const record = memoryStore[key];
  
  if (record && record.value === otp && record.expiresAt > Date.now()) {
    // Delete OTP after successful use to prevent reuse
    delete memoryStore[key];
    return true;
  }
  
  if (record && record.expiresAt <= Date.now()) {
    delete memoryStore[key];
  }
  
  return false;
};

/**
 * Sets a temporary approval flag
 */
const setTemporaryApproval = async (prefix, email, expiresInSeconds = 900) => {
  const key = `${prefix}:${email}`;
  memoryStore[key] = {
    value: 'true',
    expiresAt: Date.now() + expiresInSeconds * 1000
  };
};

/**
 * Checks if a temporary approval flag exists
 */
const checkTemporaryApproval = async (prefix, email) => {
  const key = `${prefix}:${email}`;
  const record = memoryStore[key];
  
  if (record && record.value === 'true' && record.expiresAt > Date.now()) {
    delete memoryStore[key]; // consume it
    return true;
  }
  
  if (record && record.expiresAt <= Date.now()) {
    delete memoryStore[key];
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
