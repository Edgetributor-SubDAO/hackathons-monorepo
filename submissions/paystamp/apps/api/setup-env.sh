#!/bin/bash

# PayStamp API Environment Setup Script
# This script creates a .env file with secure random secrets

echo "Setting up PayStamp API environment variables..."

# Generate secure secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create .env file
cat > .env << EOF
# API Configuration
NODE_ENV=development
API_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Database
# Update with your PostgreSQL connection string
# Default Docker Compose connection:
DATABASE_URL=postgresql://paystamp:paystamp_dev@localhost:5432/paystamp?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Security
# Auto-generated secure secrets
JWT_SECRET=${JWT_SECRET}
API_KEY_SECRET=${API_KEY_SECRET}

# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_MERCHANT_ADDRESS=

# Logging
LOG_LEVEL=info
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: Update DATABASE_URL if you're not using Docker Compose"
echo "   Current DATABASE_URL: postgresql://paystamp:paystamp_dev@localhost:5432/paystamp?schema=public"
echo ""
echo "To start the database with Docker Compose:"
echo "  docker compose -f ../../infrastructure/docker/docker-compose.dev.yml up -d"

