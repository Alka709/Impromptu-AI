const { db } = require('../db');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');

const handleEvaluationResult = async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      summary,
      strengths,
      weaknesses,
      improvementTips,
      overallScore,
      metrics
    } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'Missing userId or sessionId' });
    }

    // Save report
    await db.insert(userPrevRecord).values({
      user_id: userId,
      session_id: sessionId,
      summary: summary || '',
      strengths: JSON.stringify(strengths || []),
      weaknesses: JSON.stringify(weaknesses || []),
      improvement_tips: JSON.stringify(improvementTips || []),
      overall_score: parseFloat(overallScore) || 0.0,
    });

    // Save metrics
    await db.insert(metricesCalculated).values({
      user_id: userId,
      session_id: sessionId,
      metrics: metrics || {}
    });

    return res.status(200).json({ message: 'Evaluation saved successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
};

module.exports = { handleEvaluationResult };
