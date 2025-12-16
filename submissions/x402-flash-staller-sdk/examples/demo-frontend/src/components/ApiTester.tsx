import React, { useState } from "react";
import {
  Cloud,
  TrendingUp,
  BarChart3,
  Brain,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ApiEndpoint {
  name: string;
  path: string;
  price: string;
  priceXlm: string;
  description: string;
  icon: React.ReactNode;
  method?: string;
}

const endpoints: ApiEndpoint[] = [
  {
    name: "Weather",
    path: "/api/weather",
    price: "10,000",
    priceXlm: "0.001",
    description: "Current weather data",
    icon: <Cloud className="w-5 h-5" />,
  },
  {
    name: "Market Data",
    path: "/api/market",
    price: "50,000",
    priceXlm: "0.005",
    description: "Real-time market data",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    name: "Analytics",
    path: "/api/analytics",
    price: "100,000",
    priceXlm: "0.01",
    description: "Premium analytics",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    name: "AI Query",
    path: "/api/ai/query",
    price: "200,000",
    priceXlm: "0.02",
    description: "AI-powered queries",
    icon: <Brain className="w-5 h-5" />,
    method: "POST",
  },
];

interface ApiTesterProps {
  onRequest: (path: string, options?: RequestInit) => Promise<Response>;
  disabled?: boolean;
}

interface RequestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  latency: number;
}

export function ApiTester({ onRequest, disabled = false }: ApiTesterProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [aiQuery, setAiQuery] = useState("What is the weather like?");

  const handleRequest = async (endpoint: ApiEndpoint) => {
    if (disabled) return;

    setLoading(endpoint.path);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method: endpoint.method || "GET",
      };

      if (endpoint.method === "POST") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ query: aiQuery });
      }

      const response = await onRequest(endpoint.path, options);
      const data = await response.json();
      const latency = Date.now() - startTime;

      const result: RequestResult = {
        endpoint: endpoint.name,
        success: response.ok,
        data,
        latency,
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]);
    } catch (error: any) {
      const latency = Date.now() - startTime;

      const result: RequestResult = {
        endpoint: endpoint.name,
        success: false,
        error: error.message,
        latency,
      };

      setResults((prev) => [result, ...prev.slice(0, 9)]);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="gradient-border">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {endpoints.map((endpoint) => (
              <button
                key={endpoint.path}
                onClick={() => handleRequest(endpoint)}
                disabled={disabled || loading === endpoint.path}
                className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-stellar-blue">{endpoint.icon}</div>
                    <h3 className="font-semibold">{endpoint.name}</h3>
                  </div>
                  {loading === endpoint.path && (
                    <Loader2 className="w-5 h-5 animate-spin text-stellar-purple" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  {endpoint.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{endpoint.path}</span>
                  <span className="text-stellar-blue font-mono">
                    {endpoint.priceXlm} XLM
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              💡 <strong>Tip:</strong> For AI Query, you can customize your
              question below
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              AI Query Text
            </label>
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              disabled={disabled}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-stellar-purple disabled:opacity-50"
              placeholder="Ask anything..."
            />
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="gradient-border">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-semibold">{result.endpoint}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.latency}ms
                    </span>
                  </div>
                  {result.success && result.data && (
                    <pre className="text-xs bg-gray-900 rounded p-2 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  {!result.success && result.error && (
                    <p className="text-sm text-red-400">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
