const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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

const generateUploadUrl = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.id;

    const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!existingSession.length || existingSession[0].user_id !== userId) {
      logger.warn('Generate URL failed: Session not found or unauthorized', { session_id: sessionId, user_id: userId });
      return res.status(404).json({ error: 'Session not found or unauthorized.' });
    }

    const fileKey = `audio/${userId}/${sessionId}-${Date.now()}.webm`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: 'audio/webm',
    });

    const presignedPutUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return res.status(200).json({ uploadUrl: presignedPutUrl, fileKey: fileKey });
  } catch (error) {
    logger.error('Error generating upload URL', { error: error.message, stack: error.stack, session_id: req.params.id });
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

const confirmUpload = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.id;
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({ error: 'Missing fileKey' });
    }

    const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!existingSession.length || existingSession[0].user_id !== userId) {
      logger.warn('Confirm upload failed: Session not found or unauthorized', { session_id: sessionId, user_id: userId });
      return res.status(404).json({ error: 'Session not found or unauthorized.' });
    }

    const audioUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;

    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });
    const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 900 });

    await db.update(sessions)
      .set({ audio_url: audioUrl })
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

    return res.status(200).json({ message: 'Upload confirmed and evaluation enqueued', audio_url: audioUrl });

  } catch (error) {
    logger.error('Audio confirm error', { error: error.message, stack: error.stack, session_id: req.params.id });
    return res.status(500).json({ error: 'Failed to confirm upload' });
  }
};

module.exports = { generateUploadUrl, confirmUpload };
