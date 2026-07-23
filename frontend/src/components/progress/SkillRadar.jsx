import React from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-[#ECECEC] rounded-md px-3 py-2 shadow-md">
      <p className="text-xs font-bold text-[#111111]">{payload[0].payload.subject}</p>
      <p className="text-sm font-extrabold text-[#16A34A] mt-0.5">
        {Number(payload[0].value).toFixed(1)}
        <span className="text-xs font-medium text-[#888888]">/10</span>
      </p>
    </div>
  );
}

export default function SkillRadar({ data }) {
  // data: [{ subject: 'Fluency', score: 7.2 }, ...]
  const hasData = data && data.some(d => d.score > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#ECECEC] rounded-md px-8 pt-8 pb-6 shadow-sm flex flex-col"
    >
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-[#111111] tracking-tight">Skill Breakdown</h2>
        <p className="text-sm text-[#888888] mt-1">Average across all sessions with metrics.</p>
      </div>

      <div className="w-full h-[260px] min-h-[260px]">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid
              stroke="#ECECEC"
              strokeWidth={1}
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#555555', fontSize: 13, fontWeight: 600 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#16A34A"
              strokeWidth={2}
              fill="#16A34A"
              fillOpacity={0.12}
              dot={{ r: 4, fill: '#16A34A', strokeWidth: 0 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <p className="text-center text-sm text-[#888888] mt-2">
          Skill data will appear after sessions with detailed metrics.
        </p>
      )}
    </motion.div>
  );
}
