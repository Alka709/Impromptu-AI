import React from 'react';
import { motion } from 'framer-motion';

export default function PerformanceSummary({ summary }) {
  const text = summary || 'No performance summary available for this session.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-2xl px-8 py-7 shadow-sm h-full flex flex-col"
    >
      <h2 className="text-[15px] font-bold text-[#111111] tracking-tight mb-4">
        Performance Summary
      </h2>
      <p className="text-[15px] text-[#444444] leading-[1.85] flex-1">
        {text}
      </p>
    </motion.div>
  );
}
