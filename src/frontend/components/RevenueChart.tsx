"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RevenueChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(item => ({
    name: `Class ${item.category}`,
    revenue: item.total_revenue,
    count: item.brand_count
  }));

  const colors: Record<string, string> = {
    'Class A': '#10b981', // emerald-500
    'Class B': '#fbbf24', // amber-400
    'Class C': '#94a3b8'  // slate-400
  };

  return (
    <div className="h-72 w-full mt-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-600 mb-4 px-2">Revenue Contribution by Class</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            axisLine={false} 
            tickLine={false} 
            width={80}
          />
          <Tooltip 
            formatter={(value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value as number)}
            cursor={{fill: '#f1f5f9'}}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={100}>
            {
              chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.name]} />
              ))
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
