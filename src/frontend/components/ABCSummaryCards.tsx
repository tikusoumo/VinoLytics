import React from "react";

// Format currency for display
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ABCSummaryCards({ data }: { data: any[] }) {
  // If no data, render empty state
  if (!data || data.length === 0) {
    return <div className="text-slate-500">No ABC data available.</div>;
  }

  // Helper to extract specific category data
  const getCatData = (cat: string) => data.find((d) => d.category === cat) || { brand_count: 0, total_revenue: 0 };

  const classA = getCatData("A");
  const classB = getCatData("B");
  const classC = getCatData("C");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Class A Card */}
      <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-emerald-500 border-x border-b border-slate-200 p-6 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800">Class A</h3>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">Top 80% Rev</span>
        </div>
        <div className="text-3xl font-black text-slate-900 mb-1">
          {formatCurrency(classA.total_revenue)}
        </div>
        <div className="text-sm text-slate-500 font-medium mt-auto">
          Across <span className="text-slate-800 font-bold">{classA.brand_count}</span> Brands
        </div>
      </div>

      {/* Class B Card */}
      <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-amber-400 border-x border-b border-slate-200 p-6 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800">Class B</h3>
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">Next 15% Rev</span>
        </div>
        <div className="text-3xl font-black text-slate-900 mb-1">
          {formatCurrency(classB.total_revenue)}
        </div>
        <div className="text-sm text-slate-500 font-medium mt-auto">
          Across <span className="text-slate-800 font-bold">{classB.brand_count}</span> Brands
        </div>
      </div>

      {/* Class C Card */}
      <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-slate-400 border-x border-b border-slate-200 p-6 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800">Class C</h3>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">Bottom 5% Rev</span>
        </div>
        <div className="text-3xl font-black text-slate-900 mb-1">
          {formatCurrency(classC.total_revenue)}
        </div>
        <div className="text-sm text-slate-500 font-medium mt-auto">
          Across <span className="text-slate-800 font-bold">{classC.brand_count}</span> Brands
        </div>
      </div>
    </div>
  );
}
