#!/bin/zsh
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
cd "$(dirname "$0")"
npm run dev &
sleep 2
open -a "Google Chrome" http://localhost:3000
echo "Stock Scanner running at http://localhost:3000 (PID: $!)"
echo $! > .server.pid
