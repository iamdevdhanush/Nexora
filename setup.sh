#!/usr/bin/env bash
set -e
echo "⚡ Nexora Setup"
echo "==============="
node -v | grep -q "v[0-9]*\." && echo "✓ Node $(node -v)" || (echo "❌ Node 18+ required"; exit 1)
[ ! -f server/.env ] && cp server/.env.example server/.env && echo "📋 Created server/.env"
echo "DATABASE_URL should be: postgresql://postgres:nexora_dev@localhost:5432/nexora"
echo ""
echo "📦 Installing dependencies..."
npm run install:all
echo "🗄️  Database setup..."
npm run db:setup
echo ""
echo "✅ Done! Run: npm run dev"
echo "   Open:    http://localhost:5173"
echo "   Login:   admin@nexora.dev  → OTP shown in server console"
