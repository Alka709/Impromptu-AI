import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function DashboardScreen() {
  const { user, startNewSession } = useOutletContext();
  const [dashboardData, setDashboardData] = useState({
    recentSessions: [],
    averageScore: null,
    totalSessions: 0,
    bestScore: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user?.id}/dashboard`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchDashboard();
  }, [user?.id]);

  // Reverse recent sessions so the chart flows chronologically (oldest to newest)
  const chartData = [...(dashboardData.recentSessions || [])].reverse().map((s, i) => ({
    name: `S${i+1}`,
    score: s.overall_score
  }));

  return (
    <div className="p-4 md:p-8 pb-24">
      {/*  Welcome Header  */}
      <section className="mb-10">
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-zinc-500 font-medium">Your speaking journey continues. Ready to practice today?</p>
      </section>

      {loading ? (
        <div className="flex justify-center p-12 text-zinc-500 font-medium">Loading your dashboard...</div>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10" data-purpose="metrics-row">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm transition-transform hover:-translate-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Total Sessions</p>
              <p className="text-3xl font-extrabold text-zinc-900">{dashboardData.totalSessions || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm transition-transform hover:-translate-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Average Score</p>
              <p className="text-3xl font-extrabold text-zinc-900">{dashboardData.averageScore ? Number(dashboardData.averageScore).toFixed(1) : '—'}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm transition-transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-brandGold">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Current Streak</p>
              <p className="text-3xl font-extrabold text-brandGold relative z-10">{dashboardData.currentStreak || 0} Days</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm transition-transform hover:-translate-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Best Score</p>
              <p className="text-3xl font-extrabold text-zinc-900">{dashboardData.bestScore ? Number(dashboardData.bestScore).toFixed(1) : '—'}</p>
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-900 via-blue-900 to-zinc-900 p-6 md:p-10 rounded-3xl shadow-xl mb-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="max-w-2xl relative z-10 mb-6 md:mb-0">
              <h2 className="text-3xl font-bold text-white mb-2">Ready to Impress?</h2>
              <p className="text-indigo-200 leading-relaxed text-lg">Start a new practice session and get real-time, AI-driven feedback on your tone, pacing, and clarity.</p>
            </div>
            <button onClick={startNewSession} className="relative z-10 bg-white text-indigo-900 px-10 py-4 rounded-full font-extrabold text-lg hover:bg-indigo-50 hover:scale-105 transition-all active:scale-95 shadow-lg flex items-center gap-2">
              Start Practice
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2">
              <div className="flex justify-between items-end mb-6 px-1">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Recent Sessions</h3>
                <Link to="/progress" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All Progress →</Link>
              </div>
              
              {dashboardData.recentSessions && dashboardData.recentSessions.length > 0 ? (
                <div className="grid gap-4">
                  {dashboardData.recentSessions.map(session => (
                    <Link key={session.id} to={`/session/${session.session_id}`} className="bg-white rounded-xl border border-zinc-100 p-6 flex justify-between items-center hover:border-indigo-300 hover:shadow-md transition-all group">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-zinc-900 text-lg group-hover:text-indigo-700 transition-colors">{session.topic}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500">{session.category}</span>
                        </div>
                        <p className="text-sm text-zinc-500">{new Date(session.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • Score: <span className="font-bold text-zinc-700">{session.overall_score}/10</span></p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <span className="text-zinc-400 group-hover:text-indigo-600 font-bold">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-zinc-100 p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <p className="text-zinc-400 font-medium mb-1">No sessions yet.</p>
                  <button onClick={startNewSession} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Start your first session</button>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-6">
              {/* Performance Trend Mini Chart */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Performance</h3>
                {chartData.length > 1 ? (
                  <div className="h-32 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <YAxis domain={[0, 10]} hide={true} />
                        <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs font-medium text-zinc-400 text-center">
                    Complete at least 2 sessions to see your trend.
                  </div>
                )}
              </div>

              {/* Latest Strength Widget */}
              {dashboardData.recentSessions && dashboardData.recentSessions.length > 0 && dashboardData.recentSessions[0].strengths && (
                <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Latest Strength</h3>
                  </div>
                  <p className="text-sm font-medium text-zinc-700 leading-relaxed">
                    {(() => {
                      const strengthsStr = dashboardData.recentSessions[0].strengths;
                      try {
                        const parsed = JSON.parse(strengthsStr);
                        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : strengthsStr;
                      } catch {
                        return strengthsStr;
                      }
                    })()}
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
