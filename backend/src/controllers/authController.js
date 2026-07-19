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

const signupRequestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if verified user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0 && existingUsers[0].verified) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate and send OTP
    const otp = otpService.generateOtp();
    await otpService.storeOtp('signup_otp', email, otp, 300); // 5 mins
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('signupRequestOtp error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const signupVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const isValid = await otpService.validateOtp('signup_otp', email, otp);
    if (!isValid) return res.status(401).json({ error: 'Invalid or expired OTP' });

    // Set temp approval for 15 mins
    await otpService.setTemporaryApproval('signup_approved', email, 900);
    
    return res.status(200).json({ message: 'Email verified successfully. Please set your password.' });
  } catch (error) {
    console.error('signupVerifyOtp error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const signupComplete = async (req, res) => {
  try {
    const { email, name, password, confirmPassword } = req.body;
    if (!email || !name || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const isApproved = await otpService.checkTemporaryApproval('signup_approved', email);
    if (!isApproved) {
      return res.status(403).json({ error: 'Session expired or email not verified. Start over.' });
    }

    // Check existing
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser;
    if (existingUsers.length > 0) {
      // Overwrite unverified user
      [newUser] = await db.update(users)
        .set({ name, password_hash: passwordHash, verified: true })
        .where(eq(users.email, email))
        .returning({ id: users.id, email: users.email, name: users.name });
    } else {
      [newUser] = await db.insert(users)
        .values({ email, name, password_hash: passwordHash, verified: true })
        .returning({ id: users.id, email: users.email, name: users.name });
    }

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
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('signupComplete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// LOGIN FLOW
// ==========================================

const loginRequestOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    if (foundUsers.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = foundUsers[0];
    if (!user.verified) return res.status(403).json({ error: 'Account not verified. Please sign up again.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    // Password is correct, now send OTP for 2FA
    const otp = otpService.generateOtp();
    await otpService.storeOtp('login_otp', email, otp, 300); // 5 mins
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent for login verification', requiresOtp: true });
  } catch (error) {
    console.error('loginRequestOtp error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const loginVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const isValid = await otpService.validateOtp('login_otp', email, otp);
    if (!isValid) return res.status(401).json({ error: 'Invalid or expired OTP' });

    // OTP is valid, log them in
    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    const user = foundUsers[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );

    const { password_hash, ...userWithoutPassword } = user;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('loginVerifyOtp error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
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
  signupRequestOtp, 
  signupVerifyOtp, 
  signupComplete, 
  loginRequestOtp, 
  loginVerifyOtp, 
  logout, 
  me 
};
