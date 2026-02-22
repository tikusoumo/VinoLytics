import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, DollarSign } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CreditRiskTable({ data }: { data: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [approvedLoans, setApprovedLoans] = useState<Record<string, boolean>>({});

  if (!data || data.length === 0) {
    return (
      <div className="text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-200">
        No B2B accounts found for this period.
      </div>
    );
  }

  const handleApprove = (brandId: string) => {
    setApprovedLoans(prev => ({ ...prev, [brandId]: true }));
  };

  return (
    <div className={`transition-all duration-300 overflow-hidden relative ${isExpanded ? "max-h-[5000px]" : "max-h-[460px]"}`}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">Pre-Qualified Accounts</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {data.length} Eligible
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
            >
              {isExpanded ? <><ChevronUp className="h-3 w-3"/> Collapse View</> : <><ChevronDown className="h-3 w-3"/> View All Accounts</>}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Brand / Borrower</th>
                <th className="px-6 py-4">Working Capital Tied</th>
                <th className="px-6 py-4">Credit Score</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Suggested Line</th>
                <th className="px-6 py-4">System APR</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => (
                <tr key={row.brand} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{row.description}</div>
                    <div className="text-xs text-slate-500">ID: {row.brand}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {formatCurrency(row.total_capital_outlay)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`font-bold ${row.credit_score >= 700 ? 'text-emerald-600' : row.credit_score >= 600 ? 'text-amber-500' : 'text-red-500'}`}>
                         {row.credit_score}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      row.risk_level === 'Low Risk' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      row.risk_level === 'Moderate Risk' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {row.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 border-l border-slate-50 bg-slate-50/30">
                    {formatCurrency(row.suggested_loan_amount)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-indigo-600 bg-slate-50/30">
                    {row.proposed_apr}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    {approvedLoans[row.brand] ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approved
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleApprove(row.brand)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        Pre-Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Fading gradient when collapsed */}
      {!isExpanded && (
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}
