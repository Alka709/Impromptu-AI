import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Overview', path: '/admin', icon: 'dashboard' },
    { name: 'Users', path: '/admin/users', icon: 'users' },
    { name: 'Sessions', path: '/admin/sessions', icon: 'sessions' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950 text-white border-b border-zinc-900 flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center space-x-4">
          <button 
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight">ImpromptuAI</span>
            <span className="bg-white text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider">Admin</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={logout} 
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Exit Admin
          </button>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen bg-surface overflow-hidden">
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`w-64 border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 pt-16 h-full bg-white z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
              {user?.photo ? (
                <img src={user.photo} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">{user?.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Superadmin</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map((link) => {
              // Ensure exact match for /admin, prefix match for others
              const isActive = link.path === '/admin' 
                ? location.pathname === '/admin' || location.pathname === '/admin/'
                : location.pathname.startsWith(link.path);

              return (
                <Link 
                  key={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    isActive 
                      ? 'bg-zinc-950 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  to={link.path}
                >
                  {link.icon === 'dashboard' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  {link.icon === 'users' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  )}
                  {link.icon === 'sessions' && (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  )}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 md:ml-64 w-full p-4 md:p-8 overflow-y-auto">
          <Outlet context={{ user }} />
        </main>
      </div>
    </>
  );
}
