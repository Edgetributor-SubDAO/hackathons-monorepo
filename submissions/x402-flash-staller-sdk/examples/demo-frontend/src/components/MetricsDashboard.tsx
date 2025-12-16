import React from "react";
import { Activity, TrendingUp, Zap, Clock } from "lucide-react";

interface MetricsProps {
  totalPaid: string;
  requestCount: number;
  avgLatency: number;
}

export function MetricsDashboard({
  totalPaid,
  requestCount,
  avgLatency,
}: MetricsProps) {
  const paidXlm = (parseInt(totalPaid) / 10000000).toFixed(4);

  return (
    <div className="gradient-border">
      <div className="p-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" />
          Your Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{paidXlm} XLM</p>
            <p className="text-xs text-gray-500">{totalPaid} stroops</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Requests</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{requestCount}</p>
            <p className="text-xs text-gray-500">API calls</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{avgLatency}ms</p>
            <p className="text-xs text-gray-500">Response time</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Status</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">Live</p>
            <p className="text-xs text-gray-500">Real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
