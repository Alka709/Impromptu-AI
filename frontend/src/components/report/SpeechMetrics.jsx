import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Activity, Volume2, MessageSquare, PauseCircle } from 'lucide-react';

/* ── progress bar ── */
function MiniBar({ value, max = 10, color: customColor }) {
  const pct = Math.min(100, Math.max(0, ((value || 0) / max) * 100));
  const color = customColor || (pct >= 80 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626');
  return (
    <div className="w-full h-1 bg-[#F0F0F0] rounded-full mt-2.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* ── single metric cell ── */
function MetricCell({ icon: Icon, label, value, unit = '/10', max = 10, barColor, delay = 0 }) {
  const displayVal = value != null ? (typeof value === 'number' ? (unit === '/10' ? value.toFixed(1) : Math.round(value)) : value) : '—';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col px-6 py-5 border-r border-[#F0F0F0] last:border-r-0"
    >
      {/* Icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-[#16A34A]" strokeWidth={1.8} />
        <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">{label}</span>
      </div>
      {/* Value & Unit */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-[#111111] tracking-tight">
          {displayVal}
        </span>
        <span className="text-xs font-semibold text-[#888888]">{unit}</span>
      </div>
      {/* Bar */}
      <MiniBar value={typeof value === 'number' ? value : 0} max={max} color={barColor} />
    </motion.div>
  );
}

export default function SpeechMetrics({ metrics, overallScore }) {
  const wpm = Number(metrics?.wpm) || 0;
  const articulation = metrics?.articulation_score != null ? Number(metrics.articulation_score) : (overallScore != null ? Number(overallScore) : null);
  const fluency = metrics?.fluency_score != null ? Number(metrics.fluency_score) : null;
  const pronunciation = metrics?.pronunciation_score != null ? Number(metrics.pronunciation_score) : articulation;
  
  const fillerCount = metrics?.filler_count ?? metrics?.filler_words_count ?? (metrics?.fillers ? Object.keys(metrics.fillers).length : 0);
  const pauseCount = metrics?.pause_count ?? metrics?.pauses_count ?? (Array.isArray(metrics?.pauses) ? metrics.pauses.length : 0);

  const items = [
    { icon: Activity,     label: 'Speech Rate',    value: wpm > 0 ? wpm : null, unit: 'WPM', max: 200, delay: 0 },
    { icon: Shield,       label: 'Confidence',     value: articulation, unit: '/10', max: 10, delay: 0.05 },
    { icon: Zap,          label: 'Fluency',        value: fluency, unit: '/10', max: 10, delay: 0.1 },
    { icon: Volume2,      label: 'Pronunciation',  value: pronunciation, unit: '/10', max: 10, delay: 0.15 },
    { icon: MessageSquare,label: 'Filler Words',   value: fillerCount, unit: 'words', max: 15, barColor: fillerCount > 5 ? '#DC2626' : '#16A34A', delay: 0.2 },
    { icon: PauseCircle,  label: 'Pauses',         value: pauseCount, unit: 'pauses', max: 15, barColor: pauseCount > 8 ? '#D97706' : '#16A34A', delay: 0.25 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Section title */}
      <div className="px-7 py-5 border-b border-[#F0F0F0] flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#111111] tracking-tight">Speech Metrics</h2>
        <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">Live AI Analysis</span>
      </div>

      {/* 6-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <MetricCell key={item.label} {...item} />
        ))}
      </div>
    </motion.div>
  );
}
