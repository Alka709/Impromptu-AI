import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, BarChart3, ShieldCheck } from 'lucide-react';

/* ---------- SVG Progress Graphs ---------- */

const ScoreTrendChart = () => {
  const points = [
    { session: 'S1', score: 62 },
    { session: 'S2', score: 68 },
    { session: 'S3', score: 65 },
    { session: 'S4', score: 74 },
    { session: 'S5', score: 79 },
    { session: 'S6', score: 84 },
    { session: 'S7', score: 89 },
  ];

  // SVG dimensions
  const width = 280;
  const height = 100;
  const padding = 20;

  const minScore = 50;
  const maxScore = 100;

  const getX = (i) => padding + (i * (width - 2 * padding)) / (points.length - 1);
  const getY = (val) => height - padding - ((val - minScore) / (maxScore - minScore)) * (height - 2 * padding);

  const pathD = points.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.score);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(points.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div className="bg-white border border-[#E7E7E7] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAFAF8] border border-[#E7E7E7] flex items-center justify-center">
            <TrendingUp size={14} className="text-[#111111]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#111111]">Delivery Score Trend</h4>
            <p className="text-[10px] text-[#5B5B5B]">Progress across recent practice sessions</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">+27 pts</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#111111" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#111111" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[60, 80, 100].map((val) => (
            <line
              key={val}
              x1={padding}
              y1={getY(val)}
              x2={width - padding}
              y2={getY(val)}
              stroke="#F0F0F0"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#scoreGrad)" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((pt, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={getX(i)}
                cy={getY(pt.score)}
                r="4"
                className="fill-white stroke-[#111111] stroke-2 group-hover:r-5 transition-all duration-150"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#5B5B5B] px-1 font-medium border-t border-[#F5F5F4] pt-2">
        {points.map((p) => (
          <span key={p.session}>{p.session}</span>
        ))}
      </div>
    </div>
  );
};

const PaceAndPacingChart = () => {
  const sessions = [
    { label: 'Session 1', pace: 165, target: 130 },
    { label: 'Session 2', pace: 152, target: 130 },
    { label: 'Session 3', pace: 141, target: 130 },
    { label: 'Session 4', pace: 134, target: 130 },
  ];

  return (
    <div className="bg-white border border-[#E7E7E7] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAFAF8] border border-[#E7E7E7] flex items-center justify-center">
            <Activity size={14} className="text-[#111111]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#111111]">Pace Optimization (WPM)</h4>
            <p className="text-[10px] text-[#5B5B5B]">Words per minute vs recommended pace</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 my-1">
        {sessions.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-[#5B5B5B]">{s.label}</span>
              <span className="font-semibold text-[#111111]">{s.pace} wpm</span>
            </div>
            <div className="h-2 w-full bg-[#FAFAF8] border border-[#F0F0F0] rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(s.pace / 180) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`h-full rounded-full ${i === 3 ? 'bg-emerald-600' : 'bg-[#111111]'}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#5B5B5B] border-t border-[#F5F5F4] pt-2">
        <span>Target Pace: 120-140 WPM</span>
        <span className="text-emerald-700 font-semibold">Optimal Pace Reached</span>
      </div>
    </div>
  );
};

const FillerWordReductionChart = () => {
  const data = [14, 11, 8, 5, 2];

  return (
    <div className="sm:col-span-2 bg-white border border-[#E7E7E7] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAFAF8] border border-[#E7E7E7] flex items-center justify-center">
            <BarChart3 size={14} className="text-[#111111]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#111111]">Filler Word Reduction</h4>
            <p className="text-[10px] text-[#5B5B5B]">Um, uh, like frequency per speech minute</p>
          </div>
        </div>
        <span className="text-xs font-medium text-[#5B5B5B] bg-[#FAFAF8] border border-[#E7E7E7] px-2 py-0.5 rounded-md">85% Reduction</span>
      </div>

      <div className="flex items-end justify-between gap-3 h-24 pt-4 px-2">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-[10px] font-semibold text-[#5B5B5B]">{val}</span>
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${(val / 15) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`w-full max-w-[36px] rounded-md ${
                i === data.length - 1 ? 'bg-emerald-600' : 'bg-[#111111]'
              }`}
            />
            <span className="text-[10px] text-[#5B5B5B] font-medium">Run {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- WhySection ---------- */

const WhySection = () => (
  <section
    id="why-impromptu"
    className="py-24 px-6 bg-[#F5F5F4]"
    aria-labelledby="why-heading"
  >
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
      {/* Left: copy */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <div>
          <p className="text-xs font-semibold text-[#5B5B5B] uppercase tracking-widest mb-3">Why ImpromptuAI</p>
          <h2
            id="why-heading"
            className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight leading-tight"
          >
            Speaking well is a skill,
            <br />
            not a talent.
          </h2>
        </div>

        <p className="text-[15px] text-[#5B5B5B] leading-relaxed max-w-md">
          Most people believe great communicators are born, not made. Research consistently shows otherwise. Deliberate, structured practice with specific feedback is the single most reliable path to confident, compelling speaking.
        </p>
        <p className="text-[15px] text-[#5B5B5B] leading-relaxed max-w-md">
          ImpromptuAI was built around that insight. Every feature — from instant session analysis to real-time progress graphs — is designed to help you build confidence and eliminate weak habits faster.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          {[
            'Immediate, objective AI analysis after every attempt',
            'Tracks score progression, pacing trends & filler word reduction',
            'Designed for professionals, students, and public speakers',
          ].map((point) => (
            <div key={point} className="flex items-start gap-3 text-sm text-[#5B5B5B]">
              <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-[#111111] flex items-center justify-center" aria-hidden="true">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {point}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right: Progress Graphs replacing fake metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreTrendChart />
        <PaceAndPacingChart />
        <FillerWordReductionChart />
      </div>
    </div>
  </section>
);

export default WhySection;
