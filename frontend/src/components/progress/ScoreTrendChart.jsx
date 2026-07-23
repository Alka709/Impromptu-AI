import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── custom tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-[#ECECEC] rounded-md px-3 py-2 shadow-md">
      <p className="text-[11px] font-semibold text-[#888888] mb-0.5">{label}</p>
      <p className="text-lg font-extrabold text-[#111111]">
        {Number(payload[0].value).toFixed(1)}
        <span className="text-xs font-medium text-[#888888] ml-0.5">/10</span>
      </p>
    </div>
  );
}

export default function ScoreTrendChart({ data }) {
  // data: [{ date: 'Jul 17', score: 7.2 }, ...]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-md px-8 pt-8 pb-6 shadow-sm w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[22px] font-bold text-[#111111] tracking-tight">Overall Score Over Time</h2>
        <p className="text-sm text-[#888888] mt-1">Your performance across every session.</p>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px] min-h-[280px]">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              horizontal
              vertical={false}
              stroke="#F0F0F0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AAAAAA', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              domain={[0, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AAAAAA', fontSize: 12 }}
              ticks={[0, 2.5, 5, 7.5, 10]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ECECEC', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#16A34A"
              strokeWidth={2.5}
              fill="url(#scoreGradient)"
              dot={{ r: 4, fill: '#16A34A', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-2 mt-4 justify-center">
        <span className="w-6 h-0.5 bg-[#16A34A] inline-block rounded-full" />
        <span className="text-xs font-semibold text-[#888888]">Average Score</span>
      </div>
    </motion.div>
  );
}
