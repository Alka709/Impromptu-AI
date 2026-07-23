import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage({ setUser }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

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
    try {
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
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Failed to connect to server.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <>
<header className="fixed top-0 left-0 w-full z-10 px-8 py-4 flex justify-between items-center bg-transparent pointer-events-none">
{/*  Brand Name  */}
<div className="pointer-events-auto">
<h1 className="text-xl font-bold tracking-tight">ImpromptuAI</h1>
</div>
</header>
<main className="min-h-screen flex flex-col lg:flex-row w-full">
<section className="flex-1 bg-[#f1efea] hidden lg:flex items-center justify-center relative" data-purpose="marketing-section">
<div className="mic-box">
{/*  Microphone Icon Circle  */}
<div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-black mb-8">
<svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
</div>
{/*  Tagline  */}
<p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
          Visualizing your journey to public speaking mastery with real-time AI feedback.
        </p>
</div>
</section>
<section className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12 md:px-12 w-full lg:w-1/2" data-purpose="login-form-container">
<div className="w-full max-w-md space-y-8 mt-12 lg:mt-0">
{/*  Login Heading  */}
<div className="text-left">
<h2 className="text-4xl font-bold text-black mb-10">Login</h2>
</div>
{authError && <div className="text-red-500 text-sm mb-4">{authError}</div>}
{message && <div className="text-green-600 text-sm mb-4">{message}</div>}

<form onSubmit={handleLogin} className="space-y-6" method="POST">
{/*  Email Field  */}
<div data-purpose="email-input-group">
<label className="block text-xs font-medium text-gray-500 mb-2" htmlFor="email">Email</label>
<input className="block w-full px-4 py-3 border border-gray-200 rounded-custom focus:ring-0 focus:border-black transition-colors placeholder:text-gray-300" id="email" name="email" placeholder="email@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
</div>
{/*  Password Field  */}
<div data-purpose="password-input-group">
<div className="flex justify-between items-center mb-2">
<label className="block text-xs font-medium text-gray-500" htmlFor="password">Password</label>
<a className="text-xs text-gray-500 hover:underline" href="#">Forgot Password?</a>
</div>
<input className="block w-full px-4 py-3 border border-gray-200 rounded-custom focus:ring-0 focus:border-black transition-colors placeholder:text-gray-300" id="password" name="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
</div>
{/*  Remember Me  */}
<div className="flex items-center" data-purpose="remember-me-checkbox">
<input className="h-4 w-4 text-black border-gray-300 rounded focus:ring-transparent" id="remember-me" name="remember-me" type="checkbox"/>
<label className="ml-2 block text-xs text-gray-500" htmlFor="remember-me">
              Remember Me
            </label>
</div>
{/*  Login Button  */}
<div className="pt-2">
<button className="w-full bg-black text-white py-3 px-4 rounded-full font-bold text-sm tracking-widest hover:bg-gray-800 transition-all uppercase" data-purpose="submit-login" type="submit">
              LOGIN
            </button>
</div>
{/*  Social Login  */}
<div className="pt-1">
<button className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-4 rounded-full font-bold text-xs border border-black hover:bg-gray-50 transition-all uppercase" data-purpose="google-login" type="button" onClick={handleGoogleLogin}>
{/*  Google Icon  */}
<svg height="16" viewBox="0 0 48 48" width="16">
<path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
<path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
<path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
<path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
<path d="M0 0h48v48H0z" fill="none" />
</svg>
              SIGN IN WITH GOOGLE
            </button>
</div>
{/*  Divider  */}
<div className="relative flex items-center justify-center">
<div className="flex-grow border-t border-gray-200"></div>
<span className="mx-4 text-[10px] text-gray-400 font-medium tracking-widest uppercase">OR</span>
<div className="flex-grow border-t border-gray-200"></div>
</div>
{/*  Create Account Button  */}
<div className="pt-1">
<button className="w-full bg-white text-black py-3 px-4 rounded-full font-bold text-xs border border-black hover:bg-gray-50 transition-all uppercase" data-purpose="create-account" type="button" onClick={() => navigate('/signup')}>
              CREATE ACCOUNT
            </button>
</div>
</form>
</div>
</section>
</main>
    </>
  );
}
