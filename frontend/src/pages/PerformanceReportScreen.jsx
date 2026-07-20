import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

const getWpmStatus = (wpm) => {
  if (!wpm) return { text: "N/A", color: "text-gray-500 bg-gray-100" };
  if (wpm < 120) return { text: "Slow", color: "text-yellow-700 bg-yellow-100" };
  if (wpm <= 160) return { text: "Normal", color: "text-green-700 bg-green-100" };
  if (wpm <= 190) return { text: "Fast", color: "text-orange-700 bg-orange-100" };
  return { text: "Too Fast", color: "text-red-700 bg-red-100" };
};

const getScoreStatus = (score) => {
  if (score === undefined || score === null) return { text: "N/A", color: "text-gray-500 bg-gray-100" };
  if (score < 5) return { text: "Needs Work", color: "text-red-700 bg-red-100" };
  if (score < 8) return { text: "Average", color: "text-yellow-700 bg-yellow-100" };
  return { text: "Good", color: "text-green-700 bg-green-100" };
};

export default function PerformanceReportScreen({ user, logout, sessionData, evaluationResult }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const wpm = evaluationResult?.metrics?.wpm || 0;
  const pacingScore = Math.max(0, 10 - (Math.abs(150 - wpm) / 15));

  const radarData = [
    { subject: 'Fluency', score: evaluationResult?.metrics?.fluency_score || 0 },
    { subject: 'Confidence', score: evaluationResult?.metrics?.articulation_score || 0 },
    { subject: 'Content', score: evaluationResult?.overallScore || 0 },
    { subject: 'Pacing', score: parseFloat(pacingScore.toFixed(1)) },
    { subject: 'Overall', score: evaluationResult?.overallScore || 0 },
  ];

  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE}/users/${user.id}/history`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sorted = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const chartData = sorted.map((session, index) => ({
              name: `S${index + 1}`,
              score: session.overall_score
            }));
            setHistoryData(chartData);
          }
        })
        .catch(err => console.error("Failed to fetch history", err));
    }
  }, [user]);

  return (
    <>
<div className="flex min-h-screen overflow-hidden">
{isMobileMenuOpen && (
  <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
)}
<aside className={`w-64 border-r border-gray-200 bg-white flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} data-purpose="main-navigation">
<div className="p-6 flex items-center gap-2">
<h1 className="text-xl font-extrabold tracking-tight">Impromptu</h1>
</div>
<div className="px-4 mb-6">
<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-custom mb-4">
<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</div>
<span className="text-sm font-semibold">{user?.name}</span>
</div>
<Link className="w-full py-2.5 bg-black text-white rounded-custom text-sm font-bold flex items-center justify-center gap-2" to="/">
<span>+</span> New Session
</Link>
</div>
<nav className="flex-1 px-4 space-y-1">
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-custom" to="/">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Dashboard
</Link>
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 sidebar-item-active rounded-custom" to="/history">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Session History
</Link>
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-custom" to="/progress">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Progress
</Link>
</nav>
<div className="p-4 border-t border-gray-100 space-y-1">
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom" to="/settings">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Settings
</Link>
<button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Logout
</button>
</div>
</aside>
{/*  Main Content Area  */}
<main className="md:ml-64 flex-1 flex flex-col min-w-0 w-full" data-purpose="main-content">
<header className="h-14 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between md:justify-end gap-4" data-purpose="top-utility-bar">
<div className="flex items-center md:hidden">
  <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-500 hover:text-black">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
  </button>
  <span className="font-bold ml-2">Impromptu</span>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-gray-400 hover:text-gray-600">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
</button>
<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
<span className="font-bold text-gray-700 text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
</div>
</div>
</header>
<div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
<div className="flex justify-between items-start mb-8" data-purpose="session-summary-header">
<div>
<span className="text-sm font-bold tracking-widest text-gray-500 uppercase block mb-2">Session Performance</span>
<div className="flex items-baseline gap-2">
<span className="text-6xl font-extrabold">{evaluationResult?.overallScore || 0}</span>
<span className="text-2xl text-gray-400 font-bold">/10</span>
<span className="ml-4 text-base font-bold text-gray-500 uppercase tracking-wide">Overall Score</span>
</div>
<div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
<span className="flex items-center gap-1">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                Topic: {sessionData?.topic}
              </span>
<span className="flex items-center gap-1">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                {new Date(sessionData?.created_at || Date.now()).toLocaleDateString()}
              </span>
</div>
</div>
<div className="flex gap-3">
<Link to="/" className="px-4 py-2 text-sm font-bold bg-black text-white hover:bg-gray-800 rounded-custom flex items-center gap-2">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              Practice Again
            </Link>
</div>
</div>

<div className="mb-8 bg-white border border-gray-100 rounded-custom shadow-sm p-6" data-purpose="summary-section">
<h3 className="text-base font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  Performance Summary
</h3>
<p className="text-xl font-medium text-gray-700 leading-relaxed">
  {evaluationResult?.summary || "No summary available for this session."}
</p>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" data-purpose="main-dashboard-grid">
<div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4" data-purpose="metrics-sidebar">
{/*  Speech Rate  */}
<div className="bg-white p-5 border border-gray-100 rounded-custom shadow-sm relative">
<div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
  Speech Rate
</div>
<div className="flex items-end justify-between">
  <div className="text-4xl font-extrabold text-gray-900">{evaluationResult?.metrics?.wpm || 0} <span className="text-xl text-gray-400 font-bold">wpm</span></div>
  <span className={`px-2 py-1 text-xs font-bold rounded-md ${getWpmStatus(evaluationResult?.metrics?.wpm).color}`}>
    {getWpmStatus(evaluationResult?.metrics?.wpm).text}
  </span>
</div>
</div>
{/*  Confidence  */}
<div className="bg-white p-5 border border-gray-100 rounded-custom shadow-sm relative">
<div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
  Confidence
</div>
<div className="flex items-end justify-between">
  <div className="text-4xl font-extrabold text-gray-900">{evaluationResult?.metrics?.articulation_score || 0}<span className="text-xl text-gray-400 font-bold">/10</span></div>
  <span className={`px-2 py-1 text-xs font-bold rounded-md ${getScoreStatus(evaluationResult?.metrics?.articulation_score).color}`}>
    {getScoreStatus(evaluationResult?.metrics?.articulation_score).text}
  </span>
</div>
</div>
{/*  Fluency  */}
<div className="bg-white p-5 border border-gray-100 rounded-custom shadow-sm relative">
<div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
  Fluency
</div>
<div className="flex items-end justify-between">
  <div className="text-4xl font-extrabold text-gray-900">{evaluationResult?.metrics?.fluency_score || 0}<span className="text-xl text-gray-400 font-bold">/10</span></div>
  <span className={`px-2 py-1 text-xs font-bold rounded-md ${getScoreStatus(evaluationResult?.metrics?.fluency_score).color}`}>
    {getScoreStatus(evaluationResult?.metrics?.fluency_score).text}
  </span>
</div>
</div>
{/*  Content Score  */}
<div className="bg-white p-5 border border-gray-100 rounded-custom shadow-sm relative">
<div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
  Content Score
</div>
<div className="flex items-end justify-between">
  <div className="text-4xl font-extrabold text-gray-900">{evaluationResult?.overallScore || 0}<span className="text-xl text-gray-400 font-bold">/10</span></div>
  <span className={`px-2 py-1 text-xs font-bold rounded-md ${getScoreStatus(evaluationResult?.overallScore).color}`}>
    {getScoreStatus(evaluationResult?.overallScore).text}
  </span>
</div>
</div>
{/*  Filler Words & Pauses  */}
<div className="bg-white p-5 border border-gray-100 rounded-custom shadow-sm grid grid-cols-2 gap-4">
  <div>
    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Fillers</div>
    <div className="flex items-baseline gap-2">
      <div className="text-2xl font-bold text-orange-500">{evaluationResult?.metrics?.filler_words_count || 0}</div>
      {(evaluationResult?.metrics?.filler_words_count > 5) && <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">High</span>}
    </div>
  </div>
  <div>
    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pauses</div>
    <div className="text-2xl font-bold text-orange-500">{evaluationResult?.metrics?.pauses_count || 0}</div>
  </div>
</div>
</div>
<div className="col-span-1 lg:col-span-5 space-y-6" data-purpose="charts-container">
{/*  Performance Radar  */}
<div className="bg-white p-6 border border-gray-100 rounded-custom shadow-sm flex flex-col items-center">
<div className="w-full text-left">
<h3 className="text-lg font-bold text-gray-800 mb-6">Performance Radar Chart</h3>
</div>
<div className="h-64 w-full mt-4">
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
      <PolarGrid stroke="#e5e7eb" />
      <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 600 }} />
      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
      <Tooltip 
        contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
      />
    </RadarChart>
  </ResponsiveContainer>
</div>
</div>

{/*  Historical Progress Chart  */}
<div className="bg-white p-6 border border-gray-100 rounded-custom shadow-sm flex flex-col items-center mt-6">
<div className="w-full text-left">
<h3 className="text-lg font-bold text-gray-800 mb-6">Historical Progress</h3>
</div>
<div className="h-64 w-full mt-4">
  {historyData.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={historyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 14 }} dy={10} />
        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 14 }} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        />
        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-full text-sm text-gray-400">Not enough data to display progress</div>
  )}
</div>
</div>

</div>
<div className="col-span-1 lg:col-span-4 space-y-6" data-purpose="feedback-sidebar">
{/*  Strengths & Weaknesses  */}
<div className="bg-white p-6 border border-gray-100 rounded-custom shadow-sm space-y-6">
<div>
<h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
<svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
  Strengths
</h4>
<ul className="text-base space-y-3 text-gray-700 list-disc ml-5">
  {evaluationResult?.strengths?.map((str, i) => <li key={i}>{str}</li>) || <li>Great effort overall!</li>}
</ul>
</div>
<div>
<h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
  Weaknesses
</h4>
<ul className="text-base space-y-3 text-gray-700 list-disc ml-5">
  {evaluationResult?.weaknesses?.map((wk, i) => <li key={i}>{wk}</li>) || <li>Try to slow down your pace.</li>}
</ul>
</div>
</div>
{/*  Key Recommendations  */}
<div className="bg-white p-6 border border-gray-100 rounded-custom shadow-sm">
<h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Key Recommendations</h4>
<ul className="text-base leading-relaxed text-gray-700 list-disc ml-5 space-y-3">
  {evaluationResult?.improvementTips?.map((tip, i) => <li key={i}>{tip}</li>) || <li>Keep practicing to improve your delivery and confidence.</li>}
</ul>
</div>
</div>
</div>
<div className="mt-12 bg-white border border-gray-100 rounded-custom shadow-sm overflow-hidden" data-purpose="transcript-viewer">
<div className="p-6 border-b border-gray-50">
<h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              Session Transcript
            </h3>
</div>
<div className="p-8 space-y-6 text-lg text-gray-800 leading-relaxed max-w-5xl">
<div className="flex gap-6">
<p>{evaluationResult?.metrics?.transcript || "No transcript available."}</p>
</div>
</div>
</div>
</div>
</main>
</div>
    </>
  );
}
