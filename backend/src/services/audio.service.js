const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const { userPrevRecord } = require('../db/schema/evaluation');
const { eq, desc } = require('drizzle-orm');
const logger = require('../telemetry/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generatePresignedUploadUrl = async (sessionId, userId) => {
  const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  
  if (!existingSession.length || existingSession[0].user_id !== userId) {
    logger.warn('Generate URL failed: Session not found or unauthorized', { session_id: sessionId, user_id: userId });
    const err = new Error('Session not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  const fileKey = `audio/${userId}/${sessionId}-${Date.now()}.webm`;

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    Conditions: [
      ['content-length-range', 0, 10485760],
      ['starts-with', '$Content-Type', 'audio/']
    ],
    Fields: {
      'Content-Type': 'audio/webm'
    },
    Expires: 300,
  });

  return { uploadUrl: url, fields, fileKey };
};

const confirmAudioUploadAndEnqueue = async (sessionId, userId, fileKey) => {
  if (!fileKey) {
    const err = new Error('Missing fileKey');
    err.statusCode = 400;
    throw err;
  }

  const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!existingSession.length || existingSession[0].user_id !== userId) {
    logger.warn('Confirm upload failed: Session not found or unauthorized', { session_id: sessionId, user_id: userId });
    const err = new Error('Session not found or unauthorized.');
    err.statusCode = 404;
    throw err;
  }

  const audioUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;

  const getCommand = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
  });
  const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 900 });

  await db.update(sessions)
    .set({ audio_url: audioUrl, status: 'processing' })
    .where(eq(sessions.id, sessionId));

  const pastSessions = await db.select()
    .from(userPrevRecord)
    .where(eq(userPrevRecord.user_id, userId))
    .orderBy(desc(userPrevRecord.created_at))
    .limit(3);

  const backendCallbackUrl = process.env.BACKEND_CALLBACK_URL || `http://localhost:${process.env.PORT || 4000}`;
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  const fastApiPayload = {
    sessionId: sessionId,
    userId: userId,
    topic: existingSession[0].topic,
    audioDownloadUrl: presignedUrl,
    reportCallbackUrl: `${backendCallbackUrl}/api/webhooks/evaluation-result`,
    history: pastSessions
  };

  try {
    logger.info('Enqueueing evaluation to AI service', { session_id: sessionId, aiServiceUrl });
    await fetch(`${aiServiceUrl}/api/evaluate/enqueue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fastApiPayload)
    });
    logger.info('Successfully enqueued evaluation', { session_id: sessionId });
  } catch (err) {
    logger.error('Failed to trigger FastAPI evaluation', { error: err.message, stack: err.stack, session_id: sessionId });
  }

  return { message: 'Upload confirmed and evaluation enqueued', audio_url: audioUrl };
};

module.exports = {
  generatePresignedUploadUrl,
  confirmAudioUploadAndEnqueue
};
