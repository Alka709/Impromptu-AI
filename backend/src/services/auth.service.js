const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');
const { normalizeEmail } = require('../utils/normalizeEmail');
const { isGmailEmail, isValidPassword } = require('../validators/authValidator');
const https = require('https');

// --- Helper methods for Google OAuth ---
function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(body).toString();
    const options = {
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse response: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpsGet(hostname, path, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse user info: ' + data)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1d' }
  );
};

const signupUser = async ({ email, name, password, confirmPassword }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!isGmailEmail(normalizedEmail)) {
    const err = new Error('Only Gmail addresses are currently supported. Please sign up with a @gmail.com email, or use Sign in with Google.');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidPassword(password)) {
    const err = new Error('Password must be at least 8 characters and include at least one letter and one number.');
    err.statusCode = 400;
    throw err;
  }

  if (password !== confirmPassword) {
    const err = new Error('Passwords do not match');
    err.statusCode = 400;
    throw err;
  }

  const existingUsers = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (existingUsers.length > 0) {
    const err = new Error('User with this email already exists');
    err.statusCode = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const [newUser] = await db.insert(users)
    .values({ email: normalizedEmail, name, password_hash: passwordHash, verified: true })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  const token = generateToken(newUser);
  return { user: newUser, token };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const foundUsers = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (foundUsers.length === 0) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const user = foundUsers[0];
  if (!user.password_hash) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);
  return { user: { id: user.id, email: user.email, name: user.name, photo: user.photo }, token };
};

const getUserMe = async (userId) => {
  const foundUsers = await db.select().from(users).where(eq(users.id, userId));
  if (foundUsers.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const { password_hash, ...userWithoutPassword } = foundUsers[0];
  return userWithoutPassword;
};

const handleGoogleOAuth = async (code, clientId, clientSecret, callbackUrl) => {
  const tokenData = await httpsPost('oauth2.googleapis.com', '/token', {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    grant_type: 'authorization_code',
  });

  if (tokenData.error) {
    const err = new Error('token_exchange_failed');
    err.tokenData = tokenData;
    throw err;
  }

  const { access_token } = tokenData;

  const googleUser = await httpsGet(
    'www.googleapis.com',
    '/oauth2/v2/userinfo',
    access_token
  );

  if (!googleUser.id || !googleUser.email) {
    throw new Error('profile_fetch_failed');
  }

  const { id: googleId, email, name } = googleUser;
  const normalizedEmail = normalizeEmail(email);

  let user;
  const existingByGoogleId = await db.select().from(users).where(eq(users.google_id, googleId));

  if (existingByGoogleId.length > 0) {
    user = existingByGoogleId[0];
  } else {
    const existingByEmail = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existingByEmail.length > 0) {
      const [updated] = await db
        .update(users)
        .set({ google_id: googleId, updated_at: new Date() })
        .where(eq(users.email, normalizedEmail))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          google_id: users.google_id,
          created_at: users.created_at,
          role: users.role,
        });
      user = updated;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          password_hash: null,
          google_id: googleId,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          google_id: users.google_id,
          created_at: users.created_at,
          role: users.role,
        });
      user = newUser;
    }
  }

  const token = generateToken(user);
  return { user, token };
};

module.exports = {
  signupUser,
  loginUser,
  getUserMe,
  handleGoogleOAuth
};
