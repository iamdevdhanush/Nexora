#!/usr/bin/env bash
set -e
echo "⚡ Nexora Setup"
echo "==============="
node -v | grep -q "v[0-9]*\." && echo "✓ Node $(node -v)" || (echo "❌ Node 18+ required"; exit 1)
[ ! -f server/.env ] && cp server/.env.example server/.env && echo "📋 Created server/.env — edit DATABASE_URL and JWT_SECRET"
echo ""
echo "📦 Installing dependencies..."
npm run install:all
echo "🗄️  Setting up database..."
npm run db:setup
echo ""
echo "✅ Done! Run: npm run dev"
echo "   App:     http://localhost:5173"
echo "   API:     http://localhost:4000/health"
echo "   Login:   admin@nexora.dev  →  OTP shown in server console (123456 in dev)"
