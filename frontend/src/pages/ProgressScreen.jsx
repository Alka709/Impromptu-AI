import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function ProgressScreen() {
  const { user } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetch(`${API_BASE}/users/${user.id}/history`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistory(data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setIsLoading(false);
        });
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full p-12 text-gray-500 font-medium">Loading your progress...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Progress Yet</h2>
        <p className="text-gray-500 max-w-md mb-8">You haven't completed any impromptu speeches yet. Start practicing to unlock your progress dashboard!</p>
        <Link to="/" className="px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors">Start Practicing</Link>
      </div>
    );
  }

  // Derived metrics
  const totalSessions = history.length;
  const sessionsThisMonth = history.filter(s => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  let scoreImprovement = 0;
  if (totalSessions > 1) {
    const half = Math.floor(totalSessions / 2);
    const firstHalf = history.slice(0, half);
    const secondHalf = history.slice(half);
    const avgFirst = firstHalf.reduce((acc, curr) => acc + curr.overall_score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((acc, curr) => acc + curr.overall_score, 0) / secondHalf.length;
    scoreImprovement = ((avgSecond - avgFirst) / avgFirst) * 100;
  }
  
  const formattedImprovement = scoreImprovement > 0 ? `+${scoreImprovement.toFixed(0)}%` : `${scoreImprovement.toFixed(0)}%`;
  const improvementColor = scoreImprovement > 0 ? 'text-green-500' : (scoreImprovement < 0 ? 'text-red-500' : 'text-gray-500');

  const avgOverallScore = totalSessions > 0 
    ? (history.reduce((acc, curr) => acc + curr.overall_score, 0) / totalSessions).toFixed(1) 
    : 0;

  // Area Chart Data (Overall Score Over Time)
  const areaChartData = history.map((s, index) => ({
    name: `S${index + 1}`,
    date: new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: s.overall_score
  }));

  // Radar Chart Data (Average Skills)
  let avgFluency = 0, avgConfidence = 0, avgPacing = 0;
  let sessionsWithMetrics = 0;
  
  history.forEach(s => {
    if (s.metrics) {
      avgFluency += (s.metrics.fluency_score || 0);
      avgConfidence += (s.metrics.articulation_score || 0);
      const wpm = s.metrics.wpm || 0;
      const pacing = Math.max(0, 10 - (Math.abs(150 - wpm) / 15));
      avgPacing += pacing;
      sessionsWithMetrics++;
    }
  });

  if (sessionsWithMetrics > 0) {
    avgFluency /= sessionsWithMetrics;
    avgConfidence /= sessionsWithMetrics;
    avgPacing /= sessionsWithMetrics;
  }

  const radarData = [
    { subject: 'Fluency', score: parseFloat(avgFluency.toFixed(1)) },
    { subject: 'Confidence', score: parseFloat(avgConfidence.toFixed(1)) },
    { subject: 'Content', score: parseFloat(avgOverallScore) },
    { subject: 'Pacing', score: parseFloat(avgPacing.toFixed(1)) },
  ];

  // Pie Chart Data (Category Distribution)
  const categoryCounts = {};
  history.forEach(s => {
    const cat = s.category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  const pieData = Object.keys(categoryCounts).map(key => ({
    name: key,
    value: categoryCounts[key]
  }));
  const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="p-8 pb-24">
      {/*  Page Title  */}
      <section className="mb-8">
        <h2 className="text-3xl font-extrabold text-impromptu-black">Your Progress</h2>
        <p className="text-gray-500 mt-1">Track how your speaking skills are improving over time.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-purpose="metrics-summary">
        <div className="bg-white p-6 rounded-2xl border border-impromptu-border shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sessions This Month</p>
          <p className="text-3xl font-extrabold text-impromptu-black">{sessionsThisMonth}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-impromptu-border shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Average Score</p>
          <p className="text-3xl font-extrabold text-impromptu-black">{avgOverallScore}/10</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-impromptu-border shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Score Trend (Recent vs Past)</p>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-extrabold ${improvementColor}`}>{formattedImprovement}</span>
          </div>
        </div>
      </section>

      <section className="bg-white p-8 rounded-2xl border border-impromptu-border shadow-sm mb-8" data-purpose="main-chart">
        <h3 className="text-lg font-bold text-impromptu-black mb-6">Overall Score Over Time</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 14 }} dy={10} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 14 }} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-purpose="detailed-metrics">
        {/*  Skill Breakdown (Spider/Radar)  */}
        <div className="bg-white p-8 rounded-2xl border border-impromptu-border shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-impromptu-black mb-6">Average Skill Breakdown</h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name="Average Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/*  Category Distribution  */}
        <div className="bg-white p-8 rounded-2xl border border-impromptu-border shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-impromptu-black mb-6">Topics Practiced</h3>
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
