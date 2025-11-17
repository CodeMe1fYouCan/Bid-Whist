#!/usr/bin/env bash

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${REPO_ROOT}/server"
FRONTEND_DIR="${REPO_ROOT}/frontend"
LOG_DIR="${REPO_ROOT}/logs"

info(){ printf "\n[INFO] %s\n" "$*"; }
err(){ printf "\n[ERROR] %s\n" "$*" >&2; exit 1; }

mkdir -p "$LOG_DIR"

[ -d "$SERVER_DIR" ] || err "server/ directory not found. Run this from repository root."
[ -d "$FRONTEND_DIR" ] || err "frontend/ directory not found. Run this from repository root."

# Ensure Java present
if ! command -v java >/dev/null 2>&1; then
  err "Java not found. Install a JDK (11+). On macOS: brew install openjdk"
fi

# Create Gradle wrapper if missing
cd "$SERVER_DIR"
if [ -x "./gradlew" ]; then
  info "Gradle wrapper found in server/"
else
  if command -v gradle >/dev/null 2>&1; then
    info "Creating Gradle wrapper in server/ using system 'gradle'"
    gradle wrapper
  else
    info "Gradle not found. Attempting Homebrew install..."
    if command -v brew >/dev/null 2>&1; then
      brew install gradle
      gradle wrapper
    else
      err "No gradle and no Homebrew. Install Gradle or Homebrew."
    fi
  fi
fi

# Choose run task
RUN_CMD="./gradlew run"
if grep -R -E "org.springframework.boot|id\\(\"org.springframework.boot" --silent . 2>/dev/null; then
  RUN_CMD="./gradlew bootRun"
  info "Detected Spring Boot; using './gradlew bootRun'."
else
  info "Using './gradlew run' to start the server."
fi

# Build server
info "Building server..."
./gradlew clean build > "$LOG_DIR/server-build.log" 2>&1 || { err "Server build failed; see $LOG_DIR/server-build.log"; }

# Start server (background)
info "Starting server (logs -> $LOG_DIR/server.log)..."
nohup $RUN_CMD > "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
info "Server started (pid: $SERVER_PID)."

# Frontend install & start
cd "$FRONTEND_DIR"
PM="npm"
START_CMD="npm run dev"
if [ -f "pnpm-lock.yaml" ]; then
  PM="pnpm"
  START_CMD="pnpm dev"
elif [ -f "yarn.lock" ]; then
  PM="yarn"
  START_CMD="yarn dev"
fi

info "Installing frontend deps with $PM..."
if [ "$PM" = "npm" ]; then
  npm install > "$LOG_DIR/frontend-install.log" 2>&1 || { err "npm install failed; see $LOG_DIR/frontend-install.log"; }
elif [ "$PM" = "pnpm" ]; then
  if ! command -v pnpm >/dev/null 2>&1; then
    info "pnpm not found; installing via npm..."
    npm install -g pnpm
  fi
  pnpm install > "$LOG_DIR/frontend-install.log" 2>&1 || { err "pnpm install failed; see $LOG_DIR/frontend-install.log"; }
else
  yarn install > "$LOG_DIR/frontend-install.log" 2>&1 || { err "yarn install failed; see $LOG_DIR/frontend-install.log"; }
fi

info "Starting frontend (logs -> $LOG_DIR/frontend.log)..."
nohup $START_CMD > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
info "Frontend started (pid: $FRONTEND_PID)."

info "Setup complete."
printf "Server logs: %s/server.log (build: %s/server-build.log)\n" "$LOG_DIR" "$LOG_DIR"
printf "Frontend logs: %s/frontend.log (install: %s/frontend-install.log)\n" "$LOG_DIR" "$LOG_DIR"
info "To stop servers: kill %s %s" "$SERVER_PID" "$FRONTEND_PID"
info "Check websocket URL in frontend/src/network/api.ts or frontend/src/hooks/useWebSocket.ts and server/src/main/kotlin/.../WebSocketServer.kt"

