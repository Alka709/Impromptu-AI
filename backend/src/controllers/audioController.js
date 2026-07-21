const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const { eq } = require('drizzle-orm');
const logger = require('../telemetry/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadAudio = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      logger.warn('Audio upload failed: No audio file provided', { session_id: sessionId, user_id: userId });
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    // Verify session belongs to user
    const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!existingSession.length || existingSession[0].user_id !== userId) {
      logger.warn('Audio upload failed: Session not found or unauthorized', { session_id: sessionId, user_id: userId });
      return res.status(404).json({ error: 'Session not found or unauthorized.' });
    }

    const fileKey = `audio/${userId}/${sessionId}-${Date.now()}.webm`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    logger.info('Uploading audio file to S3', { fileKey, bucket: process.env.AWS_S3_BUCKET_NAME });
    await s3Client.send(command);
    logger.info('Audio uploaded to S3 successfully', { fileKey });

    const audioUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;

    // Generate a pre-signed GET URL valid for 15 minutes
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });
    const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 600 });

    // Update database
    await db.update(sessions)
      .set({ audio_url: audioUrl })
      .where(eq(sessions.id, sessionId));

    const backendCallbackUrl = process.env.BACKEND_CALLBACK_URL || `http://localhost:${process.env.PORT || 4000}`;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // Call FastAPI to enqueue the job
    const fastApiPayload = {
      sessionId: sessionId,
      userId: userId,
      topic: existingSession[0].topic,
      audioDownloadUrl: presignedUrl,
      reportCallbackUrl: `${backendCallbackUrl}/api/webhooks/evaluation-result`
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
      // We don't fail the upload if evaluation trigger fails, but log it.
    }

    return res.status(200).json({ message: 'Audio uploaded successfully', audio_url: audioUrl });

  } catch (error) {
    logger.error('Audio upload error', { error: error.message, stack: error.stack, session_id: req.params.id });
    return res.status(500).json({ error: 'Failed to upload audio' });
  }
};

module.exports = { uploadAudio };
