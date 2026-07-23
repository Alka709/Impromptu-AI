import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Mic,
  ChevronDown,
  FileText,
  Leaf,
  Briefcase,
  Landmark,
  GraduationCap,
  Newspaper,
  Sparkles,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Constants & Icon Mapper
───────────────────────────────────────── */
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'score_high', label: 'Highest Score' },
  { value: 'score_low', label: 'Lowest Score' },
];

const DIFFICULTY_OPTIONS = ['All Difficulties', 'easy', 'medium', 'hard'];

function getCategoryIcon(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('tech')) return FileText;
  if (cat.includes('environ')) return Leaf;
  if (cat.includes('busin')) return Briefcase;
  if (cat.includes('politi')) return Landmark;
  if (cat.includes('educat')) return GraduationCap;
  if (cat.includes('affair') || cat.includes('news') || cat.includes('current')) return Newspaper;
  if (cat.includes('person') || cat.includes('experien')) return Sparkles;
  return Mic;
}

/* ─────────────────────────────────────────
   Helper functions
───────────────────────────────────────── */
function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function scoreColor(score) {
  const n = Number(score);
  if (n >= 8) return '#16A34A';
  if (n >= 5) return '#D97706';
  return '#DC2626';
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

/** Difficulty pill */
function DifficultyBadge({ difficulty }) {
  const styles = {
    easy:   'bg-emerald-50 text-emerald-700 border-emerald-100',
    medium: 'bg-amber-50   text-amber-700   border-amber-100',
    hard:   'bg-red-50     text-red-700     border-red-100',
  };
  const cls = styles[difficulty?.toLowerCase()] || 'bg-[#F5F5F4] text-[#666666] border-[#ECECEC]';
  return (
    <span className={`inline-flex items-center border text-[11px] font-semibold px-2.5 py-0.5 rounded-sm capitalize ${cls}`}>
      {difficulty || '—'}
    </span>
  );
}

/** Category pill */
function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold text-[#16A34A] bg-[#EAF5ED] px-2.5 py-0.5 rounded-sm">
      {category}
    </span>
  );
}

/** Category filter pill button */
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-[#111111] text-white border-[#111111]'
          : 'bg-white text-[#444444] border-[#ECECEC] hover:border-[#AAAAAA] hover:text-[#111111]'
      }`}
    >
      {label}
    </button>
  );
}

/** Single session card */
function SessionCard({ session, index, isLatest }) {
  const navigate = useNavigate();
  const score = session.overall_score != null ? Number(session.overall_score) : null;
  const displayScore = score != null ? score.toFixed(1) : '—';
  const color = score != null ? scoreColor(score) : '#888888';
  const duration = formatDuration(session.duration_seconds);
  const CategoryIcon = getCategoryIcon(session.category);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/session/${session.session_id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/session/${session.session_id}`)}
      aria-label={`View report for ${session.topic}`}
      className="group relative bg-white border border-[#ECECEC] rounded-2xl px-6 py-5 cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.04)]
        hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200"
    >
      {/* Latest session badge */}
      {isLatest && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
          <span className="text-[11px] font-semibold text-[#16A34A] uppercase tracking-widest">Latest Session</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-6">
        {/* LEFT */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Category Icon */}
          <div className="w-11 h-11 rounded-md bg-[#EAF5ED] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
            <CategoryIcon size={20} strokeWidth={1.8} />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Category */}
            <div className="mb-1.5">
              <CategoryBadge category={session.category || 'General'} />
            </div>

            {/* Topic */}
            <h3 className="text-[15px] font-bold text-[#111111] leading-snug group-hover:text-[#16A34A] transition-colors duration-150 mb-2 line-clamp-2">
              {session.topic || 'Untitled Session'}
            </h3>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5 text-xs text-[#888888] font-medium">
                <Calendar size={12} strokeWidth={1.8} />
                {formatDate(session.created_at)}
              </span>
              {duration && (
                <span className="flex items-center gap-1.5 text-xs text-[#888888] font-medium">
                  <Clock size={12} strokeWidth={1.8} />
                  {duration}
                </span>
              )}
              <DifficultyBadge difficulty={session.difficulty} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Score */}
          <div className="text-right">
            <span className="block text-[10px] font-semibold text-[#888888] uppercase tracking-widest mb-0.5">Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight" style={{ color }}>
                {displayScore}
              </span>
              {score != null && (
                <span className="text-sm font-semibold text-[#AAAAAA]">/10</span>
              )}
            </div>
          </div>

          {/* View Report button */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/session/${session.session_id}`); }}
            className="flex items-center gap-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-md transition-colors duration-150 whitespace-nowrap"
          >
            View Report
            <ArrowRight
              size={13}
              strokeWidth={2.5}
              className="group-hover:translate-x-0.5 transition-transform duration-150"
            />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/** Empty state */
function EmptyState({ hasFilters, onClear, startNewSession }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white border border-[#ECECEC] rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#EAF5ED] flex items-center justify-center mb-5">
        <Mic size={28} className="text-[#16A34A]" strokeWidth={1.8} />
      </div>
      <h3 className="text-lg font-bold text-[#111111] mb-2">
        {hasFilters ? 'No sessions match your filters' : 'No sessions yet'}
      </h3>
      <p className="text-sm text-[#888888] mb-6 max-w-xs leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search or filter criteria.'
          : 'Your completed sessions will appear here. Start practicing to build your history.'}
      </p>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="text-sm font-semibold text-[#16A34A] hover:underline transition-colors"
        >
          Clear all filters
        </button>
      ) : (
        <button
          onClick={startNewSession}
          className="inline-flex items-center gap-2 bg-[#111111] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-black transition-colors"
        >
          Start your first session
          <ArrowRight size={14} />
        </button>
      )}
    </motion.div>
  );
}

/** Loading skeleton */
function SessionCardSkeleton({ index }) {
  return (
    <div
      className="bg-white border border-[#ECECEC] rounded-2xl px-6 py-5 animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-md bg-[#F0F0F0] shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-20 bg-[#F0F0F0] rounded-sm" />
          <div className="h-4 w-3/4 bg-[#F0F0F0] rounded-sm" />
          <div className="h-3 w-1/2 bg-[#F0F0F0] rounded-sm" />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="space-y-1 text-right">
            <div className="h-2 w-10 bg-[#F0F0F0] rounded-sm ml-auto" />
            <div className="h-8 w-16 bg-[#F0F0F0] rounded-sm" />
          </div>
          <div className="h-9 w-28 bg-[#F0F0F0] rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function SessionHistoryScreen() {
  const { user, startNewSession } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Filter state */
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulties');
  const [sortBy, setSortBy] = useState('newest');

  /* Fetch */
  useEffect(() => {
    if (!user?.id) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user.id}/history`, {
          credentials: 'include',
        });
        if (res.ok) setHistory(await res.json());
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user?.id]);

  /* Derived filter options */
  const categories = useMemo(
    () => ['All', ...new Set(history.map((s) => s.category).filter(Boolean))],
    [history]
  );

  /* Filtered + sorted sessions */
  const filteredSessions = useMemo(() => {
    let result = history.filter((s) => {
      const matchSearch = (s.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchDiff =
        selectedDifficulty === 'All Difficulties' ||
        (s.difficulty || '').toLowerCase() === selectedDifficulty.toLowerCase();
      return matchSearch && matchCat && matchDiff;
    });

    switch (sortBy) {
      case 'oldest':       result = [...result].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'score_high':   result = [...result].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)); break;
      case 'score_low':    result = [...result].sort((a, b) => (a.overall_score ?? 0) - (b.overall_score ?? 0)); break;
      default:             result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
    }
    return result;
  }, [history, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const hasFilters = searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All Difficulties';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedDifficulty('All Difficulties');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-6 md:px-12 lg:px-16 py-10 max-w-[1600px] mx-auto w-full">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h1 className="text-[32px] font-extrabold text-[#111111] tracking-tight">Session History</h1>
        <p className="text-[15px] text-[#666666] mt-1.5">Review every speaking session you've completed.</p>
      </motion.div>

      {/* ── Filters Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 mb-8"
      >
        {/* Row 1: Search + Difficulty + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={15} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA]" />
            <input
              type="text"
              placeholder="Search sessions by topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-[#111111] placeholder-[#AAAAAA] bg-white border border-[#ECECEC] rounded-md focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          {/* Difficulty */}
          <div className="relative">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 text-sm font-medium text-[#444444] bg-white border border-[#ECECEC] rounded-md focus:outline-none focus:border-[#111111] transition-colors cursor-pointer"
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d === 'All Difficulties' ? d : d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          </div>

          {/* Sort */}
          <div className="relative ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 text-sm font-medium text-[#444444] bg-[#FAFAF8] border border-[#ECECEC] rounded-md focus:outline-none focus:border-[#111111] transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          </div>
        </div>

        {/* Row 2: Category pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              label={cat === 'All' ? 'All Categories' : cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-1 text-xs font-semibold text-[#888888] hover:text-[#111111] transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Results count ── */}
      {!loading && history.length > 0 && (
        <p className="text-xs text-[#888888] font-medium mb-4">
          {filteredSessions.length === history.length
            ? `${history.length} session${history.length !== 1 ? 's' : ''}`
            : `${filteredSessions.length} of ${history.length} sessions`}
        </p>
      )}

      {/* ── Session List ── */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <SessionCardSkeleton key={i} index={i} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState hasFilters={false} onClear={clearFilters} startNewSession={startNewSession} />
      ) : filteredSessions.length === 0 ? (
        <EmptyState hasFilters={true} onClear={clearFilters} startNewSession={startNewSession} />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredSessions.map((session, idx) => (
              <SessionCard
                key={session.session_id || idx}
                session={session}
                index={idx}
                isLatest={idx === 0 && selectedCategory === 'All' && !searchTerm && sortBy === 'newest'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
