import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Flame, Award, ArrowRight } from 'lucide-react';

function getHelperText(type, dashData) {
  const { totalSessions, averageScore, currentStreak, bestScore, recentSessions } = dashData || {};

  switch (type) {
    case 'total': {
      if (!totalSessions) return 'No sessions yet';
      const thisMonth = (recentSessions || []).filter((s) => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      if (thisMonth > 0) return `+${thisMonth} this month`;
      return 'Across all time';
    }
    case 'avg': {
      if (!averageScore) return 'No sessions yet';
      return 'Overall average';
    }
    case 'streak': {
      const streak = currentStreak ?? 0;
      if (recentSessions && recentSessions.length > 0 && recentSessions[0].created_at) {
        const lastDate = new Date(recentSessions[0].created_at).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Practiced today';
        if (diffDays === 1) return 'Last practiced yesterday';
        if (diffDays > 1) return `Last practiced ${diffDays} days ago`;
      }
      return streak > 0 ? 'Practiced recently' : 'Start practicing today';
    }
    case 'best': {
      if (!bestScore) return 'No sessions yet';
      const bestSession = (recentSessions || []).reduce((acc, s) => {
        return (s.overall_score ?? 0) > (acc?.overall_score ?? -1) ? s : acc;
      }, null);
      if (bestSession?.created_at) {
        const d = new Date(bestSession.created_at);
        return `Achieved on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return 'Personal best';
    }
    default:
      return '';
  }
}

export default function CommunicationSnapshot({ dashData }) {
  const navigate = useNavigate();

  const total = dashData?.totalSessions ?? 0;
  const avg = dashData?.averageScore != null ? Number(dashData.averageScore).toFixed(1) : '—';
  const streak = dashData?.currentStreak ?? 0;
  const best = dashData?.bestScore != null ? Number(dashData.bestScore).toFixed(1) : '—';

  const metrics = [
    {
      key: 'total',
      label: 'Total Sessions',
      icon: Calendar,
      value: total.toString(),
      hasDenominator: false,
      subtextIsPositive: total > 0,
    },
    {
      key: 'avg',
      label: 'Average Score',
      icon: TrendingUp,
      value: avg,
      hasDenominator: avg !== '—',
      subtextIsPositive: avg !== '—',
    },
    {
      key: 'streak',
      label: 'Current Streak',
      icon: Flame,
      value: `${streak} Day${streak === 1 ? '' : 's'}`,
      hasDenominator: false,
      subtextIsPositive: streak > 0,
    },
    {
      key: 'best',
      label: 'Best Score',
      icon: Award,
      value: best,
      hasDenominator: best !== '—',
      subtextIsPositive: false,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="snapshot-heading"
      className="bg-white border border-[#ECECEC] rounded-md p-6 shadow-sm w-full"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <h2
          id="snapshot-heading"
          className="text-base font-bold text-[#111111] tracking-tight"
        >
          Your Communication Snapshot
        </h2>
        <button
          onClick={() => navigate('/progress')}
          className="text-xs font-semibold text-[#16A34A] hover:underline inline-flex items-center gap-1 transition-colors"
        >
          View Progress
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4 Metric Columns with vertical dividers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-[#ECECEC] gap-6 sm:gap-0">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          const helperText = getHelperText(m.key, dashData || {});

          return (
            <div
              key={m.key}
              className={`flex flex-col ${idx > 0 ? 'md:pl-6' : ''} ${idx < 3 ? 'md:pr-6' : ''}`}
            >
              {/* Icon badge */}
              <div className="w-10 h-10 rounded-md bg-[#EAF5ED] text-[#16A34A] flex items-center justify-center mb-3">
                <Icon size={20} strokeWidth={2} />
              </div>

              {/* Label */}
              <span className="text-xs font-semibold text-[#444444]">
                {m.label}
              </span>

              {/* Metric Value */}
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-[#111111] tracking-tight">
                  {m.value}
                </span>
                {m.hasDenominator && (
                  <span className="text-sm font-semibold text-[#888888]">/10</span>
                )}
              </div>

              {/* Subtext */}
              <p
                className={`text-xs mt-2 ${
                  m.subtextIsPositive
                    ? 'font-bold text-[#16A34A]'
                    : 'font-medium text-[#888888]'
                }`}
              >
                {helperText}
              </p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
