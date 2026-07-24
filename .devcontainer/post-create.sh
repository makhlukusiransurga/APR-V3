#!/bin/bash

echo "=========================================="
echo "  APR V3 - Post Create Setup"
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -U postgres; do
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Copy .env.example to .env if not exists
if [ ! -f /workspace/.env ]; then
    echo "📝 Creating .env file from template..."
    cp /workspace/.env.example /workspace/.env
    # Override DATABASE_URL for docker-compose setup
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:password@localhost:5432/aprv3|' /workspace/.env
fi

# Install dependencies if node_modules missing
if [ ! -d /workspace/node_modules ]; then
    echo "📦 Installing dependencies..."
    cd /workspace && npm install
fi

# Seed data
echo "🌱 Seeding initial data..."
cd /workspace && npm run seed

echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "  Run: npm start"
echo "  Open: http://localhost:8080"
echo "=========================================="

