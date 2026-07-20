const { db } = require('../db');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { sessions } = require('../db/schema/sessions');
const { users } = require('../db/schema/users');
const bcrypt = require('bcryptjs');
const { eq, desc, inArray } = require('drizzle-orm');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getRecentSessionRecords = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Fetch the last 3 records for the user, ordered by creation date descending
    const records = await db.select()
      .from(userPrevRecord)
      .where(eq(userPrevRecord.user_id, userId))
      .orderBy(desc(userPrevRecord.created_at))
      .limit(3);

    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching recent session records:', error);
    return res.status(500).json({ error: 'Failed to fetch recent session records' });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user's evaluation records
    const records = await db.select()
      .from(userPrevRecord)
      .where(eq(userPrevRecord.user_id, userId))
      .orderBy(desc(userPrevRecord.created_at))
      .limit(10);

    const allRecords = await db.select().from(userPrevRecord).where(eq(userPrevRecord.user_id, userId));
    const totalSessions = allRecords.length;
    const averageScore = totalSessions > 0 ? (allRecords.reduce((acc, curr) => acc + curr.overall_score, 0) / totalSessions).toFixed(1) : 0;

    // Calculate best score
    const bestScore = totalSessions > 0 ? Math.max(...allRecords.map(r => r.overall_score)) : 0;

    // Calculate current streak
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

    return res.status(200).json({
      totalSessions,
      averageScore,
      bestScore,
      currentStreak,
      recentSessions
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};


const getSessionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

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

    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching session history:', error);
    return res.status(500).json({ error: 'Failed to fetch session history' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, currentPassword, newPassword, photo } = req.body;

    // Optional: add authorization check if req.user exists
    if (req.user && req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

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
         return res.status(400).json({ error: 'OAuth users cannot change password directly.'});
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
      updates.password_hash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  getSessionHistory, getRecentSessionRecords, getDashboardData, updateUserProfile };
