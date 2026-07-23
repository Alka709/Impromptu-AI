import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SessionHeader from '../components/report/SessionHeader';
import PerformanceSummary from '../components/report/PerformanceSummary';
import SpeechMetricsTimeline from '../components/report/SpeechMetricsTimeline';
import SpeechMetrics from '../components/report/SpeechMetrics';
import AIEvaluation from '../components/report/AIEvaluation';
import Recommendations from '../components/report/Recommendations';
import TranscriptSection from '../components/report/TranscriptSection';
import Sidebar from '../components/dashboard/Sidebar';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function SessionFlow({ user, logout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [sessionData, setSessionData] = useState(location.state?.session || null);
  const [flowState, setFlowState] = useState('prep'); // prep | recording | analyzing | report
  const [timeLeft, setTimeLeft] = useState(60); // 1 min prep
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const freshSession = await res.json();
        setSessionData(freshSession);

        // Restore state if session was already recorded
        if (freshSession.audio_url) {
          const evalRes = await fetch(`${API_BASE}/sessions/${id}/evaluation`, { credentials: 'include' });
          if (evalRes.ok) {
            const evalData = await evalRes.json();
            if (evalData && evalData.status === 'completed') {
              setEvaluationResult(evalData);
              setFlowState('report');
            } else {
              setFlowState('analyzing');
              listenForEvaluationSSE();
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!sessionData) {
          navigate('/');
        }
      }
    };
    initSession();
    // eslint-disable-next-line
  }, [id, navigate]);

  useEffect(() => {
    let timer;
    if (flowState === 'prep' || flowState === 'recording') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (flowState === 'prep') {
              startRecording();
            } else if (flowState === 'recording') {
              stopRecording();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [flowState]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Upload audio
        setFlowState('analyzing');
        
        try {
          // 1. Get Presigned URL
          const urlRes = await fetch(`${API_BASE}/sessions/${id}/audio/url`, {
            method: 'POST',
            credentials: 'include'
          });
          if (!urlRes.ok) throw new Error('Failed to get upload URL');
          const { uploadUrl, fields, fileKey } = await urlRes.json();

          // 2. Upload directly to S3 using FormData
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append('file', audioBlob);

          const s3Res = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          });
          if (!s3Res.ok) throw new Error('Failed to upload to S3');

          // 3. Confirm upload with backend
          const confirmRes = await fetch(`${API_BASE}/sessions/${id}/audio/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileKey }),
            credentials: 'include'
          });
          if (!confirmRes.ok) throw new Error('Failed to confirm upload');

          listenForEvaluationSSE();
        } catch (err) {
          console.error('Failed to upload audio', err);
        }
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setAudioStream(stream);
      setFlowState('recording');
      setTimeLeft(120); // 2 minutes max recording
    } catch (err) {
      console.warn('Microphone unavailable. Proceeding in UI mock mode.');
      // Fallback for UI testing
      setFlowState('recording');
      setTimeLeft(120);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    } else {
      // Mock mode fallback
      setFlowState('analyzing');
      setTimeout(() => {
        setFlowState('report');
      }, 3000);
    }
  };

  const listenForEvaluationSSE = () => {
    const eventSource = new EventSource(`${API_BASE}/sessions/${id}/events`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'completed') {
          eventSource.close();
          setEvaluationResult(data);
          setFlowState('report');
        } else if (data.status === 'failed') {
          eventSource.close();
          setFlowState('error');
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
      setFlowState('error');
    };
  };

  if (!sessionData) return <div>Loading session...</div>;

  const props = { user, logout, sessionData, timeLeft, startRecording, stopRecording, evaluationResult, audioStream };

  switch (flowState) {
    case 'prep':
      return <SpeechPrepScreen {...props} />;
    case 'recording':
      return <LiveRecordingScreen {...props} />;
    case 'analyzing':
      return <SpeechAnalysisScreen {...props} />;
    case 'report':
      return <PerformanceReportScreen {...props} />;
    case 'error':
      return <SpeechErrorScreen user={user} logout={logout} />;
    default:
      return <div>Invalid state</div>;
  }
}

function SpeechErrorScreen({ user }) {
  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
      <header className="h-16 border-b border-surface-dim bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">ImpromptuAI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold text-gray-600">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-surface p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-50 text-red-500 shadow-sm flex items-center justify-center border border-red-100">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Analysis Failed</h1>
            <p className="text-gray-500 text-sm">Something went wrong while our AI was analyzing your speech. Please try again.</p>
          </div>
          <Link to="/" className="inline-block px-6 py-3 bg-black text-white rounded-full font-bold text-sm tracking-wide shadow hover:bg-gray-800 transition">
            Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}


function SpeechPrepScreen({ user, logout, sessionData, timeLeft, startRecording }) {
  const [showHints, setShowHints] = useState(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-surface">
<aside className="hidden lg:flex w-[240px] border-r border-gray-200 flex-col bg-white shrink-0" data-purpose="navigation-sidebar">
<div className="p-6 border-b border-gray-100 flex items-center gap-2">
<span className="font-bold text-lg tracking-tight">ImpromptuAI</span>
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
<div className="flex-1 flex flex-col relative">
<header className="h-16 px-4 md:px-8 flex items-center justify-between lg:justify-end border-b border-gray-100 bg-white shrink-0" data-purpose="top-header">
<div className="lg:hidden font-bold text-lg tracking-tight">ImpromptuAI</div>
<div className="flex items-center gap-4">
<button className="text-gray-400 hover:text-black">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
</button>
<button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
<span className="font-bold text-gray-700 text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
</button>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 md:pt-8 md:px-8 flex flex-col items-center relative bg-white">
  <div className="w-full max-w-3xl flex flex-col items-center space-y-12 mt-2">
    {/* Topic Section */}
    <section className="text-center w-full">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Today's Topic ({sessionData?.difficulty})</span>
      <h2 className="text-3xl md:text-4xl font-extrabold max-w-2xl mx-auto leading-tight text-gray-900">
        {sessionData?.topic}
      </h2>
      
      {sessionData?.hints && sessionData.hints.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          {!showHints ? (
            <button onClick={() => setShowHints(true)} className="text-sm font-bold text-gray-500 hover:text-black transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              Need a hint?
            </button>
          ) : (
            <div className="text-left bg-gray-50 p-6 rounded-2xl border border-gray-100 max-w-2xl w-full mt-4">
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
    </section>

    {/* Timer Section */}
    <section className="flex flex-col items-center justify-center pt-8">
      <div className="relative flex items-center justify-center h-32">
        <svg className="w-48 h-24 overflow-visible">
          <path className="text-gray-100" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path className="text-black transition-all duration-1000 ease-linear" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (timeLeft / 60) * 251.2} strokeWidth="8" strokeLinecap="round" />
        </svg>
        <div className="absolute top-14 text-center w-full flex flex-col items-center">
          <span className="block text-3xl font-extrabold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 block">Preparing</span>
        </div>
      </div>
    </section>

    {/* Action Buttons */}
    <section className="w-full max-w-xs mx-auto">
      <button onClick={startRecording} className="w-full bg-black text-white py-4 rounded-full text-sm font-bold tracking-widest hover:bg-gray-900 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-black/10">
        START SPEAKING
      </button>
      <div className="mt-6 flex items-center justify-center gap-6 text-gray-400">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          <span className="text-xs font-medium">Mic Ready</span>
        </div>
      </div>
    </section>
  </div>
</div>
</div>
</div>
  );
}


function LiveRecordingScreen({ user, logout, sessionData, timeLeft, stopRecording, audioStream }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [volumeData, setVolumeData] = useState(new Array(12).fill(8));

  useEffect(() => {
    if (!audioStream) return;
    
    // Fallback if browser doesn't support AudioContext easily
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(audioStream);
    source.connect(analyser);
    
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let animationFrameId;
    
    const updateWaveform = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const newHeights = [];
      for (let i = 0; i < 12; i++) {
        const val = dataArray[i * 2] || 0; // skip every other bin to spread out
        const height = 8 + (val / 255) * 90; // scale from 8px to ~98px
        newHeights.push(height);
      }
      setVolumeData(newHeights);
      
      animationFrameId = requestAnimationFrame(updateWaveform);
    };
    
    updateWaveform();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      audioCtx.close().catch(console.error);
    };
  }, [audioStream]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-surface">
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}
<aside className={`${isMobileMenuOpen ? 'flex absolute inset-y-0 left-0 z-50 shadow-2xl h-full' : 'hidden'} lg:flex w-[240px] border-r border-gray-200 flex-col bg-white shrink-0`} data-purpose="navigation-sidebar">
<div className="p-6 border-b border-gray-100 flex items-center gap-2">
<span className="font-bold text-lg tracking-tight">ImpromptuAI</span>
{isMobileMenuOpen && (
  <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto lg:hidden text-gray-500 hover:text-black">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
  </button>
)}
</div>
<nav className="flex-1 p-4 space-y-2">
<div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-custom">
<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">{user?.name?.charAt(0).toUpperCase()}</div>
<span className="text-sm font-medium">{user?.name}</span>
</div>

<div className="pt-4 pb-2">
<Link to="/" className="w-full py-2.5 bg-black text-white rounded-custom text-sm font-bold flex items-center justify-center gap-2 transition-colors hover:bg-gray-900">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
New Session
</Link>
</div>

<div className="space-y-1">
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom transition-colors" to="/">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Dashboard
</Link>
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom transition-colors" to="/history">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Session History
</Link>
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom transition-colors" to="/progress">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          Progress
</Link>
</div>
</nav>
<div className="p-4 space-y-1 mt-auto">
<Link className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom transition-colors" to="/settings">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        Settings
</Link>
<button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-custom transition-colors">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        Logout
</button>
</div>
</aside>
<div className="flex-1 flex flex-col relative">
<header className="h-16 px-4 md:px-8 flex items-center justify-between lg:justify-end border-b border-gray-100 bg-white shrink-0" data-purpose="main-header">
<div className="flex items-center gap-3 lg:hidden">
<button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-black">
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
</button>
<div className="font-bold text-lg tracking-tight">ImpromptuAI</div>
</div>
<div className="flex items-center gap-4">
<button className="text-gray-400 hover:text-black">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
</button>
<div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
<span className="text-xs font-bold text-gray-600">{user?.name?.charAt(0).toUpperCase()}</span>
</div>
</div>
</header>
<div className="flex-1 overflow-y-auto p-4 md:pt-8 md:px-8 flex flex-col items-center relative bg-white">
  <div className="w-full max-w-3xl flex flex-col items-center space-y-12 mt-2">
    <section className="text-center w-full">
      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-4">Recording Active</span>
      <h2 className="text-3xl md:text-4xl font-extrabold max-w-2xl mx-auto leading-tight text-gray-900">
        {sessionData?.topic}
      </h2>
    </section>

    <section className="flex flex-col items-center justify-center w-full">
      <div className="relative flex items-center justify-center h-32 mb-8">
        <svg className="w-48 h-24 overflow-visible">
          <path className="text-red-100" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path className="text-red-600 transition-all duration-1000 ease-linear" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (timeLeft / 120) * 251.2} strokeWidth="8" strokeLinecap="round" />
        </svg>
        <div className="absolute top-14 text-center w-full flex flex-col items-center">
          <span className="block text-3xl font-extrabold tracking-tight text-red-600" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-2 block">Recording</span>
        </div>
      </div>
      <div className="w-full bg-white border-2 border-gray-100 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center h-[150px] max-w-2xl" id="waveform">
        <div className="flex items-center justify-center gap-1.5 h-20 w-full overflow-hidden">
          {volumeData.map((height, i) => (
            <div key={i} className="w-1 bg-black rounded-full transition-all duration-75" style={{ height: `${height}px` }}></div>
          ))}
        </div>
      </div>
    </section>

    <section className="w-full max-w-xs mx-auto">
      <button onClick={stopRecording} className="w-full bg-red-600 text-white py-4 rounded-full text-sm font-bold tracking-widest hover:bg-red-700 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-red-600/20 flex items-center justify-center gap-3">
        <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
        STOP RECORDING
      </button>
    </section>
  </div>
</div>
</div>
    </div>
  );
}
function SpeechAnalysisScreen({ user, sessionData }) {
  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
<header className="h-16 border-b border-surface-dim bg-white flex items-center justify-between px-6 shrink-0">
<div className="flex items-center gap-2">
<span className="font-bold text-xl tracking-tight">ImpromptuAI</span>
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

function PerformanceReportScreen({ user, logout, sessionData, evaluationResult }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  const overallScore = evaluationResult?.overallScore ?? null;
  const handlePracticeAgain = () => navigate('/');

  return (
    <>
      {/* â”€â”€ Mobile top bar â”€â”€ */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#ECECEC] flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl text-[#666666] hover:bg-[#F5F5F4] transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-[14px] font-semibold text-[#111111] tracking-tight">ImpromptuAI</span>
        <div className="w-9" />
      </header>

      {/* â”€â”€ Sidebar â”€â”€ */}
      <Sidebar
        user={user}
        logout={logout}
        startNewSession={() => navigate('/')}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* â”€â”€ Main content â”€â”€ */}
      <main className="md:pl-60 min-h-screen bg-[#FAFAF8] pt-14 md:pt-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="px-6 md:px-10 lg:px-14 py-10"
        >
          {/* â”€â”€ HEADER â”€â”€ */}
          <SessionHeader
            sessionData={sessionData}
            overallScore={overallScore}
            onPracticeAgain={handlePracticeAgain}
          />

          <div className="flex flex-col gap-7 mt-9">

            {/* â”€â”€ ROW 1: Performance Summary + Speech Metrics Over Time â”€â”€ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              <PerformanceSummary summary={evaluationResult?.summary} />
              <SpeechMetricsTimeline
                metrics={evaluationResult?.metrics}
                overallScore={overallScore}
                duration={sessionData?.duration}
              />
            </div>

            {/* â”€â”€ ROW 2: Speech Metrics (full-width 6-col) â”€â”€ */}
            <SpeechMetrics
              metrics={evaluationResult?.metrics}
              overallScore={overallScore}
            />

            {/* â”€â”€ ROW 3: AI Evaluation + Recommendations â”€â”€ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              <AIEvaluation
                strengths={evaluationResult?.strengths}
                weaknesses={evaluationResult?.weaknesses}
              />
              <Recommendations tips={evaluationResult?.improvementTips} />
            </div>

            {/* â”€â”€ ROW 4: Transcript â”€â”€ */}
            <TranscriptSection transcript={evaluationResult?.metrics?.transcript} />

          </div>
        </motion.div>
      </main>
    </>
  );
}
