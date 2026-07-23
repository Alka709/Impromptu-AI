const { db } = require('../db');
const { users } = require('../db/schema/users');
const { sessions } = require('../db/schema/sessions');
const { userPrevRecord, metricesCalculated } = require('../db/schema/evaluation');
const { eq, count, desc, and, gte, lt, sql } = require('drizzle-orm');

const getDashboardMetrics = async () => {
  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);
  const [{ totalSessions }] = await db.select({ totalSessions: count() }).from(sessions);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [{ sessionsToday, activeUsersToday }] = await db
    .select({
      sessionsToday: count(),
      activeUsersToday: sql`count(distinct ${sessions.user_id})::int`
    })
    .from(sessions)
    .where(
      and(
        gte(sessions.created_at, today),
        lt(sessions.created_at, tomorrow)
      )
    );

  const [{ averageScore }] = await db
    .select({ averageScore: sql`coalesce(round(avg(${userPrevRecord.overall_score})::numeric, 2),0)::float`})
    .from(userPrevRecord)
    .innerJoin(sessions, eq(userPrevRecord.session_id, sessions.id))
    .where(
      and(
        gte(sessions.created_at, today),
        lt(sessions.created_at, tomorrow)
      )
    );

  const recentActivity = await db
    .select({
      userId: users.id,
      userName: users.name,
      sessionId: sessions.id,
      topic: sessions.topic,
      score: userPrevRecord.overall_score,
      createdAt: sessions.created_at
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .leftJoin(userPrevRecord, eq(sessions.id, userPrevRecord.session_id))
    .where(eq(sessions.status, 'completed'))
    .orderBy(desc(sessions.created_at))
    .limit(10);

  return {
    overview: {
      totalUsers: Number(totalUsers) || 0,
      activeUsersToday: Number(activeUsersToday) || 0,
      totalSessions: Number(totalSessions) || 0,
      sessionsToday: Number(sessionsToday) || 0,
      averageScore: Number(averageScore) || 0
    },
    recentActivity
  };
};

const getUsersList = async () => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      verified: users.verified,
      createdAt: sql`to_char(timezone('Asia/Kolkata', ${users.created_at}),'YYYY-MM-DD HH24:MI:SS')`,
      totalSessions: sql`count(distinct ${sessions.id})::int`,
      averageScore: sql`round(avg(${userPrevRecord.overall_score})::numeric, 2)::float`,
      bestScore: sql`coalesce(max(${userPrevRecord.overall_score}), 0)::float`,
      lastActive: sql`timezone('Asia/Kolkata', max(${sessions.created_at}))`,
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.user_id, users.id))
    .leftJoin(userPrevRecord, eq(userPrevRecord.session_id, sessions.id))
    .groupBy(users.id)
    .orderBy(desc(users.created_at));

  return result.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    verified: u.verified,
    createdAt: u.createdAt,
    totalSessions: Number(u.totalSessions) || 0,
    averageScore: Number(u.averageScore) || 0,
    bestScore: Number(u.bestScore) || 0,
    lastActive: u.lastActive ?? null
  }));
};

const getUserProfileDetails = async (id) => {
  const [stats] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      photo: users.photo,
      role: users.role,
      verified: users.verified,
      createdAt: users.created_at,
      totalSessions: sql`count(distinct ${sessions.id})::int`,
      averageScore: sql`coalesce(round(avg(${userPrevRecord.overall_score})::numeric, 2), 0)::float`,
      bestScore:    sql`coalesce(max(${userPrevRecord.overall_score}), 0)::float`,
      lastActive:   sql`max(${sessions.created_at})`,
    })
    .from(users)
    .leftJoin(sessions,       eq(sessions.user_id,           users.id))
    .leftJoin(userPrevRecord, eq(userPrevRecord.session_id,  sessions.id))
    .where(eq(users.id, id))
    .groupBy(users.id);

  if (!stats) return null;

  const recentSessions = await db
    .select({
      sessionId:  sessions.id,
      topic:      sessions.topic,
      category:   sessions.category,
      difficulty: sessions.difficulty,
      status:     sessions.status,
      score:      userPrevRecord.overall_score,
      createdAt:  sessions.created_at,
    })
    .from(sessions)
    .leftJoin(userPrevRecord, eq(userPrevRecord.session_id, sessions.id))
    .where(eq(sessions.user_id, id))
    .orderBy(desc(sessions.created_at))
    .limit(10);

  return {
    profile: {
      id:        stats.id,
      name:      stats.name,
      email:     stats.email,
      photo:     stats.photo ?? null,
      role:      stats.role,
      verified:  stats.verified,
      createdAt: stats.createdAt,
    },
    statistics: {
      totalSessions: Number(stats.totalSessions) || 0,
      averageScore:  Number(stats.averageScore)  || 0,
      bestScore:     Number(stats.bestScore)     || 0,
      lastActive:    stats.lastActive ?? null,
    },
    recentSessions: recentSessions.map((s) => ({
      sessionId:  s.sessionId,
      topic:      s.topic,
      category:   s.category,
      difficulty: s.difficulty,
      status:     s.status,
      score:      s.score ?? null,
      createdAt:  s.createdAt,
    })),
  };
};

const getSessionsList = async () => {
  const result = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      userName: users.name,
      email: users.email,
      topic: sessions.topic,
      category: sessions.category,
      difficulty: sessions.difficulty,
      status: sessions.status,
      overallScore: userPrevRecord.overall_score,
      createdAt: sessions.created_at
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .leftJoin(userPrevRecord, eq(userPrevRecord.session_id, sessions.id))
    .orderBy(desc(sessions.created_at));

  return result.map((s) => ({
    sessionId: s.sessionId,
    userId: s.userId,
    userName: s.userName,
    email: s.email,
    topic: s.topic,
    category: s.category,
    difficulty: s.difficulty,
    status: s.status,
    overallScore: s.overallScore !== null ? Number(s.overallScore) : null,
    createdAt: s.createdAt
  }));
};

const safeParse = (value) => {
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

const getSingleSessionDetails = async (id) => {
  const [row] = await db
    .select({
      sessionId: sessions.id,
      topic: sessions.topic,
      category: sessions.category,
      difficulty: sessions.difficulty,
      status: sessions.status,
      createdAt: sessions.created_at,
      
      userId: users.id,
      userName: users.name,
      email: users.email,
      photo: users.photo,

      overallScore: userPrevRecord.overall_score,
      summary: userPrevRecord.summary,
      strengths: userPrevRecord.strengths,
      weaknesses: userPrevRecord.weaknesses,
      improvementTips: userPrevRecord.improvement_tips,

      metrics: metricesCalculated.metrics
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .leftJoin(userPrevRecord, eq(userPrevRecord.session_id, sessions.id))
    .leftJoin(metricesCalculated, eq(metricesCalculated.session_id, sessions.id))
    .where(eq(sessions.id, id));

  if (!row) return null;

  let evaluation = null;
  if (row.overallScore !== null) {
    evaluation = {
      overallScore: Number(row.overallScore),
      summary: row.summary,
      strengths: safeParse(row.strengths),
      weaknesses: safeParse(row.weaknesses),
      improvementTips: safeParse(row.improvementTips)
    };
  }

  let transcript = null;
  let metrics = null;
  
  if (row.metrics) {
    const parsedMetrics = safeParse(row.metrics);
    transcript = parsedMetrics.transcript || null;
    
    metrics = {
      word_count: parsedMetrics.word_count,
      wpm: parsedMetrics.wpm,
      pause_count: parsedMetrics.pause_count,
      average_pause: parsedMetrics.average_pause,
      filler_count: parsedMetrics.filler_count,
      repetition_count: parsedMetrics.repetition_count,
      fluency_score: parsedMetrics.fluency_score,
      articulation_score: parsedMetrics.articulation_score
    };
  }

  return {
    session: {
      sessionId: row.sessionId,
      topic: row.topic,
      category: row.category,
      difficulty: row.difficulty,
      status: row.status,
      createdAt: row.createdAt
    },
    user: {
      id: row.userId,
      name: row.userName,
      email: row.email,
      photo: row.photo
    },
    evaluation,
    transcript,
    metrics
  };
};

module.exports = {
  getDashboardMetrics,
  getUsersList,
  getUserProfileDetails,
  getSessionsList,
  getSingleSessionDetails
};
