"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RecordType {
  brand: number | string;
  description: string;
  total_volume: number;
  safety_stock: number;
  shock_safety_stock: number;
  additional_capital_tied_up: number;
}

interface SafetyStockProps {
  data: RecordType[];
}

export default function SafetyStockSimulator({ data }: SafetyStockProps) {
  if (!data || data.length === 0) return <div>Loading Simulation Data...</div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-md">
          <p className="font-medium text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()} units
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-sm text-red-600 font-medium">
              Added Capital Bound: ${payload[0].payload.additional_capital_tied_up.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-row justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Safety Stock Shock Simulator</h2>
          <p className="text-slate-500 text-sm mt-1">Impact of a 50% increase in Supplier Lead Time Variance</p>
        </div>
        <div className="px-3 py-1 bg-red-50 border border-red-100 rounded-full">
           <span className="text-red-600 text-xs font-semibold tracking-wider uppercase">High Capital Risk</span>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="description" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar 
              dataKey="safety_stock" 
              name="Baseline Safety Stock" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            <Bar 
              dataKey="shock_safety_stock" 
              name="Shock Scenario (+50% Variance)" 
              fill="#EF4444" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
              animationBegin={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
