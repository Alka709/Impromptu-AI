import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardHero from '../components/dashboard/DashboardHero';
import CommunicationSnapshot from '../components/dashboard/CommunicationSnapshot';
import ContinueSessionCard from '../components/dashboard/ContinueSessionCard';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function DashboardScreen() {
  const { user, startNewSession } = useOutletContext();

  const [dashData, setDashData] = useState({
    recentSessions: [],
    averageScore: null,
    totalSessions: 0,
    bestScore: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user.id}/dashboard`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setDashData(data);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  const latestSession = dashData.recentSessions?.[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-[#FAFAF8] px-6 md:px-12 lg:px-16 py-8 max-w-[1600px] mx-auto w-full flex flex-col gap-8"
    >
      {/* Greeting header */}
      <DashboardHeader user={user} />

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col gap-8 animate-pulse">
          {/* Hero skeleton */}
          <div
            className="rounded-md bg-[#E8E8E8] w-full"
            style={{ height: 340 }}
          />
          {/* Snapshot skeleton */}
          <div className="rounded-md bg-[#E8E8E8] h-36 w-full" />
          {/* Continue skeleton */}
          <div className="rounded-md bg-[#E8E8E8] h-28 w-full" />
        </div>
      ) : (
        <>
          {/* 1. Full-width Hero */}
          <DashboardHero startNewSession={startNewSession} />

          {/* 2. Communication Snapshot */}
          <CommunicationSnapshot dashData={dashData} />

          {/* 3. Continue where you left off */}
          <ContinueSessionCard
            session={latestSession}
            startNewSession={startNewSession}
          />
        </>
      )}
    </motion.div>
  );
}
