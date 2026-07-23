import React from 'react';
import { motion } from 'framer-motion';
import { BicepsFlexed, Target } from 'lucide-react';

function EvalList({ heading, headingColor, icon: Icon, iconColor, items, emptyMsg }) {
  const list = Array.isArray(items) && items.length > 0 ? items : [emptyMsg];
  return (
    <div>
      <h3 className={`text-sm font-bold ${headingColor} mb-4 flex items-center gap-2`}>
        <Icon size={18} strokeWidth={2} />
        {heading}
      </h3>
      <ul className="space-y-2.5">
        {list.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="flex items-start gap-2.5 text-sm text-[#444444] leading-relaxed"
          >
            <Icon size={15} className={`${iconColor} shrink-0 mt-0.5`} strokeWidth={2} />
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function AIEvaluation({ strengths, weaknesses }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-2xl shadow-sm overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-7 py-5 border-b border-[#F0F0F0]">
        <h2 className="text-[15px] font-bold text-[#111111] tracking-tight">AI Evaluation</h2>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F0F0F0] flex-1">
        {/* Strengths */}
        <div className="px-7 py-6">
          <EvalList
            heading="Strengths"
            headingColor="text-[#16A34A]"
            icon={BicepsFlexed}
            iconColor="text-[#16A34A]"
            items={strengths}
            emptyMsg="Great overall effort!"
          />
        </div>

        {/* Weaknesses */}
        <div className="px-7 py-6">
          <EvalList
            heading="Areas for Focus"
            headingColor="text-amber-600"
            icon={Target}
            iconColor="text-amber-500"
            items={weaknesses}
            emptyMsg="No major weaknesses identified."
          />
        </div>
      </div>
    </motion.div>
  );
}
