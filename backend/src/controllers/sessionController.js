const sessionService = require('../services/session.service');
const sseService = require('../services/sse.service');
const catchAsync = require('../utils/catchAsync');
const { z } = require('zod');

const validCategories = [
  'Technology',
  'Education',
  'Current Affairs',
  'Personal Experience',
  'Business & Entrepreneurship',
];

const validDifficulties = ['easy', 'medium', 'hard'];

const createSessionSchema = z.object({
  category: z.enum(validCategories, {
    errorMap: () => ({ message: 'Invalid category.' })
  }),
  difficulty: z.enum(validDifficulties, {
    errorMap: () => ({ message: 'Invalid difficulty.' })
  })
});

const createSession = catchAsync(async (req, res) => {
  const parsedBody = createSessionSchema.safeParse(req.body);
  if (!parsedBody.success) {
    const errorMessage = parsedBody.error.errors[0]?.message || 'Category and difficulty are required.';
    return res.status(400).json({ error: errorMessage });
  }

  const { category, difficulty } = parsedBody.data;
  const userId = req.user.id;

  const session = await sessionService.generateSessionAndTopic(userId, category, difficulty);
  return res.status(201).json(session);
});

const getSessionEvaluation = catchAsync(async (req, res) => {
  const { id: sessionId } = req.params;
  const userId = req.user.id;

  const result = await sessionService.getEvaluationReport(sessionId, userId);
  
  if (result.status === 'processing') {
    return res.status(202).json(result);
  }

  return res.status(200).json(result);
});

const getSession = catchAsync(async (req, res) => {
  const { id: sessionId } = req.params;
  const userId = req.user.id;

  const session = await sessionService.getSessionById(sessionId, userId);
  return res.status(200).json(session);
});

const streamSessionEvents = catchAsync(async (req, res) => {
  const { id: sessionId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  sseService.addClient(sessionId, res);

  // Optional: Send initial connected ping
  res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`);

  req.on('close', () => {
    sseService.removeClient(sessionId, res);
  });
});

module.exports = { createSession, getSessionEvaluation, getSession, streamSessionEvents };
