import { useState, useEffect } from "react";

export interface Metric {
  id: string;
  timestamp: number;
  method: "flash" | "standard";
  latency: number;
  endpoint: string;
  status: "success" | "failed";
  amount?: string;
}

const WS_URL =
  import.meta.env.VITE_API_URL?.replace("http", "ws") || "ws://localhost:3001";

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws`);

    ws.onopen = () => {
      console.log("📡 Connected to metrics stream");
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "metrics") {
          setMetrics(message.data);
        } else if (message.type === "metric") {
          setMetrics((prev) => [...prev.slice(-19), message.data]);
        }
      } catch (error) {
        console.error("Failed to parse metrics:", error);
      }
    };

    ws.onclose = () => {
      console.log("📡 Disconnected from metrics stream");
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const summary = {
    total: metrics.length,
    successful: metrics.filter((m) => m.status === "success").length,
    failed: metrics.filter((m) => m.status === "failed").length,
    avgLatency:
      metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length
          )
        : 0,
  };

  return {
    metrics,
    summary,
    connected,
  };
}
