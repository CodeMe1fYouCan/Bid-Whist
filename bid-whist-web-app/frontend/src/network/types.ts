export interface Card {
    suit: string;
    rank: string;
}

export interface Player {
    id: string;
    name: string;
    hands: Hand[];
}

export interface Hand {
    id: string;
    cards: Card[];
}

export interface GameRoom {
    roomCode: string;
    players: Player[];
    currentHand: number;
    totalHands: number;
}

export interface GameState {
    room: GameRoom;
    currentPlayerId: string;
    activeHand: Hand;
    scores: Record<string, number>;
}

export interface JoinRoomRequest {
    roomCode: string;
    playerName: string;
}

export interface JoinRoomResponse {
    success: boolean;
    message?: string;
    gameState?: GameState;
}

export interface StartGameRequest {
    roomCode: string;
    playerId: string;
}

export interface StartGameResponse {
    success: boolean;
    message?: string;
    gameState?: GameState;
}