import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

interface PerformanceChartProps {
  data: {
    standard: number;
    custom: number;
  };
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Instruction Count',
      'Standard RISC-V': data.standard,
      'Custom ISA': data.custom,
    },
  ];

  return (
    <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 50, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                    cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                    formatter={(value: number) => value.toLocaleString()}
                />
                <Legend wrapperStyle={{ position: 'relative', bottom: 10 }} />
                <Bar dataKey="Standard RISC-V" fill="#64748b" radius={[0, 4, 4, 0]} barSize={35}>
                    <LabelList dataKey="Standard RISC-V" position="right" style={{ fill: '#cbd5e1' }} formatter={(v:number) => `${v.toLocaleString()}`} />
                </Bar>
                <Bar dataKey="Custom ISA" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={35}>
                    <LabelList dataKey="Custom ISA" position="right" style={{ fill: '#f1f5f9' }} formatter={(v:number) => `${v.toLocaleString()}`} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};
