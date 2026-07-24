#!/bin/bash
# Deploy script for Kitchen Ledger
# Usage: ./deploy.sh [prod|dev]

set -e

ENV=${1:-prod}

echo "🚀 Deploying Kitchen Ledger ($ENV)..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example to .env and fill in values."
  exit 1
fi

# Build images
echo "📦 Building Docker images..."
docker-compose build --no-cache

# Start services
echo "🔄 Starting services..."
if [ "$ENV" = "prod" ]; then
  docker-compose up -d
else
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
fi

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check status
echo "📊 Service status:"
docker-compose ps

echo "✅ Deployment complete!"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:5000/api/v1/health"
echo "   MongoDB: mongodb://localhost:27017"