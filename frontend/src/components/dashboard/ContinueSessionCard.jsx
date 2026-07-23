import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Calendar, Clock, ChevronRight, ArrowRight } from 'lucide-react';

function formatDate(isoString) {
  if (!isoString) return 'Jul 23, 2026';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds) {
  if (!seconds) return '12 min';
  const m = Math.floor(seconds / 60);
  return `${m || 12} min`;
}

export default function ContinueSessionCard({ session, startNewSession }) {
  const navigate = useNavigate();

  const sessionData = session || {
    session_id: 'default-session',
    topic: 'The ethical implications of using artificial intelligence to curate personal news feeds.',
    category: 'Technology',
    difficulty: 'Medium',
    created_at: new Date().toISOString(),
    duration_seconds: 720,
    overall_score: 8.4,
  };

  const handleCardClick = () => {
    if (sessionData.session_id) {
      navigate(`/session/${sessionData.session_id}`);
    } else {
      startNewSession();
    }
  };

  const formattedDate = formatDate(sessionData.created_at);
  const formattedDuration = formatDuration(sessionData.duration_seconds);
  const scoreVal = sessionData.overall_score != null ? Number(sessionData.overall_score).toFixed(1) : '8.4';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="continue-heading"
      className="bg-white border border-[#ECECEC] rounded-md p-6 shadow-sm w-full"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-5">
        <h2
          id="continue-heading"
          className="text-base font-bold text-[#111111] tracking-tight"
        >
          Continue where you left off
        </h2>
        <button
          onClick={handleCardClick}
          className="text-xs font-semibold text-[#16A34A] hover:underline inline-flex items-center gap-1 transition-colors"
        >
          View Report
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Card Content Row */}
      <div
        onClick={handleCardClick}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer group"
      >
        {/* Left Topic Section */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Green Document Icon Box */}
          <div className="w-12 h-12 rounded-md bg-[#EAF5ED] text-[#16A34A] flex items-center justify-center shrink-0">
            <FileText size={22} strokeWidth={2} />
          </div>

          {/* Topic Title + Pills */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#111111] leading-snug group-hover:text-[#16A34A] transition-colors mb-2 line-clamp-2">
              {sessionData.topic}
            </h3>

            {/* Category & Difficulty Pills */}
            <div className="flex items-center gap-2">
              <span className="bg-[#F3F4F6] text-[#444444] text-[11px] font-semibold px-3 py-0.5 rounded-sm">
                {sessionData.category || 'Technology'}
              </span>
              <span className="bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold px-3 py-0.5 rounded-sm capitalize">
                {sessionData.difficulty || 'Medium'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Metadata & Score Section */}
        <div className="flex items-center gap-6 divide-x divide-[#ECECEC] pt-4 lg:pt-0 border-t lg:border-t-0 border-[#ECECEC] shrink-0">
          {/* Date */}
          <div className="flex items-center gap-2 pl-0 lg:pl-6 text-xs font-medium text-[#666666]">
            <Calendar size={16} className="text-[#888888]" />
            <span>{formattedDate}</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 pl-6 text-xs font-medium text-[#666666]">
            <Clock size={16} className="text-[#888888]" />
            <span>{formattedDuration}</span>
          </div>

          {/* Score + Arrow */}
          <div className="flex items-center pl-6">
            <div>
              <span className="block text-[10px] font-semibold text-[#888888] uppercase tracking-wider leading-none mb-1">
                Score
              </span>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-2xl font-extrabold text-[#111111]">{scoreVal}</span>
                <span className="text-xs font-semibold text-[#888888]">/10</span>
              </div>
            </div>

            {/* Green Indicator Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A] ml-3 shrink-0" />

            {/* Chevron Right Arrow */}
            <ChevronRight size={18} className="text-[#888888] ml-4 group-hover:text-[#111111] transition-colors shrink-0" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
