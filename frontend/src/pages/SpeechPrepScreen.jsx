import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SpeechPrepScreen({ user, logout, sessionData, timeLeft, startRecording }) {
  const [showHints, setShowHints] = useState(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-surface">
<aside className="w-full lg:w-[240px] border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-white shrink-0" data-purpose="navigation-sidebar">
<div className="p-6 border-b border-gray-100 flex items-center gap-2">
<span className="font-bold text-lg tracking-tight">Impromptu</span>
</div>
<nav className="flex-1 p-4 space-y-2">
<div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-custom">
<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">{user?.name?.charAt(0).toUpperCase()}</div>
<span className="text-sm font-medium">{user?.name}</span>
</div>
<div className="pt-4 space-y-1">
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-black" to="/">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Dashboard
</Link>
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-black" to="/history">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Session History
</Link>
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-black" to="/progress">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Progress
</Link>
</div>
</nav>
<div className="p-4 space-y-1 mt-auto">
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-black" to="/settings">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        Settings
</Link>
<button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-black">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        Logout
</button>
</div>
</aside>
<main className="flex-1 flex flex-col relative">
<header className="h-16 px-8 flex items-center justify-end border-b border-gray-100 bg-white" data-purpose="top-header">
<div className="flex items-center gap-4">
<button className="text-gray-400 hover:text-black">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
</button>
<button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
<span className="font-bold text-gray-700 text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
</button>
</div>
</header>
<div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col gap-10" data-purpose="content-preparation">
{/*  Heading Section  */}
<section>
<h1 className="text-3xl font-bold tracking-tight mb-2">Preparation</h1>
<p className="text-gray-500 text-sm">Take a moment to prepare before your speaking session begins.</p>
</section>
{/*  Topic Section  */}
<section data-purpose="topic-display">
<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Today's Topic ({sessionData?.difficulty})</span>
<div className="bg-white border-2 border-black rounded-xl p-8 md:p-16 flex flex-col items-center justify-center text-center">
<h2 className="text-2xl font-bold max-w-2xl leading-relaxed">
            {sessionData?.topic}
          </h2>
          
          {sessionData?.hints && sessionData.hints.length > 0 && (
            <div className="mt-8 w-full flex flex-col items-center animate-fade-in">
              {!showHints ? (
                <button 
                  onClick={() => setShowHints(true)}
                  className="text-sm font-bold text-gray-500 hover:text-black border-b-2 border-transparent hover:border-black transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                  Need a hint?
                </button>
              ) : (
                <div className="text-left bg-gray-50 p-6 rounded-xl border border-gray-100 max-w-2xl w-full mt-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Hints</h3>
                    <button onClick={() => setShowHints(false)} className="text-gray-400 hover:text-black">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {(() => {
                      let parsedHints = sessionData.hints;
                      if (typeof parsedHints === 'string') {
                        try { parsedHints = JSON.parse(parsedHints); } catch(e) { parsedHints = []; }
                      }
                      return Array.isArray(parsedHints) ? parsedHints.map((hint, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-700">
                          <span className="text-gray-400 font-bold">{idx + 1}.</span>
                          <span className="leading-relaxed">{hint}</span>
                        </li>
                      )) : null;
                    })()}
                  </ul>
                </div>
              )}
            </div>
          )}
</div>
</section>
</div>
</main>
<aside className="w-full lg:w-[300px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col p-8 shrink-0" data-purpose="session-controls">
<div className="flex items-center gap-2 mb-12">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
<span className="text-xs font-bold uppercase tracking-wider">Session Controls</span>
</div>
{/*  Timer Section  */}
<div className="flex flex-col items-center justify-center mb-10" data-purpose="timer-display">
<div className="relative flex items-center justify-center">
<svg className="w-40 h-40">
<circle className="text-gray-100" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="2" />
<circle className="text-black timer-ring" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset={440 - (timeLeft / 120) * 440} strokeWidth="2" />
</svg>
<div className="absolute text-center">
<span className="block text-4xl font-bold">{formatTime(timeLeft)}</span>
<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preparing</span>
</div>
</div>
</div>
{/*  Action Buttons  */}
<div className="space-y-3 mb-12">
<button onClick={startRecording} className="w-full bg-black text-white py-3.5 rounded-full text-xs font-bold tracking-widest hover:bg-gray-900 transition-colors">
        START SPEAKING NOW
      </button>
</div>
{/*  Device Status  */}
<div className="space-y-4" data-purpose="device-status">
<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Device Status</span>
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
<span className="text-xs font-medium">Microphone</span>
</div>
<span className="text-[10px] font-bold text-green-500 uppercase">Ready</span>
</div>
<div className="flex items-center justify-between border-b border-gray-100 pb-6">
<div className="flex items-center gap-3">
<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
<span className="text-xs font-medium">Connection</span>
</div>
<span className="text-[10px] font-bold text-green-500 uppercase">Stable</span>
</div>
</div>
</aside>
    </div>
  );
}
