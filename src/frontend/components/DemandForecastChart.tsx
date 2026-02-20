"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

interface ForecastDataPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

interface DemandForecastChartProps {
  data: {
    brand_name: string;
    forecast: ForecastDataPoint[];
  } | null;
}

export default function DemandForecastChart({ data }: DemandForecastChartProps) {
  if (!data || !data.forecast || data.forecast.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="text-lg font-medium text-slate-800">No Forecast Data</h3>
        <p className="text-slate-500 text-sm mt-1">Unable to load demand forecast at this time.</p>
      </div>
    );
  }

  // Format dates for display
  const formattedData = data.forecast.map((d) => ({
    ...d,
    displayDate: new Date(d.ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    yhat: Math.max(0, Math.round(d.yhat)),
    yhat_lower: Math.max(0, Math.round(d.yhat_lower)),
    yhat_upper: Math.max(0, Math.round(d.yhat_upper)),
    // For recharts Area chart, representing the "band" is tricky, but we can use ranges
    // Alternatively, we plot yhat, and a separate area for the range.
    range: [Math.max(0, Math.round(d.yhat_lower)), Math.max(0, Math.round(d.yhat_upper))]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-indigo-600 font-medium flex justify-between gap-4">
              <span>Predicted Demand:</span>
              <span>{payload.find((p: any) => p.dataKey === 'yhat')?.value} units</span>
            </p>
            <p className="text-slate-500 flex justify-between gap-4 text-xs">
              <span>Optimistic:</span>
              <span>{payload.find((p: any) => p.dataKey === 'yhat_upper')?.value} units</span>
            </p>
            <p className="text-slate-500 flex justify-between gap-4 text-xs">
              <span>Pessimistic:</span>
              <span>{payload.find((p: any) => p.dataKey === 'yhat_lower')?.value} units</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Demand Forecast (Next 30 Days)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Predicted daily sales for top brand: <span className="font-medium text-slate-700">{data.brand_name}</span>
          </p>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorYhat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* The Confidence Interval Area */}
            <Area 
              type="monotone" 
              dataKey="yhat_upper" 
              stroke="none" 
              fillOpacity={1} 
              fill="url(#colorRange)" 
              name="Upper Bound"
              legendType="none"
              tooltipType="none"
            />
            <Area 
              type="monotone" 
              dataKey="yhat_lower" 
              stroke="none" 
              fill="#ffffff" 
              name="Lower Bound"
              legendType="none"
              tooltipType="none"
            />
            <Area 
              type="monotone" 
              dataKey="yhat" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorYhat)" 
              name="Predicted Demand"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
