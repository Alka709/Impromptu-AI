import React from 'react';
import { Link } from 'react-router-dom';

export default function LiveRecordingScreen({ user, sessionData, timeLeft, stopRecording }) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
<header className="h-16 border-b border-surface-dim bg-white flex items-center justify-between px-6 shrink-0" data-purpose="main-header">
<div className="flex items-center gap-2">
<span className="font-bold text-xl tracking-tight">Impromptu</span>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
<svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
</button>
<div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
<span className="text-xs font-bold text-gray-600">{user?.name?.charAt(0).toUpperCase()}</span>
</div>
</div>
</header>
<div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
<aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-surface-dim bg-white flex flex-col justify-between py-4 lg:py-6 px-4 shrink-0" data-purpose="navigation-sidebar">
<nav className="space-y-1">
<div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-custom mb-6">
<div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">{user?.name?.charAt(0).toUpperCase()}</div>
<span className="font-semibold text-sm">{user?.name}</span>
</div>
<Link className="flex items-center gap-3 p-3 text-gray-900 font-medium rounded-custom hover:bg-gray-50 transition-colors" to="/">
<svg className="text-gray-400" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><rect height="9" rx="1" width="7" x="3" y="3" /><rect height="5" rx="1" width="7" x="14" y="3" /><rect height="9" rx="1" width="7" x="14" y="12" /><rect height="5" rx="1" width="7" x="3" y="16" /></svg>
          Dashboard
</Link>
</nav>
</aside>
<main className="flex-1 overflow-y-auto p-4 md:p-8 relative" data-purpose="recording-workspace">
<div className="max-w-5xl mx-auto space-y-8">
{/*  Header Info  */}
<header data-purpose="session-header">
<span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Active Session</span>
<h1 className="text-3xl font-bold mt-1">{sessionData?.topic}</h1>
</header>
{/*  Visualizer Area  */}
<div className="w-full bg-white border border-black rounded-xl p-12 flex flex-col items-center justify-center min-h-[300px] shadow-sm" data-purpose="waveform-container">
<div className="flex items-center gap-1.5 h-32" id="waveform">
<div className="w-1 bg-gray-300 rounded-full h-8 waveform-bar"></div>
<div className="w-1 bg-gray-400 rounded-full h-12 waveform-bar"></div>
<div className="w-1 bg-gray-500 rounded-full h-20 waveform-bar"></div>
<div className="w-1 bg-gray-800 rounded-full h-14 waveform-bar"></div>
<div className="w-1 bg-black rounded-full h-24 waveform-bar"></div>
<div className="w-1 bg-black rounded-full h-32 waveform-bar animate-pulse"></div>
<div className="w-1 bg-black rounded-full h-28 waveform-bar"></div>
<div className="w-1 bg-gray-800 rounded-full h-22 waveform-bar"></div>
<div className="w-1 bg-gray-500 rounded-full h-16 waveform-bar"></div>
<div className="w-1 bg-gray-400 rounded-full h-24 waveform-bar"></div>
<div className="w-1 bg-gray-300 rounded-full h-12 waveform-bar"></div>
<div className="w-1 bg-gray-200 rounded-full h-8 waveform-bar"></div>
</div>
</div>
{/*  Recording Button  */}
<button onClick={stopRecording} className="w-full bg-red-600 text-white rounded-full py-4 flex items-center justify-center gap-2 hover:bg-red-700 transition-all font-semibold" data-purpose="recording-toggle">
<span className="w-2 h-2 bg-white rounded-full"></span>
          Stop Recording & Analyze
        </button>
</div>
</main>
<aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-surface-dim bg-white flex flex-col p-6 shrink-0" data-purpose="session-controls-sidebar">
<div className="flex items-center gap-2 mb-8">
<svg className="text-gray-400" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
<h2 className="text-xs font-bold uppercase tracking-tight text-gray-900">Session Controls</h2>
</div>
{/*  Countdown Timer  */}
<div className="flex flex-col items-center justify-center py-10 mb-8 border border-red-500 rounded-full aspect-square w-48 mx-auto" data-purpose="timer-display">
<span className="text-4xl font-bold tracking-tight text-red-600">{formatTime(timeLeft)}</span>
<span className="text-[10px] uppercase font-bold text-red-400 tracking-widest mt-1">Recording</span>
</div>
</aside>
</div>
    </div>
  );
}
