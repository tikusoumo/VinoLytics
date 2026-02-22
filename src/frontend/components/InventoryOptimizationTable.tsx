"use client";

import React, { useState } from "react";
import { TrendingUp, Package, AlertTriangle, CheckCircle, Maximize2, Minimize2 } from "lucide-react";

interface OptimizationItem {
  brand: string;
  description: string;
  current_on_hand: number;
  rop: number;
  eoq: number;
  action_required: string;
}

interface InventoryOptimizationTableProps {
  data: OptimizationItem[];
}

export default function InventoryOptimizationTable({ data }: InventoryOptimizationTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-indigo-500" />
          Inventory Optimization (EOQ & ROP)
        </h3>
        <p className="text-slate-500">No inventory optimization data available right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-500" />
            Inventory Optimization
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Top items requiring reorder based on EOQ & ROP analysis
          </p>
        </div>
        <button 
           onClick={() => setIsExpanded(!isExpanded)}
           className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors border border-slate-200"
        >
          {isExpanded ? (
            <><Minimize2 className="h-3.5 w-3.5" /> Collapse</>
          ) : (
            <><Maximize2 className="h-3.5 w-3.5" /> Expand</>
          )}
        </button>
      </div>
      <div className={`overflow-auto flex-1 relative transition-all duration-300 ${isExpanded ? 'max-h-[800px]' : 'max-h-80'}`}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4">Brand</th>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4 text-right">Current Stock</th>
              <th className="px-6 py-4 text-right">Reorder Point (ROP)</th>
              <th className="px-6 py-4 text-right">Optimized Order Qty (EOQ)</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <tr 
                key={index} 
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900">{item.brand}</td>
                <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={item.description}>
                  {item.description}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {item.current_on_hand.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-medium text-amber-600">
                  {item.rop.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-medium text-indigo-600">
                  {item.eoq.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    item.action_required === 'Reorder Now' 
                      ? 'bg-red-50 text-red-700 border-red-100' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {item.action_required === 'Reorder Now' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {item.action_required}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
