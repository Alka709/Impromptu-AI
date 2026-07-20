/**
 * googleAuthController.js
 *
 * Implements Google OAuth 2.0 Authorization Code Flow (no passport, no googleapis)
 * Uses only the built-in https module to exchange tokens and fetch user info.
 *
 * Routes:
 *   GET /api/auth/google          → redirect to Google's consent screen
 *   GET /api/auth/google/callback → exchange code, upsert user, set JWT cookie, redirect to frontend
 */

const https = require('https');
const jwt = require('jsonwebtoken');
const { eq, or } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema/users');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// ─── Helper: do an HTTPS POST and return parsed JSON ────────────────────────
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

// ─── Helper: do an HTTPS GET with Authorization header ──────────────────────
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

// ─── Step 1: Redirect user to Google OAuth consent screen ────────────────────
const redirectToGoogle = (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

// ─── Step 2: Handle callback from Google ─────────────────────────────────────
const handleGoogleCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=google_oauth_failed`);
  }

  try {
    // ── 2a. Exchange auth code for access token ──────────────────────────────
    const tokenData = await httpsPost('oauth2.googleapis.com', '/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=token_exchange_failed`);
    }

    const { access_token } = tokenData;

    // ── 2b. Fetch Google user profile ────────────────────────────────────────
    const googleUser = await httpsGet(
      'www.googleapis.com',
      '/oauth2/v2/userinfo',
      access_token
    );

    if (!googleUser.id || !googleUser.email) {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=profile_fetch_failed`);
    }

    const { id: googleId, email, name, verified_email } = googleUser;

    // ── 2c. Upsert user: find by google_id OR email ──────────────────────────
    let user;
    const existingByGoogleId = await db
      .select()
      .from(users)
      .where(eq(users.google_id, googleId));

    if (existingByGoogleId.length > 0) {
      // Already a Google user — just use them
      user = existingByGoogleId[0];
    } else {
      // Check if this email already exists (email/password account)
      const existingByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingByEmail.length > 0) {
        // Link Google to existing account
        const [updated] = await db
          .update(users)
          .set({ google_id: googleId, updated_at: new Date() })
          .where(eq(users.email, email))
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
            google_id: users.google_id,
            created_at: users.created_at,
          });
        user = updated;
      } else {
        // Brand new Google user — create account
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: name || email.split('@')[0],
            password_hash: null, // Google users have no password
            google_id: googleId,
          })
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
            google_id: users.google_id,
            created_at: users.created_at,
          });
        user = newUser;
      }
    }

    // ── 2d. Issue JWT cookie (same as email/password login) ──────────────────
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/'
    });

    // ── 2e. Redirect back to frontend dashboard ───────────────────────────────
    return res.redirect(`${FRONTEND_ORIGIN}/`);

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=server_error`);
  }
};

module.exports = { redirectToGoogle, handleGoogleCallback };
