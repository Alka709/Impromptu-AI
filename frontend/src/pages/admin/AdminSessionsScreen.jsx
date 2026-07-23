import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function AdminSessionsScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterUser, setFilterUser] = useState(searchParams.get('user') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/sessions`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Filter Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchUser = filterUser ? (s.email || '').toLowerCase().includes(filterUser.toLowerCase()) || (s.userName || '').toLowerCase().includes(filterUser.toLowerCase()) : true;
      const matchCategory = filterCategory ? s.category === filterCategory : true;
      const matchDifficulty = filterDifficulty ? s.difficulty === filterDifficulty : true;
      return matchUser && matchCategory && matchDifficulty;
    });
  }, [sessions, filterUser, filterCategory, filterDifficulty]);

  // Extract unique categories and difficulties for dropdowns
  const uniqueCategories = [...new Set(sessions.map(s => s.category).filter(Boolean))];
  const uniqueDifficulties = [...new Set(sessions.map(s => s.difficulty).filter(Boolean))];

  if (loading) return <div className="flex h-64 items-center justify-center">Loading sessions...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Session Monitoring</h1>
        <p className="text-gray-500 mt-2">Global view of all AI processing jobs.</p>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search User</label>
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black transition-colors bg-white"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
          <select 
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black transition-colors bg-white"
          >
            <option value="">All Difficulties</option>
            {uniqueDifficulties.map(diff => <option key={diff} value={diff} className="capitalize">{diff}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">ID</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">User</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSessions.map((s) => {
                let statusColor = "bg-gray-100 text-gray-600";
                if (s.status === 'completed') statusColor = "bg-green-100 text-green-700";
                if (s.status === 'failed') statusColor = "bg-red-100 text-red-700";
                if (s.status === 'processing') statusColor = "bg-blue-100 text-blue-700 animate-pulse";
                if (s.status === 'pending') statusColor = "bg-yellow-100 text-yellow-800";

                return (
                  <tr 
                    key={s.sessionId} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/sessions/${s.sessionId}`)}
                  >
                    <td className="p-4 text-sm font-mono text-gray-400">{(s.sessionId || '').slice(0,8)}...</td>
                    <td className="p-4 text-sm font-semibold">
                      <div className="leading-none">{s.userName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 font-normal mt-1">{s.email || ''}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${statusColor}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">{s.category}</td>
                    <td className="p-4 text-sm text-gray-500 capitalize">{s.difficulty}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleTimeString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-semibold">No sessions match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
