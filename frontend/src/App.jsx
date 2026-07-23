import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import new page components
import LoginPage from './pages/LoginPage';
import CreateAccountScreen from './pages/CreateAccountScreen';
import DashboardScreen from './pages/DashboardScreen';
import SessionFlow from './pages/SessionFlow';
import SessionHistoryScreen from './pages/SessionHistoryScreen';
import ProgressScreen from './pages/ProgressScreen';
import SettingsScreen from './pages/SettingsScreen';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardScreen from './pages/admin/AdminDashboardScreen';
import AdminUsersScreen from './pages/admin/AdminUsersScreen';
import AdminUserDetailScreen from './pages/admin/AdminUserDetailScreen';
import AdminSessionsScreen from './pages/admin/AdminSessionsScreen';
import AdminSessionDetailScreen from './pages/admin/AdminSessionDetailScreen';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

const App = () => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const res = await fetch(`${API_BASE}/auth/me`, { 
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
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

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch(e) {}
    setUser(null);
  };

  if (loadingAuth) return <div className="flex items-center justify-center h-screen bg-surface">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page as the Root */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage setUser={setUser} />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <CreateAccountScreen setUser={setUser} />} />

        {/* Unified Session Flow Component (Full Screen, No Sidebar) */}
        <Route path="/session/:id" element={user ? <SessionFlow user={user} logout={logout} /> : <Navigate to="/login" />} />

        {/* Protected Dashboard Routes with Shared Layout */}
        <Route element={user ? <MainLayout user={user} logout={logout} /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/history" element={<SessionHistoryScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={user && user.role === 'admin' ? <AdminLayout user={user} logout={logout} /> : <Navigate to="/" />}>
          <Route index element={<AdminDashboardScreen />} />
          <Route path="users" element={<AdminUsersScreen />} />
          <Route path="users/:id" element={<AdminUserDetailScreen />} />
          <Route path="sessions" element={<AdminSessionsScreen />} />
          <Route path="sessions/:id" element={<AdminSessionDetailScreen />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
