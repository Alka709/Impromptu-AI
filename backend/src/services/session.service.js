const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { eq } = require('drizzle-orm');
const logger = require('../telemetry/logger');

const generateSessionAndTopic = async (userId, category, difficulty) => {
  logger.info('Requesting topic from AI service', { category, difficulty, user_id: userId });
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  
  let topic = '';
  let hints = [];

  try {
    const aiResponse = await fetch(`${aiServiceUrl}/generate_topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, difficulty }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      logger.error('AI Service Error during topic generation', { errorData, category, difficulty });
      const err = new Error('Failed to generate topic from AI service.');
      err.statusCode = 502;
      throw err;
    }

    const aiData = await aiResponse.json();
    topic = aiData.topic;
    hints = aiData.hints;

    if (!topic || !hints) {
      logger.error('AI service returned empty topic or hints', { topic_exists: !!topic, hints_exists: !!hints });
      const err = new Error('AI service returned an empty topic or hints.');
      err.statusCode = 500;
      throw err;
    }
  } catch (aiError) {
    logger.error('Failed to communicate with AI Service', { error: aiError.message });
    if (!aiError.statusCode) {
      const err = new Error('Failed to reach AI service.');
      err.statusCode = 502;
      throw err;
    }
    throw aiError;
  }

  // Save session in DB
  const newSession = await db.insert(sessions).values({
    user_id: userId,
    category,
    difficulty,
    topic,
    hints,
  }).returning();

  logger.info('Session created successfully', { session_id: newSession[0].id, user_id: userId });
  return newSession[0];
};

const getEvaluationReport = async (sessionId, userId) => {
  // First check if the session exists and belongs to the user
  const sessionList = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!sessionList.length || sessionList[0].user_id !== userId) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }

  if (sessionList[0].status === 'failed') {
    return { status: 'failed', error: 'AI Evaluation failed. Please try again.' };
  }

  // Fetch the report
  const records = await db.select().from(userPrevRecord)
    .where(eq(userPrevRecord.session_id, sessionId));
    
  if (!records.length) {
    return { status: 'processing' };
  }

  // Fetch metrics
  const metricsRec = await db.select().from(metricesCalculated)
    .where(eq(metricesCalculated.session_id, sessionId));

  if (!metricsRec.length) {
    return { status: 'processing' };
  }

  const evaluation = records[0];
  
  // Defensively check type before parsing
  const rawMetrics = metricsRec.length ? metricsRec[0].metrics : {};
  const metrics = typeof rawMetrics === 'string' ? JSON.parse(rawMetrics) : rawMetrics;

  return {
    status: 'completed',
    summary: evaluation.summary,
    strengths: JSON.parse(evaluation.strengths),
    weaknesses: JSON.parse(evaluation.weaknesses),
    improvementTips: JSON.parse(evaluation.improvement_tips),
    overallScore: evaluation.overall_score,
    metrics: metrics
  };
};

const getSessionById = async (sessionId, userId) => {
  const sessionList = await db.select().from(sessions).where(eq(sessions.id, sessionId));

  if (!sessionList.length) {
    const err = new Error('Session not found.');
    err.statusCode = 404;
    throw err;
  }

  const session = sessionList[0];
  if (session.user_id !== userId) {
    logger.warn('Unauthorized session access attempt', { session_id: sessionId, user_id: userId });
    const err = new Error('Unauthorized.');
    err.statusCode = 403;
    throw err;
  }

  return session;
};

module.exports = {
  generateSessionAndTopic,
  getEvaluationReport,
  getSessionById
};
