"use client";

import React, { useEffect, useState } from "react";
import ABCSummaryCards from "@/components/ABCSummaryCards";
import ReorderTable from "@/components/ReorderTable";
import RevenueChart from "@/components/RevenueChart";
import MarginBleedersChart from "@/components/MarginBleedersChart";
import CapitalTrapsScatter from "@/components/CapitalTrapsScatter";
import InventoryOptimizationTable from "@/components/InventoryOptimizationTable";
import DemandForecastChart from "@/components/DemandForecastChart";

export default function Dashboard() {
  const [abcData, setAbcData] = useState([]);
  const [reorderData, setReorderData] = useState([]);
  const [marginData, setMarginData] = useState([]);
  const [capitalData, setCapitalData] = useState([]);
  const [inventoryOptData, setInventoryOptData] = useState([]);
  const [demandForecastData, setDemandForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from our FastAPI backend
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using Promise.all to fetch all endpoints concurrently
        const [abcRes, reorderRes, marginRes, capitalRes, inventoryRes, forecastRes] = await Promise.all([
          fetch("http://localhost:8000/api/abc-summary"),
          fetch("http://localhost:8000/api/reorder-alerts"),
          fetch("http://localhost:8000/api/margin-bleeders"),
          fetch("http://localhost:8000/api/capital-traps"),
          fetch("http://localhost:8000/api/inventory-optimization"),
          fetch("http://localhost:8000/api/demand-forecast"),
        ]);

        if (!abcRes.ok || !reorderRes.ok || !marginRes.ok || !capitalRes.ok || !inventoryRes.ok || !forecastRes.ok) {
          throw new Error("Failed to fetch data from VinoLytics API");
        }

        const abcJson = await abcRes.json();
        const reorderJson = await reorderRes.json();
        const marginJson = await marginRes.json();
        const capitalJson = await capitalRes.json();
        const inventoryOptJson = await inventoryRes.json();
        const forecastJson = await forecastRes.json();

        setAbcData(abcJson);
        setReorderData(reorderJson);
        setMarginData(marginJson);
        setCapitalData(capitalJson);
        setInventoryOptData(inventoryOptJson);
        setDemandForecastData(forecastJson);
      } catch (err: any) {
        console.error("Failed to fetch VinoLytics API:", err);
        setError("Unable to connect to the backend server. Is FastAPI running on port 8000?");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
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
    <div className="space-y-10">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inventory Overview</h1>
        <p className="mt-2 text-slate-600">
          Real-time insights into inventory performance and critical stock alerts.
        </p>
      </div>

      {/* ABC Analysis Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">ABC Revenue Distribution</h2>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
            Based on historical sales
          </span>
        </div>
        <ABCSummaryCards data={abcData} />
        <RevenueChart data={abcData} />
      </section>

      {/* Financial Risks Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Financial Risks</h2>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full border border-purple-200 font-medium">
            Margin & Capital Analysis
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarginBleedersChart data={marginData} />
          <CapitalTrapsScatter data={capitalData} />
        </div>
      </section>

      {/* Reorder Alerts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Critical Reorder Alerts</h2>
          <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            {reorderData.length} Action Items
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <ReorderTable data={reorderData} />
        </div>
      </section>

      {/* Advanced Supply Chain Analytics Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Supply Chain Optimization</h2>
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Powered by Prophet & EOQ Models
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <DemandForecastChart data={demandForecastData} />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <InventoryOptimizationTable data={inventoryOptData} />
        </div>
      </section>
    </div>
  );
}
