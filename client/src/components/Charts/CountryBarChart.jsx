import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function CountryBarChart({ data }) {
  const colors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="text-purple-300 font-semibold mb-2">Top Countries by Detections</div>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
            <XAxis type="number" stroke="#9ca3af" />
            <YAxis type="category" dataKey="country" width={60} stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#0b1224', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }} />
            <Bar dataKey="count">
              {(data || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.threatLevel] || '#06b6d4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CountryBarChart;
