import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/dashboard`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch admin stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center">Loading dashboard...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">{error}</div>;
  if (!stats) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Overview</h1>
        <p className="text-gray-500 mt-2">High-level metrics and system health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Total Users" value={stats.overview.totalUsers} color="border-zinc-950" />
        <MetricCard title="Total Sessions" value={stats.overview.totalSessions} color="border-zinc-300" />
        <MetricCard title="Today's Avg Score" value={stats.overview.averageScore ? Number(stats.overview.averageScore).toFixed(1) : '-'} color="border-green-200 bg-green-50" />
        <MetricCard title="Active Users Today" value={stats.overview.activeUsersToday} />
        <MetricCard title="Sessions Today" value={stats.overview.sessionsToday} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">User</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentActivity && stats.recentActivity.map((act) => (
                  <tr key={act.sessionId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-bold">{act.userName}                    </td>
                    <td className="p-4 text-sm font-medium">{act.topic}</td>
                    <td className="p-4 text-sm font-bold">{act.score !== null ? Number(act.score).toFixed(1) : '-'}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(act.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(act.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <div className="p-8 text-center text-gray-500 font-semibold">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color = "border-gray-200" }) {
  return (
    <div className={`p-6 bg-white rounded-3xl border ${color} shadow-sm flex flex-col justify-between h-32 transition-transform hover:-translate-y-1`}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
}
