const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const { eq } = require('drizzle-orm');

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
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    // Verify session belongs to user
    const existingSession = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!existingSession.length || existingSession[0].user_id !== userId) {
      return res.status(404).json({ error: 'Session not found or unauthorized.' });
    }

    const fileKey = `audio/${userId}/${sessionId}-${Date.now()}.webm`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

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

    // Call FastAPI to enqueue the job
    const fastApiPayload = {
      sessionId: sessionId,
      userId: userId,
      topic: existingSession[0].topic,
      audioDownloadUrl: presignedUrl,
      reportCallbackUrl: `http://localhost:${process.env.PORT || 4000}/api/webhooks/evaluation-result`
    };

    try {
      await fetch('http://localhost:8000/api/evaluate/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fastApiPayload)
      });
    } catch (err) {
      console.error('Failed to trigger FastAPI evaluation:', err);
      // We don't fail the upload if evaluation trigger fails, but log it.
    }

    return res.status(200).json({ message: 'Audio uploaded successfully', audio_url: audioUrl });

  } catch (error) {
    console.error('Audio upload error:', error);
    return res.status(500).json({ error: 'Failed to upload audio' });
  }
};

module.exports = { uploadAudio };
