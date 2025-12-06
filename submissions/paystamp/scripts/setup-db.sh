#!/bin/bash

# PayStamp Database Setup Script

set -e

echo "🚀 PayStamp Database Setup"
echo "=========================="
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✓ Docker found"
    
    # Check if docker compose is available
    if docker compose version &> /dev/null; then
        echo "✓ Docker Compose found"
        echo ""
        echo "Starting PostgreSQL and Redis with Docker..."
        
        cd "$(dirname "$0")/.."
        docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
        
        echo ""
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        
        # Check if containers are running
        if docker ps | grep -q paystamp-postgres-dev; then
            echo "✓ PostgreSQL container is running"
        else
            echo "✗ PostgreSQL container failed to start"
            exit 1
        fi
        
        if docker ps | grep -q paystamp-redis-dev; then
            echo "✓ Redis container is running"
        else
            echo "✗ Redis container failed to start"
            exit 1
        fi
        
        echo ""
        echo "✅ Database setup complete!"
        echo ""
        echo "Next steps:"
        echo "  cd apps/api"
        echo "  npm run db:generate"
        echo "  npm run db:push"
        
    elif command -v docker-compose &> /dev/null; then
        echo "✓ Docker Compose (legacy) found"
        echo ""
        echo "Starting PostgreSQL and Redis with Docker..."
        
        cd "$(dirname "$0")/.."
        docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
        
        echo ""
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        
        echo "✅ Database setup complete!"
        
    else
        echo "✗ Docker Compose not found"
        echo ""
        echo "Please install Docker Desktop or Docker Compose"
        exit 1
    fi

# Check if PostgreSQL is installed locally
elif command -v psql &> /dev/null; then
    echo "✓ PostgreSQL found (local installation)"
    echo ""
    
    # Check if PostgreSQL is running
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "✓ PostgreSQL is running on port 5432"
        echo ""
        echo "Please ensure:"
        echo "  1. Database 'paystamp' exists"
        echo "  2. User 'paystamp' exists with password 'paystamp_dev'"
        echo "  3. User has permissions on the database"
        echo ""
        echo "If not, run:"
        echo "  createdb paystamp"
        echo "  createuser paystamp"
        echo "  psql -c \"ALTER USER paystamp WITH PASSWORD 'paystamp_dev';\""
        echo "  psql -c \"GRANT ALL PRIVILEGES ON DATABASE paystamp TO paystamp;\" -d paystamp"
        
    else
        echo "✗ PostgreSQL is not running"
        echo ""
        echo "Please start PostgreSQL:"
        echo "  macOS: brew services start postgresql"
        echo "  Linux: sudo systemctl start postgresql"
        exit 1
    fi
    
    # Check if Redis is available
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            echo "✓ Redis is running"
        else
            echo "⚠ Redis is not running"
            echo "  macOS: brew services start redis"
            echo "  Linux: sudo systemctl start redis"
        fi
    else
        echo "⚠ Redis not found"
        echo "  Install: brew install redis (macOS) or apt-get install redis-server (Linux)"
    fi
    
else
    echo "✗ PostgreSQL not found"
    echo ""
    echo "Please install:"
    echo "  1. Docker Desktop (recommended): https://www.docker.com/products/docker-desktop"
    echo "  2. OR PostgreSQL locally:"
    echo "     macOS: brew install postgresql"
    echo "     Linux: sudo apt-get install postgresql"
    echo ""
    echo "See DATABASE_SETUP.md for detailed instructions"
    exit 1
fi

echo ""
echo "📚 For more information, see DATABASE_SETUP.md"

