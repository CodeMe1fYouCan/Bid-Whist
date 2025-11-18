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

### Running Locally

#### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

#### Server
1. Navigate to the `server` directory.
2. Build the project:
   ```bash
   ./gradlew build
   ```
3. Run the server:
   ```bash
   ./gradlew run
   ```

### Quick Start Script
Use the provided script to start both frontend and server:
```bash
./start-dev.sh
```

## Deployment

Want to play online with friends? Deploy your app to the cloud!

**Quick Start**: See [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for the fastest way to get online (~5 minutes, $5/month)

**Detailed Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions

**Checklist**: Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) to track your deployment progress

### Recommended Platforms
- **Railway** (~$5/month) - Easiest and cheapest
- **DigitalOcean** (~$12/month) - Production ready
- **Render** (Free tier) - Good for testing

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.