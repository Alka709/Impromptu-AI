const cron = require('node-cron');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const { userPrevRecord } = require('../db/schema/evaluation');
const { eq, desc, or, and, lt } = require('drizzle-orm');
const logger = require('../telemetry/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function initRetryJob() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Running background job to retry failed sessions...');
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const failedSessions = await db.select().from(sessions).where(
        or(
          eq(sessions.status, 'failed'),
          and(
            eq(sessions.status, 'processing'),
            lt(sessions.created_at, twoHoursAgo)
          )
        )
      );
      
      if (failedSessions.length === 0) {
        logger.info('No failed sessions found.');
        return;
      }

      logger.info(`Found ${failedSessions.length} failed sessions to retry.`);

      for (const session of failedSessions) {
        try {
          if (!session.audio_url) continue;

          // Parse the fileKey from the audio_url
          const urlParts = session.audio_url.split('.amazonaws.com/');
          if (urlParts.length < 2) continue;
          const fileKey = urlParts[1];

          // Generate new presigned URL
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
          });
          const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 900 });

          // Fetch user history
          const pastSessions = await db.select()
            .from(userPrevRecord)
            .where(eq(userPrevRecord.user_id, session.user_id))
            .orderBy(desc(userPrevRecord.created_at))
            .limit(3);

          const backendCallbackUrl = process.env.BACKEND_CALLBACK_URL || `http://localhost:${process.env.PORT || 4000}`;
          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

          const fastApiPayload = {
            sessionId: session.id,
            userId: session.user_id,
            topic: session.topic,
            audioDownloadUrl: presignedUrl,
            reportCallbackUrl: `${backendCallbackUrl}/api/webhooks/evaluation-result`,
            history: pastSessions
          };

          // Enqueue evaluation
          await fetch(`${aiServiceUrl}/api/evaluate/enqueue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fastApiPayload)
          });

          // Update status to processing
          await db.update(sessions)
            .set({ status: 'processing' })
            .where(eq(sessions.id, session.id));

          logger.info(`Successfully requeued failed session ${session.id}`);
        } catch (err) {
          logger.error(`Failed to retry session ${session.id}`, { error: err.message });
        }
      }
    } catch (error) {
      logger.error('Error in retryFailedSessions cron job', { error: error.message });
    }
  });
}

module.exports = { initRetryJob };
