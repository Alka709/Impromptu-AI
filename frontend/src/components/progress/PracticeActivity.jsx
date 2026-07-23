import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const val = d.sessions;
  return (
    <div className="bg-white border border-[#ECECEC] rounded-md px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-[#888888] mb-0.5">{d.range || d.week}</p>
      <p className="text-base font-extrabold text-[#111111]">
        {val} session{val !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export default function PracticeActivity({ data }) {
  // data: [{ week: 'Jul 19', sessions: 5, range: 'Jul 19 - Jul 25' }, ...]
  const chartData = (data && data.length > 0) ? data : [
    { week: 'W1', sessions: 0 },
    { week: 'W2', sessions: 0 },
    { week: 'W3', sessions: 0 },
    { week: 'W4', sessions: 0 },
  ];
  const maxSessions = Math.max(...chartData.map(d => d.sessions), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-md px-8 pt-8 pb-6 shadow-sm flex flex-col"
    >
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-[#111111] tracking-tight">Practice Activity</h2>
        <p className="text-sm text-[#888888] mt-1">Weekly practice frequency over time.</p>
      </div>

      <div className="w-full h-[260px] min-h-[260px]">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              horizontal
              vertical={false}
              stroke="#F0F0F0"
            />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AAAAAA', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AAAAAA', fontSize: 12 }}
              allowDecimals={false}
              width={32}
              domain={[0, maxSessions > 0 ? Math.max(maxSessions + 1, 5) : 5]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7FBF8' }} />
            <Bar dataKey="sessions" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.sessions > 0 ? '#16A34A' : '#E5E7EB'}
                  fillOpacity={entry.sessions > 0 ? 0.9 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
