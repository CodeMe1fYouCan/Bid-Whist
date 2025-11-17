#!/bin/bash

# Bid Whist Development Stop Script
# This script stops both frontend and backend servers

echo "🛑 Stopping Bid Whist Development Servers"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Read PIDs from files
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping backend server (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        sleep 2
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ Backend server stopped${NC}"
    else
        echo -e "${YELLOW}Backend server not running${NC}"
    fi
    rm .backend.pid
else
    echo -e "${YELLOW}No backend PID file found${NC}"
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        sleep 2
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        echo -e "${GREEN}✓ Frontend server stopped${NC}"
    else
        echo -e "${YELLOW}Frontend server not running${NC}"
    fi
    rm .frontend.pid
else
    echo -e "${YELLOW}No frontend PID file found${NC}"
fi

# Also kill any gradle or vite processes that might be lingering
echo ""
echo -e "${YELLOW}Cleaning up any lingering processes...${NC}"
pkill -f "gradlew run" 2>/dev/null && echo -e "${GREEN}✓ Killed gradle processes${NC}" || true
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓ Killed vite processes${NC}" || true

echo ""
echo -e "${GREEN}=========================================="
echo "✓ All servers stopped"
echo "==========================================${NC}"
