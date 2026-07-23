import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

const COLLAPSE_LINES = 12;
const LINE_HEIGHT_PX = 29; // approx 16px font * 1.8 leading

export default function TranscriptSection({ transcript }) {
  const [expanded, setExpanded] = useState(false);

  const hasContent = transcript && transcript.trim().length > 0;
  const text = hasContent ? transcript : 'No transcript is available for this session.';

  // Roughly estimate if it overflows 12 lines (~ 800 chars)
  const isLong = text.length > 800;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-[#F0F0F0]">
        <h2 className="text-[15px] font-bold text-[#111111] tracking-tight flex items-center gap-2">
          <FileText size={16} className="text-[#888888]" strokeWidth={1.8} />
          Transcript
        </h2>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:underline transition-colors"
          >
            {expanded ? (
              <>Show Less <ChevronUp size={14} /></>
            ) : (
              <>View Full Transcript <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div
        className="relative px-8 py-7 overflow-hidden transition-all duration-500"
        style={{
          maxHeight: expanded || !isLong
            ? '9999px'
            : `${COLLAPSE_LINES * LINE_HEIGHT_PX}px`,
        }}
      >
        <p
          className="text-[16px] text-[#333333] max-w-4xl"
          style={{ lineHeight: '1.85' }}
        >
          {text}
        </p>

        {/* Fade-out gradient when collapsed */}
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {/* Bottom expand button */}
      {isLong && !expanded && (
        <div className="px-8 pb-6 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="text-sm font-semibold text-[#16A34A] hover:underline"
          >
            View Full Transcript ↓
          </button>
        </div>
      )}
    </motion.div>
  );
}
