# Bid Whist Server

This is the server component of the Bid Whist web application, built using Kotlin. The server manages game sessions, player connections, and real-time communication through WebSockets.

## Features

- **WebSocket Support**: Real-time gameplay with WebSocket connections for seamless interaction between players.
- **Room Management**: Players can create and join game rooms using unique room codes for matchmaking.
- **Multiple Hands**: Support for players to control multiple hands during gameplay.
- **Game Logic**: Implements the rules and logic specific to the Bid Whist card game.

## Project Structure

- `src/main/kotlin/com/example/bidwhist/`
  - `Application.kt`: Entry point for the server application.
  - `WebSocketServer.kt`: Manages WebSocket connections.
  - `RoomManager.kt`: Handles game room creation and matchmaking.
  - `GameSession.kt`: Manages the state and logic of individual game sessions.
  - `PlayerConnection.kt`: Manages player connections and interactions.
  - `models/`
    - `GameState.kt`: Defines the data model for the game state.
    - `DTOs.kt`: Contains Data Transfer Objects for communication.

## Getting Started

1. Clone the repository.
2. Navigate to the `server` directory.
3. Use Gradle to build and run the server:
   ```
   ./gradlew run
   ```

## Dependencies

- Kotlin
- Ktor (for WebSocket support)
- Other necessary libraries as defined in `build.gradle.kts`.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.