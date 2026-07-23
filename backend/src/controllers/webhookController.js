const catchAsync = require('../utils/catchAsync');
const webhookService = require('../services/webhook.service');
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

const handleEvaluationResult = catchAsync(async (req, res) => {
  const parsedBody = webhookSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: parsedBody.error.errors[0].message });
  }

  const result = await webhookService.processEvaluationWebhook(parsedBody.data);
  return res.status(200).json(result);
});

module.exports = { handleEvaluationResult };
