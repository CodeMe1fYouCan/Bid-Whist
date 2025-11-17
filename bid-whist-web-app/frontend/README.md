# Bid Whist Web Application

This is an online web application for playing the card game Bid Whist. The application allows players to connect and play together remotely, featuring multiple hands per player and matchmaking via room codes.

## Features

- **Multiple Hands**: Players can control multiple hands during the game, allowing for flexible gameplay.
- **Matchmaking**: Players can join games using unique room codes, ensuring a private gaming experience.
- **Real-time Gameplay**: The application uses WebSocket for real-time communication between players.

## Getting Started

### Prerequisites

- Node.js and npm (for the frontend)
- Kotlin and Gradle (for the server)

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Server Setup

1. Navigate to the `server` directory:
   ```
   cd server
   ```

2. Build the server:
   ```
   ./gradlew build
   ```

3. Run the server:
   ```
   ./gradlew run
   ```

## Project Structure

- **frontend/**: Contains the React application for the Bid Whist game.
- **server/**: Contains the Kotlin server application that manages game sessions and player connections.
- **scripts/**: Contains scripts for starting the frontend and server applications.

## Contributing

Feel free to submit issues or pull requests to improve the application. Your contributions are welcome!

## License

This project is open-source and available under the MIT License.