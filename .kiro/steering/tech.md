# Technology Stack

## Frontend

- **Framework**: React 17 with TypeScript
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS 4.x with PostCSS
- **Routing**: React Router DOM v5
- **Type Safety**: TypeScript with strict mode enabled

### Frontend Commands

```bash
cd bid-whist-web-app/frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run serve
```

## Server

- **Language**: Kotlin 1.6.10
- **Framework**: Ktor 1.6.7 (Netty engine)
- **Build Tool**: Gradle with Kotlin DSL
- **Key Libraries**:
  - `ktor-websockets` for real-time communication
  - `ktor-jackson` for JSON serialization
  - `logback-classic` for logging
- **Shadow Plugin**: For creating fat JARs

### Server Commands

```bash
cd bid-whist-web-app/server

# Build project
./gradlew build

# Run server (port 8080)
./gradlew run

# Create fat JAR
./gradlew shadowJar
```

## Development Scripts

Located in `bid-whist-web-app/scripts/`:
- `setup-dev.sh` - Initial development setup
- `dev-frontend.sh` - Start frontend dev server
- `dev-server.sh` - Start backend server

## Configuration

- Frontend: `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`
- Server: `application.conf` (port 8080, WebSocket path `/ws`)
- Server runs on `localhost:8080`
- WebSocket endpoint: `/room/{roomCode}`
