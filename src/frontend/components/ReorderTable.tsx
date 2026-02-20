"use client";

import React, { useState } from "react";
import { Search, ArrowUpDown } from 'lucide-react';

export default function ReorderTable({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("current_on_hand");
  const [sortDirection, setSortDirection] = useState("asc");

  // TODO: add pagination here later, this table will get massive when we scale.
  // For now displaying everything that comes from the backend (top 50)
  
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <span className="text-2xl block mb-2">🎉</span>
        No reorders needed right now. Inventory is looking healthy!
      </div>
    );
  }

  // Filter
  const filteredData = data.filter((item) => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.brand.toString().includes(searchTerm)
  );

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center bg-slate-50/50">
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 shadow-sm transition-all"
            placeholder="Search brand or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm font-medium text-slate-500">
          Showing {sortedData.length} item(s)
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('description')}>
                <div className="flex items-center">
                  Brand <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('avg_daily_sales')}>
                <div className="flex items-center">
                  Daily Demand <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('current_on_hand')}>
                <div className="flex items-center justify-end">
                  Current Stock <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('rop')}>
                <div className="flex items-center justify-end">
                  Reorder Point <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-center font-semibold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {sortedData.map((item, idx) => {
              // Calculate deficit to show severity
              const deficit = item.rop - item.current_on_hand;
              // Extremely critical if on hand is 0 or less than half of ROP
              const isCritical = item.current_on_hand === 0 || item.current_on_hand < (item.rop / 2);

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{item.description}</div>
                    <div className="text-xs text-slate-500">ID: {item.brand}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                    {item.avg_daily_sales.toFixed(2)} units/day
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                    {Math.floor(item.current_on_hand)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600">
                    {item.rop}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                        isCritical ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}
                    >
                      {isCritical ? 'URGENT REORDER' : 'REORDER NOW'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No items match your search "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
