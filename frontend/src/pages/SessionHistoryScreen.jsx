import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';

export default function SessionHistoryScreen() {
  const navigate = useNavigate();
  const { user, startNewSession } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user?.id}/history`, { credentials: 'include' });
        if (res.ok) {
          setHistory(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchHistory();
  }, [user?.id]);

  const uniqueCategories = ['All', ...new Set(history.map(s => s.category).filter(Boolean))];

  const filteredHistory = history.filter(session => {
    const matchesSearch = (session.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || session.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getScoreIndicator = (score) => {
    if (score >= 8) return 'bg-emerald-500 shadow-emerald-200';
    if (score >= 5) return 'bg-amber-400 shadow-amber-200';
    return 'bg-rose-500 shadow-rose-200';
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      {/*  Page Header  */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Session History</h1>
        <p className="text-zinc-500 mt-2 font-medium">Review and analyze every practice session you've ever completed.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-zinc-500 font-medium">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-100 min-h-[400px] flex flex-col items-center justify-center p-12 text-center shadow-sm" data-purpose="empty-state-card">
          <div className="mb-6 bg-zinc-50 w-24 h-24 rounded-full flex items-center justify-center">
            <svg fill="none" height="40" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="40" className="text-zinc-300">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">No sessions yet</h2>
          <p className="text-zinc-500 max-w-sm mt-3 mb-8 leading-relaxed">
            Your historical data will appear here once you complete your first speech.
          </p>
          <button onClick={startNewSession} className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-zinc-800 transition-transform active:scale-95 shadow-lg flex items-center gap-2">
            Start your first session
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/*  Filters Bar  */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by topic..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-zinc-50 border-transparent rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">Category:</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-50 border-transparent rounded-xl text-zinc-900 py-3 pl-4 pr-10 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold appearance-none cursor-pointer"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/*  Data Table  */}
          <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
            {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">Session Details</th>
                      <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-widest hidden lg:table-cell">Difficulty</th>
                      <th className="p-6 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredHistory.map((session, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => navigate(`/session/${session.session_id}`)}
                        className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="p-6">
                          <p className="text-base font-bold text-zinc-900 group-hover:text-indigo-700 transition-colors">{session.topic}</p>
                          <p className="text-sm font-medium text-zinc-500 mt-1">
                            {new Date(session.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-md">{session.category}</span>
                          </div>
                        </td>
                        <td className="p-6 hidden lg:table-cell">
                          <span className="px-3 py-1 bg-zinc-50 border border-zinc-200 text-zinc-500 text-xs font-bold uppercase tracking-wider rounded-md">{session.difficulty}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-lg font-extrabold text-zinc-900">{Number(session.overall_score).toFixed(1)}</span>
                            <div className={`w-3 h-3 rounded-full shadow-lg ${getScoreIndicator(session.overall_score)}`}></div>
                            <svg className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 -mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center">
                <p className="text-zinc-500 font-medium text-lg">No sessions match your filters.</p>
                <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} className="mt-4 text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
