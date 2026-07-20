import React from 'react';
import { Link } from 'react-router-dom';

export default function SpeechAnalysisScreen({ user, sessionData }) {
  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
<header className="h-16 border-b border-surface-dim bg-white flex items-center justify-between px-6 shrink-0">
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
<main className="flex-1 flex items-center justify-center bg-surface p-8">
<div className="max-w-md w-full text-center space-y-8">
<div className="w-24 h-24 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-200 animate-pulse">
<svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
</svg>
</div>
<div>
<h1 className="text-2xl font-bold tracking-tight mb-2">Analyzing Speech</h1>
<p className="text-gray-500 text-sm">Please wait while our AI models evaluate your performance for "{sessionData?.topic}".</p>
</div>
<div className="w-full bg-gray-200 rounded-full h-1.5 mb-4 overflow-hidden">
  <div className="bg-black h-1.5 rounded-full w-full animate-[pulse_1s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }}></div>
</div>
<p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Processing Audio</p>
</div>
</main>
    </div>
  );
}
