const { db } = require('../db');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { sessions } = require('../db/schema/sessions');
const { eq } = require('drizzle-orm');
const sseService = require('./sse.service');

const processEvaluationWebhook = async (data) => {
  const {
    userId,
    sessionId,
    status,
    summary,
    strengths,
    weaknesses,
    improvementTips,
    overallScore,
    metrics
  } = data;

  if (status === 'failed') {
    await db.update(sessions)
      .set({ status: 'failed' })
      .where(eq(sessions.id, sessionId));
      
    sseService.notifyClient(sessionId, { status: 'failed' });
    
    return { message: 'Failure recorded successfully' };
  }

  // Idempotency check
  const existing = await db.select()
    .from(userPrevRecord)
    .where(eq(userPrevRecord.session_id, sessionId))
    .limit(1);

  if (existing.length > 0) {
    return { message: 'Already processed' };
  }

  // Mark session as completed
  await db.update(sessions)
    .set({ status: 'completed' })
    .where(eq(sessions.id, sessionId));

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

  const evaluationResult = {
    status: 'completed',
    summary: summary || '',
    strengths: strengths || [],
    weaknesses: weaknesses || [],
    improvementTips: improvementTips || [],
    overallScore: parseFloat(overallScore) || 0.0,
    metrics: metrics || {}
  };
  
  sseService.notifyClient(sessionId, evaluationResult);

  return { message: 'Evaluation saved successfully' };
};

module.exports = {
  processEvaluationWebhook
};
