const { db } = require('../db');
const { sessions } = require('../db/schema/sessions');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { eq } = require('drizzle-orm');
const logger = require('../telemetry/logger');

const validCategories = [
  'Technology',
  'Education',
  'Current Affairs',
  'Personal Experience',
  'Business & Entrepreneurship',
];

const validDifficulties = ['easy', 'medium', 'hard'];

const createSession = async (req, res) => {
  try {
    const { category, difficulty } = req.body;
    const userId = req.user.id;

    if (!category || !difficulty) {
      logger.warn('Session creation failed: Missing category or difficulty', { user_id: userId });
      return res.status(400).json({ error: 'Category and difficulty are required.' });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category.' });
    }

    if (!validCategories.includes(category)) {
      logger.warn('Session creation failed: Invalid category', { category, user_id: userId });
      return res.status(400).json({ error: 'Invalid category.' });
    }

    if (!validDifficulties.includes(difficulty)) {
      logger.warn('Session creation failed: Invalid difficulty', { difficulty, user_id: userId });
      return res.status(400).json({ error: 'Invalid difficulty.' });
    }

    logger.info('Requesting topic from AI service', { category, difficulty, user_id: userId });

    // Call FastAPI service to generate topic
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
      return res.status(502).json({ error: 'Failed to generate topic from AI service.' });
    }

    const { topic, hints } = await aiResponse.json();

    if (!topic || !hints) {
        logger.error('AI service returned empty topic or hints', { topic_exists: !!topic, hints_exists: !!hints });
        return res.status(500).json({ error: 'AI service returned an empty topic or hints.' });
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
    return res.status(201).json(newSession[0]);

  } catch (error) {
    logger.error('Create session error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getSessionEvaluation = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.id;

    // Fetch the report
    const records = await db.select().from(userPrevRecord)
      .where(eq(userPrevRecord.session_id, sessionId));
      
    if (!records.length) {
      return res.status(202).json({ status: 'processing' });
    }

    // Fetch metrics
    const metricsRec = await db.select().from(metricesCalculated)
      .where(eq(metricesCalculated.session_id, sessionId));

    if (!metricsRec.length) {
      return res.status(202).json({ status: 'processing' });
    }

    const evaluation = records[0];
    
    // Defensively check type before parsing
    const rawMetrics = metricsRec.length ? metricsRec[0].metrics : {};
    const metrics = typeof rawMetrics === 'string' ? JSON.parse(rawMetrics) : rawMetrics;

    return res.status(200).json({
      status: 'completed',
      summary: evaluation.summary,
      strengths: JSON.parse(evaluation.strengths),
      weaknesses: JSON.parse(evaluation.weaknesses),
      improvementTips: JSON.parse(evaluation.improvement_tips),
      overallScore: evaluation.overall_score,
      metrics: metrics
    });
  } catch (error) {
    logger.error('Get evaluation error', { error: error.message, stack: error.stack, session_id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getSession = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.id;

    const sessionList = await db.select().from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!sessionList.length) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const session = sessionList[0];
    if (session.user_id !== userId) {
      logger.warn('Unauthorized session access attempt', { session_id: sessionId, user_id: userId });
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    return res.status(200).json(session);
  } catch (error) {
    logger.error('Get session error', { error: error.message, stack: error.stack, session_id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createSession, getSessionEvaluation, getSession };
