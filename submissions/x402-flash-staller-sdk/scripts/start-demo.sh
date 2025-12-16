#!/bin/bash

# Quick start script for x402-flash demo
# Starts both frontend and backend in parallel

set -e

echo "🚀 Starting x402-flash Demo"
echo "============================"

# Check if dependencies are installed (npm workspaces hoist to root)
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not found. Run ./scripts/setup-demo.sh first"
    exit 1
fi

# Check if package files exist
if [ ! -f "examples/demo-api-server/package.json" ]; then
    echo "❌ API server package.json not found. Run ./scripts/setup-demo.sh first"
    exit 1
fi

if [ ! -f "examples/demo-frontend/package.json" ]; then
    echo "❌ Frontend package.json not found. Run ./scripts/setup-demo.sh first"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Run ./scripts/setup-demo.sh first"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $API_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start API server in background
echo "🖥️  Starting API server on port 3001..."
cd examples/demo-api-server
npm run dev &
API_PID=$!
cd ../..

# Wait a bit for API server to start
sleep 3

# Start frontend in background
echo "🎨 Starting frontend on port 3000..."
cd examples/demo-frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✨ Demo is running!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 API Server: http://localhost:3001"
echo "📍 WebSocket: ws://localhost:3001/ws"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait for both processes
wait $API_PID $FRONTEND_PID
