const catchAsync = require('../utils/catchAsync');
const audioService = require('../services/audio.service');

const generateUploadUrl = catchAsync(async (req, res) => {
  const { id: sessionId } = req.params;
  const userId = req.user.id;

  const data = await audioService.generatePresignedUploadUrl(sessionId, userId);
  return res.status(200).json(data);
});

const confirmUpload = catchAsync(async (req, res) => {
  const { id: sessionId } = req.params;
  const userId = req.user.id;
  const { fileKey } = req.body;

  const result = await audioService.confirmAudioUploadAndEnqueue(sessionId, userId, fileKey);
  return res.status(200).json(result);
});

module.exports = { generateUploadUrl, confirmUpload };
