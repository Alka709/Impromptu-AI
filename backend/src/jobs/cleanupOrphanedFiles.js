const cron = require('node-cron');
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const logger = require('../telemetry/logger');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function initCleanupJob() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running background job to cleanup orphaned S3 files...');
    try {
      const bucketName = process.env.AWS_S3_BUCKET_NAME;
      if (!bucketName) {
        logger.error('AWS_S3_BUCKET_NAME is missing.');
        return;
      }

      // 1. Fetch all confirmed audio_urls from the database
      const allSessions = await db.select({ audio_url: sessions.audio_url }).from(sessions);
      const dbUrls = new Set(allSessions.map(s => s.audio_url).filter(Boolean));

      // 2. Fetch all objects in the audio/ prefix from S3
      let isTruncated = true;
      let continuationToken;
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: 'audio/',
          ContinuationToken: continuationToken
        });
        
        const response = await s3Client.send(command);
        
        if (response.Contents) {
          for (const item of response.Contents) {
            // Check if older than 24 hours
            if (new Date(item.LastModified) < twentyFourHoursAgo) {
              const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${item.Key}`;
              
              // If this URL is NOT in our database, it's an orphan
              if (!dbUrls.has(fileUrl)) {
                logger.info(`Deleting orphaned S3 file: ${item.Key}`);
                await s3Client.send(new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: item.Key
                }));
              }
            }
          }
        }
        
        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
      }
      
      logger.info('S3 cleanup job completed successfully.');
    } catch (error) {
      logger.error('Error in cleanupOrphanedFiles cron job', { error: error.message });
    }
  });
}

module.exports = { initCleanupJob };
