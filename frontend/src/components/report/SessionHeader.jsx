import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, BarChart2, RefreshCw } from 'lucide-react';

/* ── helpers ── */
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m} min ${s}s` : `${m} min`;
}

function difficultyStyle(diff) {
  const d = (diff || '').toLowerCase();
  if (d === 'easy') return 'bg-[#EAF5ED] text-[#16A34A]';
  if (d === 'hard') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

/* ── score label ── */
function scoreLabel(score) {
  if (score >= 9) return 'Excellent!';
  if (score >= 8) return 'Great job!';
  if (score >= 6) return 'Good effort';
  if (score >= 4) return 'Keep going';
  return 'Needs work';
}

/* ── Circular progress ring ── */
function ScoreRing({ score, size = 96, strokeWidth = 8 }) {
  const pct = Math.min(1, Math.max(0, (score || 0) / 10));
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - pct * circ;
  const greenColor = '#16A34A';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#ECECEC"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={greenColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fontWeight="800"
        fill="#111111"
        fontFamily="inherit"
      >
        {Math.round(pct * 100)}%
      </text>
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9.5"
        fontWeight="600"
        fill={greenColor}
        fontFamily="inherit"
      >
        {scoreLabel(score)}
      </text>
    </svg>
  );
}

export default function SessionHeader({ sessionData, overallScore, onPracticeAgain }) {
  const navigate = useNavigate();

  const topic      = sessionData?.topic || 'Untitled Session';
  const category   = sessionData?.category || '';
  const difficulty = sessionData?.difficulty || '';
  const date       = formatDate(sessionData?.created_at);
  const duration   = formatDuration(sessionData?.duration);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/history')}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#666666] hover:text-[#111111] transition-colors mb-6"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Back to Session History
      </button>

      {/* Header row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">

        {/* LEFT — Topic + meta */}
        <div className="flex-1 min-w-0">
          {/* Topic */}
          <h1 className="text-[36px] font-bold text-[#111111] tracking-tight leading-[1.15] mb-4">
            {topic}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#666666]">
            {/* Category badge */}
            {category && (
              <span className="inline-block bg-[#EAF5ED] text-[#16A34A] text-xs font-semibold px-2.5 py-0.5 rounded-md">
                {category}
              </span>
            )}
            {/* Difficulty */}
            {difficulty && (
              <>
                <span className="text-[#CCCCCC]">·</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${difficultyStyle(difficulty)}`}>
                  <BarChart2 size={11} />
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
              </>
            )}
            {/* Date */}
            {date && (
              <>
                <span className="text-[#CCCCCC]">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} strokeWidth={1.8} />
                  {date}
                </span>
              </>
            )}
            {/* Duration */}
            {duration && (
              <>
                <span className="text-[#CCCCCC]">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} strokeWidth={1.8} />
                  {duration}
                </span>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Score card */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="bg-white border border-[#ECECEC] rounded-2xl px-8 py-5 shadow-sm flex items-center gap-8">
            {/* Score */}
            <div className="flex flex-col items-start">
              <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider mb-0.5">
                Overall Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-[#111111] tracking-tight">
                  {overallScore ?? '—'}
                </span>
                <span className="text-lg font-semibold text-[#AAAAAA]">/10</span>
              </div>
            </div>

            {/* Ring */}
            <ScoreRing score={overallScore} size={96} strokeWidth={7} />
          </div>

          {/* Practice Again */}
          <button
            onClick={onPracticeAgain}
            className="inline-flex items-center gap-2 bg-[#111111] hover:bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
          >
            <RefreshCw size={14} />
            Practice Again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
