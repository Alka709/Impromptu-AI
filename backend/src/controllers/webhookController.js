const { db } = require('../db');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { sessions } = require('../db/schema/sessions');
const { eq } = require('drizzle-orm');

const { z } = require('zod');

const webhookSchema = z.object({
  userId: z.string({ required_error: 'Missing userId or sessionId' }).min(1, 'Missing userId or sessionId'),
  sessionId: z.string({ required_error: 'Missing userId or sessionId' }).min(1, 'Missing userId or sessionId'),
  status: z.enum(['completed', 'failed']).optional(),
  error: z.string().optional(),
  summary: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  improvementTips: z.array(z.string()).optional(),
  overallScore: z.union([z.number(), z.string()]).optional(),
  metrics: z.any().optional()
}).passthrough();

const handleEvaluationResult = async (req, res) => {
  try {
    const parsedBody = webhookSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: parsedBody.error.errors[0].message });
    }

    const {
      userId,
      sessionId,
      status,
      error,
      summary,
      strengths,
      weaknesses,
      improvementTips,
      overallScore,
      metrics
    } = parsedBody.data;

    if (status === 'failed') {
      await db.update(sessions)
        .set({ status: 'failed' })
        .where(eq(sessions.id, sessionId));
      return res.status(200).json({ message: 'Failure recorded successfully' });
    }

    // Idempotency check — if this session's report already exists, treat this as a
    // duplicate delivery (e.g. a retried webhook call) and no-op rather than inserting again.
    const existing = await db.select()
      .from(userPrevRecord)
      .where(eq(userPrevRecord.session_id, sessionId))
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json({ message: 'Already processed' });
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

    return res.status(200).json({ message: 'Evaluation saved successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
};

module.exports = { handleEvaluationResult };
