import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lightbulb } from 'lucide-react';

function RecommendationRow({ text, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
      className="flex items-center gap-4 px-6 py-4 border-b border-[#F8F8F8] last:border-b-0 hover:bg-[#FAFAF8] transition-colors cursor-default group"
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-md bg-[#EAF5ED] text-[#16A34A] flex items-center justify-center shrink-0">
        <Lightbulb size={15} strokeWidth={1.8} />
      </div>
      {/* Text */}
      <p className="flex-1 text-sm text-[#333333] leading-relaxed">{text}</p>
      {/* Chevron */}
      <ChevronRight
        size={16}
        className="text-[#CCCCCC] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all duration-200"
        strokeWidth={2}
      />
    </motion.div>
  );
}

export default function Recommendations({ tips }) {
  const list = Array.isArray(tips) && tips.length > 0
    ? tips
    : ['Keep practicing to build speaking confidence and delivery.'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-2xl shadow-sm overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-[#F0F0F0]">
        <h2 className="text-[15px] font-bold text-[#111111] tracking-tight">Recommendations</h2>
      </div>

      {/* List */}
      <div className="flex-1">
        {list.map((tip, i) => (
          <RecommendationRow key={i} text={tip} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
