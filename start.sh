#!/bin/bash

echo "====================================================="
echo "  BRMS - Mac One-Click Host Script"
echo "====================================================="
echo ""

# 1. Kill port 5001
echo "[*] Clearing port 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null

# 2. Start Backend
echo "[*] Starting Backend API (port 5001) in background..."
cd "$(dirname "$0")/server" || exit
nohup npm run dev > ../backend.log 2>&1 &
cd ..

# 3. Start Agent
echo "[*] Starting Python Agent in background..."
cd "$(dirname "$0")/local_agent/Agent/LocalManager" || exit
if [ -d "venv" ]; then
    nohup ./venv/bin/python main.py > agent.log 2>&1 &
else
    echo "⚠️  Python venv not found! Skipping agent start."
fi
cd ../../../

# 4. Start Cloudflare Tunnel
echo "[*] Starting Cloudflare Tunnel in background..."
npx --yes cloudflared tunnel --url http://localhost:5001 > tunnel.log 2>&1 &

# Wait for tunnel URL
echo "[*] Waiting for Cloudflare URL (takes ~10 seconds)..."
sleep 10

URL=$(grep -o 'https://.*\.trycloudflare\.com' tunnel.log | head -1)

if [ -n "$URL" ]; then
    echo ""
    echo "✅ Success! All processes are happily running in the background!"
    echo "====================================================="
    echo "  Your Vercel URL (NEXT_PUBLIC_API_URL):"
    echo "  $URL"
    echo "====================================================="
    echo ""
    echo "To view logs anytime:"
    echo "  Backend: tail -f backend.log"
    echo "  Tunnel:  tail -f tunnel.log"
    echo "To stop everything later:"
    echo "  lsof -ti:5001 | xargs kill -9; pkill -f cloudflared; pkill -f 'python main.py'"
else
    echo "❌ Could not find Cloudflare URL in time. Check tunnel.log for errors."
fi
