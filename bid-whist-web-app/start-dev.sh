#!/bin/bash

# Bid Whist Development Startup Script
# This script builds the backend and starts both frontend and backend servers

set -e  # Exit on error

echo "🎴 Starting Bid Whist Development Environment"
echo "=============================================="

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build the backend
echo ""
echo -e "${BLUE}📦 Step 1: Building backend...${NC}"
cd server
if ./gradlew build; then
    echo -e "${GREEN}✓ Backend built successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
cd ..

# Step 2: Install frontend dependencies if needed
echo ""
echo -e "${BLUE}📦 Step 2: Checking frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
cd ..

# Step 3: Start the backend server in background
echo ""
echo -e "${BLUE}🚀 Step 3: Starting backend server...${NC}"
cd server
./gradlew run > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
echo "   Backend logs: logs/backend.log"
cd ..

# Wait a bit for backend to start
echo ""
echo -e "${YELLOW}⏳ Waiting for backend to initialize...${NC}"
sleep 5

# Check if backend is still running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend is running on http://localhost:8080${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check logs/backend.log${NC}"
    exit 1
fi

# Step 4: Start the frontend server in background
echo ""
echo -e "${BLUE}🚀 Step 4: Starting frontend server...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
echo "   Frontend logs: logs/frontend.log"
cd ..

# Wait a bit for frontend to start
sleep 3

# Check if frontend is still running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start. Check logs/frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Save PIDs to file for easy cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Success message
echo ""
echo -e "${GREEN}=============================================="
echo "✓ Development environment is ready!"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}🌐 Access the application:${NC}"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo ""
echo -e "${YELLOW}📋 Process IDs:${NC}"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${RED}🛑 To stop servers:${NC}"
echo "   Run: ./stop-dev.sh"
echo "   Or:  kill $BACKEND_PID $FRONTEND_PID"
echo ""
