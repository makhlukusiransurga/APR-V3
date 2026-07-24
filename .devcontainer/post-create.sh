#!/bin/bash

echo "=========================================="
echo "  APR V3 - Post Create Setup"
echo "=========================================="

# Install dependencies first (doesn't need DB)
echo "📦 Installing npm dependencies..."
cd /workspace
npm install
echo "✅ Dependencies installed!"

# Copy .env.example to .env if not exists
if [ ! -f /workspace/.env ]; then
    echo "📝 Creating .env file from template..."
    cp /workspace/.env.example /workspace/.env
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:password@localhost:5432/aprv3|' /workspace/.env
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if pg_isready -h localhost -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  echo "   Attempt $i/30..."
  sleep 2
done

# Run seed
echo "🌱 Seeding initial data..."
cd /workspace && npm run seed

echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "  Jalankan: npm start"
echo "  Buka: http://localhost:8080"
echo "  Login: admin / admin"
echo "=========================================="

