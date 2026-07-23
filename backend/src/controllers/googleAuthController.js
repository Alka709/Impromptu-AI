const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const logger = require('../telemetry/logger');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

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

const handleGoogleCallback = catchAsync(async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    logger.error('Google OAuth error:', { error });
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=google_oauth_failed`);
  }

  try {
    const { user, token } = await authService.handleGoogleOAuth(code, CLIENT_ID, CLIENT_SECRET, CALLBACK_URL);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (user.role === 'admin') {
      return res.redirect(`${FRONTEND_ORIGIN}/admin`);
    }
    return res.redirect(`${FRONTEND_ORIGIN}/dashboard`);
    
  } catch (err) {
    logger.error('Google OAuth callback error', { error: err.message, stack: err.stack });
    
    if (err.message === 'token_exchange_failed') {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=token_exchange_failed`);
    }
    if (err.message === 'profile_fetch_failed') {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=profile_fetch_failed`);
    }
    
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=server_error`);
  }
});

module.exports = { redirectToGoogle, handleGoogleCallback };
