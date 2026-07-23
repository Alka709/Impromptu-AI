import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function AdminUserDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch user details');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center">Loading user profile...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">{error}</div>;
  if (!data) return null;

  const { profile, statistics, recentSessions } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Profile</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{profile.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-3xl text-white overflow-hidden mb-4">
            {profile.photo ? <img src={profile.photo} alt="Profile" className="h-full w-full object-cover" /> : profile.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <p className="text-gray-500 mb-4">{profile.email}</p>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 text-xs uppercase font-bold rounded-full tracking-wider ${profile.role === 'admin' ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {profile.role}
            </span>
            <span className={`px-3 py-1 text-xs uppercase font-bold rounded-full tracking-wider ${profile.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {profile.verified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-6">Joined: {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Statistics */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <MetricCard title="Total Sessions" value={statistics.totalSessions} />
          <MetricCard title="Average Score" value={statistics.averageScore ? Number(statistics.averageScore).toFixed(1) : '-'} color="border-zinc-300" />
          <MetricCard title="Best Score" value={statistics.bestScore ? Number(statistics.bestScore).toFixed(1) : '-'} color="border-green-200 bg-green-50" />
          <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Last Active</h3>
            <p className="text-xl font-bold text-gray-700">{statistics.lastActive ? new Date(statistics.lastActive).toLocaleDateString() : 'Never'}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Sessions</h2>
          <button 
            onClick={() => navigate(`/admin/sessions?user=${encodeURIComponent(profile.email)}`)} 
            className="text-sm font-bold text-gray-500 hover:text-black transition-colors underline"
          >
            View All in Sessions Tab
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Session ID</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSessions && recentSessions.map((s) => {
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
                      <td className="p-4 text-sm font-medium">{s.topic}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${statusColor}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold">{s.score !== null ? Number(s.score).toFixed(1) : '-'}</td>
                      <td className="p-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {(!recentSessions || recentSessions.length === 0) && (
              <div className="p-8 text-center text-gray-500 font-semibold">No recent sessions found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color = "border-gray-200" }) {
  return (
    <div className={`p-6 rounded-3xl border ${color} bg-white shadow-sm flex flex-col justify-between`}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
}
