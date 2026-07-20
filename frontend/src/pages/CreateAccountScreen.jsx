import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CreateAccountScreen({ setUser }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: fullName, password, confirmPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        navigate('/');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <>
<header className="h-16 w-full flex items-center justify-between px-8 border-b border-gray-100 bg-white sticky top-0 z-50" data-purpose="global-navigation">
<div className="flex items-center">
<span className="text-xl font-bold tracking-tight">Impromptu</span>
</div>
</header>
<main className="flex w-full split-container">
<section className="hidden lg:flex flex-1 bg-surface items-center justify-center relative p-12" data-purpose="decorative-branding">
<div className="w-full max-w-md flex flex-col items-center text-center">
<div className="w-64 h-48 mic-logo-container rounded-custom flex flex-col items-center justify-center space-y-6 bg-white/30">
<div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center">
<svg className="text-slate-800" fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
</div>
<p className="text-slate-600 text-sm px-8 leading-relaxed">
            Visualizing your journey to public speaking mastery with real-time AI feedback.
          </p>
</div>
</div>
</section>
<section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto" data-purpose="registration-form-area">
<div className="form-container w-full max-w-md">
<header className="mb-8">
<h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
<p className="text-slate-500 text-sm">Join the community and start speaking.</p>
</header>

{error && <div className="text-red-500 text-sm mb-4">{error}</div>}
{message && <div className="text-green-600 text-sm mb-4">{message}</div>}

<form className="space-y-4" onSubmit={handleSignup}>
{/*  Full Name  */}
<div className="space-y-1.5">
<label className="block text-xs font-medium text-slate-700" htmlFor="full_name">Full Name</label>
<input className="w-full px-4 py-2.5 rounded-custom border border-slate-200 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" id="full_name" name="full_name" placeholder="Enter your full name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
</div>
{/*  Email Address  */}
<div className="space-y-1.5">
<label className="block text-xs font-medium text-slate-700" htmlFor="email">Email Address</label>
<input className="w-full px-4 py-2.5 rounded-custom border border-slate-200 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" id="email" name="email" placeholder="name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
</div>
{/*  Password  */}
<div className="space-y-1.5">
<label className="block text-xs font-medium text-slate-700" htmlFor="password">Password</label>
<input className="w-full px-4 py-2.5 rounded-custom border border-slate-200 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" id="password" name="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
</div>
{/*  Confirm Password  */}
<div className="space-y-1.5">
<label className="block text-xs font-medium text-slate-700" htmlFor="confirm_password">Confirm Password</label>
<input className="w-full px-4 py-2.5 rounded-custom border border-slate-200 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" id="confirm_password" name="confirm_password" placeholder="••••••••" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
</div>
{/*  Primary CTA  */}
<button className="w-full bg-[#0a0a0a] text-white font-semibold py-3 rounded-full hover:bg-slate-800 transition-colors mt-2 text-sm" type="submit">
            Create Account
          </button>
{/*  Social Signup  */}
<button className="w-full bg-white border border-slate-200 text-slate-900 font-semibold py-3 rounded-full hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 text-sm" type="button" onClick={handleGoogleLogin}>
<svg className="w-4 h-4" viewBox="0 0 24 24">
<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
</svg>
<span>Sign up with Google</span>
</button>
{/*  Divider  */}
<div className="relative flex py-2 items-center">
<div className="flex-grow border-t border-slate-100"></div>
<span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">OR</span>
<div className="flex-grow border-t border-slate-100"></div>
</div>
{/*  Login Link  */}
<p className="text-center text-xs text-slate-500">
            Already have an account? <Link className="text-slate-900 font-bold underline underline-offset-2" to="/login">Login</Link>
</p>
</form>
</div>
</section>
</main>
    </>
  );
}
