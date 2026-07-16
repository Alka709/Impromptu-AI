import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Clock, TrendingUp, Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export const SessionHistory = ({ user, setUser }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${user.id}/history`, { credentials: 'include' });
        if (res.ok) {
          setHistory(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  return (
    <div className="dashboard-layout">
      <Sidebar user={user} setUser={setUser} />
      
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h2>Session History</h2>
          <div className="user-profile">
            <span>{user.name}</span>
            <div className="user-avatar">{user.name.charAt(0)}</div>
          </div>
        </div>

        <div className="dashboard-content" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={22} color="var(--primary-color)" /> All Past Sessions
            </div>
            
            {loading ? (
              <div className="flex-center" style={{ padding: '3rem' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className="flex-center" style={{ padding: '3rem', color: 'var(--text-medium)' }}>
                You haven't completed any sessions yet!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-solid)', color: 'var(--text-light)' }}>
                      <th style={{ padding: '1rem' }}>Date</th>
                      <th style={{ padding: '1rem' }}>Topic</th>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Difficulty</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((session, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-solid)', transition: 'background 0.2s', cursor: 'pointer' }} 
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem', color: 'var(--text-medium)', fontSize: '0.9rem' }}>
                          {new Date(session.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                          {session.topic.length > 50 ? session.topic.substring(0, 50) + '...' : session.topic}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--secondary-color)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                            {session.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: session.difficulty === 'hard' ? 'rgba(248, 113, 113, 0.1)' : session.difficulty === 'medium' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(74, 222, 128, 0.1)', color: session.difficulty === 'hard' ? 'var(--danger-color)' : session.difficulty === 'medium' ? 'var(--warning-color)' : 'var(--success-color)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: session.overall_score >= 8 ? 'var(--success-color)' : session.overall_score >= 6 ? 'var(--warning-color)' : 'var(--danger-color)' }}>
                          {session.overall_score}/10
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};