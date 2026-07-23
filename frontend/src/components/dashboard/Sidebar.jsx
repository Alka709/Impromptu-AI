import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Mic,
  Clock,
  BarChart2,
  Settings,
  User,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';

export default function Sidebar({ user, logout, startNewSession, isMobileOpen, onMobileClose }) {
  const location = useLocation();

  const NAV_LINKS = [
    { name: 'Home',            path: '/dashboard',         Icon: Home },
    { name: 'Sessions',        path: '#new-session', Icon: Mic, isAction: true },
    { name: 'Session History',  path: '/history',  Icon: Clock },
    { name: 'Progress',        path: '/progress', Icon: BarChart2 },
  ];

  const BOTTOM_LINKS = [
    { name: 'Profile',  path: '/settings', Icon: User },
  ];

  const userName = user?.name || 'Abhyuday';
  const userEmail = user?.email || 'abhyuday10081@gmail.com';
  const firstInitial = userName.charAt(0).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4 bg-white text-[#111111] select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 rounded-sm bg-[#111111] text-white flex items-center justify-center font-bold text-base shadow-sm">
          I
        </div>
        <span className="text-lg font-bold text-[#111111] tracking-tight">ImpromptuAi</span>
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 space-y-1.5" aria-label="Main navigation">
        {NAV_LINKS.map(({ name, path, Icon, isAction }) => {
          const active = location.pathname === path || (path === '/' && location.pathname === '/');
          
          if (isAction) {
            return (
              <button
                key={name}
                onClick={() => {
                  startNewSession();
                  onMobileClose?.();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium text-[#444444] hover:bg-[#F5F5F4] hover:text-[#111111] transition-colors duration-150"
              >
                <Icon size={18} strokeWidth={1.8} className="text-[#666666]" />
                {name}
              </button>
            );
          }

          return (
            <Link
              key={path}
              to={path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition-all duration-150 ${
                active
                  ? 'bg-[#EAF5ED] text-[#16A34A] font-semibold'
                  : 'text-[#444444] hover:bg-[#F5F5F4] hover:text-[#111111] font-medium'
              }`}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2 : 1.8}
                className={active ? 'text-[#16A34A]' : 'text-[#666666]'}
              />
              {name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-4 pt-4 border-t border-[#ECECEC]">
        {/* Secondary Links */}
        <div className="space-y-1">
          {BOTTOM_LINKS.map(({ name, path, Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={name}
                to={path}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-[#EAF5ED] text-[#16A34A] font-semibold'
                    : 'text-[#444444] hover:bg-[#F5F5F4] hover:text-[#111111]'
                }`}
              >
                <Icon size={18} strokeWidth={1.8} className="text-[#666666]" />
                {name}
              </Link>
            );
          })}
        </div>

        {/* User Card */}
        <div className="bg-[#F8F9FA] rounded-md p-2.5 border border-[#ECECEC] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#EAF5ED] text-[#16A34A] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D2EAD8]">
              {user?.photo ? (
                <img src={user.photo} alt={userName} className="w-full h-full rounded-md object-cover" />
              ) : (
                firstInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#111111] leading-tight truncate">
                {userName}
              </p>
              <p className="text-[10px] text-[#888888] truncate leading-tight mt-0.5">
                {userEmail}
              </p>
            </div>
          </div>
          <ChevronDown size={14} className="text-[#888888]" />
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            onMobileClose?.();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-sm font-medium text-[#444444] hover:text-[#111111] transition-colors duration-150"
          aria-label="Log out"
        >
          <LogOut size={18} strokeWidth={1.8} className="text-[#666666]" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#ECECEC] bg-white fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-60 bg-white border-r border-[#ECECEC] z-50 md:hidden flex flex-col"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-sm text-[#666666] hover:bg-[#F5F5F4]"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
