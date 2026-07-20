import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function MainLayout({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Technology');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isStarting, setIsStarting] = useState(false);

  const validCategories = [
    'Technology',
    'Education',
    'Current Affairs',
    'Personal Experience',
    'Business & Entrepreneurship',
  ];

  const startNewSession = () => setIsModalOpen(true);
  const closeStartSessionModal = () => setIsModalOpen(false);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category: selectedCategory, difficulty: selectedDifficulty })
      });
      const sessionData = await res.json();
      if (sessionData.id) {
        closeStartSessionModal();
        navigate(`/session/${sessionData.id}`, { state: { session: sessionData } });
      } else {
        alert(sessionData.error || 'Failed to create session');
      }
    } catch (e) {
      alert('Failed to connect to server');
    } finally {
      setIsStarting(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Session History', path: '/history', icon: 'history' },
    { name: 'Progress', path: '/progress', icon: 'progress' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center">
          <button 
            className="md:hidden mr-4 p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <span className="text-2xl font-extrabold tracking-tight">Impromptu</span>
        </div>
        <div className="flex items-center space-x-4">
          <button aria-label="Profile" className="p-1 border border-gray-200 rounded-full hover:border-gray-400 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {user?.photo ? (
                <img src={user.photo} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="font-bold text-gray-700 text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen overflow-hidden">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`w-64 border-r border-gray-100 flex flex-col fixed inset-y-0 left-0 pt-16 h-full bg-white z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 overflow-hidden shrink-0">
              {user?.photo ? (
                <img src={user.photo} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">{user?.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
            </div>
          </div>
          
          <div className="px-4 mb-6">
            <button onClick={startNewSession} className="w-full bg-black text-white py-3 px-4 rounded-full flex items-center justify-center space-x-2 font-semibold hover:bg-zinc-800 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>New Session</span>
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-full font-semibold transition-all ${
                  location.pathname === link.path 
                    ? 'bg-zinc-100 text-black' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                to={link.path}
              >
                {link.icon === 'dashboard' && (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                )}
                {link.icon === 'history' && (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                )}
                {link.icon === 'progress' && (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                )}
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>

          <nav className="p-2 space-y-1 border-t border-gray-100">
            <Link className={`flex items-center space-x-3 px-4 py-3 rounded-full transition-all ${
              location.pathname === '/settings' ? 'bg-zinc-100 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`} to="/settings">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Settings</span>
            </Link>
            <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-full transition-all">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 md:ml-64 w-full bg-surface min-h-screen">
          <Outlet context={{ user, logout, startNewSession }} />
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Configure Session</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black transition-colors"
              >
                {validCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={closeStartSessionModal} 
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartSession} 
                disabled={isStarting}
                className="flex-1 py-3 px-4 bg-black hover:bg-zinc-800 text-white font-bold rounded-full transition-colors disabled:opacity-50"
              >
                {isStarting ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
