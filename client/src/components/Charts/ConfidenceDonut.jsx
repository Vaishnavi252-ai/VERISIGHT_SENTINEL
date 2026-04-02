import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#34d399', '#f59e0b', '#ef4444'];

function ConfidenceDonut({ data }) {
  const total = (data || []).reduce((a, b) => a + (b.count || 0), 0) || 1;
  const donutData = (data || []).map((d) => ({ name: d.label, value: d.count }));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="text-cyan-300 font-semibold mb-2">Confidence Distribution</div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="none">
              {donutData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0b1224', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }} />
            <Legend wrapperStyle={{ color: '#e5e7eb' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ConfidenceDonut;
