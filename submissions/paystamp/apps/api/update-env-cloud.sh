#!/bin/bash

# Script to help update .env file with cloud database URLs

echo "=========================================="
echo "PayStamp Cloud Database Setup"
echo "=========================================="
echo ""
echo "This script will help you update your .env file with cloud database URLs."
echo ""
echo "You'll need:"
echo "  1. Supabase PostgreSQL connection string"
echo "  2. Upstash Redis URL"
echo ""
read -p "Press Enter to continue..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Running setup-env.sh first..."
    ./setup-env.sh
fi

echo ""
echo "Enter your Supabase PostgreSQL connection string:"
echo "  (Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres)"
read -p "DATABASE_URL: " db_url

echo ""
echo "Enter your Upstash Redis URL:"
echo "  (Format: redis://default:[password]@[host]:[port] OR https://[name]-[id].upstash.io)"
read -p "REDIS_URL: " redis_url

# Update .env file
if [ -n "$db_url" ] && [ -n "$redis_url" ]; then
    # Use sed to update the file (works on macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$db_url|" .env
        sed -i '' "s|^REDIS_URL=.*|REDIS_URL=$redis_url|" .env
    else
        # Linux
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$db_url|" .env
        sed -i "s|^REDIS_URL=.*|REDIS_URL=$redis_url|" .env
    fi
    
    echo ""
    echo "✅ .env file updated successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run db:generate"
    echo "  2. Run: npm run db:push"
    echo "  3. Run: npm run dev"
else
    echo "❌ Both DATABASE_URL and REDIS_URL are required."
    exit 1
fi

