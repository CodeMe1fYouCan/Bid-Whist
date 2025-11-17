# Bid Whist Development Guide

## Quick Start

### Start Development Servers

```bash
cd bid-whist-web-app
./start-dev.sh
```

This script will:
1. Build the backend (Kotlin/Gradle)
2. Install frontend dependencies if needed
3. Start the backend server on port 8080
4. Start the frontend dev server (usually port 5173)

### Stop Development Servers

```bash
./stop-dev.sh
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080

## Manual Commands

### Backend Only

```bash
cd server

# Build
./gradlew build

# Run
./gradlew run

# Clean build
./gradlew clean build
```

### Frontend Only

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run serve
```

## Viewing Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find and kill process on port 8080 (backend)
lsof -ti:8080 | xargs kill -9

# Find and kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Backend Build Fails

```bash
cd server
./gradlew clean build --refresh-dependencies
```

### Frontend Issues

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Game Rules Summary

- **Teams**: 2 teams (Us vs Them), each with 2 hands
- **Bidding**: 1-7, dealer can match highest bid
- **Trump**: Hearts, Diamonds, Clubs, Spades, or No-Trump
- **Scoring**: 
  - Bidding team needs 6 + bid tricks to make it
  - If made: score (tricks - 6) points
  - If missed: defending team scores bid + max(0, their tricks - 6)
- **Win Condition**: First to 11 or 21 points (configurable)

## Project Structure

```
bid-whist-web-app/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
├── server/            # Kotlin + Ktor
│   ├── src/main/kotlin/
│   └── build.gradle.kts
├── logs/              # Server logs
├── start-dev.sh       # Start both servers
└── stop-dev.sh        # Stop both servers
```
