import React from 'react';
import { BadgeDollarSign, ShieldCheck, TrendingUp } from 'lucide-react';

// Format currency for display
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CreditSummaryCards({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-200">
        No credit risk data available for the selected timeline.
      </div>
    );
  }

  const totalLoans = data.reduce((acc, curr) => acc + curr.suggested_loan_amount, 0);
  const avgScore = Math.round(data.reduce((acc, curr) => acc + curr.credit_score, 0) / data.length);
  const avgApr = (data.reduce((acc, curr) => acc + curr.proposed_apr, 0) / data.length).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Addressable Market</h3>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BadgeDollarSign className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {formatCurrency(totalLoans)}
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Total suggested loan volume across 50 brands
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg Portfolio Score</h3>
          <div className="p-2 bg-emerald-50 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {avgScore}
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Mock B2B credit score (300-850 range)
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Estimated Net Yield</h3>
          <div className="p-2 bg-amber-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">
          {avgApr}%
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Average algorithmic APR based on risk
        </div>
      </div>
    </div>
  );
}
