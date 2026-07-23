import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

export default function AdminUsersScreen() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center">Loading users...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">User Management</h1>
        <p className="text-gray-500 mt-2">Total registered users: {users.length}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">ID</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">User</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Stats</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Role</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Verified</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr 
                  key={u.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                >
                  <td className="p-4 text-sm font-mono text-gray-400">{u.id.slice(0,8)}...</td>
                  <td className="p-4 text-sm font-semibold">
                    <div className="leading-none">{u.name}</div>
                    <div className="text-xs text-gray-500 font-normal mt-1">{u.email}</div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="text-gray-900 font-semibold">{u.totalSessions} sessions</div>
                    <div className="text-xs text-gray-500 mt-1">Avg: {u.averageScore ? Number(u.averageScore).toFixed(1) : '-'} | Best: {u.bestScore ? Number(u.bestScore).toFixed(1) : '-'}</div>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${u.role === 'admin' ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full tracking-wider ${u.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{u.createdAt ? u.createdAt.split(' ')[0] : '-'}</td>
                  <td className="p-4 text-sm text-gray-500">{u.createdAt ? u.createdAt.split(' ')[1] : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-semibold">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
