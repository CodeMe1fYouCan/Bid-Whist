# Bid Whist Web Application

This project is an online web application for the card game Bid Whist, allowing players to connect and play together remotely. The application is designed for two players, with the option for one player to control multiple hands.

## Features

- **Multiple Hands**: Players can control 1, 2, or 3 hands, allowing for flexible gameplay.
- **Matchmaking**: Players can join games using a unique room code, ensuring a private gaming experience.
- **Real-time Gameplay**: Utilizes WebSocket for real-time communication between players.

## Project Structure

The project consists of two main parts: the frontend and the server.

### Frontend

- Built with TypeScript and React.
- Uses Vite as the build tool.
- Contains components for the game lobby, game room, and gameplay interface.

### Server

- Built with Kotlin.
- Manages game sessions, player connections, and matchmaking.
- Handles WebSocket connections for real-time gameplay.

## Getting Started

### Prerequisites

- Node.js and npm for the frontend.
- Kotlin and Gradle for the server.

### Running the Frontend

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Running the Server

1. Navigate to the `server` directory.
2. Build the project:
   ```
   ./gradlew build
   ```
3. Run the server:
   ```
   ./gradlew run
   ```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.