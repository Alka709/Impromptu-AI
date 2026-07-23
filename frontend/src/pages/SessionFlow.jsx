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

function SpeechErrorScreen({ user, logout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#ECECEC] flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl text-[#666666] hover:bg-[#F5F5F4]" aria-label="Open menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-[14px] font-semibold text-[#111111] tracking-tight">ImpromptuAI</span>
        <div className="w-9" />
      </header>
      <Sidebar user={user} logout={logout} startNewSession={() => {}} isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
      <main className="md:pl-60 min-h-screen bg-[#FAFAF8] pt-14 md:pt-0 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-6">
            <svg className="w-9 h-9 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold text-[#111111] tracking-tight mb-2">Analysis Failed</h1>
          <p className="text-[#666666] text-[15px] mb-8 leading-relaxed">Something went wrong while our AI was analyzing your speech. Please try again.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#111111] text-white rounded-xl font-semibold text-[14px] hover:bg-black transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}


function SpeechPrepScreen({ user, logout, sessionData, timeLeft, startRecording }) {
  const [showHints, setShowHints] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#ECECEC] flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl text-[#666666] hover:bg-[#F5F5F4]" aria-label="Open menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-[14px] font-semibold text-[#111111] tracking-tight">ImpromptuAI</span>
        <div className="w-9" />
      </header>
      <Sidebar user={user} logout={logout} startNewSession={() => {}} isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
      <main className="md:pl-60 min-h-screen bg-[#FAFAF8] pt-14 md:pt-0 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl flex flex-col items-center gap-10">

          {/* Topic */}
          <section className="text-center w-full">
            <span className="text-[11px] font-bold text-[#888888] uppercase tracking-widest block mb-3">
              {sessionData?.difficulty?.toUpperCase()} · Prepare to speak
            </span>
            <h1 className="text-[36px] md:text-[44px] font-extrabold text-[#111111] leading-tight tracking-tight">
              {sessionData?.topic}
            </h1>

            {sessionData?.hints && sessionData.hints.length > 0 && (
              <div className="mt-6 flex flex-col items-center">
                {!showHints ? (
                  <button
                    onClick={() => setShowHints(true)}
                    className="text-[13px] font-semibold text-[#888888] hover:text-[#111111] transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    Need a hint?
                  </button>
                ) : (
                  <div className="text-left bg-white border border-[#ECECEC] rounded-2xl p-6 max-w-xl w-full mt-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#888888]">Hints</h3>
                      <button onClick={() => setShowHints(false)} className="text-[#888888] hover:text-[#111111]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <ul className="space-y-3">
                      {(() => {
                        let parsedHints = sessionData.hints;
                        if (typeof parsedHints === 'string') { try { parsedHints = JSON.parse(parsedHints); } catch { parsedHints = []; } }
                        return Array.isArray(parsedHints) ? parsedHints.map((hint, idx) => (
                          <li key={idx} className="flex gap-3 text-[14px] text-[#444444] leading-relaxed">
                            <span className="text-[#AAAAAA] font-bold shrink-0">{idx + 1}.</span>
                            <span>{hint}</span>
                          </li>
                        )) : null;
                      })()}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Timer arc */}
          <section className="flex flex-col items-center">
            <div className="relative flex items-center justify-center h-32">
              <svg className="w-48 h-24 overflow-visible">
                <path className="text-[#ECECEC]" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                <path className="text-[#111111] transition-all duration-1000 ease-linear" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (timeLeft / 60) * 251.2} strokeWidth="8" strokeLinecap="round" />
              </svg>
              <div className="absolute top-14 text-center">
                <span className="block text-[28px] font-extrabold tracking-tight text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
                <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest mt-1 block">Prepare</span>
              </div>
            </div>
          </section>

          {/* Start button */}
          <section className="w-full max-w-xs">
            <button
              onClick={startRecording}
              className="w-full bg-[#111111] text-white py-3.5 rounded-xl text-[14px] font-bold tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              START SPEAKING
            </button>
            <p className="text-center text-[12px] text-[#AAAAAA] mt-3 font-medium">Microphone ready · 2 min recording</p>
          </section>
        </div>
      </main>
    </>
  );
}

function LiveRecordingScreen({ user, logout, sessionData, timeLeft, stopRecording, audioStream }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [volumeData, setVolumeData] = useState(new Array(12).fill(8));

  useEffect(() => {
    if (!audioStream) return;
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
        const val = dataArray[i * 2] || 0;
        const height = 8 + (val / 255) * 90;
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
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#ECECEC] flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl text-[#666666] hover:bg-[#F5F5F4]" aria-label="Open menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-[14px] font-semibold text-[#111111] tracking-tight">ImpromptuAI</span>
        <div className="w-9" />
      </header>
      <Sidebar user={user} logout={logout} startNewSession={() => {}} isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
      <main className="md:pl-60 min-h-screen bg-[#FAFAF8] pt-14 md:pt-0 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl flex flex-col items-center gap-10">

          {/* Topic */}
          <section className="text-center w-full">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest block mb-3">● Recording Active</span>
            <h1 className="text-[36px] md:text-[44px] font-extrabold text-[#111111] leading-tight tracking-tight">
              {sessionData?.topic}
            </h1>
          </section>

          {/* Timer arc */}
          <section className="flex flex-col items-center">
            <div className="relative flex items-center justify-center h-32">
              <svg className="w-48 h-24 overflow-visible">
                <path className="text-red-100" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                <path className="text-red-500 transition-all duration-1000 ease-linear" d="M 16 96 A 80 80 0 0 1 176 96" fill="transparent" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (timeLeft / 120) * 251.2} strokeWidth="8" strokeLinecap="round" />
              </svg>
              <div className="absolute top-14 text-center">
                <span className="block text-[28px] font-extrabold tracking-tight text-red-500" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
                <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest mt-1 block">Recording</span>
              </div>
            </div>
          </section>

          {/* Waveform */}
          <section className="w-full max-w-xl">
            <div className="bg-white border border-[#ECECEC] rounded-2xl p-6 flex items-center justify-center h-[120px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]" id="waveform">
              <div className="flex items-center justify-center gap-1.5 h-16 w-full overflow-hidden">
                {volumeData.map((height, i) => (
                  <div key={i} className="w-1 bg-[#111111] rounded-full transition-all duration-75" style={{ height: `${height}px` }} />
                ))}
              </div>
            </div>
          </section>

          {/* Stop button */}
          <section className="w-full max-w-xs">
            <button
              onClick={stopRecording}
              className="w-full bg-rose-600 text-white py-3.5 rounded-xl text-[14px] font-bold tracking-widest hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(220,38,38,0.25)]"
            >
              <span className="w-2.5 h-2.5 bg-white rounded-sm" />
              STOP RECORDING
            </button>
          </section>
        </div>
      </main>
    </>
  );
}

function SpeechAnalysisScreen({ user, logout, sessionData }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#ECECEC] flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl text-[#666666] hover:bg-[#F5F5F4]" aria-label="Open menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-[14px] font-semibold text-[#111111] tracking-tight">ImpromptuAI</span>
        <div className="w-9" />
      </header>
      <Sidebar user={user} logout={logout} startNewSession={() => {}} isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />
      <main className="md:pl-60 min-h-screen bg-[#FAFAF8] pt-14 md:pt-0 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-[#ECECEC] shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-center mb-8 animate-pulse">
            <svg className="w-9 h-9 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold text-[#111111] tracking-tight mb-2">Analyzing Speech</h1>
          <p className="text-[15px] text-[#666666] mb-8 leading-relaxed">
            Please wait while our AI evaluates your performance for<br />
            <span className="font-semibold text-[#111111]">"{sessionData?.topic}"</span>
          </p>
          <div className="w-full bg-[#F0F0F0] rounded-full h-1 mb-3 overflow-hidden">
            <div className="bg-[#16A34A] h-1 rounded-full w-full animate-[pulse_1.2s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }} />
          </div>
          <p className="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest">Processing Audio</p>
        </div>
      </main>
    </>
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
