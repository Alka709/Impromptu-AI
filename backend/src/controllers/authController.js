const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');

const signup = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in DB
    const [newUser] = await db.insert(users).values({
      email,
      name,
      password_hash: passwordHash,
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      created_at: users.created_at
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );

    return res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    if (foundUsers.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = foundUsers[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );

    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  // Since we are using stateless JWTs returned in the JSON body,
  // the actual logout happens on the client side by deleting the token.
  // This endpoint is provided for consistency and in case we switch to cookies later.
  return res.status(200).json({ message: 'Logged out successfully. Please remove your token on the client side.' });
};

module.exports = { signup, login, logout }
