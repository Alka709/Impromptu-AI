import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

/* ---------- Symmetric Waveform bar ---------- */
function WaveformBar({ delay, height }) {
  return (
    <motion.div
      className="w-[3px] bg-[#16A34A]/60"
      animate={{
        height: [height * 0.35, height, height * 0.55, height * 0.85, height * 0.35],
        opacity: [0.4, 0.9, 0.5, 0.8, 0.4],
      }}
      transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ minHeight: 6 }}
    />
  );
}

/**
 * DashboardHero component with circular mic button and minimal outer card curves
 */
export default function DashboardHero({ startNewSession }) {
  const leftBars = [
    12, 18, 24, 16, 32, 28, 42, 22, 36, 48, 30, 52, 26, 40, 34, 46, 28, 38, 22
  ];
  const rightBars = [...leftBars].reverse();

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Start a new session"
      onClick={startNewSession}
      className="relative rounded-md overflow-hidden w-full cursor-pointer group shadow-md"
      style={{
        height: 340,
        background: 'radial-gradient(ellipse at center, #0B3C2B 0%, #05261B 45%, #021710 100%)',
      }}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Main container vertically centered */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-6 text-center">
        {/* Top visual: Mic Button + Symmetric Waveforms */}
        <div className="relative flex items-center justify-center w-full max-w-2xl mb-6">
          {/* Left Waveform */}
          <div className="flex items-center gap-[4px] h-16 justify-end flex-1 pr-6 hidden sm:flex">
            {leftBars.map((h, i) => (
              <WaveformBar key={`left-${i}`} delay={i * 0.08} height={h} />
            ))}
          </div>

          {/* Center Mic Circle + Glowing Rings */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Outer rings */}
            <div className="absolute w-36 h-36 rounded-full border border-[#16A34A]/20 bg-[#16A34A]/5 animate-pulse" />
            <div className="absolute w-28 h-28 rounded-full border border-[#16A34A]/30 bg-[#16A34A]/10" />

            {/* Mic Circle */}
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-transform duration-200"
            >
              <Mic size={34} className="text-[#16A34A] stroke-[2.5]" />
            </motion.div>
          </div>

          {/* Right Waveform */}
          <div className="flex items-center gap-[4px] h-16 justify-start flex-1 pl-6 hidden sm:flex">
            {rightBars.map((h, i) => (
              <WaveformBar key={`right-${i}`} delay={i * 0.08 + 0.2} height={h} />
            ))}
          </div>
        </div>

        {/* Text Section */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 group-hover:text-[#EAF5ED] transition-colors">
            Start a New Session
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-normal">
            Practice, speak, and get AI-powered feedback to improve your delivery, clarity, and confidence.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
