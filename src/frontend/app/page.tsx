"use client";

import React, { useEffect, useState } from "react";
import ABCSummaryCards from "@/components/ABCSummaryCards";
import ReorderTable from "@/components/ReorderTable";
import RevenueChart from "@/components/RevenueChart";
import MarginBleedersChart from "@/components/MarginBleedersChart";
import CapitalTrapsScatter from "@/components/CapitalTrapsScatter";
import InventoryOptimizationTable from "@/components/InventoryOptimizationTable";
import DemandForecastChart from "@/components/DemandForecastChart";
import SafetyStockSimulator from "@/components/SafetyStockSimulator";
import CreditSummaryCards from "@/components/CreditSummaryCards";
import CreditRiskTable from "@/components/CreditRiskTable";
import { Calendar } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("supply");
  const [dateRange, setDateRange] = useState("all");
  const [abcData, setAbcData] = useState([]);
  const [reorderData, setReorderData] = useState([]);
  const [marginData, setMarginData] = useState([]);
  const [capitalData, setCapitalData] = useState([]);
  const [inventoryOptData, setInventoryOptData] = useState([]);
  const [demandForecastData, setDemandForecastData] = useState(null);
  const [safetyStockData, setSafetyStockData] = useState([]);
  const [creditData, setCreditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from our FastAPI backend
    const fetchData = async () => {
      try {
        setLoading(true);
        
        let queryParams = "";
        if (dateRange === "jan2016") {
          queryParams = "?start_date=2016-01-01&end_date=2016-01-31";
        } else if (dateRange === "feb2016") {
          queryParams = "?start_date=2016-02-01&end_date=2016-02-29";
        } else if (dateRange === "q1_2016") {
          queryParams = "?start_date=2016-01-01&end_date=2016-03-31";
        } else if (dateRange === "q2_2016") {
          queryParams = "?start_date=2016-04-01&end_date=2016-06-30";
        } else if (dateRange === "q3_2016") {
          queryParams = "?start_date=2016-07-01&end_date=2016-09-30";
        } else if (dateRange === "q4_2016") {
          queryParams = "?start_date=2016-10-01&end_date=2016-12-31";
        } else if (dateRange === "fy2016") {
          queryParams = "?start_date=2016-01-01&end_date=2016-12-31";
        }

        // Using Promise.all to fetch all endpoints concurrently
        const [abcRes, reorderRes, marginRes, capitalRes, inventoryRes, forecastRes, safetyStockRes, creditRes] = await Promise.all([
          fetch(`http://localhost:8000/api/abc-summary${queryParams}`),
          fetch(`http://localhost:8000/api/reorder-alerts${queryParams}`),
          fetch(`http://localhost:8000/api/margin-bleeders${queryParams}`),
          fetch(`http://localhost:8000/api/capital-traps${queryParams}`),
          fetch(`http://localhost:8000/api/inventory-optimization${queryParams}`),
          fetch(`http://localhost:8000/api/demand-forecast${queryParams}`),
          fetch(`http://localhost:8000/api/safety-stock-simulation${queryParams}`),
          fetch(`http://localhost:8000/api/credit-risk${queryParams}`),
        ]);

        if (!abcRes.ok || !reorderRes.ok || !marginRes.ok || !capitalRes.ok || !inventoryRes.ok || !forecastRes.ok || !safetyStockRes.ok || !creditRes.ok) {
          throw new Error("Failed to fetch data from VinoLytics API");
        }

        const abcJson = await abcRes.json();
        const reorderJson = await reorderRes.json();
        const marginJson = await marginRes.json();
        const capitalJson = await capitalRes.json();
        const inventoryOptJson = await inventoryRes.json();
        const forecastJson = await forecastRes.json();
        const safetyStockJson = await safetyStockRes.json();
        const creditJson = await creditRes.json();

        setAbcData(abcJson);
        setReorderData(reorderJson);
        setMarginData(marginJson);
        setCapitalData(capitalJson);
        setInventoryOptData(inventoryOptJson);
        setDemandForecastData(forecastJson);
        setSafetyStockData(safetyStockJson);
        setCreditData(creditJson);
      } catch (err: any) {
        console.error("Failed to fetch VinoLytics API:", err);
        setError("Unable to connect to the backend server. Is FastAPI running on port 8000?");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading && (!abcData || abcData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
        <p className="text-slate-500 font-medium">Loading data from warehouse...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md shadow-sm">
        <div className="flex items-center">
          <span className="text-red-500 mr-3 text-xl">⚠️</span>
          <h3 className="text-red-800 font-medium text-lg">Connection Error</h3>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded font-medium hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Overview</h1>
          <p className="max-w-xl mt-1 text-sm text-slate-600">
            Real-time insights into inventory performance and critical stock alerts.
          </p>
        </div>
        
        {/* Timeline Interaction */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <label htmlFor="timeline-filter" className="sr-only">Timeline:</label>
          <select 
            id="timeline-filter"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Time History</option>
            <option value="fy2016">Full Year 2016</option>
            <option value="q1_2016">Q1 2016</option>
            <option value="q2_2016">Q2 2016</option>
            <option value="q3_2016">Q3 2016</option>
            <option value="q4_2016">Q4 2016</option>
            <option disabled>──────────</option>
            <option value="jan2016">January 2016</option>
            <option value="feb2016">February 2016</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("supply")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "supply" 
              ? "bg-white text-indigo-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          Supply Chain Engine
        </button>
        <button
          onClick={() => setActiveTab("credit")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "credit" 
              ? "bg-white text-emerald-600 shadow-sm" 
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          Financing & Credit
        </button>
      </div>

      {activeTab === "supply" ? (
        <>
          {/* Top Level KPIs */}
          <section className={loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
            <ABCSummaryCards data={abcData} />
          </section>

      {/* Second Row: 3-Column Charts */}
      <section className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}`}>
        <RevenueChart data={abcData} />
        <MarginBleedersChart data={marginData} />
        <CapitalTrapsScatter data={capitalData} />
      </section>

      {/* Third Row: 2-Column Advanced Charts */}
      <section className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}`}>
        <DemandForecastChart data={demandForecastData} />
        <SafetyStockSimulator data={safetyStockData} />
      </section>

      {/* Fourth Row: Data Tables */}
      <section className={`flex flex-col gap-4 pb-10 ${loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}`}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Critical Reorder Alerts</h2>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
              {reorderData.length} Action Items
            </span>
          </div>
          <ReorderTable data={reorderData} />
        </div>
        
            <InventoryOptimizationTable data={inventoryOptData} />
          </section>
        </>
      ) : (
        <>
          {/* Credit Top Level KPIs */}
          <section className={loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
            <CreditSummaryCards data={creditData} />
          </section>

          {/* Credit Tables */}
          <section className={`flex flex-col gap-4 pb-10 ${loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}`}>
            <CreditRiskTable data={creditData} />
          </section>
        </>
      )}
    </div>
  );
}
