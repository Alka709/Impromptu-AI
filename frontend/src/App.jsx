import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Mic } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

const AppLogo = () => (
  <div className="app-logo">
    <Mic className="app-logo-icon" size={26} strokeWidth={2} />
    <span className="app-logo-text">Impromptu AI</span>
  </div>
);

const AuthenticatedLayout = ({ children }) => (
  <div className="app-shell">
    <header className="app-header">
      <AppLogo />
    </header>
    <main className="app-main">
      {children}
    </main>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    fetchMe();
  }, []);

  if (loadingAuth) return <div className="glass-card">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        <Route path="/" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/session/:id" element={user ? <SessionFlow user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      navigate('/');
    } else {
      alert(data.error || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <AppLogo />
        </div>
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="flex-col">
          <input className="input-field" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">Log In</button>
        </form>
        <p className="link-text" onClick={() => navigate('/signup')}>Need an account? Sign up</p>
      </div>
    </div>
  );
};

const Signup = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      navigate('/');
    } else {
      alert(data.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <AppLogo />
        </div>
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup} className="flex-col">
          <input className="input-field" type="text" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="input-field" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">Sign Up</button>
        </form>
        <p className="link-text" onClick={() => navigate('/login')}>Already have an account? Log in</p>
      </div>
    </div>
  );
};

const Dashboard = ({ user, setUser }) => {
  const [category, setCategory] = useState('Technology');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startSession = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ category, difficulty })
    });
    const data = await res.json();
    setLoading(false);
    if (data.id) {
      navigate(`/session/${data.id}`, { state: { session: data } });
    } else {
      alert(data.error || 'Failed to create session');
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {}
    setUser(null);
  };

  return (
    <AuthenticatedLayout>
      <div className="glass-card">
        <h1>Dashboard</h1>
        <h2>New Session</h2>
        <div className="flex-col">
          <select className="input-field" value={category} onChange={e=>setCategory(e.target.value)}>
            <option>Technology</option>
            <option>Education</option>
            <option>Current Affairs</option>
            <option>Personal Experience</option>
            <option>Business & Entrepreneurship</option>
          </select>
          <select className="input-field" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
            <option>easy</option>
            <option>medium</option>
            <option>hard</option>
          </select>
          <button className="btn-primary" onClick={startSession} disabled={loading}>
            {loading ? 'Generating Topic...' : 'Start Session'}
          </button>
          <button className="btn-secondary" onClick={logout}>Log Out</button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

const SessionFlow = ({ user }) => {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const location = useLocation();

  // State could be 'prep', 'recording', 'uploading', 'analyzing', 'results'
  const [flowState, setFlowState] = useState('prep');
  const [timeLeft, setTimeLeft] = useState(60); // 1 min prep
  const [showHints, setShowHints] = useState(false);
  const [session, setSession] = useState(location.state?.session || null);
  const [recordingStream, setRecordingStream] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch session from backend if missing from location state (e.g. page refresh)
  useEffect(() => {
    if (!session) {
      const fetchSession = async () => {
        try {
          const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setSession(data);
          } else {
            alert("Could not retrieve session details.");
            navigate('/');
          }
        } catch (err) {
          console.error("Failed to fetch session", err);
          alert("Error loading session.");
          navigate('/');
        }
      };
      fetchSession();
    }
  }, [session, sessionId, user, navigate]);

  useEffect(() => {
    if (flowState === 'prep' || flowState === 'recording') {
      if (timeLeft > 0) {
        const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timerId);
      } else {
        if (flowState === 'prep') startRecording();
        else stopRecording();
      }
    }
  }, [timeLeft, flowState]);

  const startRecording = async () => {
    setFlowState('recording');
    setTimeLeft(120); // 2 min recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = uploadAudio;
      mediaRecorder.start();
    } catch (err) {
      alert("Microphone access denied or unavailable.");
      setFlowState('prep');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setRecordingStream(null);
    setFlowState('uploading');
  };

  const uploadAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const res = await fetch(`${API_BASE}/sessions/${session.id}/audio`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data.audio_url) {
        setFlowState('analyzing');
      } else {
        alert("Upload failed.");
        setFlowState('prep');
      }
    } catch (e) {
      alert("Error uploading audio.");
      setFlowState('prep');
    }
  };

  useEffect(() => {
    let intervalId;
    if (flowState === 'analyzing') {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/sessions/${session.id}/evaluation`, {
            credentials: 'include'
          });
          if (res.status === 200) {
            const data = await res.json();
            if (data.status === 'completed') {
              setEvaluationResult(data);
              setFlowState('results');
              clearInterval(intervalId);
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [flowState, session, user]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const highlightFillers = (text, fillerWordsObj) => {
    if (!text) return '';
    const fillers = Object.keys(fillerWordsObj || {}).map(f => f.toLowerCase());
    if (fillers.length === 0) return text;

    const regex = new RegExp(`\\b(${fillers.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (fillers.includes(part.toLowerCase())) {
        return <mark key={index} className="highlighted-filler">{part}</mark>;
      }
      return part;
    });
  };

  if (!session) {
    return (
      <AuthenticatedLayout>
        <div className="glass-card">Loading...</div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
    <div className="glass-card" style={{ maxWidth: flowState === 'results' ? '1000px' : '600px', width: '95%', transition: 'max-width 0.5s ease' }}>
      <h1>
        {flowState === 'prep' ? 'Preparation' : 
         flowState === 'recording' ? 'Recording' : 
         flowState === 'uploading' ? 'Uploading' : 
         flowState === 'analyzing' ? 'Analyzing' : 'Evaluation Dashboard'}
      </h1>
      
      {flowState === 'prep' || flowState === 'recording' ? (
        <div className="timer-display">{formatTime(timeLeft)}</div>
      ) : null}

      {(flowState === 'prep' || flowState === 'recording') && (
        <>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '1.5rem' }}>{session.topic}</h2>
          {flowState === 'prep' && (
            <div className="flex-col">
              {!showHints ? (
                <button className="btn-secondary" onClick={() => setShowHints(true)}>Show Hints</button>
              ) : (
                <ul className="hints-list">
                  {session.hints?.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              )}
              <button className="btn-primary" onClick={startRecording}>Start Early</button>
            </div>
          )}
          {flowState === 'recording' && (
             <div className="flex-col" style={{ width: '100%' }}>
               <AudioVisualizer stream={recordingStream} />
               <button className="btn-secondary" onClick={stopRecording}>End Recording Early</button>
             </div>
          )}
        </>
      )}

      {flowState === 'uploading' && <h2>Uploading your speech to secure cloud storage...</h2>}

      {flowState === 'analyzing' && (
        <div className="flex-col" style={{ alignItems: 'center' }}>
          <h2 className="pulsing-text" style={{ color: 'var(--primary-color)' }}>AI is analyzing your speech...</h2>
          <p style={{ marginTop: '1rem', color: 'var(--text-medium)' }}>This usually takes about 10-20 seconds.</p>
        </div>
      )}

      {flowState === 'results' && evaluationResult && (
        <div className="dashboard-container">
          
          {/* Top Overview Section */}
          <div className="dashboard-header-grid">
            <div className="overall-score-card">
              <div className="radial-score">
                <span className="score-val">{evaluationResult.overallScore}</span>
                <span className="score-denominator">/10</span>
              </div>
              <span className="score-label">Coaches Score</span>
            </div>
            
            <div className="feedback-card">
              <h3>Summary Review</h3>
              <p>{evaluationResult.summary}</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            
            {/* Card 1: Articulation Components */}
            <div className="metric-card">
              <h4>Articulation & Pronunciation</h4>
              <div className="metric-content">
                <div className="score-bar-group">
                  <div className="score-row">
                    <span>Articulation Score</span>
                    <span className="score-num">{(evaluationResult.metrics?.articulation_score || 0).toFixed(1)}/10</span>
                  </div>
                  <div className="progress-bg">
                    <div className="progress-bar purple" style={{ width: `${(evaluationResult.metrics?.articulation_score || 0) * 10}%` }}></div>
                  </div>
                </div>

                <div className="score-bar-group">
                  <div className="score-row">
                    <span>Pronunciation score</span>
                    <span className="score-num">{(evaluationResult.metrics?.pronunciation_score || 0).toFixed(1)}/10</span>
                  </div>
                  <div className="progress-bg">
                    <div className="progress-bar indigo" style={{ width: `${(evaluationResult.metrics?.pronunciation_score || 0) * 10}%` }}></div>
                  </div>
                </div>

                <div className="score-bar-group">
                  <div className="score-row">
                    <span>Fluency score</span>
                    <span className="score-num">{(evaluationResult.metrics?.fluency_score || 0).toFixed(1)}/10</span>
                  </div>
                  <div className="progress-bg">
                    <div className="progress-bar blue" style={{ width: `${(evaluationResult.metrics?.fluency_score || 0) * 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Speaking Pace */}
            <div className="metric-card">
              <h4>Speech Pace</h4>
              <div className="metric-content flex-center">
                <div className="large-stat">{evaluationResult.metrics?.wpm || 0}</div>
                <div className="large-stat-label">Words Per Minute (WPM)</div>
                <div style={{ marginTop: '0.8rem' }}>
                  <span className={`speed-badge ${evaluationResult.metrics?.speaking_speed || 'normal'}`}>
                    {(evaluationResult.metrics?.speaking_speed || 'normal').replace('_', ' ')}
                  </span>
                </div>
                <p className="small-desc" style={{ marginTop: '0.8rem', textAlign: 'center' }}>
                  Ideal range: 120–160 WPM. Slow pace increases clarity, fast pace indicates nervousness.
                </p>
              </div>
            </div>

            {/* Card 3: Hesitation & Repetitions */}
            <div className="metric-card">
              <h4>Fillers & Repetitions</h4>
              <div className="metric-content">
                <div className="stat-row">
                  <div className="stat-col">
                    <span className="sub-stat">{evaluationResult.metrics?.filler_count || 0}</span>
                    <span className="sub-stat-label">Filler Words</span>
                  </div>
                  <div className="stat-col">
                    <span className="sub-stat">{evaluationResult.metrics?.repetition_count || 0}</span>
                    <span className="sub-stat-label">Repetitions</span>
                  </div>
                </div>

                {evaluationResult.metrics?.fillers && Object.keys(evaluationResult.metrics.fillers).length > 0 ? (
                  <div className="tag-section">
                    <div className="tag-label">Filler Breakdown:</div>
                    <div className="tag-container">
                      {Object.entries(evaluationResult.metrics.fillers).map(([word, count]) => (
                        <span key={word} className="metric-tag">{word}: {count}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="small-desc text-green" style={{ marginTop: '1rem', textAlign: 'center' }}>
                    Excellent! No filler words detected.
                  </p>
                )}
              </div>
            </div>

            {/* Card 4: Pauses & Silence */}
            <div className="metric-card">
              <h4>Pauses & Timing</h4>
              <div className="metric-content">
                <div className="stat-row flex-wrap">
                  <div className="stat-col">
                    <span className="sub-stat-small">{evaluationResult.metrics?.pause_count || 0}</span>
                    <span className="sub-stat-label">Pauses</span>
                  </div>
                  <div className="stat-col">
                    <span className="sub-stat-small">{(evaluationResult.metrics?.average_pause || 0).toFixed(1)}s</span>
                    <span className="sub-stat-label">Avg Pause</span>
                  </div>
                  <div className="stat-col">
                    <span className="sub-stat-small">{((evaluationResult.metrics?.speaking_ratio || 0) * 100).toFixed(0)}%</span>
                    <span className="sub-stat-label">Speaking Ratio</span>
                  </div>
                </div>
                <div className="audio-details-list" style={{ marginTop: '1rem' }}>
                  <div>Longest pause duration: {(evaluationResult.metrics?.longest_pause || 0).toFixed(1)}s</div>
                  <div>Medium pauses (0.5–1.5s): {evaluationResult.metrics?.medium_pause_count || 0}</div>
                  <div>Long pauses (&gt;1.5s): {evaluationResult.metrics?.long_pause_count || 0}</div>
                </div>
              </div>
            </div>

            {/* Card 5: Voice Modulation */}
            <div className="metric-card">
              <h4>Voice Modulation</h4>
              <div className="metric-content">
                <div className="stat-row">
                  <div className="stat-col">
                    <span className="sub-stat-small">{evaluationResult.metrics?.average_pitch ? `${evaluationResult.metrics.average_pitch.toFixed(0)} Hz` : 'N/A'}</span>
                    <span className="sub-stat-label">Avg Pitch</span>
                  </div>
                  <div className="stat-col">
                    <span className="sub-stat-small">{evaluationResult.metrics?.volume_stability ? `${(evaluationResult.metrics.volume_stability * 100).toFixed(0)}%` : 'N/A'}</span>
                    <span className="sub-stat-label">Volume Stability</span>
                  </div>
                </div>
                <div className="audio-details-list" style={{ marginTop: '1rem' }}>
                  <div>Pitch Range: {evaluationResult.metrics?.min_pitch ? `${evaluationResult.metrics.min_pitch.toFixed(0)}–${evaluationResult.metrics.max_pitch.toFixed(0)} Hz` : 'N/A'}</div>
                  <div>Pitch Jitter: {evaluationResult.metrics?.jitter ? (evaluationResult.metrics.jitter * 100).toFixed(2) + '%' : 'N/A'}</div>
                  <div>Harmonics-to-Noise: {evaluationResult.metrics?.hnr ? `${evaluationResult.metrics.hnr.toFixed(1)} dB` : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Card 6: Strengths & Improvements */}
            <div className="metric-card span-two-cols">
              <h4>Session Evaluation Bullets</h4>
              <div className="flex-row responsive-flex" style={{ gap: '2rem', justifyContent: 'space-between', textAlign: 'left' }}>
                <div style={{ flex: '1' }}>
                  <h5 style={{ color: 'var(--accent-color)', fontSize: '1rem', marginTop: '0', marginBottom: '0.5rem' }}>Strengths</h5>
                  <ul className="dashboard-list green-bullets">
                    {evaluationResult.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div style={{ flex: '1' }}>
                  <h5 style={{ color: 'var(--danger-color)', fontSize: '1rem', marginTop: '0', marginBottom: '0.5rem' }}>Areas to Improve</h5>
                  <ul className="dashboard-list red-bullets">
                    {evaluationResult.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            </div>
            
          </div>

          {/* Actionable Tips */}
          {evaluationResult.improvementTips && evaluationResult.improvementTips.length > 0 && (
            <div className="dashboard-section-card">
              <h4>Improvement Checklist</h4>
              <ul className="dashboard-list blue-bullets">
                {evaluationResult.improvementTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}

          {/* Transcript Section */}
          {evaluationResult.metrics?.transcript && (
            <div className="dashboard-section-card">
              <h4>Speech Transcript</h4>
              <p className="transcript-text">
                {highlightFillers(evaluationResult.metrics.transcript, evaluationResult.metrics.fillers)}
              </p>
              <div className="transcript-legend">
                <span className="legend-dot"></span> Highlighted words are filler words. Try replacing these with silent pauses.
              </div>
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <button className="btn-primary" onClick={() => navigate('/')}>Host Another Session</button>
          </div>

        </div>
      )}
    </div>
    </AuthenticatedLayout>
  );
};

const AudioVisualizer = ({ stream }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    let animationId;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#6366F1';
      canvasCtx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width="400" height="100" style={{ margin: '1rem auto', display: 'block', maxWidth: '100%' }} />;
};

export default App;
