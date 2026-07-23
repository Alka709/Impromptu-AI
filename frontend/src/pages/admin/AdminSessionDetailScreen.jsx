import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function AdminSessionDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/sessions/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch session details');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionDetails();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center">Loading session report...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">{error}</div>;
  if (!data) return null;

  const { session, user, evaluation, transcript, metrics } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Session Report</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{session.sessionId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Meta & User */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">User Details</h3>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                {user.photo ? <img src={user.photo} alt="Profile" className="h-full w-full object-cover" /> : user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Session Meta</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-500">Status</span> <span className="font-bold uppercase">{session.status}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Category</span> <span className="font-semibold">{session.category}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Difficulty</span> <span className="font-semibold capitalize">{session.difficulty}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Date</span> <span className="font-medium">{new Date(session.createdAt).toLocaleDateString()}</span></li>
              <li className="flex justify-between"><span className="text-gray-500">Time</span> <span className="font-medium">{new Date(session.createdAt).toLocaleTimeString()}</span></li>
            </ul>
          </div>

          {metrics && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Speech Metrics</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-gray-500">WPM</span> <span className="font-bold">{metrics.wpm}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Total Words</span> <span className="font-semibold">{metrics.word_count}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Pauses</span> <span className="font-semibold">{metrics.pause_count} ({metrics.average_pause}s avg)</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Filler Words</span> <span className="font-semibold text-red-600">{metrics.filler_count}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Repetitions</span> <span className="font-semibold text-red-600">{metrics.repetition_count}</span></li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: AI Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          {evaluation ? (
            <>
              <div className="bg-white p-6 rounded-3xl border border-green-200 shadow-sm bg-green-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider">Overall Score</h3>
                  <span className="text-4xl font-black text-green-600">{evaluation.overallScore}/100</span>
                </div>
                <p className="text-green-900 leading-relaxed">{evaluation.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    {evaluation.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Weaknesses</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    {evaluation.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Improvement Tips</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  {evaluation.improvementTips?.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center text-gray-500">
              {session.status === 'completed' ? 'Evaluation data is missing.' : 'Session is not yet completed. No evaluation available.'}
            </div>
          )}

          {transcript && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Raw Transcript</h3>
              <p className="text-gray-700 leading-relaxed font-mono text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">{transcript}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
