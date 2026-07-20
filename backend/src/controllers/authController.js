const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');
const { sendOtpEmail } = require('../utils/emailService');
const otpService = require('../utils/otpService');

// ==========================================
// SIGNUP FLOW
// ==========================================

const signup = async (req, res) => {
  try {
    const { email, name, password, confirmPassword } = req.body;
    if (!email || !name || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user (automatically marking as verified since OTP is disabled)
    const [newUser] = await db.insert(users)
      .values({ email, name, password_hash: passwordHash, verified: true })
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

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// LOGIN FLOW
// ==========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    if (foundUsers.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = foundUsers[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

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

    return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, photo: user.photo } });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', { path: '/' });
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
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  me
};
