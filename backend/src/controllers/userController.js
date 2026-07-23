const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');

const getRecentSessionRecords = catchAsync(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const records = await userService.getRecentSessionRecords(userId);
  return res.status(200).json(records);
});

const getDashboardData = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const data = await userService.getDashboardData(userId);
  return res.status(200).json(data);
});

const getSessionHistory = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const history = await userService.getSessionHistory(userId);
  return res.status(200).json(history);
});

const updateUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (req.user && req.user.id !== userId) {
    return res.status(403).json({ error: 'Unauthorized to update this profile' });
  }

  await userService.updateUserProfile(userId, req.body);
  return res.status(200).json({ message: 'Profile updated successfully' });
});

const deleteUserAccount = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (req.user && req.user.id !== userId) {
    return res.status(403).json({ error: 'Unauthorized to delete this account' });
  }

  await userService.deleteUserAccount(userId);
  return res.status(200).json({ message: 'Account deleted successfully' });
});

module.exports = {
  getSessionHistory,
  getRecentSessionRecords,
  getDashboardData,
  updateUserProfile,
  deleteUserAccount
};
