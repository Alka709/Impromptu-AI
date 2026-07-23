import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

function formatTimeLabel(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Construct speech timeline points dynamically scaling with speech duration (e.g., 2 mins = 120s).
 */
function buildTimelineData(metrics, overallScore, durationSeconds) {
  const overall     = Number(overallScore) || 7.0;
  const fluency     = metrics?.fluency_score != null ? Number(metrics.fluency_score) : overall;
  const confidence  = metrics?.articulation_score != null ? Number(metrics.articulation_score) : overall;
  const dur         = Math.max(10, durationSeconds || metrics?.audio_duration || 120);
  
  // Word timestamps or VAD speech segments
  const words = Array.isArray(metrics?.words) ? metrics.words : [];
  const segments = Array.isArray(metrics?.speech_segments) ? metrics.speech_segments : [];
  
  // Dynamically calculate steps: ~7 to 10 points spanning 0s to dur (e.g. 120s)
  const numSteps = Math.min(10, Math.max(6, Math.round(dur / 15)));
  const interval = dur / (numSteps - 1);
  const points = [];

  if (words.length > 5) {
    for (let i = 0; i < numSteps; i++) {
      const segStart = i * interval;
      const segEnd = (i + 1) * interval;
      const wordsInSeg = words.filter(w => (w.start >= segStart && w.start < segEnd) || (w.end >= segStart && w.end < segEnd));
      const intervalWpm = (wordsInSeg.length / (interval / 60)) || 0;
      const score = Math.max(2.0, Math.min(10.0, 10.0 - Math.abs(150 - intervalWpm) / 18));
      const label = formatTimeLabel(segStart);
      points.push({ label, your: parseFloat(score.toFixed(1)), avg: parseFloat(overall.toFixed(1)) });
    }
  } else if (segments.length > 0) {
    for (let i = 0; i < numSteps; i++) {
      const segStart = i * interval;
      const segEnd = (i + 1) * interval;
      let activeSecs = 0;
      segments.forEach(s => {
        const overlapStart = Math.max(segStart, s.start);
        const overlapEnd = Math.min(segEnd, s.end);
        if (overlapEnd > overlapStart) {
          activeSecs += (overlapEnd - overlapStart);
        }
      });
      const ratio = activeSecs / interval;
      const score = Math.max(3.0, Math.min(10.0, ratio * 10));
      const label = formatTimeLabel(segStart);
      points.push({ label, your: parseFloat(score.toFixed(1)), avg: parseFloat(overall.toFixed(1)) });
    }
  } else {
    // Deterministic curve scaling across speech duration
    const baseDiff = (fluency - confidence) * 0.2;
    for (let i = 0; i < numSteps; i++) {
      const t = i / (numSteps - 1);
      const warmup = (1 - Math.cos(t * Math.PI)) * 0.5;
      const curve = Math.sin(t * Math.PI) * baseDiff;
      const yourScore = Math.max(1.0, Math.min(10.0, confidence + (overall - confidence) * warmup + curve));
      const label = formatTimeLabel(t * dur);
      points.push({ label, your: parseFloat(yourScore.toFixed(1)), avg: parseFloat(overall.toFixed(1)) });
    }
  }

  const avg = parseFloat(overall.toFixed(1));
  return { points, avg, dur };
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-[#ECECEC] rounded-md px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-[#888888] mb-1">Time: {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)}/10
        </p>
      ))}
    </div>
  );
}

export default function SpeechMetricsTimeline({ metrics, overallScore, duration }) {
  const { points, avg, dur } = buildTimelineData(metrics, overallScore, duration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-2xl px-8 py-7 shadow-sm h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-bold text-[#111111] tracking-tight">
          Speech Performance Over Time
        </h2>
        <span className="text-[10px] font-semibold text-[#16A34A] uppercase tracking-wider">
          {formatTimeLabel(dur)} Timeline Analysis
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="yourGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" horizontal vertical={false} stroke="#F0F0F0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AAAAAA', fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              domain={[0, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AAAAAA', fontSize: 11 }}
              ticks={[0, 2.5, 5, 7.5, 10]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#ECECEC' }} />
            <ReferenceLine y={avg} stroke="#CCCCCC" strokeDasharray="5 4" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="your"
              name="Performance"
              stroke="#16A34A"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#16A34A', strokeWidth: 0 }}
              activeDot={{ r: 5.5, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 justify-center">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-[#555555]">
          <span className="w-5 h-0.5 bg-[#16A34A] rounded-full inline-block" />
          Live Performance Trend
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-[#555555]">
          <span className="inline-flex gap-px">
            <span className="w-1.5 h-0.5 bg-[#AAAAAA] rounded-full" />
            <span className="w-1.5 h-0.5 bg-[#AAAAAA] rounded-full" />
            <span className="w-1.5 h-0.5 bg-[#AAAAAA] rounded-full" />
          </span>
          Overall Baseline
        </span>
      </div>
    </motion.div>
  );
}
