const { db } = require('../db');
const { userPrevRecord } = require('../db/schema/evaluation');
const { eq, desc } = require('drizzle-orm');

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

module.exports = { getRecentSessionRecords };
