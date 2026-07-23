const { db } = require('../db');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { sessions } = require('../db/schema/sessions');
const { users } = require('../db/schema/users');
const bcrypt = require('bcryptjs');
const { eq, desc, inArray } = require('drizzle-orm');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getRecentSessionRecords = async (userId) => {
  const records = await db.select()
    .from(userPrevRecord)
    .where(eq(userPrevRecord.user_id, userId))
    .orderBy(desc(userPrevRecord.created_at))
    .limit(3);

  return records;
};

const getDashboardData = async (userId) => {
  const records = await db.select()
    .from(userPrevRecord)
    .where(eq(userPrevRecord.user_id, userId))
    .orderBy(desc(userPrevRecord.created_at))
    .limit(10);

  const allRecords = await db.select().from(userPrevRecord).where(eq(userPrevRecord.user_id, userId));
  const totalSessions = allRecords.length;
  const averageScore = totalSessions > 0 ? (allRecords.reduce((acc, curr) => acc + curr.overall_score, 0) / totalSessions).toFixed(1) : 0;

  const bestScore = totalSessions > 0 ? Math.max(...allRecords.map(r => r.overall_score)) : 0;

  let currentStreak = 0;
  if (totalSessions > 0) {
    const dates = [...new Set(allRecords.map(r => new Date(r.created_at).setHours(0,0,0,0)))].sort((a, b) => b - a);
    const today = new Date().setHours(0,0,0,0);
    const yesterday = today - 86400000;
    
    let streakDate = dates[0];
    if (streakDate === today || streakDate === yesterday) {
      currentStreak = 1;
      let expectedDate = streakDate - 86400000;
      for (let i = 1; i < dates.length; i++) {
        if (dates[i] === expectedDate) {
          currentStreak++;
          expectedDate -= 86400000;
        } else {
          break;
        }
      }
    }
  }

  const sessionIds = records.map(r => r.session_id);
  let sessionData = [];
  if (sessionIds.length > 0) {
    sessionData = await db.select().from(sessions).where(inArray(sessions.id, sessionIds));
  }

  const recentSessions = records.map(r => {
    const s = sessionData.find(session => session.id === r.session_id);
    return {
      ...r,
      topic: s ? s.topic : 'Unknown Topic',
      category: s ? s.category : 'Unknown',
      difficulty: s ? s.difficulty : 'Unknown',
    };
  });

  return {
    totalSessions,
    averageScore,
    bestScore,
    currentStreak,
    recentSessions
  };
};

const getSessionHistory = async (userId) => {
  const records = await db.select()
    .from(userPrevRecord)
    .where(eq(userPrevRecord.user_id, userId))
    .orderBy(desc(userPrevRecord.created_at));

  const sessionIds = records.map(r => r.session_id);
  let sessionData = [];
  let metricsData = [];
  if (sessionIds.length > 0) {
    sessionData = await db.select().from(sessions).where(inArray(sessions.id, sessionIds));
    metricsData = await db.select().from(metricesCalculated).where(inArray(metricesCalculated.session_id, sessionIds));
  }

  const history = records.map(r => {
    const s = sessionData.find(session => session.id === r.session_id);
    const m = metricsData.find(metric => metric.session_id === r.session_id);
    
    let parsedMetrics = {};
    if (m && m.metrics) {
      parsedMetrics = typeof m.metrics === 'string' ? JSON.parse(m.metrics) : m.metrics;
    }

    return {
      ...r,
      topic: s ? s.topic : 'Unknown Topic',
      category: s ? s.category : 'Unknown',
      difficulty: s ? s.difficulty : 'Unknown',
      metrics: parsedMetrics
    };
  });

  return history;
};

const updateUserProfile = async (userId, updateData) => {
  const { name, currentPassword, newPassword, photo } = updateData;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = {};
  if (name) updates.name = name;
  
  if (photo !== undefined) {
    if (photo && photo.startsWith('data:image')) {
      const matches = photo.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const extension = mimeType.split('/')[1] || 'jpg';
        const fileKey = `avatars/${userId}-${Date.now()}.${extension}`;
        
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read'
        });
        
        await s3Client.send(command);
        
        updates.photo = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;
      } else {
        updates.photo = photo;
      }
    } else {
      updates.photo = photo;
    }
  }

  if (currentPassword && newPassword) {
    if (!user.password_hash) {
       const err = new Error('OAuth users cannot change password directly.');
       err.statusCode = 400;
       throw err;
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const err = new Error('Incorrect current password');
      err.statusCode = 400;
      throw err;
    }
    updates.password_hash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length > 0) {
    await db.update(users).set(updates).where(eq(users.id, userId));
  }
};

const deleteUserAccount = async (userId) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.photo && user.photo.includes(process.env.AWS_S3_BUCKET_NAME)) {
    try {
      const key = user.photo.split('.amazonaws.com/')[1];
      if (key) {
        s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key
        })).catch(err => console.error('Failed to delete avatar from S3:', err));
      }
    } catch (err) {
      console.error('Error parsing S3 avatar key:', err);
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(userPrevRecord).where(eq(userPrevRecord.user_id, userId));
    await tx.delete(metricesCalculated).where(eq(metricesCalculated.user_id, userId));
    await tx.delete(sessions).where(eq(sessions.user_id, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
};

module.exports = {
  getRecentSessionRecords,
  getDashboardData,
  getSessionHistory,
  updateUserProfile,
  deleteUserAccount
};
