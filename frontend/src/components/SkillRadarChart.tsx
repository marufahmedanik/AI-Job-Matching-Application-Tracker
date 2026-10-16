import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import type { RadarItem } from '../types';

interface SkillRadarChartProps {
  data: RadarItem[];
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 my-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          📊 Domain Competency Radar
        </h4>
        <span className="text-[10px] text-slate-500">Candidate vs. Circular Requirement</span>
      </div>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke="#475569"
              tick={{ fill: '#64748b', fontSize: 9 }}
            />
            <Radar
              name="Required"
              dataKey="required"
              stroke="#64748b"
              fill="#64748b"
              fillOpacity={0.2}
              strokeDasharray="3 3"
            />
            <Radar
              name="Candidate"
              dataKey="candidate"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f8fafc'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
