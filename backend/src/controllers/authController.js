const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const logger = require('../telemetry/logger');
const { z } = require('zod');

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  });
};

const signupSchema = z.object({
  email: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
  name: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
  password: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
  confirmPassword: z.string({ required_error: 'All fields are required' }).min(1, 'All fields are required'),
});

const signup = catchAsync(async (req, res) => {
  const parsedBody = signupSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: parsedBody.error.errors[0].message });
  }

  const { user, token } = await authService.signupUser(parsedBody.data);
  
  setTokenCookie(res, token);
  logger.info('User signed up successfully', { user_id: user.id, email: user.email });
  
  return res.status(201).json({ user });
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email and password required' }).min(1, 'Email and password required'),
  password: z.string({ required_error: 'Email and password required' }).min(1, 'Email and password required'),
});

const login = catchAsync(async (req, res) => {
  const parsedBody = loginSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: parsedBody.error.errors[0].message });
  }

  const { user, token } = await authService.loginUser(parsedBody.data);

  setTokenCookie(res, token);
  logger.info('User logged in successfully', { user_id: user.id, email: user.email });

  return res.status(200).json({ user });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie('token', { path: '/' });
  logger.info('User logged out');
  return res.status(200).json({ message: 'Logged out successfully.' });
});

const me = catchAsync(async (req, res) => {
  const user = await authService.getUserMe(req.user.id);
  return res.status(200).json({ user });
});

module.exports = {
  signup,
  login,
  logout,
  me
};
