import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Mic, Home, User, Settings, LogOut, TrendingUp, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sidebar } from './Sidebar';
import { NewSession } from './NewSession';
import { SessionHistory } from './SessionHistory';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

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
        <Route path="/new-session" element={user ? <NewSession user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <SessionHistory user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/session/:id" element={user ? <SessionFlow user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

const GOOGLE_OAUTH_URL = `${API_BASE}/auth/google`;

const GoogleButton = () => (
  <button
    type="button"
    className="btn-google"
    onClick={() => { window.location.href = GOOGLE_OAUTH_URL; }}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
    Continue with Google
  </button>
);

const AuthDivider = () => (
  <div className="auth-divider">
    <span className="auth-divider-line" />
    <span className="auth-divider-text">or</span>
    <span className="auth-divider-line" />
  </div>
);

const Login = ({ setUser }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err) {
      setAuthError('Authentication failed. Please try again.');
    }
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setMessage('');
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.requiresOtp) {
      setMessage(data.message);
      setStep(2);
    } else {
      setAuthError(data.error || 'Login failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch(`${API_BASE}/auth/login/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      navigate('/');
    } else {
      setAuthError(data.error || 'OTP verification failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <AppLogo />
        </div>
        <h2>Welcome back</h2>
        <p style={{ color: 'var(--text-medium)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>Sign in to continue your practice</p>

        {authError && <div className="auth-error-banner">{authError}</div>}
        {message && <div style={{ color: 'var(--primary-color)', padding: '10px', background: '#eef2ff', borderRadius: '5px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{message}</div>}

        {step === 1 && (
          <>
            <GoogleButton />
            <AuthDivider />
            <form onSubmit={handleLogin} className="flex-col">
              <input className="input-field" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
              <input className="input-field" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
              <button type="submit" className="btn-primary">Log In</button>
            </form>
            <p className="link-text" onClick={() => navigate('/signup')}>Need an account? Sign up</p>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex-col">
            <input className="input-field" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)} required maxLength={6} />
            <button type="submit" className="btn-primary">Verify & Log In</button>
            <p className="link-text" onClick={() => setStep(1)}>Back to login</p>
          </form>
        )}
      </div>
    </div>
  );
};

const Signup = ({ setUser }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setMessage('');
    const res = await fetch(`${API_BASE}/auth/signup/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setStep(2);
    } else {
      setAuthError(data.error || 'Failed to request OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setMessage('');
    const res = await fetch(`${API_BASE}/auth/signup/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setStep(3);
    } else {
      setAuthError(data.error || 'OTP verification failed');
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch(`${API_BASE}/auth/signup/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, confirmPassword }),
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUser(data.user);
      navigate('/');
    } else {
      setAuthError(data.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <AppLogo />
        </div>
        <h2>Create account</h2>
        <p style={{ color: 'var(--text-medium)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>Start your public speaking journey</p>

        {authError && <div className="auth-error-banner">{authError}</div>}
        {message && <div style={{ color: 'var(--primary-color)', padding: '10px', background: '#eef2ff', borderRadius: '5px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{message}</div>}

        {step === 1 && (
          <>
            <GoogleButton />
            <AuthDivider />
            <form onSubmit={handleRequestOtp} className="flex-col">
              <input className="input-field" type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} required />
              <button type="submit" className="btn-primary">Send OTP</button>
            </form>
            <p className="link-text" onClick={() => navigate('/login')}>Already have an account? Log in</p>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex-col">
            <p style={{textAlign: 'center', fontSize: '0.9rem'}}>An OTP has been sent to {email}</p>
            <input className="input-field" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)} required maxLength={6} />
            <button type="submit" className="btn-primary">Verify Email</button>
            <p className="link-text" onClick={() => setStep(1)}>Back</p>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCompleteSignup} className="flex-col">
            <input className="input-field" type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">Complete Account Setup</button>
          </form>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ user, setUser }) => {
  const [data, setData] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user.id}/dashboard`, { credentials: 'include' });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, [user]);

    const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {}
    setUser(null);
  };

  const chartData = data?.recentSessions?.slice().reverse().map((s, i) => ({
    name: `S${i+1}`,
    score: s.overall_score
  })) || [];

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} setUser={setUser} />

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h2>Dashboard</h2>
          <div className="user-profile">
            <span>{user.name}</span>
            <div className="user-avatar">{user.name.charAt(0)}</div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-grid">
            <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
              <div className="card-header">Ready for practice?</div>
              <p style={{ color: 'var(--text-medium)', marginBottom: '1rem' }}>Head over to the sessions page to choose your topic and start a new impromptu speech.</p>
              <button className="btn-primary" onClick={() => navigate('/new-session')} style={{ width: 'fit-content' }}>
                Go to Sessions
              </button>
            </div>

            <div className="dashboard-card">
              <div className="card-header">Average Score <TrendingUp size={18} color="var(--primary-color)" /></div>
              <div className="stat-value">{data?.averageScore || '0.0'}</div>
              <p>Across {data?.totalSessions || 0} sessions</p>
            </div>

            <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
              <div className="card-header">Progress Over Time</div>
              <div style={{ width: '100%', height: '200px' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--secondary-color)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--secondary-color)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" />
                      <YAxis stroke="#64748B" domain={[0, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-solid)' }} />
                      <Area type="monotone" dataKey="score" stroke="var(--secondary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-center" style={{ height: '100%', color: 'var(--text-medium)' }}>Not enough data</div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">Recent Activity <Clock size={18} color="var(--accent-color)" /></div>
              <div className="recent-sessions-list">
                {data?.recentSessions?.slice(0, 3).map((s, i) => (
                  <div className="recent-session-item" key={i}>
                    <div>
                      <div className="rs-topic">{s.topic.substring(0, 30)}...</div>
                      <div className="rs-date">{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="rs-score">{s.overall_score}/10</div>
                  </div>
                ))}
                {(!data?.recentSessions || data.recentSessions.length === 0) && (
                  <p>No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
