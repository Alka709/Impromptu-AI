import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PALETTE = [
  '#16A34A', // green
  '#4ADE80', // light green
  '#86EFAC', // mint
  '#D97706', // amber
  '#6B7280', // gray
  '#A3A3A3', // light gray
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-[#ECECEC] rounded-md px-3 py-2 shadow-md">
      <p className="text-xs font-bold text-[#111111]">{d.name}</p>
      <p className="text-xs text-[#888888] mt-0.5">{d.value} session{d.value !== 1 ? 's' : ''}</p>
      {d.avgScore != null && (
        <p className="text-xs text-[#16A34A] font-semibold mt-0.5">Avg {d.avgScore}/10</p>
      )}
    </div>
  );
}

export default function TopicsChart({ data }) {
  // data: [{ name: 'Technology', value: 10, avgScore: 8.4 }]
  const total = (data || []).reduce((s, d) => s + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#FFFFFF] border border-[#ECECEC] rounded-md px-8 pt-8 pb-6 shadow-sm flex flex-col"
    >
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-[#111111] tracking-tight">Topics Practiced</h2>
        <p className="text-sm text-[#888888] mt-1">Category distribution across all sessions.</p>
      </div>

      {/* Donut */}
      <div className="w-full h-[220px] min-h-[220px]">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {(data || []).map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={PALETTE[i % PALETTE.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2.5">
        {(data || []).map((item, i) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-sm font-medium text-[#333333] truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {item.avgScore != null && (
                <span className="text-sm font-bold text-[#111111]">
                  {item.avgScore}
                  <span className="text-xs font-medium text-[#888888]">/10</span>
                </span>
              )}
              <span className="text-xs font-medium text-[#888888] w-12 text-right">
                ({item.value})
              </span>
            </div>
          </div>
        ))}
        {total > 0 && (
          <p className="text-[11px] text-[#AAAAAA] pt-1">( ) = Number of sessions</p>
        )}
      </div>
    </motion.div>
  );
}
