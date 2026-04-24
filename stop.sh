#!/bin/zsh
cd "$(dirname "$0")"
if [[ -f .server.pid ]]; then
  kill $(cat .server.pid) 2>/dev/null && echo "Server stopped." || echo "Server not running."
  rm -f .server.pid
else
  # Fallback: kill any next dev process on port 3000
  lsof -ti:3000 | xargs kill 2>/dev/null && echo "Server stopped." || echo "No server found on port 3000."
fi
