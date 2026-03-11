#!/bin/bash
# Avvia l'ambiente di sviluppo locale completo (SQLite, no Docker)

echo "🌱 Seed utente di test..."
cd backend
cp .env.dev .env
python seed_dev.py
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ambiente pronto!"
echo "   Backend:  cd backend && uvicorn app.main:app --reload --port 8000"
echo "   Frontend: cd magic-deck-generator && npm run dev"
echo ""
echo "   Login:    test@dev.com / test1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
