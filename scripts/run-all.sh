#!/usr/bin/env bash
# ReMind — Inicia frontend y backend en paralelo (Linux / macOS)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON="$ROOT/.venv/bin/python3"
BACKEND_DIR="$ROOT/backend"

echo "🚀 Iniciando ReMind..."
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo ""

# Trap para matar ambos procesos al salir con Ctrl+C
trap 'echo ""; echo "Deteniendo servidores..."; kill 0; exit 0' INT TERM

# Frontend
cd "$ROOT"
npm run dev &

# Backend
cd "$BACKEND_DIR"
"$PYTHON" -m uvicorn main:app --reload --port 8000 &

wait
