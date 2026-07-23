import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../dashboard/Sidebar';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

const VALID_CATEGORIES = [
  'Technology',
  'Education',
  'Current Affairs',
  'Personal Experience',
  'Business & Entrepreneurship',
];

export default function MainLayout({ user, logout }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Technology');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isStarting, setIsStarting] = useState(false);

  const startNewSession = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: selectedCategory,
          difficulty: selectedDifficulty,
        }),
      });
      const sessionData = await res.json();
      if (sessionData.id) {
        closeModal();
        navigate(`/session/${sessionData.id}`, { state: { session: sessionData } });
      } else {
        alert(sessionData.error || 'Failed to create session');
      }
    } catch {
      alert('Failed to connect to server');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      {/* Mobile top bar (only visible on small screens) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#ECECEC] flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-[#666666] hover:bg-[#F5F5F4] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <span className="text-[14px] font-semibold text-[#111111] tracking-tight">ImpromptuAI</span>
        {/* Spacer to balance */}
        <div className="w-9" />
      </header>

      {/* Sidebar */}
      <Sidebar
        user={user}
        logout={logout}
        startNewSession={startNewSession}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main
        className="md:pl-60 min-h-screen bg-[#FAFAF8] pt-14 md:pt-0"
      >
        <Outlet context={{ user, logout, startNewSession }} />
      </main>

      {/* New Session Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl p-7 w-full max-w-md border border-[#ECECEC] shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2
              id="modal-title"
              className="text-lg font-bold text-[#111111] tracking-tight mb-6"
            >
              Configure Session
            </h2>

            {/* Category */}
            <div className="mb-5">
              <label
                htmlFor="session-category"
                className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2"
              >
                Category
              </label>
              <select
                id="session-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-[#E8E8E8] rounded-xl px-3 py-2.5 text-sm text-[#111111] bg-white focus:outline-none focus:border-[#111111] transition-colors"
              >
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="mb-7">
              <label
                htmlFor="session-difficulty"
                className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2"
              >
                Difficulty
              </label>
              <select
                id="session-difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-[#E8E8E8] rounded-xl px-3 py-2.5 text-sm text-[#111111] bg-white focus:outline-none focus:border-[#111111] transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 px-4 bg-[#F5F5F4] hover:bg-[#EBEBEA] text-[#111111] font-semibold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartSession}
                disabled={isStarting}
                className="flex-1 py-2.5 px-4 bg-[#111111] hover:bg-black text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {isStarting ? 'Starting…' : 'Start Session'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
