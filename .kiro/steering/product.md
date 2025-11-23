# Product Overview

Bid Whist Web Application is an online multiplayer card game platform that enables players to play Bid Whist remotely. The game supports 1-4 real players with the unique feature of allowing individual players to control multiple hands (1-3 hands per player).

## Key Features

- Real-time multiplayer gameplay using WebSocket connections
- Private game rooms with unique 6-character room codes for matchmaking
- Flexible player configuration: players can control 1, 2, or 3 hands
- Team selection: players choose between "Us" and "Them" teams
- Ready state management: all players must ready up before game starts
- Standard Bid Whist rules with 52-card deck (13 cards per hand)
- No-trump scoring: points are doubled when the trump suit is "no-trump"

## Game Start Requirements

- Exactly 4 hands total must be controlled by real players
- Each team ("Us" and "Them") must have exactly 2 hands
- All real players must be in ready state
- No AI players - all hands are controlled by real players

## Target Use Case

Designed for remote Bid Whist players who want to play together online with the flexibility of controlling multiple hands, simulating in-person gameplay where one person might play multiple positions.
