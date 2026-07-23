import React from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHeader({ user }) {
  const nameToUse = user?.name || 'Abhyuday';
  const firstName = nameToUse.split(' ')[0];
  const firstInitial = firstName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start justify-between w-full"
    >
      {/* Left: Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-[#111111] tracking-tight leading-none">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-[#666666] mt-2 font-normal">
          Let's continue improving your communication skills.
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="w-9 h-9 flex items-center justify-center rounded-md border border-[#ECECEC] bg-white text-[#444444] hover:text-[#111111] hover:border-[#CCCCCC] transition-colors duration-150 shadow-sm"
        >
          <Bell size={16} strokeWidth={1.8} />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-md border border-[#D2EAD8] bg-[#EAF5ED] text-[#16A34A] overflow-hidden flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
          {user?.photo ? (
            <img
              src={user.photo}
              alt={nameToUse}
              className="w-full h-full object-cover"
            />
          ) : (
            firstInitial
          )}
        </div>
      </div>
    </motion.div>
  );
}
