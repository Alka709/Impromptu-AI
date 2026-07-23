import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Zap, Sparkles } from 'lucide-react';

/* ---------- Animated Dashboard Preview ---------- */

const WaveformBar = ({ delay, height }) => (
  <motion.div
    className="w-[3px] rounded-full bg-[#111111]"
    animate={{ height: [height * 0.4, height, height * 0.6, height * 0.9, height * 0.4] }}
    transition={{ duration: 1.6, repeat: Infinity, delay, ease: 'easeInOut' }}
    style={{ minHeight: 4 }}
  />
);

const DashboardPreview = () => {
  const bars = [12, 20, 32, 18, 28, 36, 22, 14, 30, 24, 38, 20, 16, 28, 34, 20, 26, 32, 18, 22];
  const delays = bars.map((_, i) => i * 0.08);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[520px] mx-auto"
    >
      {/* Main card */}
      <div className="bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        {/* Card top bar */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F0F0F0]">
          <div className="w-3 h-3 rounded-full bg-[#E7E7E7]" />
          <div className="w-3 h-3 rounded-full bg-[#E7E7E7]" />
          <div className="w-3 h-3 rounded-full bg-[#E7E7E7]" />
          <span className="ml-2 text-xs text-[#ABABAB] font-medium tracking-wide">Session Analysis</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Score row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5B5B5B] font-medium uppercase tracking-widest mb-1">Overall Score</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-[#111111] leading-none">84</span>
                <span className="text-sm text-[#5B5B5B] mb-0.5">/ 100</span>
                <span className="text-xs text-emerald-600 font-semibold mb-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-md">+6</span>
              </div>
            </div>
            {/* Circular progress */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="26" stroke="#F0F0F0" strokeWidth="6" fill="none" />
                <circle
                  cx="32" cy="32" r="26"
                  stroke="#111111" strokeWidth="6" fill="none"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - 0.84)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#111111]">84%</span>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Clarity', value: '91', color: '#111111' },
              { label: 'Pacing', value: '78', color: '#111111' },
              { label: 'Confidence', value: '83', color: '#111111' },
            ].map((m) => (
              <div key={m.label} className="bg-[#FAFAF8] rounded-xl p-3 border border-[#F0F0F0]">
                <p className="text-[10px] text-[#5B5B5B] font-medium uppercase tracking-wider mb-1.5">{m.label}</p>
                <p className="text-xl font-bold text-[#111111] leading-none">{m.value}</p>
                <div className="mt-2 h-1 rounded-full bg-[#E7E7E7]">
                  <div
                    className="h-1 rounded-full bg-[#111111]"
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Waveform */}
          <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#F0F0F0]">
            <p className="text-[10px] text-[#5B5B5B] font-medium uppercase tracking-wider mb-3">YOUR AUDIO</p>
            <div className="flex items-center gap-[3px] h-10">
              {bars.map((h, i) => (
                <WaveformBar key={i} delay={delays[i]} height={h} />
              ))}
            </div>
          </div>

          {/* AI Feedback cards */}
          <div className="space-y-2">
            <p className="text-[10px] text-[#5B5B5B] font-medium uppercase tracking-wider">AI Feedback</p>
            {[
              { type: 'strength', text: 'Strong opening hook — engaged audience immediately.' },
              { type: 'improve', text: 'Slow down during transitions for better clarity.' },
            ].map((fb, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-2.5 items-start p-3 rounded-xl border text-xs ${
                  fb.type === 'strength'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}
              >
                <span className="mt-0.5 shrink-0 text-[10px]">{fb.type === 'strength' ? '✓' : '→'}</span>
                <span>{fb.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating progress card */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2 }}
        className="absolute -bottom-5 -left-6 bg-white border border-[#E7E7E7] rounded-xl p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] w-44"
      >
        <p className="text-[10px] text-[#5B5B5B] font-medium mb-2">Weekly Progress</p>
        <div className="flex items-end gap-1 h-10">
          {[30, 45, 35, 60, 50, 75, 84].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-[#111111] opacity-90 transition-all duration-300"
              style={{ height: `${(h / 84) * 100}%` }}
            />
          ))}
        </div>
        <p className="text-[10px] text-emerald-600 font-semibold mt-2">+28% this week</p>
      </motion.div>

      {/* Floating sessions badge */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2 }}
        className="absolute -top-4 -right-4 bg-[#111111] text-white rounded-xl p-3 shadow-lg"
      >
        <p className="text-[10px] font-medium opacity-70">Sessions</p>
        <p className="text-xl font-bold leading-none mt-0.5">47</p>
      </motion.div>
    </motion.div>
  );
};

/* ---------- Hero ---------- */

const Hero = () => {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    const el = document.querySelector('#features');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      className="relative min-h-screen pt-32 pb-20 px-6 flex items-center"
      aria-labelledby="hero-heading"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(#E7E7E7 1px, transparent 1px), linear-gradient(90deg, #E7E7E7 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-8">
            {/* Eyebrow badge with STATIC dot */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[#5B5B5B] border border-[#E7E7E7] bg-white rounded-full px-3.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                AI-Powered Speech Coaching
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1
                id="hero-heading"
                className="text-5xl md:text-6xl lg:text-[64px] font-bold text-[#111111] leading-[1.07] tracking-tight"
              >
                Master the way
                <br />
                <span className="text-[#5B5B5B]">you speak.</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-[#5B5B5B] leading-relaxed max-w-md"
            >
              Practice speeches, receive instant AI-powered analysis, and build lasting communication skills — one session at a time.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#000000' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 bg-[#111827] text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors duration-150"
                aria-label="Start practicing — go to login"
              >
                Start Practicing
                <ArrowRight size={15} aria-hidden="true" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleLearnMore}
                className="flex items-center gap-2 border border-[#E7E7E7] bg-white text-[#111111] font-medium px-6 py-3 rounded-xl text-sm hover:border-[#CCCCCC] transition-colors duration-150"
                aria-label="Learn more — scroll to features"
              >
                Learn More
                <ChevronDown size={14} aria-hidden="true" />
              </motion.button>
            </motion.div>

            {/* Quick AI Response Feature Highlight (No fake metrics) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E7E7E7] bg-white text-xs font-medium text-[#111111]">
                <Zap size={14} className="text-amber-500 fill-amber-500" />
                <span>Quick AI Response</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E7E7E7] bg-white text-xs font-medium text-[#111111]">
                <Sparkles size={14} className="text-slate-700" />
                <span>Instant Speech Analytics</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Dashboard Preview */}
          <div className="hidden lg:flex justify-center items-center pl-8 py-8">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
