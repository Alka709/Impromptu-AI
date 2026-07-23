import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';

import ProgressSnapshot from '../components/progress/ProgressSnapshot';
import ScoreTrendChart from '../components/progress/ScoreTrendChart';
import TopicsChart from '../components/progress/TopicsChart';
import SkillRadar from '../components/progress/SkillRadar';
import PracticeActivity from '../components/progress/PracticeActivity';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

/* ─────────────────────────────────────────────
   Data derivation helpers (pure, no side-effects)
───────────────────────────────────────────── */

/** Build the weekly activity buckets trailing up to the current week */
function computeWeeklyActivity(history) {
  if (!history) return [];

  // Determine current week's Sunday start (00:00:00)
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  const day = currentWeekStart.getDay(); // 0 = Sunday
  currentWeekStart.setDate(currentWeekStart.getDate() - day);

  // Find earliest session date if history exists
  let numWeeks = 8; // Default 8 trailing weeks
  if (history.length > 0) {
    const sorted = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const earliestDate = new Date(sorted[0].created_at);
    earliestDate.setHours(0, 0, 0, 0);
    const earliestDay = earliestDate.getDay();
    const earliestWeekStart = new Date(earliestDate);
    earliestWeekStart.setDate(earliestWeekStart.getDate() - earliestDay);

    const diffTime = currentWeekStart.getTime() - earliestWeekStart.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    numWeeks = Math.max(8, Math.min(diffWeeks + 1, 12));
  }

  // Generate week buckets ending at current week
  const weeks = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const wStart = new Date(currentWeekStart);
    wStart.setDate(wStart.getDate() - i * 7);

    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);

    const count = history.filter(s => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      return d >= wStart && d <= wEnd;
    }).length;

    const label = wStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      week: label,
      sessions: count,
      range: `${label} - ${wEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    });
  }

  return weeks;
}

/** Build score trend chart data from sorted-ascending history */
function computeScoreTrend(sortedHistory) {
  return sortedHistory.map((s, i) => ({
    date: new Date(s.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    score: parseFloat(Number(s.overall_score).toFixed(1)),
    index: i + 1,
  }));
}

/** Compute topics donut data */
function computeTopicsData(history) {
  const map = {};
  history.forEach(s => {
    const cat = s.category || 'Unknown';
    if (!map[cat]) map[cat] = { count: 0, scoreSum: 0, hasScore: false };
    map[cat].count += 1;
    if (s.overall_score != null) {
      map[cat].scoreSum += Number(s.overall_score);
      map[cat].hasScore = true;
    }
  });

  return Object.entries(map)
    .map(([name, d]) => ({
      name,
      value: d.count,
      avgScore: d.hasScore ? parseFloat((d.scoreSum / d.count).toFixed(1)) : null,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Compute radar data from session metrics */
function computeRadarData(history) {
  let fluency = 0, confidence = 0, pacing = 0, content = 0, pronunciation = 0, n = 0;

  history.forEach(s => {
    if (!s.metrics) return;
    fluency      += (s.metrics.fluency_score       ?? 0);
    confidence   += (s.metrics.articulation_score  ?? 0);
    pronunciation+= (s.metrics.pronunciation_score ?? s.metrics.articulation_score ?? 0);
    content      += (s.overall_score               ?? 0);

    const wpm = s.metrics.wpm || 0;
    const pacingScore = Math.min(10, Math.max(0, 10 - Math.abs(150 - wpm) / 15));
    pacing += pacingScore;
    n++;
  });

  if (n === 0) {
    return [
      { subject: 'Fluency',       score: 0 },
      { subject: 'Confidence',    score: 0 },
      { subject: 'Pacing',        score: 0 },
      { subject: 'Content',       score: 0 },
      { subject: 'Pronunciation', score: 0 },
    ];
  }

  return [
    { subject: 'Fluency',       score: parseFloat((fluency / n).toFixed(1)) },
    { subject: 'Confidence',    score: parseFloat((confidence / n).toFixed(1)) },
    { subject: 'Pacing',        score: parseFloat((pacing / n).toFixed(1)) },
    { subject: 'Content',       score: parseFloat((content / n).toFixed(1)) },
    { subject: 'Pronunciation', score: parseFloat((pronunciation / n).toFixed(1)) },
  ];
}

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function SkeletonCard({ h = 'h-64' }) {
  return (
    <div className={`bg-white border border-[#ECECEC] rounded-md ${h} animate-pulse`} />
  );
}

/* ─────────────────────────────────────────────
   Empty State
───────────────────────────────────────────── */
function EmptyState({ startNewSession }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 rounded-md bg-[#EAF5ED] flex items-center justify-center mb-5">
        <TrendingUp size={28} className="text-[#16A34A]" strokeWidth={1.8} />
      </div>
      <h2 className="text-xl font-bold text-[#111111] mb-2">No progress yet</h2>
      <p className="text-sm text-[#888888] mb-7 max-w-xs leading-relaxed">
        Complete your first session to start tracking your communication growth.
      </p>
      <button
        onClick={startNewSession}
        className="inline-flex items-center gap-2 bg-[#111111] text-white text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-black transition-colors"
      >
        Start Practicing
        <ArrowRight size={14} />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function ProgressScreen() {
  const { user, startNewSession } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Fetch all history */
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/users/${user.id}/history`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Progress history fetch error:', err);
        setIsLoading(false);
      });
  }, [user?.id]);

  /* ── Derived data (memoised) ── */
  const totalSessions = history.length;

  const sessionsThisMonth = useMemo(() => {
    const now = new Date();
    return history.filter(s => {
      const d = new Date(s.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [history]);

  const avgScore = useMemo(() => {
    if (!totalSessions) return null;
    const avg = history.reduce((acc, s) => acc + Number(s.overall_score), 0) / totalSessions;
    return avg.toFixed(1);
  }, [history, totalSessions]);

  const scoreTrend = useMemo(() => {
    if (totalSessions < 2) return null;
    const half = Math.floor(totalSessions / 2);
    const first = history.slice(0, half);
    const second = history.slice(half);
    const avgFirst = first.reduce((a, s) => a + Number(s.overall_score), 0) / first.length;
    const avgSecond = second.reduce((a, s) => a + Number(s.overall_score), 0) / second.length;
    return (((avgSecond - avgFirst) / avgFirst) * 100).toFixed(0);
  }, [history, totalSessions]);

  const { bestScore, bestScoreDate } = useMemo(() => {
    if (!totalSessions) return { bestScore: null, bestScoreDate: null };
    const best = history.reduce((acc, s) =>
      Number(s.overall_score) > Number(acc.overall_score) ? s : acc
    , history[0]);
    return {
      bestScore: Number(best.overall_score).toFixed(1),
      bestScoreDate: new Date(best.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    };
  }, [history, totalSessions]);

  const scoreTrendData = useMemo(() => computeScoreTrend(history), [history]);
  const topicsData     = useMemo(() => computeTopicsData(history),  [history]);
  const radarData      = useMemo(() => computeRadarData(history),   [history]);
  const activityData   = useMemo(() => computeWeeklyActivity(history), [history]);

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#FAFAF8] px-6 md:px-12 lg:px-16 py-10 max-w-[1600px] mx-auto w-full">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[#111111] tracking-tight">Your Progress</h1>
        <p className="text-sm text-[#666666] mt-1.5">Track your communication growth over time.</p>
      </motion.div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col gap-8 animate-pulse">
          <SkeletonCard h="h-20" />
          <SkeletonCard h="h-80" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonCard h="h-80" />
            <SkeletonCard h="h-80" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonCard h="h-80" />
            <SkeletonCard h="h-80" />
          </div>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && totalSessions === 0 && (
        <EmptyState startNewSession={startNewSession} />
      )}

      {/* ── Content ── */}
      {!isLoading && totalSessions > 0 && (
        <div className="flex flex-col gap-8">

          {/* 1. Compact snapshot strip */}
          <ProgressSnapshot
            sessionsThisMonth={sessionsThisMonth}
            avgScore={avgScore}
            scoreTrend={scoreTrend}
            bestScore={bestScore}
            bestScoreDate={bestScoreDate}
          />

          {/* 2. Hero: Score over time (full width) */}
          <ScoreTrendChart data={scoreTrendData} />

          {/* 3. Topics + Radar (equal width) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TopicsChart data={topicsData} />
            <SkillRadar data={radarData} />
          </div>

          {/* 4. Practice Activity (full width bar chart) */}
          <PracticeActivity data={activityData} />

        </div>
      )}
    </div>
  );
}
