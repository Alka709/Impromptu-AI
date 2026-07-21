const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');
const { sendOtpEmail } = require('../utils/emailService');
const otpService = require('../utils/otpService');
const logger = require('../telemetry/logger');
const { normalizeEmail } = require('../utils/normalizeEmail');
const { isGmailEmail, isValidPassword } = require('../validators/authValidator');

// ==========================================
// SIGNUP FLOW
// ==========================================

const { z } = require('zod');

const signupSchema = z.object({
  email: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
  name: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
  password: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
  confirmPassword: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
});

const signup = async (req, res) => {
  try {
    const parsedBody = signupSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.errors[0].message });
    }

    const { email, name, password, confirmPassword } = parsedBody.data;
    const normalizedEmail = normalizeEmail(email);

    if (!isGmailEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Only Gmail addresses are currently supported. Please sign up with a @gmail.com email, or use Sign in with Google.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include at least one letter and one number.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existingUsers.length > 0) {
      logger.warn('Signup failed: User already exists', { email });
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user (automatically marking as verified since OTP is disabled)
    const [newUser] = await db.insert(users)
      .values({ email: normalizedEmail, name, password_hash: passwordHash, verified: true })
      .returning({ id: users.id, email: users.email, name: users.name });

    // Generate JWT and log them in immediately
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    logger.info('User signed up successfully', { user_id: newUser.id, email: newUser.email });
    return res.status(201).json({ user: newUser });
  } catch (error) {
    logger.error('signup error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// LOGIN FLOW
// ==========================================

const loginSchema = z.object({
  email: z.string({ required_error: 'Email and password required' }).min(1, 'Email and password required'),
  password: z.string({ required_error: 'Email and password required' }).min(1, 'Email and password required'),
});

const login = async (req, res) => {
  try {
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.errors[0].message });
    }

    const { email, password } = parsedBody.data;
    const normalizedEmail = normalizeEmail(email);

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (foundUsers.length === 0) {
      logger.warn("Login failed: User not found", { email });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = foundUsers[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logger.warn('Login failed: Invalid password', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    logger.info('User logged in successfully', { user_id: user.id, email: user.email });
    return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, photo: user.photo } });
  } catch (error) {
    logger.error('login error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', { path: '/' });
  logger.info('User logged out');
  return res.status(200).json({ message: 'Logged out successfully.' });
};

const me = async (req, res) => {
  try {
    const userId = req.user.id;
    const foundUsers = await db.select().from(users).where(eq(users.id, userId));
    if (foundUsers.length === 0) return res.status(404).json({ error: 'User not found' });

    const { password_hash, ...userWithoutPassword } = foundUsers[0];
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    logger.error('Me endpoint error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  me
};
