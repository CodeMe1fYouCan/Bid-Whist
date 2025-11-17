# Project Structure

## Root Organization

```
bid-whist-web-app/
├── frontend/          # React TypeScript application
├── server/            # Kotlin Ktor server
├── scripts/           # Development automation scripts
└── logs/              # Application logs
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/    # React components (Card, HandView, Lobby, Room, Table, etc.)
│   ├── pages/         # Route pages (Home, Game)
│   ├── game/          # Game logic (dealer, handManager, rules, scoring)
│   ├── network/       # API client and type definitions
│   ├── hooks/         # Custom React hooks (useWebSocket)
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions (roomCodeValidator, roomManager)
│   ├── App.tsx        # Main app component with routing
│   ├── main.tsx       # Application entry point
│   └── index.css      # Global styles
├── public/            # Static assets
└── dist/              # Build output
```

### Frontend Conventions

- Components use functional React with TypeScript
- Path alias `@/*` maps to `src/*`
- React Router v5 for navigation
- WebSocket connections managed via custom hooks

## Server Structure

```
server/
├── src/main/
│   ├── kotlin/com/example/bidwhist/
│   │   ├── Application.kt        # Server entry point, routing, WebSocket handlers
│   │   ├── GameSession.kt        # Game state management
│   │   ├── PlayerConnection.kt   # Player connection handling
│   │   ├── RoomManager.kt        # Room creation and matchmaking
│   │   └── models/
│   │       ├── DTOs.kt           # Data Transfer Objects
│   │       └── GameState.kt      # Game state models
│   └── resources/
│       └── application.conf      # Server configuration
└── build/                        # Gradle build output
```

### Server Conventions

- Package: `com.example.bidwhist`
- WebSocket messages use JSON with Jackson serialization
- Room codes are uppercase, 6 characters
- Game supports exactly 4 players (AI fills empty slots)
- Each player receives 13 cards from a standard 52-card deck

## Key Architectural Patterns

- **Frontend**: Component-based architecture with separation of concerns (components, pages, game logic, network)
- **Server**: WebSocket-based real-time communication with in-memory room state management
- **Communication**: JSON messages over WebSocket with typed DTOs
- **Game Flow**: Lobby → Room → Game with room code-based matchmaking
