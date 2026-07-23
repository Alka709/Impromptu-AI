const logger = require('../telemetry/logger');
const adminService = require('../services/admin.service');
const catchAsync = require('../utils/catchAsync');

const getDashboard = catchAsync(async (req, res) => {
  const data = await adminService.getDashboardMetrics();
  return res.status(200).json(data);
});

const getUsers = catchAsync(async (req, res) => {
  const users = await adminService.getUsersList();
  logger.info("Admin users fetched", { adminId: req.user.id });
  return res.status(200).json({ users });
});

const getUserDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await adminService.getUserProfileDetails(id);
  
  if (!data) {
    return res.status(404).json({ error: 'User not found' });
  }

  logger.info("Admin fetched user details", { adminId: req.user.id, targetUserId: id });
  return res.status(200).json(data);
});

const getSessions = catchAsync(async (req, res) => {
  const sessions = await adminService.getSessionsList();
  logger.info("Admin fetched sessions", { adminId: req.user.id, totalSessions: sessions.length });
  return res.status(200).json({ sessions });
});

const getSessionDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await adminService.getSingleSessionDetails(id);

  if (!data) {
    return res.status(404).json({ error: 'Session not found' });
  }

  logger.info("Admin fetched session details", { adminId: req.user.id, sessionId: id });
  return res.status(200).json(data);
});

module.exports = {
  getDashboard,
  getUsers,
  getUserDetails,
  getSessions,
  getSessionDetails
};
