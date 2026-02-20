"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function MarginBleedersChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-96 w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Top 10 Margin Bleeders</h3>
        <p className="text-sm text-slate-500">Products with the lowest True Margin after excise taxes and freight.</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `$${value}`}
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            dataKey="description" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 11, fill: '#64748b'}}
            width={120}
          />
          <Tooltip 
            formatter={(value: any, name?: string) => [
              new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number),
              name === 'true_margin' ? 'True Margin' : name
            ]}
            cursor={{fill: '#f1f5f9'}}
          />
          <Bar dataKey="true_margin" radius={[0, 4, 4, 0]} maxBarSize={40}>
            {
              data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.true_margin < 0 ? '#ef4444' : '#f87171'} />
              ))
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
