import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp, BarChart2, Award } from 'lucide-react';

/* ── metric cell ── */
function Metric({ icon: Icon, label, value, denominator, helper, helperGreen, isLast }) {
  return (
    <div
      className={`flex items-center gap-4 flex-1 min-w-0 py-1 ${
        !isLast ? 'border-r border-[#ECECEC] pr-6 mr-6' : ''
      }`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-md bg-[#EAF5ED] text-[#16A34A] flex items-center justify-center shrink-0">
        <Icon size={18} strokeWidth={1.8} />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#888888] uppercase tracking-widest mb-0.5 whitespace-nowrap">
          {label}
        </p>
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className="text-[26px] font-extrabold text-[#111111] tracking-tight">
            {value}
          </span>
          {denominator && (
            <span className="text-sm font-semibold text-[#AAAAAA] ml-0.5">/10</span>
          )}
        </div>
        {helper && (
          <p className={`text-[12px] mt-0.5 font-medium ${helperGreen ? 'text-[#16A34A]' : 'text-[#888888]'}`}>
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProgressSnapshot({ sessionsThisMonth, avgScore, scoreTrend, bestScore, bestScoreDate }) {
  const trendIsPositive = parseFloat(scoreTrend) > 0;
  const trendDisplay = scoreTrend != null
    ? `${trendIsPositive ? '+' : ''}${scoreTrend}% vs earlier`
    : '—';

  const metrics = [
    {
      icon: CalendarDays,
      label: 'Sessions This Month',
      value: sessionsThisMonth.toString(),
      helper: '+' + sessionsThisMonth + ' this month',
      helperGreen: sessionsThisMonth > 0,
    },
    {
      icon: BarChart2,
      label: 'Average Score',
      value: avgScore !== null ? avgScore : '—',
      denominator: avgScore !== null,
      helper: 'Overall average',
      helperGreen: false,
    },
    {
      icon: TrendingUp,
      label: 'Score Trend',
      value: scoreTrend != null ? `${trendIsPositive ? '+' : ''}${scoreTrend}%` : '—',
      helper: 'Compared to previous sessions',
      helperGreen: trendIsPositive,
    },
    {
      icon: Award,
      label: 'Best Score',
      value: bestScore !== null ? bestScore : '—',
      denominator: bestScore !== null,
      helper: bestScoreDate ? `Achieved ${bestScoreDate}` : 'No sessions yet',
      helperGreen: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-md px-6 py-5 shadow-sm w-full"
    >
      <div className="flex flex-wrap items-center gap-0">
        {metrics.map((m, i) => (
          <Metric
            key={m.label}
            {...m}
            isLast={i === metrics.length - 1}
          />
        ))}
      </div>
    </motion.div>
  );
}
