"use client";

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function CapitalTrapsScatter({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-96 w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Working Capital Traps</h3>
        <p className="text-sm text-slate-500">Brands with high capital tied up and long days-to-sell.</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            type="number" 
            dataKey="avg_days_to_sell" 
            name="Days to Sell" 
            unit=" days" 
            axisLine={false} 
            tickLine={false}
            tick={{fontSize: 12, fill: '#64748b'}}
          />
          <YAxis 
            type="number" 
            dataKey="capital_tied_up" 
            name="Capital Tied Up" 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            axisLine={false} 
            tickLine={false}
            tick={{fontSize: 12, fill: '#64748b'}}
            width={80}
          />
          <ZAxis type="category" dataKey="description" name="Brand" />
          <Tooltip 
            cursor={{strokeDasharray: '3 3'}}
            formatter={(value: any, name: string) => {
              if (name === 'Capital Tied Up') {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value as number);
              }
              if (name === 'Days to Sell') {
                return `${(value as number).toFixed(1)} days`;
              }
              return value;
            }}
          />
          <Scatter name="Brands" data={data} fill="#a855f7" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
